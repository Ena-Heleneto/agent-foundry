"""收束清单加载与校验：以 packages/skills 构建产物 manifest.json 为唯一事实来源。

apps/mcp 经仓库内相对路径推导定位 `packages/skills/dist/manifest.json`；
产物缺失即报错提示先执行 `pnpm --filter @foundry/skills build`，不回退扫描源目录。
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

# 破坏性 skill 放行时的显著标注前缀（契约：描述前置 ⚠️ DESTRUCTIVE）
DESTRUCTIVE_MARKER = "⚠️ DESTRUCTIVE"


def resolve_manifest_path(manifest_path: Path | None = None) -> Path:
    """解析收束清单 manifest.json 的路径。

    解析优先级（research D11 / contracts/mcp-server.md）：
    1. 显式传入的 manifest_path 参数；
    2. FOUNDRY_SKILLS_MANIFEST 环境变量；
    3. 自 __file__ 向上回溯查找包含 packages/skills/dist/manifest.json 的仓库根；
    4. 自当前工作目录向上回溯查找包含 packages/skills/dist/manifest.json 的仓库根；
    5. 源码布局下的标准相对路径推导（__file__.parents[4] / packages/skills/dist/manifest.json）。
    """
    if manifest_path is not None:
        return Path(manifest_path)

    env_path = os.environ.get("FOUNDRY_SKILLS_MANIFEST")
    if env_path:
        return Path(env_path)

    current = Path(__file__).resolve()
    for parent in [current, *current.parents]:
        candidate = parent / "packages" / "skills" / "dist" / "manifest.json"
        if candidate.is_file():
            return candidate

    cwd = Path.cwd().resolve()
    for parent in [cwd, *cwd.parents]:
        candidate = parent / "packages" / "skills" / "dist" / "manifest.json"
        if candidate.is_file():
            return candidate

    if len(current.parents) >= 5:
        return current.parents[4] / "packages" / "skills" / "dist" / "manifest.json"
    return current.parent / "packages" / "skills" / "dist" / "manifest.json"


# 仓库内默认产物路径（与 cwd 解耦，支持回溯与环境变量）
DEFAULT_MANIFEST_PATH = resolve_manifest_path()


class ManifestError(RuntimeError):
    """清单加载或校验失败的统一错误类型。"""


@dataclass(frozen=True)
class SkillReference:
    """skill 附属文件（references/*）的单条记录。"""

    name: str
    """附属文件名（manifest 中的相对路径）。"""

    content: str
    """附属文件全文。"""


@dataclass(frozen=True)
class SkillEntry:
    """单个收束 skill 的清单条目（经校验与过滤决策后的形态）。"""

    name: str
    """skill 名称（frontmatter name，亦作 prompt 名）。"""

    description: str
    """skill 描述；放行破坏性 skill 时已前置 ⚠️ DESTRUCTIVE 标注。"""

    destructive: bool
    """frontmatter destructive 标记（缺省按 false）。"""

    skill: str
    """SKILL.md 全文。"""

    references: tuple[SkillReference, ...] = field(default_factory=tuple)
    """references/* 附属文件列表。"""


def _require_str(item: dict[str, Any], key: str, skill_name: str) -> str:
    """校验清单条目指定键为非空字符串，否则抛出 ManifestError。"""
    value = item.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ManifestError(f"skill `{skill_name}` 的字段 `{key}` 缺失或不是非空字符串")
    return value


def load_manifest(manifest_path: Path | None = None) -> dict[str, Any]:
    """读取并解析 manifest.json，缺失或非法 JSON 时抛出 ManifestError。

    参数 manifest_path 为 None 时解析默认产物路径（支持环境变量与回溯）。
    """
    path = resolve_manifest_path(manifest_path)
    if not path.is_file():
        raise ManifestError(
            f"未找到收束清单 {path}；请先执行 `pnpm --filter @foundry/skills build` 生成构建产物"
        )
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ManifestError(f"清单 {path} 解析失败：{exc}") from exc
    if not isinstance(data, dict) or not isinstance(data.get("skills"), list):
        raise ManifestError(f"清单 {path} 结构非法：缺少 `skills` 数组")
    return data


def parse_skills(
    manifest: dict[str, Any], *, include_destructive: bool = False
) -> list[SkillEntry]:
    """校验清单条目并按 destructive 规则过滤，返回可收束的 skill 列表。

    - 校验 name/description 为非空字符串，destructive 缺省按 false。
    - `destructive: true` 默认拒绝收束；include_destructive 放行时描述前置
      `⚠️ DESTRUCTIVE` 显著标注。
    """
    entries: list[SkillEntry] = []
    for item in manifest["skills"]:
        if not isinstance(item, dict):
            raise ManifestError("清单条目必须是对象")
        name = _require_str(item, "name", "<未知>")
        description = _require_str(item, "description", name)
        destructive_raw = item.get("destructive", False)
        if not isinstance(destructive_raw, bool):
            raise ManifestError(f"skill `{name}` 的字段 `destructive` 不是布尔值")
        if destructive_raw and not include_destructive:
            continue
        if destructive_raw:
            description = f"{DESTRUCTIVE_MARKER} {description}"
        skill_body = _require_str(item, "skill", name)
        references_raw = item.get("references") or []
        if not isinstance(references_raw, list):
            raise ManifestError(f"skill `{name}` 的字段 `references` 不是数组")
        references = tuple(
            SkillReference(
                name=_require_str(ref, "name", name),
                content=_require_str(ref, "content", name),
            )
            for ref in references_raw
            if isinstance(ref, dict)
        )
        entries.append(
            SkillEntry(
                name=name,
                description=description,
                destructive=destructive_raw,
                skill=skill_body,
                references=references,
            )
        )
    return entries


def load_skills(
    manifest_path: Path | None = None, *, include_destructive: bool = False
) -> list[SkillEntry]:
    """加载默认（或指定）清单并返回经校验过滤的收束 skill 列表。"""
    return parse_skills(load_manifest(manifest_path), include_destructive=include_destructive)
