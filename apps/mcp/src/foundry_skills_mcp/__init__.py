"""ENA Foundry 自定义 skill 收束 MCP 服务器包。

提供 stdio 本地调用与 Streamable HTTP 自托管部署两种形态，
将 packages/skills 构建产物 dist/manifest.json 中的 skill 收束为 FastMCP 的 prompts、resources 与 tools。
"""

__version__ = "0.1.0"
