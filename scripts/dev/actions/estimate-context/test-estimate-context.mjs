// test-estimate-context.mjs — estimate-context 脚本单元与集成测试
// 用法: node scripts/dev/actions/estimate-context/test-estimate-context.mjs

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  calculateMcpSkillChars,
  calculateSymlinkSkillChars,
  DEFAULT_CHARS_PER_TOKEN,
  estimateMultipleSkills,
  estimateSkillContext,
  formatMarkdownTable,
  resolvePaths,
} from "./estimate-context.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ESTIMATE_SCRIPT = path.join(SCRIPT_DIR, "estimate-context.mjs");

let passCount = 0;

function ok(desc) {
  passCount += 1;
  console.log(`ok: ${desc}`);
}

function fail(desc) {
  console.error(`FAIL: ${desc}`);
  process.exit(1);
}

function check(desc, cond) {
  if (cond) ok(desc);
  else fail(desc);
}

// 1. 基础路径解析
/**
 * 仓库的默认 Codex skill 路径与清单路径。
 */
const paths = resolvePaths();
check(
  "resolvePaths 返回有效路径",
  paths.manifestPath.endsWith("manifest.json") &&
    paths.skillsLinkDir === path.resolve(SCRIPT_DIR, '../../../..', '.agents/skills'),
);

// 2. MCP 字符数估算
const mockEntry = {
  name: "test-skill",
  category: "eval",
  description: "Test skill description",
  destructive: false,
  skill: "# Test Skill\nLine 1\nLine 2",
  references: [{ name: "ref.md", content: "# Ref" }],
};
const mcpChars = calculateMcpSkillChars(mockEntry);
check(
  "calculateMcpSkillChars 返回正确的 JSON 字符长度",
  mcpChars === JSON.stringify(mockEntry).length && mcpChars > 0,
);

// 3. 构造临时沙箱测试软链/源码目录字符数估算
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "estimate-test-"));
try {
  const mockLinkDir = path.join(tmpDir, "links");
  const mockSrcDir = path.join(tmpDir, "src");
  const mockSkillDir = path.join(mockLinkDir, "test-skill");
  const mockRefsDir = path.join(mockSkillDir, "references");

  fs.mkdirSync(mockRefsDir, { recursive: true });
  const skillContent = "# Test Skill\nContent here";
  const refContent = "# Reference contract content";
  fs.writeFileSync(path.join(mockSkillDir, "SKILL.md"), skillContent, "utf8");
  fs.writeFileSync(path.join(mockRefsDir, "contract.md"), refContent, "utf8");

  const symlinkChars = calculateSymlinkSkillChars("test-skill", {
    skillsLinkDir: mockLinkDir,
    skillsSrcDir: mockSrcDir,
  });
  check(
    "calculateSymlinkSkillChars 正确累加 SKILL.md 与 references 字符",
    symlinkChars === skillContent.length + refContent.length,
  );

  // 4. 构造临时 manifest 进行估算
  const mockManifestPath = path.join(tmpDir, "manifest.json");
  const mockManifest = {
    version: 1,
    skills: [
      {
        name: "test-skill",
        category: "eval",
        description: "desc",
        destructive: false,
        skill: skillContent,
        references: [{ name: "contract.md", content: refContent }],
      },
    ],
  };
  fs.writeFileSync(mockManifestPath, JSON.stringify(mockManifest), "utf8");

  const result = estimateSkillContext("test-skill", {
    manifestPath: mockManifestPath,
    skillsLinkDir: mockLinkDir,
    skillsSrcDir: mockSrcDir,
    charsPerToken: 4,
  });

  check(
    "estimateSkillContext 计算 token 与增幅指标",
    result.name === "test-skill" &&
      result.symlinkChars === symlinkChars &&
      result.mcpChars > result.symlinkChars &&
      result.diffChars > 0 &&
      typeof result.increasePercent === "number",
  );

  // 5. 格式化为 Markdown 表格
  const mdTable = formatMarkdownTable([result], 4);
  check(
    "formatMarkdownTable 包含关键表头与指标",
    mdTable.includes("| 技能名称 |") &&
      mdTable.includes("`test-skill`") &&
      mdTable.includes("Token 差值"),
  );

  // 6. CLI 执行测试（真实仓库环境）
  const cliRun = spawnSync("node", [ESTIMATE_SCRIPT, "eval-short-rule"], {
    encoding: "utf8",
  });
  check("CLI 执行单个真实 skill 成功退出 (exit code 0)", cliRun.status === 0);
  check(
    "CLI 输出包含 eval-short-rule 与 Markdown 表格",
    cliRun.stdout.includes("eval-short-rule") &&
      cliRun.stdout.includes("增幅 (%)"),
  );

  // 7. CLI --json 模式测试
  const jsonRun = spawnSync(
    "node",
    [ESTIMATE_SCRIPT, "eval-short-rule", "--json"],
    { encoding: "utf8" },
  );
  check(
    "CLI --json 输出可解析 JSON",
    jsonRun.status === 0 && Array.isArray(JSON.parse(jsonRun.stdout)),
  );

  // 8. 错误处理：不存在的技能抛出异常
  let caught = false;
  try {
    estimateSkillContext("non-existent-skill", {
      manifestPath: mockManifestPath,
      skillsLinkDir: mockLinkDir,
      skillsSrcDir: mockSrcDir,
    });
  } catch {
    caught = true;
  }
  check("查询不存在的技能时正确抛出错误", caught);
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

console.log(`\n通过 ${passCount} 项检查，全部成功！`);
