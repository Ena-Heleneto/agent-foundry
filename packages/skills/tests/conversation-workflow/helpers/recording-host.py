"""用独立伪终端、回环端点和合成输入观察真实 Codex CLI。"""

import asyncio
import errno
import fcntl
import http.server
import json
import os
from pathlib import Path
import pty
import re
import select
import shlex
import signal
import struct
import subprocess
import sys
import termios
import threading
import time
import uuid


FIRST_PROMPT = "T004_FIRST_SYNTHETIC_PROMPT"
FINAL_TEXT = "T004_FIXED_FINAL_REPLY"
EVENTS = ("SessionStart", "UserPromptSubmit", "PreModelRequest", "Stop", "Interrupt", "SessionEnd")


def final_reply(case):
    """为恢复轮使用独立标记，避免把显示的旧末轮当成本轮结果。"""
    return FINAL_TEXT if case == "first" else f"{FINAL_TEXT}_{case.upper().replace('-', '_')}"


def hook(records, trace):
    """留存宿主实际输入，给首条顺序用例单独写入可读收据。"""
    data = json.load(sys.stdin)
    data["observedNs"] = time.monotonic_ns()
    with (trace / "hooks.jsonl").open("a") as output:
        output.write(json.dumps(data) + "\n")
    if data.get("hook_event_name") == "UserPromptSubmit" and data.get("prompt") == FIRST_PROMPT:
        (records / "first-prompt.txt").write_text(FIRST_PROMPT)


def events(trace):
    """按实际写入顺序返回当前合成用例的 hook 事件。"""
    log = trace / "hooks.jsonl"
    return [json.loads(line) for line in log.read_text().splitlines()] if log.exists() else []


class Responses(http.server.BaseHTTPRequestHandler):
    """固定回包端点在请求到达时读回测试收据。"""

    def log_message(self, *_args):
        pass

    def do_GET(self):
        payload = b'{"object":"list","data":[]}'
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_POST(self):
        body = self.rfile.read(int(self.headers.get("Content-Length", "0")))
        receipt = self.server.records / "first-prompt.txt"
        request = {
            "case": self.server.case,
            "path": self.path,
            "atNs": time.monotonic_ns(),
            "savedPrompt": receipt.read_text() if receipt.exists() else None,
            "hasFirstPrompt": FIRST_PROMPT.encode() in body,
        }
        self.server.requests.append(request)
        response_id = "response-" + uuid.uuid4().hex
        message = {
            "type": "message", "role": "assistant", "id": response_id + "-message",
            "content": [{"type": "output_text", "text": final_reply(request["case"])}],
        }
        first = {"type": "response.created", "response": {"id": response_id}}
        end = [
            {"type": "response.output_item.done", "item": message},
            {"type": "response.completed", "response": {
                "id": response_id,
                "usage": {"input_tokens": 1, "output_tokens": 1, "total_tokens": 2},
            }},
        ]
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Connection", "close")
        self.end_headers()
        try:
            self.write_event(first)
            if request["case"] == "interrupt":
                time.sleep(4)
            for data in end:
                self.write_event(data)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def write_event(self, data):
        self.wfile.write(("data: " + json.dumps(data) + "\n\n").encode())
        self.wfile.flush()


class Terminal:
    """运行正常的 Codex 终端入口，响应终端能力查询并保留合成屏幕。"""

    def __init__(self, command, cwd, extra_env=None):
        self.buffer = bytearray()
        self.status = None
        self.pid, self.fd = pty.fork()
        if self.pid == 0:
            os.chdir(cwd)
            os.execve(command[0], command, {**os.environ, **(extra_env or {})})
        fcntl.ioctl(self.fd, termios.TIOCSWINSZ, struct.pack("HHHH", 35, 120, 0, 0))

    def text(self):
        decoded = self.buffer.decode(errors="replace")
        return re.sub(r"\x1b(?:\[[0-?]*[ -/]*[@-~]|\][^\x07\x1b]*(?:\x07|\x1b\\))", "", decoded)

    def read(self, timeout=0.1):
        if not select.select([self.fd], [], [], timeout)[0]:
            return
        try:
            chunk = os.read(self.fd, 32768)
        except OSError as error:
            if error.errno != errno.EIO:
                raise
            return
        self.buffer.extend(chunk)
        for query, answer in (
            (b"\x1b[6n", b"\x1b[1;1R"),
            (b"\x1b[c", b"\x1b[?1;2c"),
            (b"\x1b[?u", b"\x1b[?0u"),
            (b"\x1b]10;?", b"\x1b]10;rgb:ffff/ffff/ffff\x07"),
            (b"\x1b]11;?", b"\x1b]11;rgb:0000/0000/0000\x07"),
        ):
            if query in chunk:
                os.write(self.fd, answer)

    def exited(self):
        if self.status is None:
            pid, status = os.waitpid(self.pid, os.WNOHANG)
            if pid:
                self.status = os.waitstatus_to_exitcode(status)
        return self.status is not None

    def wait(self, condition, label, timeout=8):
        deadline = time.monotonic() + timeout
        while not condition():
            if time.monotonic() > deadline or self.exited():
                if condition():
                    return
                raise RuntimeError(f"{label}，退出 {self.status}，终端末尾 {self.text()[-1800:]!r}")
            self.read()

    def submit(self, text):
        os.write(self.fd, text.encode())
        self.settle(0.2)
        os.write(self.fd, b"\r")

    def settle(self, seconds):
        deadline = time.monotonic() + seconds
        while time.monotonic() < deadline:
            self.read(0.02)

    def interrupt(self):
        os.write(self.fd, b"\x03")

    def close(self):
        if not self.exited():
            os.kill(self.pid, signal.SIGKILL)
            os.waitpid(self.pid, 0)
        os.close(self.fd)


async def discover_project_items(codex, repo, method, params):
    """从实际宿主取回项目级入口和状态。"""
    process = await asyncio.create_subprocess_exec(
        codex, "app-server", "--listen", "stdio://", cwd=repo,
        stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.DEVNULL,
    )

    async def send(packet):
        process.stdin.write((json.dumps(packet) + "\n").encode())
        await process.stdin.drain()

    async def receive(request_id):
        while line := await process.stdout.readline():
            packet = json.loads(line)
            if packet.get("id") == request_id:
                if "error" in packet:
                    raise RuntimeError(packet["error"])
                return packet["result"]
        raise RuntimeError(f"宿主未返回 {method}")

    try:
        await send({"id": 1, "method": "initialize", "params": {
            "clientInfo": {"name": "foundry-t004", "version": "1"},
        }})
        await asyncio.wait_for(receive(1), 10)
        await send({"method": "initialized"})
        await send({"id": 2, "method": method, "params": params})
        return (await asyncio.wait_for(receive(2), 10))["data"]
    finally:
        process.stdin.close()
        try:
            await asyncio.wait_for(process.wait(), 3)
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()


async def list_hooks(codex, repo, scopes):
    """使用与 /hooks 相同的宿主发现接口读取候选和实际信任状态。"""
    return await discover_project_items(codex, repo, "hooks/list", {"cwds": [str(scope) for scope in scopes]})


def timezone_boundary(seconds_until_boundary=8):
    """为单个进程构造临近午夜的本地时区。"""
    boundary = int(time.time()) + seconds_until_boundary
    offset = (-boundary % 86400 + 43200) % 86400 - 43200
    hours, remainder = divmod(abs(offset), 3600)
    minutes, seconds = divmod(remainder, 60)
    sign = "-" if offset >= 0 else "+"
    return boundary, offset, f"TST{sign}{hours}:{minutes:02}:{seconds:02}"


def stored_sessions():
    """只查看隔离会话文件名，取得可供恢复的合成线程标识。"""
    return {
        str(uuid.UUID(path.stem[-36:])): str(path.relative_to(Path.home() / ".codex"))
        for path in (Path.home() / ".codex/sessions").rglob("rollout-*.jsonl")
    }


def terminal_case(codex, cwd, prompt, server, name, extra_args=(), interrupt=False):
    """在真实交互入口完成普通或主动中断的单轮合成对话。"""
    server.case = name
    terminal = Terminal([codex, "--no-daemon", "--no-alt-screen", *extra_args], cwd)
    try:
        terminal.wait(
            lambda: "gpt-5.4" in terminal.text() or "› 1. Open restricted" in terminal.text(),
            f"{name} 等待启动",
        )
        if "› 1. Open restricted" in terminal.text():
            terminal.submit("")
        terminal.wait(lambda: "gpt-5.4" in terminal.text(), f"{name} 等待编辑器")
        if interrupt:
            terminal.submit(prompt)
            terminal.wait(lambda: any(item["case"] == name for item in server.requests), "等待中断对照请求")
            terminal.interrupt()
            terminal.wait(
                lambda: any(item["hook_event_name"] == "Interrupt" for item in events(server.trace)),
                "等待真实中断事件",
            )
        elif prompt:
            terminal.submit(prompt)
            terminal.wait(lambda: final_reply(name) in terminal.text(), f"{name} 等待本轮固定回复")
            terminal.settle(0.5)
        terminal.submit("/exit")
        terminal.wait(terminal.exited, f"{name} 等待正常退出")
        assert terminal.status == 0, terminal.text()[-1500:]
    finally:
        terminal.close()


def exec_case(codex, cwd, prompt, server, name, session=None):
    """保留真实 exec 或 exec resume 的入口对照。"""
    server.case = name
    command = [codex, "--no-daemon", "exec", "--json", "-C", str(cwd)]
    if session:
        command.extend(["resume", session])
    result = subprocess.run([*command, prompt], cwd=cwd, capture_output=True, text=True, timeout=15)
    assert result.returncode == 0 and final_reply(name) in result.stdout, result.stdout[-1600:] + result.stderr[-1600:]
    started = [
        item["thread_id"]
        for line in result.stdout.splitlines() if line.startswith("{")
        if (item := json.loads(line)).get("type") == "thread.started"
    ]
    return started[0] if started else None


def record_snapshot(records):
    """仅比较验证资料区的文件，与诊断日志分隔。"""
    return {str(item.relative_to(records)): item.read_bytes() for item in records.rglob("*") if item.is_file()}


def inspect_case(server, name, launch, action):
    """把启动器已知信息与宿主真正给出的字段并列保留。"""
    start = len(events(server.trace))
    before = set(stored_sessions())
    records_before = record_snapshot(server.records)
    result = action()
    observed = events(server.trace)[start:]
    new_sessions = sorted(set(stored_sessions()) - before)
    return {
        "case": name,
        "startedFrom": str(launch),
        "newSessions": new_sessions,
        "execSession": result,
        "scopeEvents": [
            {
                "event": event["hook_event_name"],
                "cwd": event["cwd"],
                "sessionId": event["session_id"],
                "source": event.get("source"),
                "payloadKeys": sorted(set(event) - {"observedNs"}),
            }
            for event in observed
        ],
        "requests": sum(item["case"] == name for item in server.requests),
        "recordsUnchanged": records_before == record_snapshot(server.records),
    }


def main(codex, root):
    repo = root / "repository"
    child = repo / "projects/alpha"
    outside = root / "repository-outside"
    records = root / "records"
    trace = root / "trace"
    trace.mkdir()
    home_config = Path.home() / ".codex/config.toml"
    home_config.parent.mkdir()
    version = subprocess.check_output([codex, "--version"], text=True).strip()
    assert version == "codex-cli 0.170.0", version
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Responses)
    server.records, server.trace, server.requests, server.case = records, trace, [], "first"
    threading.Thread(target=server.serve_forever, daemon=True).start()
    configuration = f"""model = "gpt-5.4"
model_provider = "foundry_fixture"
check_for_update_on_startup = false
approval_policy = "never"
sandbox_mode = "read-only"
[model_providers.foundry_fixture]
name = "Foundry fixture"
base_url = "http://127.0.0.1:{server.server_address[1]}/v1"
wire_api = "responses"
requires_openai_auth = false
request_max_retries = 0
stream_max_retries = 0
[projects.{json.dumps(str(repo))}]
trust_level = "trusted"
[projects.{json.dumps(str(outside))}]
trust_level = "untrusted"
"""
    hook_file = repo / ".codex/hooks.json"
    hook_file.parent.mkdir()
    command = shlex.join(["/usr/bin/python3", str(root / "recording-host.py"), "hook", str(records), str(trace)])
    hook_file.write_text(json.dumps({"hooks": {
        name: [{"hooks": [{"type": "command", "command": command}]}] for name in EVENTS
    }}))
    home_config.write_text(configuration.replace('trust_level = "trusted"', 'trust_level = "untrusted"'))
    untrusted_project = asyncio.run(list_hooks(codex, repo, (repo, child, outside)))
    assert all(not row["hooks"] for row in untrusted_project), untrusted_project
    untrusted = inspect_case(
        server, "untrusted", repo,
        lambda: terminal_case(codex, repo, "T004_UNTRUSTED", server, "untrusted"),
    )
    assert untrusted["requests"] > 0 and not untrusted["scopeEvents"], untrusted
    home_config.write_text(configuration)
    before = asyncio.run(list_hooks(codex, repo, (repo, child, outside)))
    discovered = before[0]["hooks"]
    assert len(discovered) == len(EVENTS), before
    assert all(item["trustStatus"] == "untrusted" for item in discovered)
    assert {item["key"] for item in before[1]["hooks"]} == {item["key"] for item in discovered}
    assert not before[2]["hooks"]
    trusted = "\n".join(
        f"[hooks.state.{json.dumps(item['key'])}]\ntrusted_hash = {json.dumps(item['currentHash'])}\n"
        for item in discovered
    )
    home_config.write_text(configuration + "\n" + trusted)
    after = asyncio.run(list_hooks(codex, repo, (repo, child, outside)))
    assert all(item["trustStatus"] == "trusted" for row in after[:2] for item in row["hooks"]), after

    server.case = "first"
    initial_sessions = set(stored_sessions())
    first_event = len(events(trace))
    boundary, offset, timezone = timezone_boundary()
    terminal = Terminal([codex, "--no-daemon", "--no-alt-screen"], child, {"TZ": timezone})
    try:
        terminal.wait(lambda: "gpt-5.4" in terminal.text(), "等待编辑器")
        opened_at = time.time()
        assert opened_at < boundary, "终端启动晚于测试午夜"
        terminal.wait(lambda: time.time() >= boundary + 0.15, "等待跨日")
        idle_hooks = events(trace)[first_event:]
        idle_sessions = sorted(set(stored_sessions()) - initial_sessions)
        submitted_at = time.time()
        terminal.submit(FIRST_PROMPT)
        terminal.wait(lambda: FINAL_TEXT in terminal.text(), "等待固定末轮")
        terminal.wait(
            lambda: any(event.get("last_assistant_message") == FINAL_TEXT for event in events(trace)),
            "等待 Stop 保存正常末轮",
        )
        terminal.settle(0.5)
        terminal.submit("/exit")
        terminal.wait(terminal.exited, "等待正常退出")
        assert terminal.status == 0, terminal.text()[-1500:]
    finally:
        terminal.close()
    hook_events = events(trace)[first_event:]
    first_requests = [item for item in server.requests if item["case"] == "first"]
    first_id = next(item["session_id"] for item in hook_events if item["hook_event_name"] == "SessionStart")
    assert first_id in stored_sessions(), stored_sessions()
    snapshot = (records / "first-prompt.txt").read_bytes()
    followups = [untrusted]
    try:
        followups.append(inspect_case(
            server, "interrupt", repo,
            lambda: terminal_case(codex, repo, "T004_INTERRUPT", server, "interrupt", interrupt=True),
        ))
        followups.append(inspect_case(
            server, "exec", child,
            lambda: exec_case(codex, child, "T004_EXEC", server, "exec"),
        ))
        followups.append(inspect_case(
            server, "exec-resume", child,
            lambda: exec_case(codex, child, "T004_EXEC_RESUME", server, "exec-resume", first_id),
        ))
        followups.append(inspect_case(
            server, "outside", outside,
            lambda: terminal_case(codex, outside, "T004_OUTSIDE", server, "outside"),
        ))
        outside_ids = followups[-1]["newSessions"]
        assert len(outside_ids) == 1, followups[-1]
        followups.append(inspect_case(
            server, "inside-resume", child,
            lambda: terminal_case(codex, child, "T004_INSIDE_RESUME", server, "inside-resume",
                                  ("-c", 'tui.resume_cwd="current"', "resume", first_id)),
        ))
        followups.append(inspect_case(
            server, "inside-resume-outside", child,
            lambda: terminal_case(codex, child, "T004_INSIDE_RESUME_OUTSIDE", server, "inside-resume-outside",
                                  ("-c", 'tui.resume_cwd="current"', "resume", outside_ids[0])),
        ))
        followups.append(inspect_case(
            server, "outside-resume-inside", outside,
            lambda: terminal_case(codex, outside, "T004_OUTSIDE_RESUME_INSIDE", server, "outside-resume-inside",
                                  ("-c", 'tui.resume_cwd="session"', "resume", first_id)),
        ))
    finally:
        server.shutdown()

    today = lambda stamp: time.strftime("%Y-%m-%d", time.gmtime(stamp + offset))
    print(json.dumps({
        "version": version,
        "hooks": {
            "before": {row["cwd"]: [item["trustStatus"] for item in row["hooks"]] for row in before},
            "after": {row["cwd"]: [item["trustStatus"] for item in row["hooks"]] for row in after},
            "untrustedProjectCounts": [len(row["hooks"]) for row in untrusted_project],
        },
        "idleEvents": [item["hook_event_name"] for item in idle_hooks],
        "idleSessionFiles": idle_sessions,
        "openDate": today(opened_at), "firstPromptDate": today(submitted_at),
        "firstRequestSawSavedPrompt": bool(first_requests) and first_requests[0]["savedPrompt"] == FIRST_PROMPT,
        "requests": first_requests,
        "events": hook_events,
        "followups": followups,
        "receiptUnchanged": snapshot == (records / "first-prompt.txt").read_bytes(),
    }))


if __name__ == "__main__":
    if sys.argv[1] == "hook":
        hook(Path(sys.argv[2]), Path(sys.argv[3]))
    else:
        main(sys.argv[1], Path(sys.argv[2]))
