"""registry 清单加载、校验与过滤规则的单测（fixture 用临时目录构造假 manifest）。"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from foundry_skills_mcp.registry import (
    DESTRUCTIVE_MARKER,
    ManifestError,
    load_manifest,
    load_skills,
    parse_skills,
)


def _skill(
    name: str,
    description: str = "示例描述",
    destructive: bool = False,
    references: list[dict[str, str]] | None = None,
) -> dict[str, object]:
    """构造单条清单条目的测试辅助函数。"""
    return {
        "name": name,
        "category": "speckit",
        "description": description,
        "destructive": destructive,
        "skill": f"# {name} 正文",
        "references": references or [],
    }


def _write_manifest(tmp_path: Path, skills: list[dict[str, object]]) -> Path:
    """将假清单写入临时目录并返回路径。"""
    path = tmp_path / "manifest.json"
    path.write_text(
        json.dumps({"version": 1, "generatedAt": "2026-01-01T00:00:00Z", "skills": skills}),
        encoding="utf-8",
    )
    return path


def test_load_manifest_missing_file(tmp_path: Path) -> None:
    """清单缺失时报错并提示先执行构建命令，不回退扫源目录。"""
    with pytest.raises(ManifestError, match="pnpm --filter @foundry/skills build"):
        load_manifest(tmp_path / "不存在.json")


def test_load_manifest_invalid_structure(tmp_path: Path) -> None:
    """缺少 skills 数组的清单判定为结构非法。"""
    path = tmp_path / "manifest.json"
    path.write_text(json.dumps({"version": 1}), encoding="utf-8")
    with pytest.raises(ManifestError, match="结构非法"):
        load_manifest(path)


def test_parse_skills_filters_destructive_by_default() -> None:
    """destructive: true 的 skill 默认被拒绝收束。"""
    manifest = {"skills": [_skill("safe"), _skill("danger", destructive=True)]}
    entries = parse_skills(manifest)
    assert [e.name for e in entries] == ["safe"]
    assert all(not e.destructive for e in entries)


def test_parse_skills_include_destructive_marks_description() -> None:
    """放行破坏性 skill 时描述前置 ⚠️ DESTRUCTIVE 显著标注。"""
    manifest = {"skills": [_skill("danger", description="危险操作", destructive=True)]}
    entries = parse_skills(manifest, include_destructive=True)
    assert len(entries) == 1
    assert entries[0].destructive is True
    assert entries[0].description.startswith(DESTRUCTIVE_MARKER)


def test_parse_skills_requires_name_and_description() -> None:
    """name/description 缺失或非字符串时校验失败。"""
    with pytest.raises(ManifestError, match="`name`"):
        parse_skills({"skills": [_skill("x", "y") | {"name": ""}]})
    with pytest.raises(ManifestError, match="`description`"):
        parse_skills({"skills": [_skill("x") | {"description": 1}]})


def test_parse_skills_destructive_must_be_bool() -> None:
    """destructive 非布尔值时校验失败。"""
    bad = _skill("x")
    bad["destructive"] = "true"
    with pytest.raises(ManifestError, match="`destructive`"):
        parse_skills({"skills": [bad]})


def test_load_skills_roundtrip(tmp_path: Path) -> None:
    """临时目录假清单端到端加载：字段与 references 完整保留。"""
    refs = [{"name": "refs/a.md", "content": "附属全文"}]
    path = _write_manifest(tmp_path, [_skill("demo", references=refs)])
    entries = load_skills(path)
    assert len(entries) == 1
    entry = entries[0]
    assert entry.name == "demo"
    assert entry.skill == "# demo 正文"
    assert entry.references[0].name == "refs/a.md"
    assert entry.references[0].content == "附属全文"
