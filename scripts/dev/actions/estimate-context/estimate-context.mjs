#!/usr/bin/env node

/**
 * @file estimate-context.mjs
 * @description 估算指定 skill 集合在「MCP 收束形态」与「项目级软链形态」下的注入上下文 token 开销对比。
 *
 * 依据:
 * - FR-027 维度二度量方式
 * - research D13
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "../../../..");

export const DEFAULT_CHARS_PER_TOKEN = 3.5;

/**
 * 解析既有清单、Codex安装目录与src一级集合根路径；MCP清单消费仍留后续适配。
 */
export function resolvePaths(customRoot = REPO_ROOT) {
  return {
    manifestPath: path.resolve(
      customRoot,
      "packages/skills/dist/manifest.json",
    ),
    skillsLinkDir: path.resolve(customRoot, ".agents/skills"),
    skillsSrcDir: path.resolve(customRoot, "packages/skills/src"),
  };
}

/**
 * 递归计算软链或源码目录下 skill 的总字符数
 */
export function calculateSymlinkSkillChars(
  skillName,
  { skillsLinkDir, skillsSrcDir },
) {
  // 优先从软链目录读取，不存在时回退至源码目录
  let targetDir = path.join(skillsLinkDir, skillName);
  if (!fs.existsSync(targetDir) && skillsSrcDir) {
    // 在 src 分类子目录中寻找
    const categories = fs.existsSync(skillsSrcDir)
      ? fs.readdirSync(skillsSrcDir)
      : [];
    for (const cat of categories) {
      const candidate = path.join(skillsSrcDir, cat, skillName);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        targetDir = candidate;
        break;
      }
    }
  }

  if (!fs.existsSync(targetDir)) {
    throw new Error(`未找到技能目录: ${skillName} (路径: ${targetDir})`);
  }

  let totalChars = 0;
  const skillMdPath = path.join(targetDir, "SKILL.md");
  if (fs.existsSync(skillMdPath)) {
    totalChars += fs.readFileSync(skillMdPath, "utf8").length;
  }

  const refsDir = path.join(targetDir, "references");
  if (fs.existsSync(refsDir) && fs.statSync(refsDir).isDirectory()) {
    const refFiles = fs.readdirSync(refsDir);
    for (const f of refFiles) {
      const fp = path.join(refsDir, f);
      if (fs.statSync(fp).isFile()) {
        totalChars += fs.readFileSync(fp, "utf8").length;
      }
    }
  }

  return totalChars;
}

/**
 * 计算单个 skill 在 MCP 形态下的字符数（manifest.json 中该条目的序列化字符数）
 */
export function calculateMcpSkillChars(skillEntry) {
  if (!skillEntry) return 0;
  return JSON.stringify(skillEntry).length;
}

/**
 * 估算技能对比数据
 */
export function estimateSkillContext(
  skillName,
  {
    manifestPath,
    skillsLinkDir,
    skillsSrcDir,
    charsPerToken = DEFAULT_CHARS_PER_TOKEN,
  },
) {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `收束清单不存在: ${manifestPath}。请先执行 pnpm --filter @foundry/skills build`,
    );
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const entry = manifest.skills?.find((s) => s.name === skillName);

  if (!entry) {
    throw new Error(`在 manifest.json 中未找到技能: ${skillName}`);
  }

  const mcpChars = calculateMcpSkillChars(entry);
  const symlinkChars = calculateSymlinkSkillChars(skillName, {
    skillsLinkDir,
    skillsSrcDir,
  });

  const mcpTokens = Math.ceil(mcpChars / charsPerToken);
  const symlinkTokens = Math.ceil(symlinkChars / charsPerToken);

  const diffChars = mcpChars - symlinkChars;
  const diffTokens = mcpTokens - symlinkTokens;
  const increasePercent =
    symlinkChars === 0
      ? 0
      : Number(((diffChars / symlinkChars) * 100).toFixed(2));

  return {
    name: skillName,
    category: entry.category,
    symlinkChars,
    symlinkTokens,
    mcpChars,
    mcpTokens,
    diffChars,
    diffTokens,
    increasePercent,
  };
}

/**
 * 批量估算技能对比数据
 */
export function estimateMultipleSkills(skillNames = [], options = {}) {
  const paths = resolvePaths(options.repoRoot);
  const manifestPath = options.manifestPath || paths.manifestPath;
  const skillsLinkDir = options.skillsLinkDir || paths.skillsLinkDir;
  const skillsSrcDir = options.skillsSrcDir || paths.skillsSrcDir;
  const charsPerToken = options.charsPerToken || DEFAULT_CHARS_PER_TOKEN;

  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `收束清单不存在: ${manifestPath}。请先执行 pnpm --filter @foundry/skills build`,
    );
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const allNames = manifest.skills?.map((s) => s.name) || [];

  const targetNames = skillNames.length > 0 ? skillNames : allNames;

  return targetNames.map((name) =>
    estimateSkillContext(name, {
      manifestPath,
      skillsLinkDir,
      skillsSrcDir,
      charsPerToken,
    }),
  );
}

/**
 * 格式化为 Markdown 表格
 */
export function formatMarkdownTable(
  results,
  charsPerToken = DEFAULT_CHARS_PER_TOKEN,
) {
  const lines = [
    `| 技能名称 | 软链字符数 | 软链 Token | MCP 字符数 | MCP Token | Token 差值 | 增幅 (%) |`,
    `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |`,
  ];

  let totalSymlinkChars = 0;
  let totalSymlinkTokens = 0;
  let totalMcpChars = 0;
  let totalMcpTokens = 0;

  for (const r of results) {
    totalSymlinkChars += r.symlinkChars;
    totalSymlinkTokens += r.symlinkTokens;
    totalMcpChars += r.mcpChars;
    totalMcpTokens += r.mcpTokens;

    const sign = r.diffTokens >= 0 ? `+${r.diffTokens}` : `${r.diffTokens}`;
    const pctSign =
      r.increasePercent >= 0
        ? `+${r.increasePercent}%`
        : `${r.increasePercent}%`;
    lines.push(
      `| \`${r.name}\` | ${r.symlinkChars} | ${r.symlinkTokens} | ${r.mcpChars} | ${r.mcpTokens} | ${sign} | ${pctSign} |`,
    );
  }

  const totalDiffTokens = totalMcpTokens - totalSymlinkTokens;
  const totalDiffChars = totalMcpChars - totalSymlinkChars;
  const totalPct =
    totalSymlinkChars === 0
      ? 0
      : Number(((totalDiffChars / totalSymlinkChars) * 100).toFixed(2));
  const totalSign =
    totalDiffTokens >= 0 ? `+${totalDiffTokens}` : `${totalDiffTokens}`;
  const totalPctSign = totalPct >= 0 ? `+${totalPct}%` : `${totalPct}%`;

  lines.push(
    `| **总计 / 综合** | **${totalSymlinkChars}** | **${totalSymlinkTokens}** | **${totalMcpChars}** | **${totalMcpTokens}** | **${totalSign}** | **${totalPctSign}** |`,
  );
  lines.push(``);
  lines.push(
    `*注：Token 估算折算率按 1 token ≈ ${charsPerToken} 字符计算，保留原始字符数。*`,
  );

  return lines.join("\n");
}

// CLI 执行入口
if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  const args = process.argv.slice(2);
  let charsPerToken = DEFAULT_CHARS_PER_TOKEN;
  let asJson = false;
  const names = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--rate" && args[i + 1]) {
      charsPerToken = parseFloat(args[++i]);
    } else if (args[i] === "--json") {
      asJson = true;
    } else if (!args[i].startsWith("-")) {
      names.push(args[i]);
    }
  }

  try {
    const results = estimateMultipleSkills(names, { charsPerToken });
    if (asJson) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log(formatMarkdownTable(results, charsPerToken));
    }
  } catch (err) {
    console.error(`错误: ${err.message}`);
    process.exit(1);
  }
}
