"""foundry-skills-mcp 服务器入口：stdio 本地调用 / Streamable HTTP 自托管部署。

按 contracts/mcp-server.md 收束 packages/skills 构建产物中的自定义 skill：
- prompts：每个收束 skill 的 SKILL.md 正文（名 `<skill-name>`）
- resources：skill 的 references/* 附属文件（URI `skill://<name>/<相对路径>`）
- tools：`list_skills` 返回收束清单（名称、描述、destructive 标注）

CLI：默认 stdio；`--http` 切 Streamable HTTP（`--host` 缺省 127.0.0.1，
`--port` 缺省 8787，线上须显式 `--host 0.0.0.0`）；`--include-destructive`
放行破坏性 skill（显著标注）。
"""

from __future__ import annotations

import argparse
import sys
from collections.abc import Callable

from fastmcp import FastMCP
from starlette.requests import Request
from starlette.responses import JSONResponse

try:
    from foundry_skills_mcp.registry import SkillEntry, load_skills
except ImportError:
    from .registry import SkillEntry, load_skills

mcp = FastMCP("foundry-skills-mcp")


@mcp.custom_route("/healthz", methods=["GET"])
async def healthz(request: Request) -> JSONResponse:
    """HTTP 健康检查端点（非 MCP 协议面），恒返回 200。"""
    return JSONResponse({"status": "ok"})


def register_skills(server: FastMCP, skills: list[SkillEntry]) -> None:
    """将收束 skill 清单注册为 prompts / resources / list_skills 工具。"""

    def make_prompt(entry: SkillEntry) -> Callable[[], str]:
        """为单个 skill 生成返回 SKILL.md 正文的 prompt 函数。"""

        def prompt_fn() -> str:
            return entry.skill

        prompt_fn.__name__ = f"prompt_{entry.name.replace('-', '_')}"
        prompt_fn.__doc__ = entry.description
        return prompt_fn

    def make_resource(entry: SkillEntry, ref_name: str) -> Callable[[], str]:
        """为单个附属文件生成返回全文的 resource 函数。"""

        content = next(ref.content for ref in entry.references if ref.name == ref_name)

        def resource_fn() -> str:
            return content

        resource_fn.__name__ = f"resource_{entry.name.replace('-', '_')}"
        resource_fn.__doc__ = f"skill `{entry.name}` 的附属文件 `{ref_name}`"
        return resource_fn

    for entry in skills:
        server.prompt(name=entry.name)(make_prompt(entry))
        for ref in entry.references:
            uri = f"skill://{entry.name}/{ref.name}"
            server.resource(uri, name=f"{entry.name}/{ref.name}")(make_resource(entry, ref.name))

    @server.tool
    def list_skills() -> list[dict[str, object]]:
        """列出收束的 skill 清单（名称、描述、destructive 标注）。"""
        return [
            {
                "name": entry.name,
                "description": entry.description,
                "destructive": entry.destructive,
            }
            for entry in skills
        ]


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """解析 CLI 参数：默认 stdio，`--http` 切 Streamable HTTP 模式。"""
    parser = argparse.ArgumentParser(
        prog="foundry-skills-mcp",
        description="ENA Foundry 自定义 skill 收束 MCP 服务器",
    )
    parser.add_argument(
        "--http",
        action="store_true",
        help="以 Streamable HTTP 模式运行（默认 stdio）",
    )
    parser.add_argument("--host", default="127.0.0.1", help="HTTP 监听地址（默认 127.0.0.1；线上须显式 0.0.0.0）")
    parser.add_argument("--port", type=int, default=8787, help="HTTP 监听端口（默认 8787）")
    parser.add_argument(
        "--include-destructive",
        action="store_true",
        help="放行 destructive skill（描述前置 ⚠️ DESTRUCTIVE 显著标注）",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    """加载收束清单、注册能力并按 CLI 选择传输模式启动服务器。"""
    args = parse_args(argv)
    skills = load_skills(include_destructive=args.include_destructive)
    register_skills(mcp, skills)
    if args.http:
        mcp.run(transport="http", host=args.host, port=args.port)
    else:
        mcp.run()
    return 0


if __name__ == "__main__":
    sys.exit(main())
