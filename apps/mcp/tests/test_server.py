"""server 能力映射单测：prompt/resource 注册形态与 list_skills 输出形态。"""

from __future__ import annotations

import pytest
from fastmcp import FastMCP

from foundry_skills_mcp.registry import SkillEntry, SkillReference
from foundry_skills_mcp.server import register_skills


def _entry(
    name: str,
    description: str = "示例描述",
    destructive: bool = False,
    references: tuple[SkillReference, ...] = (),
) -> SkillEntry:
    """构造单个 SkillEntry 的测试辅助函数。"""
    return SkillEntry(
        name=name,
        description=description,
        destructive=destructive,
        skill=f"# {name} 正文",
        references=references,
    )


@pytest.mark.asyncio
async def test_prompts_registered_with_skill_body() -> None:
    """每个收束 skill 注册为同名 prompt，渲染返回 SKILL.md 正文。"""
    server = FastMCP("test")
    register_skills(server, [_entry("alpha"), _entry("beta")])
    prompt = await server.get_prompt("alpha")
    assert prompt.name == "alpha"
    assert prompt.description == "示例描述"
    rendered = await prompt.render({})
    assert rendered.messages[0].content.text == "# alpha 正文"
    await server.get_prompt("beta")


@pytest.mark.asyncio
async def test_resources_registered_with_skill_uri_scheme() -> None:
    """references 附属文件按 skill://<name>/<相对路径> 注册并返回全文。"""
    server = FastMCP("test")
    entry = _entry(
        "demo",
        references=(SkillReference(name="refs/a.md", content="附属全文"),),
    )
    register_skills(server, [entry])
    resource = await server.get_resource("skill://demo/refs/a.md")
    assert str(resource.uri) == "skill://demo/refs/a.md"
    assert await resource.read() == "附属全文"


@pytest.mark.asyncio
async def test_list_skills_output_shape() -> None:
    """list_skills 返回名称/描述/destructive 标注的清单形态。"""
    server = FastMCP("test")
    register_skills(
        server,
        [
            _entry("safe"),
            _entry("danger", description="⚠️ DESTRUCTIVE 危险操作", destructive=True),
        ],
    )
    tool = await server.get_tool("list_skills")
    result = await tool.run({})
    items = result.structured_content["result"]
    assert isinstance(items, list)
    assert {item["name"] for item in items} == {"safe", "danger"}
    danger = next(item for item in items if item["name"] == "danger")
    assert danger["destructive"] is True
    assert str(danger["description"]).startswith("⚠️ DESTRUCTIVE")
    for item in items:
        assert set(item) == {"name", "description", "destructive"}
