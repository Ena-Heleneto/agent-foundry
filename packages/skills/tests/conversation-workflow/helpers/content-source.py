"""通过受控回包调用真实 CLI 的现有工具，验证原值来源而非自主记录。"""

import base64
import hashlib
import http.server
import importlib.util
import json
import re
import shlex
import struct
import subprocess
import sys
import threading
import uuid
import zlib
from pathlib import Path


def digest(data):
    """按原始字节计算摘要。"""
    return hashlib.sha256(data).hexdigest()


def make_png():
    """产生不依赖图像库的已知 PNG 原件。"""

    def chunk(kind, data):
        return (
            struct.pack("!I", len(data))
            + kind
            + data
            + struct.pack("!I", zlib.crc32(kind + data) & 0xFFFFFFFF)
        )

    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack("!2I5B", 32, 32, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress((b"\x00" + b"\xff\x40\x80" * 32) * 32))
        + chunk(b"IEND", b"")
    )


def mcp_fixture(root):
    """本地 MCP 只返回本次合成附件，不访问用户配置或认证。"""
    for line in sys.stdin:
        packet = json.loads(line)
        method = packet.get("method")
        rid = packet.get("id")
        if rid is None:
            continue
        if method == "initialize":
            result = {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "t005-fixture", "version": "1"},
            }
        elif method == "tools/list":
            result = {
                "tools": [
                    {
                        "name": "attachment",
                        "description": "返回 T005 已知工具附件及原件路径。",
                        "inputSchema": {
                            "type": "object",
                            "properties": {"label": {"type": "string"}},
                            "required": ["label"],
                        },
                    }
                ]
            }
        elif method == "tools/call":
            result = {
                "content": [
                    {
                        "type": "text",
                        "text": json.dumps(
                            {
                                "label": packet["params"]["arguments"]["label"],
                                "path": str(root / "input/tool-image.png"),
                                "sha256": digest(
                                    (root / "input/tool-image.png").read_bytes()
                                ),
                            },
                            ensure_ascii=False,
                        ),
                    },
                    {
                        "type": "image",
                        "mimeType": "image/png",
                        "data": base64.b64encode(
                            (root / "input/tool-image.png").read_bytes()
                        ).decode(),
                    },
                ]
            }
        else:
            result = {}
        print(json.dumps({"jsonrpc": "2.0", "id": rid, "result": result}), flush=True)


if len(sys.argv) > 1 and sys.argv[1] == "--mcp":
    mcp_fixture(Path(sys.argv[2]))
    sys.exit(0)

spec = importlib.util.spec_from_file_location(
    "host", Path(sys.argv[2]) / "recording-host.py"
)
host = importlib.util.module_from_spec(spec)
spec.loader.exec_module(host)
root = Path(sys.argv[2])
codex = sys.argv[1]
repo = root / "repository"
outside = root / "repository-outside"
trace = root / "trace"
trace.mkdir()
png = make_png()
(root / "input/user-image.png").write_bytes(png)
(root / "input/tool-image.png").write_bytes(png)
expected_long = "开始\n" + "片段 α\n" * 16384 + "结束\n"
long_cmd = "python3 -c " + shlex.quote(
    "import sys;sys.stdout.write('开始\\n'+'片段 α\\n'*16384+'结束\\n')"
)
short_source = "import os,json,sys;print(json.dumps({'threadId':os.environ.get('CODEX_THREAD_ID'),'cwd':os.getcwd(),'args':sys.argv[1:],'text':'短输出 α\\r\\n末行  '},ensure_ascii=False))"
short_cmd = (
    "python3 -c "
    + shlex.quote(short_source)
    + " "
    + shlex.quote("中文 带空格")
    + " "
    + shlex.quote("--option=a b")
)
stream_cmd = "python3 -c " + shlex.quote(
    "import time;print('STREAM_A',flush=True);time.sleep(1.6);print('STREAM_B',flush=True)"
)
copy_source = f"from pathlib import Path;import hashlib,json;src=Path({str(root / 'input/附件 原件.bin')!r});dst=Path({str(root / 'records/附件 副本.bin')!r});dst.write_bytes(src.read_bytes());print(json.dumps({{'originalSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'savedSha256':hashlib.sha256(dst.read_bytes()).hexdigest(),'bytes':len(dst.read_bytes())}}))"

steps = [
    (
        "short",
        {
            "cmd": short_cmd,
            "workdir": str(outside),
            "yield_time_ms": 1000,
            "max_output_tokens": 1000,
        },
    ),
    (
        "long",
        {
            "cmd": long_cmd,
            "workdir": str(repo),
            "yield_time_ms": 1000,
            "max_output_tokens": 600,
        },
    ),
    (
        "stream",
        {
            "cmd": stream_cmd,
            "workdir": str(repo),
            "yield_time_ms": 1000,
            "max_output_tokens": 600,
        },
    ),
    (
        "long-expanded",
        {
            "cmd": long_cmd,
            "workdir": str(repo),
            "yield_time_ms": 1000,
            "max_output_tokens": 50000,
        },
    ),
    (
        "long-file",
        {
            "cmd": long_cmd
            + " | tee "
            + shlex.quote(str(root / "records/long-original.txt")),
            "workdir": str(repo),
            "yield_time_ms": 1000,
            "max_output_tokens": 600,
        },
    ),
    (
        "long-file-check",
        {
            "cmd": "python3 -c "
            + shlex.quote(
                "from pathlib import Path;import hashlib,json;p=Path("
                + repr(str(root / "records/long-original.txt"))
                + ");b=p.read_bytes();print(json.dumps({'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}))"
            ),
            "workdir": str(repo),
            "yield_time_ms": 1000,
            "max_output_tokens": 600,
        },
    ),
    (
        "copy",
        {
            "cmd": "python3 -c " + shlex.quote(copy_source),
            "workdir": str(repo),
            "yield_time_ms": 1000,
            "max_output_tokens": 600,
        },
    ),
]


class Endpoint(host.Responses):
    """只在实际工具结果回传后推进，保留模型真实可见值。"""

    def do_POST(self):
        """分别处理主轮、子线程和不支持工具的辅助请求。"""
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))))
        self.server.requests.append(body)
        if not body.get("tools"):
            self.emit(
                {
                    "type": "message",
                    "role": "assistant",
                    "id": "msg_" + uuid.uuid4().hex,
                    "content": [
                        {"type": "output_text", "text": "T005_AUXILIARY_RESPONSE"}
                    ],
                }
            )
            return
        user_texts = [
            part.get("text", "")
            for value in body.get("input", [])
            if isinstance(value, dict)
            and value.get("role") == "user"
            and isinstance(value.get("content"), list)
            for part in value["content"]
            if isinstance(part, dict)
        ]
        if any(t.startswith("T005_CHILD_SYNTHETIC") for t in user_texts):
            self.emit(
                {
                    "type": "message",
                    "role": "assistant",
                    "id": "msg_" + uuid.uuid4().hex,
                    "content": [
                        {
                            "type": "output_text",
                            "text": "T005_CHILD_RETURN_BETA"
                            if any(
                                t.startswith("T005_CHILD_SYNTHETIC_FOLLOWUP")
                                for t in user_texts
                            )
                            else "T005_CHILD_RETURN_ALPHA",
                        }
                    ],
                }
            )
            return
        inputs = body.get("input", [])
        for value in inputs:
            if isinstance(value, dict) and value.get("type") == "function_call_output":
                cid = value.get("call_id")
                if cid in self.server.calls:
                    self.server.calls[cid]["output"] = value.get("output")
        if not (trace / "tools.json").exists():
            (trace / "tools.json").write_text(
                json.dumps(body.get("tools", []), ensure_ascii=False, indent=2)
            )
        done = {
            row["case"]
            for row in self.server.calls.values()
            if "output" in row
            and not str(row["output"]).startswith("unsupported call:")
        }
        failures = {
            name: sum(
                row["case"] == name
                and str(row.get("output", "")).startswith("unsupported call:")
                for row in self.server.calls.values()
            )
            for name, args in steps
        }
        done.update(name for name, n in failures.items() if n >= 2)
        inflight = next(
            (row for row in self.server.calls.values() if "output" not in row), None
        )
        item = None
        if inflight:
            item = inflight["item"]
        else:
            step = next(
                ((name, args) for name, args in steps if name not in done), None
            )
            if step:
                name, args = step
                item = self.call(name, "exec_command", args)
            elif "mcp" not in done:
                tool = next(
                    (
                        (t["name"], nested["name"])
                        for t in body.get("tools", [])
                        if "fixture" in t.get("name", "")
                        for nested in t.get("tools", [])
                        if nested.get("name") == "attachment"
                    ),
                    None,
                )
                if tool:
                    item = self.call(
                        "mcp", tool[1], {"label": "工具附件 α 带空格"}, tool[0]
                    )
            if item is None and "mcp" in done and "tool-image-copy" not in done:
                output = next(
                    row["output"]
                    for row in self.server.calls.values()
                    if row["case"] == "mcp"
                )
                metadata = json.loads(
                    next(
                        block["text"]
                        for block in output
                        if block.get("type") == "input_text"
                        and block.get("text", "").startswith("{")
                    )
                )
                source = Path(metadata["path"])
                if not source.resolve().is_relative_to(root / "input"):
                    raise RuntimeError("MCP 返回原件超出合成输入目录")
                command = f"from pathlib import Path;import hashlib,json;source=Path({str(source)!r});data=source.read_bytes();assert hashlib.sha256(data).hexdigest()=={metadata['sha256']!r};saved=Path({str(root / 'records/工具 附件.png')!r});saved.write_bytes(data);print(json.dumps({{'sha256':hashlib.sha256(saved.read_bytes()).hexdigest()}}))"
                item = self.call(
                    "tool-image-copy",
                    "exec_command",
                    {
                        "cmd": "python3 -c " + shlex.quote(command),
                        "workdir": str(repo),
                        "yield_time_ms": 1000,
                        "max_output_tokens": 600,
                    },
                )
            if item is None and "stream-poll" not in done:
                out = next(
                    (
                        row.get("output")
                        for row in self.server.calls.values()
                        if row["case"] == "stream"
                    ),
                    "",
                )
                matched = re.search(
                    r'(?:session ID|session_id["\s:]+)\s*(\d+)', str(out), re.I
                )
                if matched:
                    item = self.call(
                        "stream-poll",
                        "write_stdin",
                        {
                            "session_id": int(matched.group(1)),
                            "chars": "",
                            "yield_time_ms": 1000,
                            "max_output_tokens": 600,
                        },
                    )
        if item is None and "spawn" not in done:
            item = self.call(
                "spawn",
                "spawn_agent",
                {
                    "message": "T005_CHILD_SYNTHETIC 仅返回 T005_CHILD_RETURN_ALPHA",
                    "fork_context": False,
                },
                "multi_agent_v1",
            )
        elif item is None and "child-wait" not in done:
            output = next(
                (
                    row.get("output")
                    for row in self.server.calls.values()
                    if row["case"] == "spawn"
                ),
                "",
            )
            matched = re.search(r'"agent_id"\s*:\s*"([^"]+)"', str(output))
            if matched:
                item = self.call(
                    "child-wait",
                    "wait_agent",
                    {"targets": [matched.group(1)], "timeout_ms": 10000},
                    "multi_agent_v1",
                )
        if item is None and "child-interaction" not in done:
            output = next(
                (
                    row.get("output")
                    for row in self.server.calls.values()
                    if row["case"] == "spawn"
                ),
                "",
            )
            matched = re.search(r'"agent_id"\s*:\s*"([^"]+)"', str(output))
            if matched:
                item = self.call(
                    "child-interaction",
                    "send_input",
                    {
                        "target": matched.group(1),
                        "message": "T005_CHILD_SYNTHETIC_FOLLOWUP 仅返回 T005_CHILD_RETURN_BETA",
                    },
                    "multi_agent_v1",
                )
        if (
            item is None
            and "child-interaction" in done
            and "child-wait-followup" not in done
        ):
            output = next(
                (
                    row.get("output")
                    for row in self.server.calls.values()
                    if row["case"] == "spawn"
                ),
                "",
            )
            matched = re.search(r'"agent_id"\s*:\s*"([^"]+)"', str(output))
            if matched:
                item = self.call(
                    "child-wait-followup",
                    "wait_agent",
                    {"targets": [matched.group(1)], "timeout_ms": 10000},
                    "multi_agent_v1",
                )
        if item is None:
            item = {
                "type": "message",
                "role": "assistant",
                "id": "msg_" + uuid.uuid4().hex,
                "content": [
                    {"type": "output_text", "text": "T005_CONTENT_SOURCE_DONE"}
                ],
            }
        self.emit(item)

    def emit(self, item):
        """将主会话、子线程和辅助请求分别结束，不向无工具请求注入函数。"""
        rid = "response-" + uuid.uuid4().hex
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Connection", "close")
        self.end_headers()
        try:
            self.write_event({"type": "response.created", "response": {"id": rid}})
            self.write_event({"type": "response.output_item.done", "item": item})
            self.write_event(
                {
                    "type": "response.completed",
                    "response": {
                        "id": rid,
                        "output": [item],
                        "usage": {
                            "input_tokens": 1,
                            "output_tokens": 1,
                            "total_tokens": 2,
                        },
                    },
                }
            )
        except (BrokenPipeError, ConnectionResetError):
            pass

    def call(self, case, name, args, namespace=None):
        """关联实际发出的名称、参数和后续模型可见结果。"""
        cid = "call_" + uuid.uuid4().hex
        item = {
            "type": "function_call",
            "id": "fc_" + uuid.uuid4().hex,
            "call_id": cid,
            "name": name,
            "arguments": json.dumps(args, ensure_ascii=False),
        }
        if namespace:
            item["namespace"] = namespace
        self.server.calls[cid] = {
            "case": case,
            "name": name,
            "namespace": namespace,
            "arguments": args,
            "item": item,
        }
        return item


server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Endpoint)
server.requests = []
server.calls = {}
threading.Thread(target=server.serve_forever, daemon=True).start()
config = Path.home() / ".codex/config.toml"
config.parent.mkdir(parents=True)
config.write_text(f"""model = "gpt-5.4"
model_provider = "foundry_fixture"
check_for_update_on_startup = false
approval_policy = "never"
sandbox_mode = "danger-full-access"
[model_providers.foundry_fixture]
name = "Foundry fixture"
base_url = "http://127.0.0.1:{server.server_address[1]}/v1"
wire_api = "responses"
requires_openai_auth = false
request_max_retries = 0
stream_max_retries = 0
[mcp_servers.fixture]
command = "/usr/bin/python3"
args = [{json.dumps(str(root / "content-source.py"))}, "--mcp", {json.dumps(str(root))}]
[projects.{json.dumps(str(repo))}]
trust_level = "trusted"
""")
terminal = host.Terminal(
    [
        codex,
        "--no-daemon",
        "--no-alt-screen",
        "--image",
        str(root / "input/user-image.png"),
    ],
    repo,
)
try:
    terminal.wait(lambda: "gpt-5.4" in terminal.text(), "等待内容来源测试终端", 15)
    terminal.submit("T005_SYNTHETIC_CONTENT_SOURCE")
    terminal.wait(
        lambda: "T005_CONTENT_SOURCE_DONE" in terminal.text(), "等待真实工具执行", 55
    )
    terminal.submit("/exit")
    terminal.wait(terminal.exited, "等待退出", 10)
    calls = [
        {"callId": cid, **{k: v for k, v in row.items() if k != "item"}}
        for cid, row in server.calls.items()
    ]
    image_inputs = [
        part
        for request in server.requests
        for item in request.get("input", [])
        if isinstance(item, dict)
        for part in item.get("content", [])
        if isinstance(item.get("content"), list)
        and isinstance(part, dict)
        and part.get("type") == "input_image"
    ]
    image_info = []
    for part in image_inputs:
        url = part.get("image_url", "")
        data = (
            base64.b64decode(url.split(",", 1)[1])
            if isinstance(url, str) and url.startswith("data:")
            else b""
        )
        entry = {
            "keys": list(part),
            "bytes": len(data),
            "sha256": digest(data),
            "matchesOriginal": data == png,
        }
        if entry not in image_info:
            image_info.append(entry)
    report = {
        "version": subprocess.check_output([codex, "--version"], text=True).strip(),
        "controlledEndpoint": True,
        "realModel": False,
        "terminalStatus": terminal.status,
        "noHooks": not (repo / ".codex/hooks.json").exists(),
        "expected": {
            "shortArguments": ["中文 带空格", "--option=a b"],
            "longUtf8Bytes": len(expected_long.encode()),
            "longSha256": digest(expected_long.encode()),
            "binarySha256": digest((root / "input/附件 原件.bin").read_bytes()),
            "pngSha256": digest(png),
        },
        "imageInputs": image_info,
        "calls": calls,
        "requestToolNames": [
            [t.get("name") for t in request.get("tools", [])]
            for request in server.requests
        ],
        "namespaceTools": {
            t["name"]: [
                {"name": n.get("name"), "parameters": n.get("parameters")}
                for n in t.get("tools", [])
            ]
            for t in server.requests[0].get("tools", [])
            if t.get("type") == "namespace"
        },
        "toolNames": [t.get("name") for t in server.requests[0].get("tools", [])],
        "longFile": {
            "bytes": len((root / "records/long-original.txt").read_bytes()),
            "sha256": digest((root / "records/long-original.txt").read_bytes()),
        }
        if (root / "records/long-original.txt").exists()
        else None,
        "auxiliaryRequests": sum(
            not request.get("tools") for request in server.requests
        ),
        "savedAttachmentSha256": digest((root / "records/附件 副本.bin").read_bytes())
        if (root / "records/附件 副本.bin").exists()
        else None,
    }
    report["savedToolImageSha256"] = (
        digest((root / "records/工具 附件.png").read_bytes())
        if (root / "records/工具 附件.png").exists()
        else None
    )
    report["userImageOriginalPathInInitialInput"] = str(
        root / "input/user-image.png"
    ) in json.dumps(server.requests[0].get("input", []))
    report["sessionMetadata"] = []
    report["persistedParentCalls"] = []
    for session in (Path.home() / ".codex/sessions").rglob("rollout-*.jsonl"):
        current_turn = None
        session_id = None
        for line in session.read_text().splitlines():
            event = json.loads(line)
            payload = event.get("payload", {})
            if event.get("type") == "session_meta":
                session_id = payload.get("id")
                report["sessionMetadata"].append(
                    {
                        k: payload.get(k)
                        for k in ("id", "timestamp", "cwd", "source", "cli_version")
                    }
                )
            if event.get("type") == "turn_context":
                current_turn = payload.get("turn_id")
            if (
                event.get("type") == "response_item"
                and payload.get("type") == "function_call"
                and payload.get("call_id") in server.calls
            ):
                report["persistedParentCalls"].append(
                    {
                        "threadId": session_id,
                        "turnId": current_turn,
                        "callId": payload["call_id"],
                        "name": payload.get("name"),
                        "namespace": payload.get("namespace"),
                        "argumentJson": payload.get("arguments"),
                        "matchesSentArguments": json.loads(
                            payload.get("arguments", "{}")
                        )
                        == server.calls[payload["call_id"]]["arguments"],
                    }
                )
    print(json.dumps(report, ensure_ascii=False))
finally:
    terminal.close()
    server.shutdown()
