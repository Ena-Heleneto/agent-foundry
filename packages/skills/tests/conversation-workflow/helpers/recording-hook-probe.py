"""T035 首次启用及首末轮烟雾探针，仅使用隔离项目、合成回复和临时记录器。"""

import asyncio
from datetime import datetime, timedelta, timezone
import fcntl
from hashlib import sha256
import http.server
import json
import os
from pathlib import Path
import re
import runpy
import select
import shlex
import shutil
import signal
import sqlite3
import struct
import subprocess
import sys
import tempfile
import threading
import time
import tomllib
from urllib.parse import unquote
from uuid import UUID
import uuid
import zlib


def log(path, **data):
    with path.open("a") as output:
        output.write(json.dumps({"ns": time.monotonic_ns(), "wallNs": time.time_ns(), **data}) + "\n")


def trace(path):
    return [json.loads(line) for line in path.read_text().splitlines()] if path.exists() else []


def prompt_metadata(payload):
    db = Path(os.environ["CODEX_SQLITE_HOME"]) / "thread_history_1.sqlite"
    if not db.is_file():
        return {"sqliteExists": False}
    with sqlite3.connect(f"file:{db}?mode=ro", uri=True) as connection:
        indexed = connection.execute(
            "select turn_id, status, rollout_byte_offset from thread_turns where thread_id = ?",
            (payload["session_id"],),
        ).fetchall()
    active = [row for row in indexed if row[0] == payload.get("turn_id") and row[1] == "inProgress"]
    if len(active) != 1 or type(active[0][2]) is not int:
        return {"sqliteExists": True, "matchedActiveTurn": False, "indexedRows": len(indexed)}
    with Path(payload["transcript_path"]).open("rb") as rollout:
        rollout.seek(active[0][2])
        # 此探针只读取自身生成的合成会话。
        item = json.loads(rollout.readline())
    event = item.get("payload", {})
    return {
        "sqliteExists": True,
        "matchedActiveTurn": True,
        "eventMatches": item.get("type") == "event_msg" and event.get("type") == "task_started" and event.get("turn_id") == payload.get("turn_id"),
        "turnTrigger": (event.get("turn_attribution") or {}).get("turn_trigger"),
    }


def append_record(path, entry):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as stream:
        stream.write(entry)
    if not path.read_text(encoding="utf-8").endswith(entry):
        raise RuntimeError("主记录读回与本次写入不符")


def record_hook(root, trace):
    """只在合成项目内记录已核实的用户轮次和实发回复。"""
    data = json.load(sys.stdin)
    event = data["hook_event_name"]
    turn = str(UUID(data["turn_id"]))
    session = str(UUID(data["session_id"]))
    reads = []
    cwd = Path(data["cwd"]).resolve()
    if not cwd.is_relative_to(root):
        log(trace, event=event, turn=turn, session=session, status="outside-cwd", reads=reads)
        return
    index_root = Path(os.environ["CODEX_HOME"]) / "sessions"
    transcript = Path(data["transcript_path"]).resolve()
    if not transcript.is_relative_to(index_root) or not transcript.name.endswith(f"-{session}.jsonl"):
        log(trace, event=event, turn=turn, session=session, status="unknown-transcript", reads=reads)
        return
    reads.append("current-turn-event")
    meta = prompt_metadata(data)
    trigger = meta.get("turnTrigger")
    if not meta.get("eventMatches") or trigger != "user":
        log(trace, event=event, turn=turn, session=session, status="skipped", trigger=trigger, reads=reads)
        return
    with transcript.open("rb") as stream:
        session_meta = json.loads(stream.readline())
    reads.append("session-meta")
    origin = session_meta.get("payload", {})
    if (session_meta.get("type") != "session_meta" or origin.get("id") != session or
        origin.get("originator") != "codex-tui" or not origin.get("cwd") or
        not Path(origin["cwd"]).resolve().is_relative_to(root)):
        log(trace, event=event, turn=turn, session=session, status="outside-origin", reads=reads)
        return
    opening_date = re.match(r"rollout-(\d{4}-\d{2}-\d{2})T", transcript.name).group(1)
    record = root / f"records/{opening_date}/{session}.md"
    turn_marker = f"<!-- turn-{turn} -->"
    prompt = data.get("prompt")
    reply = data.get("last_assistant_message")
    old_text = record.read_text() if record.is_file() else ""
    if event == "UserPromptSubmit" and turn_marker not in old_text:
        title = f"# 对话记录\n\n会话 `{session}` · 开启 `{origin['timestamp']}` · 目录 `{origin['cwd']}`\n" if not old_text else ""
        entry = f"{title}\n> **{datetime.now().date()}** {turn_marker}\n>\n> - **发起** {prompt}\n"
        original = prompt
    elif event == "Stop" and reply and turn_marker in old_text and "> - **回复** " not in old_text.split(turn_marker, 1)[1]:
        entry = "> - **回复** " + "\n>   ".join(reply.split("\n")) + "\n"
        original = reply
    else:
        log(trace, event=event, turn=turn, session=session, status="skipped-existing", reads=reads)
        return
    log(trace, event=event, turn=turn, session=session, status="received", reads=reads, original=original)
    append_record(record, entry)
    read_back = record.read_text(encoding="utf-8").splitlines()
    if event == "UserPromptSubmit":
        saved = read_back[-1].removeprefix("> - **发起** ")
    else:
        text = record.read_text(encoding="utf-8").split(turn_marker, 1)[1]
        saved = text.split("> - **回复** ", 1)[1].removesuffix("\n").replace("\n>   ", "\n")
    log(trace, event=event, turn=turn, session=session, status="read-back", exact=saved == original)

if len(sys.argv) > 1 and sys.argv[1] == "--hook":
    record_hook(Path(__file__).resolve().parents[1], Path(sys.argv[2]))
    raise SystemExit

host_fixture = runpy.run_path(str(Path(__file__).with_name("recording-host.py")))
HostResponses = host_fixture["Responses"]
list_hooks = host_fixture["list_hooks"]
discover_project_items = host_fixture["discover_project_items"]

PROMPTS = ["读一下 README", "请只回复 T035_NO_TOOLS"]
REPLIES = ["T035_README_FINAL\n\nT035_README_END", "T035_NO_TOOLS\n\nT035_NO_TOOLS_END"]
README = "T035_README_ACTUAL_BYTES"
TOOLS = ("exec_command", "shell_command")
COMMIT_PROMPT = "修复、提交失败后重试 T035_COMMIT"
COMMIT_REPLY = "T035_COMMIT_RESULT"
AFTER_PROMPT = "请回复 T035_AFTER_COMMIT"
AFTER_REPLY = "T035_AFTER_NORMAL"
RESUMES = ("T035_RESUME_ALPHA", "T035_RESUME_BETA", "T035_RESUME_RELOCATED")
MATRIX_PROMPT = "T035_MATRIX_INPUT"
MATRIX_REPLY = "T035_MATRIX_DONE"
OUTSIDE_PROMPT = "T035_OUTSIDE_OPEN"
FOREIGN_PROMPT = "T035_FOREIGN_RESUME"
PAUSED_PROMPT = "T035_INTERRUPTED_INPUT"
PAUSED_REPLY = "T035_INTERRUPTED_VISIBLE"
CONTINUED = "T035_INTERRUPTED_RECOVERED"
CANCEL_INPUT = "T035_CANCEL_INPUT"
CANCEL_CHUNK = "T035_CANCEL_VISIBLE_CHUNK"
EARLY_INPUT = "T035_CLOSED_BEFORE_INPUT_SAVE"
WRITE_PROMPT = "T035_WRITE_FAIL_INPUT"
WRITE_REPLY = "T035_WRITE_REPAIRED"
PARTIAL_INPUT = "T035_PARTIAL_INPUT"
PARTIAL_REPLY = "T035_PARTIAL_REPAIRED"
PARALLEL_PROMPT = "T035_PARALLEL_SAME_INPUT"
PARALLEL_REPLY = "T035_PARALLEL_SAME_REPLY"
STEER_INPUT = "T035_STEER_FIRST"
STEER_ADDITION = "T035_STEER_ADDITION"
STEER_REPLY = "T035_STEER_DONE"
LONG_HEAD = "T035_LONG_BEGIN"
LONG_TAIL = "T035_LONG_END"
MATRIX_TOOL_IDS = ("matrix-image-alpha", "matrix-image-beta", "matrix-outside", "matrix-long", "matrix-stream", "matrix-poll")
COMMIT_STEPS = (
    ("t035-failure", "git commit --only -m should-fail -- absent.txt"),
    ("t035-repair", "printf 'T035_REPAIRED_README\\n' > README.md"),
    ("t035-retry", "git add README.md && git commit -m repaired"),
)


def formal_message(label, text):
    """构造正式主记录的预期完整消息，保留原话与外层排版的区别。"""
    title = {"发起": "用户 · 发起", "补充": "用户 · 补充", "回复": "主代理 · 回复"}[label]
    return f"<!-- foundry-message {label} {len(text)} -->\n\n### {title}\n\n{text}\n"


def records_snapshot(repo):
    """检查合成项目的记录写入和字节变化。"""
    roots = (repo / "records", repo / "conversation-recording/records")
    return {path.relative_to(repo).as_posix(): [path.stat().st_mtime_ns, sha256(path.read_bytes()).hexdigest()]
            for root in roots for path in root.rglob("*") if path.is_file()}


def main_records(repo):
    """找到独立正式安装和早期平铺探针各自的主记录。"""
    return [*repo.glob("records/*/*/record.md"), *repo.glob("records/*/*.md")]


def record_session(record):
    """从实际文件前言取会话身份，标题目录仍按真实 ID 恢复。"""
    if record.name == "record.md":
        return re.search(r"^会话 `([a-f0-9-]{36})`", record.read_text(), re.M)[1]
    return record.stem


def record_date(record):
    return record.parents[1 if record.name == "record.md" else 0].name


def png_fixture(color):
    """生成一个合成原件，供两处同名附件的字节回查。"""
    def chunk(kind, payload):
        return struct.pack(">I", len(payload)) + kind + payload + struct.pack(">I", zlib.crc32(kind + payload))

    header = struct.pack(">2I5B", 1, 1, 8, 2, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(b"\0" + color)) + chunk(b"IEND", b"")


class Provider(HostResponses):
    """回环端点仅返回合成回复或一次读取 README 的工具请求。"""

    def matrix_tool(self, outputs, available):
        """驱动真实 MCP 文件工具以及包含完整参数的命令和续流。"""
        call = next((name for name in MATRIX_TOOL_IDS if name not in outputs), None)
        if not call:
            return None
        if call.startswith("matrix-image-"):
            label = call.removeprefix("matrix-image-")
            tool = next(t for t in available if f"fixture_{label}" in t.get("name", ""))
            if tool.get("tools"):
                nested = next(t for t in tool["tools"] if t["name"] == "attachment")
                return self.call(call, nested["name"], {"label": label}, tool["name"])
            return self.call(call, tool["name"], {"label": label})
        if call == "matrix-poll":
            match = re.search(r"session ID (\d+)", str(outputs["matrix-stream"]))
            assert match, outputs["matrix-stream"]
            return self.call(call, "write_stdin", {"session_id": int(match[1]), "chars": "", "yield_time_ms": 3000})
        commands = {
            "matrix-outside": ("/usr/bin/cat evidence.txt", str(self.server.matrix_work / "outside-tools"), 1000, 2000),
            "matrix-long": (f"python3 -c 'print(\"{LONG_HEAD}\"); print(\"repeat abc 123\" * 700); print(\"{LONG_TAIL}\")'",
                            str(self.server.repo), 1000, 12000),
            "matrix-stream": ("printf 'T035_STREAM_FIRST\\n'; sleep 2; printf 'T035_STREAM_LAST\\n'",
                              str(self.server.repo), 1000, 2000),
        }
        cmd, workdir, yield_time, limit = commands[call]
        return self.call(call, "exec_command", {"cmd": cmd, "workdir": workdir,
                                                  "yield_time_ms": yield_time, "max_output_tokens": limit})

    @staticmethod
    def call(call, name, arguments, namespace=None):
        item = {"type": "function_call", "id": f"fc-{call}", "call_id": call,
                "name": name, "arguments": json.dumps(arguments, ensure_ascii=False)}
        if namespace:
            item["namespace"] = namespace
        return item

    def do_POST(self):
        request = json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))))
        last_user = next((item for item in reversed(request["input"]) if item.get("role") == "user"), {})
        user_text = json.dumps(last_user, ensure_ascii=False)
        is_aux = "text" in request
        correlation = "unrecognized"
        resume_answer = next((answer for answer in RESUMES if answer in user_text), None)
        if MATRIX_PROMPT in user_text:
            correlation = "matrix"
        elif OUTSIDE_PROMPT in user_text:
            correlation = "outside"
        elif FOREIGN_PROMPT in user_text:
            correlation = "foreign"
        elif PAUSED_PROMPT in user_text:
            correlation = "interrupted"
        elif CONTINUED in user_text:
            correlation = "continued"
        elif CANCEL_INPUT in user_text:
            correlation = "cancel"
        elif WRITE_PROMPT in user_text:
            correlation = "writeFailure"
        elif PARTIAL_INPUT in user_text:
            correlation = "partialFailure"
        elif PARALLEL_PROMPT in user_text:
            correlation = "parallel"
        elif STEER_INPUT in user_text or STEER_ADDITION in user_text:
            correlation = "steer"
        elif resume_answer:
            correlation = "resume"
        elif AFTER_PROMPT in user_text:
            correlation = "after"
        elif COMMIT_PROMPT in user_text:
            correlation = "commit"
        elif PROMPTS[1] in user_text:
            correlation = "question"
        elif "README" in user_text:
            correlation = "readme"
        elif "T035_EXEC" in user_text:
            correlation = "exec"
        response_id = uuid.uuid4().hex
        item_id = response_id + "-message"
        item = None
        output = next((value for value in request["input"] if value.get("call_id") == "call_t035_readme"
                       and value.get("type") == "function_call_output"), None)
        request_tools = request.get("tools", [])
        tools = [tool for tool in request_tools if tool.get("name") in TOOLS]
        commit_outputs = {value.get("call_id"): value.get("output") for value in request["input"]
                          if value.get("type") == "function_call_output" and str(value.get("call_id")).startswith("t035-")}
        wanted = {"readme": PROMPTS[0], "question": PROMPTS[1]}.get(correlation)
        prompt_saved = wanted is not None and any(
            wanted.encode() in path.read_bytes() for path in main_records(self.server.repo)
        )
        log(self.server.events, event="ProviderRequest", correlation=correlation, auxiliary=is_aux,
            outputHasReadme=output is not None and README in json.dumps(output), promptAlreadySaved=prompt_saved,
            commitOutputs=commit_outputs if correlation == "commit" else {},
            records=records_snapshot(self.server.repo) if correlation == "commit" else {})
        if correlation == "matrix" and not is_aux:
            outputs = {row["call_id"]: row.get("output") for row in request["input"]
                       if row.get("type") == "function_call_output" and row.get("call_id") in MATRIX_TOOL_IDS}
            item = self.matrix_tool(outputs, request_tools)
            log(self.server.events, event="MatrixToolResults", calls=list(outputs))
        if correlation == "steer" and not is_aux:
            seen = any(row.get("type") == "function_call_output" and row.get("call_id") == "steer-tool"
                       for row in request["input"])
            if not seen:
                item = self.call("steer-tool", "exec_command", {
                    "cmd": "printf 'started' > .t035-steer-started; sleep 5; printf 'T035_STEER_TOOL_DONE\\n'",
                    "yield_time_ms": 8000})
        if correlation == "interrupted" and not is_aux:
            assert self.server.final_gate.wait(15), "中断探针未释放合成回复"
        if correlation == "writeFailure" and not is_aux:
            assert self.server.write_gate.wait(15), "写入故障探针未释放合成回复"
        if correlation == "partialFailure" and not is_aux:
            part_done = any(row.get("type") == "function_call_output" and row.get("call_id") == "partial-tool"
                            for row in request["input"])
            log(self.server.events, event="PartialFailureStage", toolCompleted=part_done)
            stage = self.server.partial_finish if part_done else self.server.partial_start
            assert stage.wait(15), "部分写入探针未释放实际工具或回复"
            if not part_done:
                item = self.call("partial-tool", "exec_command", {"cmd": "/usr/bin/cat README.md"})
        if correlation == "readme" and not is_aux and output is None and tools:
            tool = tools[0]
            cmd = "/usr/bin/cat README.md"
            args = {"cmd": cmd} if tool["name"] == "exec_command" else {"command": cmd}
            item = {"type": "function_call", "id": item_id, "call_id": "call_t035_readme",
                    "name": tool["name"], "arguments": json.dumps(args)}
            log(self.server.events, event="ProviderBusinessTool", tool=tool["name"], command=cmd)
        if correlation == "commit" and not is_aux and tools:
            pending = next(((call, cmd) for call, cmd in COMMIT_STEPS if call not in commit_outputs), None)
            if pending:
                call, cmd = pending
                tool = tools[0]
                args = {"cmd": cmd} if tool["name"] == "exec_command" else {"command": cmd}
                item = {"type": "function_call", "id": item_id, "call_id": call,
                        "name": tool["name"], "arguments": json.dumps(args)}
        if item is None:
            answer = {"readme": REPLIES[0], "question": REPLIES[1], "exec": "T035_EXEC_FINAL",
                      "commit": COMMIT_REPLY, "after": AFTER_REPLY, "resume": resume_answer,
                      "matrix": MATRIX_REPLY, "outside": "T035_OUTSIDE_DONE", "foreign": "T035_FOREIGN_DONE",
                      "interrupted": PAUSED_REPLY, "continued": CONTINUED,
                      "writeFailure": WRITE_REPLY, "partialFailure": PARTIAL_REPLY,
                      "parallel": PARALLEL_REPLY, "steer": STEER_REPLY}.get(correlation, "T035_OTHER_FINAL")
            if is_aux:
                answer = "T035 AUXILIARY"
            item = {"id": item_id, "type": "message", "role": "assistant", "phase": "final_answer",
                    "content": [{"type": "output_text", "text": answer}]}
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Connection", "close")
        self.end_headers()
        self.write_event({"type": "response.created", "response": {"id": response_id}})
        if item["type"] == "message" and not is_aux:
            self.write_event({"type": "response.output_item.added", "output_index": 0, "item": {**item, "content": []}})
            if correlation == "cancel":
                self.write_event({"type": "response.output_text.delta", "delta": CANCEL_CHUNK, "item_id": item_id,
                                  "output_index": 0, "content_index": 0})
                self.server.cancel_gate.wait(15)
                return
            first, sep, last = answer.partition("\n\n")
            for part in ([first + sep, last] if sep else [first]):
                self.write_event({"type": "response.output_text.delta", "delta": part, "item_id": item_id,
                                  "output_index": 0, "content_index": 0})
                if part.endswith(sep) and sep:
                    time.sleep(0.45)
        self.write_event({"type": "response.output_item.done", "output_index": 0, "item": item})
        log(self.server.events, event="ProviderFinished", correlation=correlation, auxiliary=is_aux,
            isFinal=item["type"] == "message")
        self.write_event({"type": "response.completed", "response": {
            "id": response_id, "output": [item], "usage": {"input_tokens": 1, "output_tokens": 2, "total_tokens": 3}}})


def matching_hook_process(candidate):
    """定位本隔离项目仍在运行的正式回调。"""
    for path in Path("/proc").glob("[0-9]*/cmdline"):
        try:
            argv = path.read_bytes().split(b"\0")
        except (FileNotFoundError, PermissionError, ProcessLookupError):
            continue
        if os.fsencode(candidate) in argv:
            return int(path.parent.name)
    return None


def run_probe(binary, work, skill_source, link_source, formal=False, extended=False):
    """使用原生信任界面复验正式安装或保留的临时对照。"""
    state = Path(os.environ["CODEX_HOME"]).resolve()
    assert state == work / "state" and Path(os.environ["CODEX_SQLITE_HOME"]).resolve() == state
    repo = work / "repo"
    events = work / "events.jsonl"
    repo.mkdir()
    subprocess.run(["git", "init", "-q", repo], check=True)
    (repo / "README.md").write_text(README + "\n")
    if formal:
        for arguments in (("config", "user.name", "T035 fixture"), ("config", "user.email", "t035@example.invalid"),
                          ("add", "README.md"), ("commit", "-qm", "fixture baseline")):
            subprocess.run(["git", *arguments], cwd=repo, capture_output=True, check=True)
    target = repo / ".agents/skills"
    maintained = skill_source / "conversation-recording"
    hook_file = repo / ".codex/hooks.json"
    if formal:
        subprocess.run([sys.executable, "-B", str(maintained / "install.py"), "--project", str(repo)],
                       capture_output=True, check=True)
        candidate = target / "conversation-recording/scripts/stop.py"
        prompt_candidate = candidate.with_name("user_prompt_submit.py")
    else:
        subprocess.run(["bash", str(link_source), str(skill_source), str(target)], capture_output=True, check=True)
        hook_file.parent.mkdir()
        candidate = hook_file.parent / "recording-probe.py"
        prompt_candidate = candidate
        shutil.copyfile(__file__, candidate)
        command = shlex.join([sys.executable, str(candidate), "--hook", str(events)])
        hook_file.write_text(json.dumps({"hooks": {event: [{"hooks": [{"type": "command", "command": command}]}]
                                                    for event in ("UserPromptSubmit", "Stop")}}))
    skill = target / "conversation-recording"
    installed = {str(path.relative_to(skill)): sha256(path.read_bytes()).hexdigest()
                 for path in skill.rglob("*") if path.is_file() and path.name != ".foundry-recording-install.json"}
    base = {str(path.relative_to(maintained)): sha256(path.read_bytes()).hexdigest()
            for path in maintained.rglob("*") if path.is_file()}
    assert installed == base and "SKILL.md" in installed, installed
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Provider)
    server.events = events
    server.repo = repo
    server.matrix_work = work
    server.final_gate = threading.Event()
    server.cancel_gate = threading.Event()
    server.write_gate = threading.Event()
    server.partial_start = threading.Event()
    server.partial_finish = threading.Event()
    threading.Thread(target=server.serve_forever, daemon=True).start()
    config = state / "config.toml"
    config.write_text(f"""model = "gpt-5.4"
model_provider = "fixture"
check_for_update_on_startup = false
approval_policy = "never"
sandbox_mode = "{'danger-full-access' if formal else 'read-only'}"
[model_providers.fixture]
name = "T035 isolated"
base_url = "http://127.0.0.1:{server.server_port}/v1"
wire_api = "responses"
requires_openai_auth = false
request_max_retries = 0
stream_max_retries = 0
""")
    expected_images = {}
    user_image = work / "user-image.png"
    if extended:
        mcp_source = Path(__file__).with_name("content-source.py")
        user_image.write_bytes(png_fixture(b"\x42\x23\x11"))
        with config.open("a") as output:
            for label, color in (("alpha", b"\x20\x55\x99"), ("beta", b"\x99\x52\x20")):
                mcp_root = work / f"mcp-{label}"
                source_image = mcp_root / "input/tool-image.png"
                source_image.parent.mkdir(parents=True)
                source_image.write_bytes(png_fixture(color))
                expected_images[label] = sha256(source_image.read_bytes()).hexdigest()
                output.write(f"\n[mcp_servers.fixture_{label}]\ncommand = {json.dumps(sys.executable)}\n"
                             f"args = {json.dumps([str(mcp_source), '--mcp', str(mcp_root)])}\n")
        tool_directory = work / "outside-tools"
        tool_directory.mkdir()
        (tool_directory / "evidence.txt").write_text("T035_TOOL_OUTSIDE_BYTES\n")
    tmux = ["tmux", "-f", "/dev/null", "-S", str(work / "terminal.sock")]
    session = "isolated"

    def shell(*args):
        return subprocess.check_output([*tmux, *args], stderr=subprocess.STDOUT, text=True)

    def screen():
        try:
            return shell("capture-pane", "-p", "-t", session)
        except subprocess.CalledProcessError as error:
            return error.output

    def wait(predicate, label, timeout=15):
        limit = time.monotonic() + timeout
        while time.monotonic() < limit:
            result = predicate()
            if result:
                return result
            time.sleep(0.07)
        raise RuntimeError(f"{label}\n{screen()}\n{trace(events)[-8:]}")

    def enter(value):
        shell("send-keys", "-t", session, "-l", value)
        wait(lambda: value in screen(), "终端已回显输入")
        shell("send-keys", "-t", session, "Enter")

    def start(directory=repo, arguments=(), zone=None):
        command = ("env", f"TZ={zone}", binary) if zone else (binary,)
        shell("new-session", "-d", "-s", session, "-x", "125", "-y", "40", "-c", str(directory),
              *command, *arguments)

    def end():
        enter("/exit")
        wait(lambda: "can't find" in screen() or "no server running" in screen(), "正常退出会话")

    def discovered():
        return asyncio.run(list_hooks(binary, repo, (repo,)))[0]["hooks"]

    def discovered_skill():
        scopes = asyncio.run(discover_project_items(binary, repo, "skills/list", {"cwds": [str(repo)], "forceReload": True}))
        skills = scopes[0]["skills"]
        assert not any(item["name"] == "shadow-profile" for item in skills)
        matching = [item for item in skills if item["name"] == "conversation-recording" and item["enabled"]]
        assert len(matching) == 1 and Path(matching[0]["path"]) == skill / "SKILL.md", matching
        return {"installedProjectSkillDiscovered": True, "retiredEntryCount": 0}

    def read_backs():
        return [event for event in trace(events) if event.get("status") == "read-back"]

    def saved_reply(answer):
        expected = formal_message("回复", answer).encode()
        locations = main_records(repo) + main_records(repo / "conversation-recording")
        return next((path for path in locations if expected in path.read_bytes()), None)

    def stop_isolated_daemon():
        result = subprocess.run([binary, "app-server", "daemon", "stop"], cwd=repo, text=True,
                                capture_output=True, timeout=15)
        assert result.returncode == 0, (result.stdout, result.stderr)

    def kill_isolated_daemon():
        """终止本探针 PID 命名空间内的原生宿主，保留未完成回调边界。"""
        metadata = json.loads((state / "app-server-daemon/daemon.pid").read_text())
        process = metadata["pid"]
        descriptor = os.pidfd_open(process)
        try:
            argv = (Path("/proc") / str(process) / "cmdline").read_bytes().split(b"\0")
            assert b"app-server" in argv and Path(os.fsdecode(argv[0])).name == "codex", argv
            signal.pidfd_send_signal(descriptor, signal.SIGKILL)
            assert select.select([descriptor], [], [], 10)[0], "隔离宿主未退出"
        finally:
            os.close(descriptor)

    def sessions_containing(value):
        return [path for path in (state / "sessions").rglob("rollout-*.jsonl") if value in path.read_text()]

    def wait_ready():
        wait(lambda: "gpt-5.4" in screen() or "Trust and continue" in screen(), "原生终端就绪")
        if "Trust and continue" in screen():
            # 等第一屏保护性输入清理结束后，再在真实终端确认。
            time.sleep(0.3)
            shell("send-keys", "-t", session, "Enter")
            wait(lambda: "gpt-5.4" in screen(), "临时目录受信后终端就绪")

    def resume(directory, session_id):
        stop_isolated_daemon()
        start(directory, ("-c", 'tui.resume_cwd="current"', "resume", session_id))
        wait_ready()

    def verify_matrix():
        """核对真实 MCP 附件、长输出、流式工具和恢复后的链接。"""
        stop_isolated_daemon()
        start(arguments=("--image", str(user_image)))
        wait_ready()
        enter(MATRIX_PROMPT)
        record = wait(lambda: saved_reply(MATRIX_REPLY), "MCP 与命令矩阵的回复已保存", 35)
        end()
        assert any(set(row.get("calls", [])) == set(MATRIX_TOOL_IDS) for row in trace(events))
        detail_ref = re.search(r"\[查看经过\]\(([^)]*)\)", record.read_text())[1]
        detail_path = record.parent / detail_ref
        detail = detail_path.read_text()
        links = re.findall(r"\[附件\]\(((?:\.\./)?attachments/[^)]+)\)", detail)
        originals = {link: sha256((detail_path.parent / unquote(link)).read_bytes()).hexdigest() for link in links}
        user_checksum = sha256(user_image.read_bytes()).hexdigest()
        assert len(originals) == 3 and set(originals.values()) == {*expected_images.values(), user_checksum}, (originals, expected_images)
        assert "T035_TOOL_OUTSIDE_BYTES" in detail and str(work / "outside-tools") in detail
        assert ("repeat abc 123" * 700) in detail and LONG_HEAD in detail and LONG_TAIL in detail
        stream_first = re.search(r"## 工具结果 `matrix-stream`.*?T035_STREAM_FIRST", detail, re.S)
        stream_last = re.search(r"## 工具结果 `matrix-poll`.*?T035_STREAM_LAST", detail, re.S)
        assert stream_first and stream_last and stream_first.start() < stream_last.start(), detail[-6000:]
        resume(repo, record_session(record))
        enter("T035_MATRIX_REOPEN")
        wait(lambda: saved_reply("T035_OTHER_FINAL"), "带附件会话实际续写")
        end()
        assert detail_path.read_text() == detail
        assert all(sha256((detail_path.parent / link).read_bytes()).hexdigest() == checksum
                   for link, checksum in originals.items())
        return {"attachments": originals, "sourceHashes": expected_images, "userAttachmentSha256": user_checksum,
                "afterNativeResume": True,
                "longOutputExact": True, "streamedOutputInOrder": True, "outsideToolOutputInOriginalSession": True}

    def verify_foreign_resume():
        """在同名前缀的另一工作树创建会话，从安装目标中恢复。"""
        before = records_snapshot(repo)
        sibling = work / "repo-outside"
        subprocess.run(["git", "worktree", "add", "--detach", str(sibling)], cwd=repo, capture_output=True, check=True)
        stop_isolated_daemon()
        start(sibling)
        wait_ready()
        enter(OUTSIDE_PROMPT)
        wait(lambda: "T035_OUTSIDE_DONE" in screen(), "另一工作树会话完成")
        end()
        outside_rollout, = sessions_containing(OUTSIDE_PROMPT)
        outside_session = outside_rollout.stem[-36:]
        assert not records_snapshot(sibling) and records_snapshot(repo) == before
        resume(repo, outside_session)
        enter(FOREIGN_PROMPT)
        wait(lambda: "T035_FOREIGN_DONE" in screen(), "跨工作树恢复仍完成业务")
        end()
        rollout = [json.loads(line) for line in outside_rollout.read_text().splitlines()]
        assert any("T035_FOREIGN_DONE" in str(entry) for entry in rollout)
        effective = [entry["payload"].get("cwd") for entry in rollout if entry["type"] == "turn_context"]
        assert effective[-1] == str(repo), effective
        assert records_snapshot(repo) == before and not records_snapshot(sibling)
        return {"linkedWorktree": True, "sameNativeSession": True, "resumedBusinessCompleted": True,
                "noNewRecordOrRewrite": True}

    def verify_interrupted_stop():
        """在真实 Stop 等待会话锁时结束该回调，检验最后已落盘边界。"""
        stop_isolated_daemon()
        start()
        wait_ready()
        enter(PAUSED_PROMPT)
        wait(lambda: any(row.get("correlation") == "interrupted" and not row.get("auxiliary")
                         for row in trace(events)), "用户原话保存后进入模型请求")
        record = next(path for path in main_records(repo) if PAUSED_PROMPT in path.read_text())
        rollout, = (state / "sessions").rglob(f"*-{record_session(record)}.jsonl")
        before = record.read_bytes()
        with rollout.open("rb") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            server.final_gate.set()
            wait(lambda: PAUSED_REPLY in screen(), "完整回复已发至终端")
            process = wait(lambda: matching_hook_process(candidate), "正式 Stop 等待会话锁")
            assert PAUSED_REPLY in rollout.read_text() and record.read_bytes() == before
            os.kill(process, signal.SIGKILL)
            shell("kill-pane", "-t", session)
        stop_isolated_daemon()
        assert record.read_bytes() == before and PAUSED_REPLY not in record.read_text()
        resume(repo, record_session(record))
        enter(f"请只回复 {CONTINUED}")
        wait(lambda: saved_reply(CONTINUED), "强制中断后恢复并正常保存")
        end()
        assert record.read_bytes().startswith(before)
        assert PAUSED_REPLY not in record.read_text() and CONTINUED in record.read_text()
        return {"finalVisibleBeforeKill": True, "lastConfirmedBytesPreserved": True,
                "sameRecordResumed": True, "interruptedFinalRemainedGap": True}

    def verify_failed_write():
        """真实阻断首次写入，确认业务继续并在可写后补回原文。"""
        stop_isolated_daemon()
        ignore = repo / ".gitignore"
        ignore.write_text("/records/\n/conversation-recording/\n")
        before = records_snapshot(repo)
        start()
        wait_ready()
        enter(WRITE_PROMPT)
        wait(lambda: any(row.get("correlation") == "writeFailure" and not row.get("auxiliary") for row in trace(events)),
             "有实际模型请求，首条写入已返回")
        wait(lambda: "会话记录出现缺口" in screen() and "UserPromptSubmit" in screen(), "终端显示首条写入缺口")
        assert records_snapshot(repo) == before
        ignore.unlink()
        server.write_gate.set()
        saved = wait(lambda: saved_reply(WRITE_REPLY), "恢复写入后保存原话和完整回复")
        end()
        assert WRITE_PROMPT in saved.read_text() and WRITE_REPLY in saved.read_text()
        return {"firstWriteBlocked": True, "nativeWarningBeforeReply": True,
                "businessContinued": True, "originalPromptRecovered": True}

    def verify_user_cancellation_and_early_close():
        """通过终端停止流式回复，再于新输入落盘前关闭同一合成会话。"""
        stop_isolated_daemon()
        start()
        wait_ready()
        enter(CANCEL_INPUT)
        wait(lambda: CANCEL_CHUNK in screen(), "已显示未完成的流式回复")
        record = next(path for path in main_records(repo) if CANCEL_INPUT in path.read_text())
        before = record.read_bytes()
        shell("send-keys", "-t", session, "Escape")
        rollout, = (state / "sessions").rglob(f"*-{record_session(record)}.jsonl")
        wait(lambda: '"type":"turn_aborted"' in rollout.read_text(), "宿主确认用户停止")
        server.cancel_gate.set()
        assert record.read_bytes() == before and CANCEL_CHUNK.encode() not in before
        with rollout.open("rb") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            enter(EARLY_INPUT)
            wait(lambda: matching_hook_process(prompt_candidate), "首条保存回调等待会话锁")
            assert record.read_bytes() == before
            shell("kill-pane", "-t", session)
            # 先关闭宿主，避免被杀回调返回后宿主继续提交输入。
            kill_isolated_daemon()
            if process := matching_hook_process(prompt_candidate):
                os.kill(process, signal.SIGKILL)
        assert EARLY_INPUT not in rollout.read_text()
        resume(repo, record_session(record))
        enter("T035_AFTER_EARLY_CLOSE")
        wait(lambda: formal_message("回复", "T035_OTHER_FINAL") in record.read_text(), "关闭后从原记录续写")
        end()
        with sqlite3.connect(f"{(state / 'thread_history_1.sqlite').as_uri()}?mode=ro", uri=True) as index:
            turns = index.execute("SELECT status FROM thread_turns WHERE thread_id = ? ORDER BY rollout_byte_offset",
                                  (record_session(record),)).fetchall()
        assert turns == [("interrupted",), ("inProgress",), ("completed",)], turns
        assert record.read_bytes().startswith(before)
        assert EARLY_INPUT not in record.read_text() and CANCEL_CHUNK not in record.read_text()
        assert "T035_AFTER_EARLY_CLOSE" in record.read_text()
        return {"nativeUserStoppedStreaming": True, "partialFinalNotRecorded": True,
                "closedBeforeInputSave": True, "nativeInputUnavailable": True,
                "staleInProgressIndexObserved": True, "sameRecordResumedWithGap": True}

    def verify_partial_write():
        """临时阻断详情目录，保持已读回的主记录并补验详情链接。"""
        stop_isolated_daemon()
        start()
        wait_ready()
        enter(PARTIAL_INPUT)
        wait(lambda: any(row["event"] == "PartialFailureStage" and not row["toolCompleted"] for row in trace(events)),
             "详情阻断前的首条原话已保存")
        record = next(path for path in main_records(repo) if PARTIAL_INPUT in path.read_text())
        original = record.read_bytes()
        obstacle = record.parent / "details"
        if record.name != "record.md":
            obstacle /= record_session(record)
            obstacle.parent.mkdir(exist_ok=True)
        obstacle.write_text("T035_PARTIAL_WRITE_OBSTRUCTION\n")
        server.partial_start.set()
        wait(lambda: any(row["event"] == "PartialFailureStage" and row["toolCompleted"] for row in trace(events)),
             "详情写入受阻时实际文件读取照常完成")
        wait(lambda: "会话记录出现缺口" in screen() and "PostToolUse" in screen(), "终端显示详情写入缺口")
        assert record.read_bytes() == original and obstacle.read_text() == "T035_PARTIAL_WRITE_OBSTRUCTION\n"
        obstacle.unlink()
        server.partial_finish.set()
        wait(lambda: saved_reply(PARTIAL_REPLY), "解除阻断后回复与详情已保存")
        end()
        link = re.search(r"\[查看经过\]\(([^)]*)\)", record.read_text())[1]
        assert "T035_REPAIRED_README" in (record.parent / link).read_text()
        return {"mainRecordPreserved": True, "toolStillCompleted": True,
                "nativeWarningBeforeReply": True, "detailRecoveredInSameTurn": True}

    def verify_parallel_midnight():
        """两个目录的同时空白会话跨午夜后各自建档。"""
        nonlocal session
        stop_isolated_daemon()
        before = records_snapshot(repo)
        boundary, offset, zone = host_fixture["timezone_boundary"](12)
        first_date = time.strftime("%Y-%m-%d", time.gmtime(time.time() + offset))
        for name in ("parallel-alpha", "parallel-beta"):
            directory = repo / name
            directory.mkdir()
            session = name
            start(directory, zone=zone)
            wait_ready()
        assert time.time() < boundary and records_snapshot(repo) == before
        wait(lambda: time.time() >= boundary + 0.15, "真实本地午夜")
        first_prompt_date = time.strftime("%Y-%m-%d", time.gmtime(time.time() + offset))
        assert first_date != first_prompt_date
        for name in ("parallel-alpha", "parallel-beta"):
            session = name
            enter(PARALLEL_PROMPT)
        wait(lambda: sum(PARALLEL_REPLY in record.read_text() for record in main_records(repo)) == 2,
             "并行会话各自建档及保存实发回复")
        records = [record for record in main_records(repo) if PARALLEL_PROMPT in record.read_text()]
        assert len(records) == 2 and all(record_date(record) == first_date for record in records)
        assert all(f"## {first_prompt_date} <!-- turn-" in record.read_text() for record in records)
        assert all(record.read_text().count(formal_message("发起", PARALLEL_PROMPT)) == 1 for record in records)
        for name in ("parallel-alpha", "parallel-beta"):
            session = name
            enter("/exit")
            wait(lambda: "can't find" in screen() or "no server running" in screen(), "并行会话退出")
        session = "isolated"
        return {"openedAtDate": first_date, "promptSentAtDate": first_prompt_date,
                "twoSeparateRecords": True, "emptyBeforePrompt": True, "sameTextKeptInEachSession": True}

    def verify_supplement():
        """在真实工具运行期间发送补充，核对归入同一个轮次。"""
        stop_isolated_daemon()
        start()
        wait_ready()
        enter(STEER_INPUT)
        wait(lambda: (repo / ".t035-steer-started").is_file(), "实际工具已开始且本轮尚未结束")
        enter(STEER_ADDITION)
        record = wait(lambda: saved_reply(STEER_REPLY), "带同轮补充的回复已保存")
        end()
        content = record.read_text()
        assert content.count("<!-- turn-") == 1, content
        assert content.index(formal_message("发起", STEER_INPUT)) < content.index(formal_message("补充", STEER_ADDITION))
        assert content.index(formal_message("补充", STEER_ADDITION)) < content.index(formal_message("回复", STEER_REPLY))
        assert content.count("\n---\n\n") == 2
        return {"sentDuringActualTool": True, "oneNativeTurn": True, "supplementBeforeFinalInRecord": True}

    try:
        assert not discovered()
        assert "projects" not in tomllib.loads(config.read_text())
        start()
        wait(lambda: "Trust and continue" in screen(), "目录信任提示")
        time.sleep(0.3)
        shell("send-keys", "-t", session, "Enter")
        wait(lambda: "Trust all and continue" in screen(), "Hook 信任提示")
        before_hooks = discovered()
        expected_events = {"userPromptSubmit", "stop"}
        if formal:
            expected_events.update(("postToolUse", "subagentStop"))
        actual_events = {hook["eventName"] for hook in before_hooks}
        assert expected_events <= actual_events <= (expected_events | {"preToolUse"} if formal else expected_events)
        assert all(hook["trustStatus"] == "untrusted" for hook in before_hooks)
        shell("send-keys", "-t", session, "Down")
        wait(lambda: "› 2. Trust all" in screen(), "选中 Hook 信任")
        shell("send-keys", "-t", session, "Enter")
        wait(lambda: "gpt-5.4" in screen(), "信任后空白界面")
        hook_details = discovered()
        assert len(hook_details) == len(actual_events) and all(hook["trustStatus"] == "trusted" and hook["enabled"] and
                                              Path(hook["sourcePath"]) == hook_file for hook in hook_details)
        assert {hook["currentHash"] for hook in before_hooks} == {hook["currentHash"] for hook in hook_details}
        skill_discovery = discovered_skill()
        end()
        assert not trace(events) and not (repo / "records").exists()
        start()
        wait(lambda: "gpt-5.4" in screen(), "普通 codex 启动")
        reply_writes = []
        for number, (prompt, answer) in enumerate(zip(PROMPTS, REPLIES), start=1):
            enter(prompt)
            wait(lambda: answer.splitlines()[-1] in screen(), f"轮次 {number} 显示末段")
            check = (lambda: saved_reply(answer)) if formal else (lambda: len(read_backs()) >= number * 2)
            wait(check, f"轮次 {number} 原话与回复读回")
            if formal:
                reply_writes.append(saved_reply(answer).stat().st_mtime_ns)
        commit_proof = None
        if formal:
            enter(COMMIT_PROMPT)
            wait(lambda: COMMIT_REPLY in screen(), "显示提交结果")
            wait(lambda: any('"type":"task_complete"' in line and COMMIT_REPLY in line
                             for path in (state / "sessions").rglob("*.jsonl")
                             for line in path.read_text().splitlines()), "宿主完成提交结果轮次")
            trace_after_reply = records_snapshot(repo)
            commit_requests = [row for row in trace(events) if row["event"] == "ProviderRequest"
                               and row["correlation"] == "commit" and not row["auxiliary"]]
            outputs_by_count = {len(row["commitOutputs"]): row for row in commit_requests}
            assert set(outputs_by_count) == {0, 1, 2, 3}, commit_requests
            assert outputs_by_count[0]["records"] == outputs_by_count[1]["records"], commit_requests
            assert outputs_by_count[1]["records"] != outputs_by_count[2]["records"], commit_requests
            assert outputs_by_count[2]["records"] == outputs_by_count[3]["records"] == trace_after_reply, commit_requests
            outputs = outputs_by_count[3]["commitOutputs"]
            assert "absent.txt" in str(outputs["t035-failure"]), outputs
            assert "repaired" in str(outputs["t035-retry"]), outputs
            assert not saved_reply(COMMIT_REPLY)
            details = [*repo.glob("records/*/*/details/*.md"), *repo.glob("records/*/details/*/*.md")]
            detail = "\n".join(path.read_text() for path in details)
            assert "T035_REPAIRED_README" in detail and "absent.txt" not in detail
            enter(AFTER_PROMPT)
            wait(lambda: saved_reply(AFTER_REPLY), "提交后的普通回复继续保存")
            commit_proof = {"realFailureThenSuccess": True, "repairRecordedBeforeRetry": True,
                            "bothCommitWindowsUnchanged": True, "resultReplyOmitted": True, "laterReplyRecorded": True}
        end()
        observed = trace(events)
        records = main_records(repo)
        assert len(records) == 1, records
        saved = records[0].read_bytes()
        actual_replies = [row for row in observed if row["event"] == "Stop" and row.get("status") == "received"]
        if formal:
            assert all(saved_reply(answer) for answer in REPLIES)
        else:
            assert [row["original"] for row in actual_replies] == REPLIES, actual_replies
        assert all(row.get("exact") for row in read_backs()), read_backs()
        assert saved.count(b"<!-- turn-") == (4 if formal else 2), saved
        assert all(prompt.encode() in saved for prompt in PROMPTS)
        assert sum(row["event"] == "ProviderBusinessTool" for row in observed) == 1, observed
        assert any(row.get("outputHasReadme") for row in observed), observed
        for name, prompt in zip(("readme", "question"), PROMPTS):
            requests = [row for row in observed if row["event"] == "ProviderRequest" and row["correlation"] == name and not row["auxiliary"]]
            assert requests[0]["promptAlreadySaved"], requests
            if not formal:
                original = next(row for row in observed if row.get("original") == prompt)
                prompt_read_back = next(row for row in read_backs() if row["turn"] == original["turn"] and row["event"] == "UserPromptSubmit")
                finished = next(row for row in observed if row["event"] == "ProviderFinished" and row["correlation"] == name and not row["auxiliary"] and row["isFinal"])
                after = next(row for row in read_backs() if row["turn"] == original["turn"] and row["event"] == "Stop")
                assert prompt_read_back["ns"] < requests[0]["ns"] < finished["ns"] < after["ns"], observed
        session_id = record_session(records[0])
        rollouts = list((state / "sessions").rglob(f"*{session_id}.jsonl"))
        assert len(rollouts) == 1, rollouts
        final_entries = []
        for line in rollouts[0].read_text().splitlines():
            row = json.loads(line)
            payload = row.get("payload", {})
            if row["type"] == "response_item" and payload.get("phase") == "final_answer":
                text = "".join(item.get("text", "") for item in payload["content"])
                final_entries.append({"hostTime": row["timestamp"], "hostText": text})
        assert [entry["hostText"] for entry in final_entries] == REPLIES + ([COMMIT_REPLY, AFTER_REPLY] if formal else []), final_entries
        for entry, write_ns in zip(final_entries[:len(reply_writes)], reply_writes):
            emitted = int(datetime.fromisoformat(entry["hostTime"]).timestamp() * 1e9)
            assert emitted < write_ns, (entry, write_ns)
        for entry, receipt in zip(final_entries, actual_replies):
            emitted = int(datetime.fromisoformat(entry["hostTime"]).timestamp() * 1e9)
            assert emitted < receipt["wallNs"], (entry, receipt)
        stop_isolated_daemon()
        file_snapshot = {path: (path.stat().st_mtime_ns, path.read_bytes()) for path in (repo / "records").rglob("*") if path.is_file()}
        cases = []
        for label, arguments in (("exec", []), ("exec-resume", ["resume", session_id])):
            offset = len(trace(events))
            result = subprocess.run([binary, "exec", "--json", *arguments, "T035_EXEC"], cwd=repo,
                                    text=True, capture_output=True, timeout=20)
            assert result.returncode == 0 and "T035_EXEC_FINAL" in result.stdout, result.stdout[-2000:] + result.stderr[-1000:]
            checks = [row for row in trace(events)[offset:] if row["event"] in ("UserPromptSubmit", "Stop")]
            if not formal:
                assert len(checks) == 2 and all(row.get("trigger") == "exec" and row.get("reads") == ["current-turn-event"] for row in checks), checks
            current_snapshot = {path: (path.stat().st_mtime_ns, path.read_bytes()) for path in (repo / "records").rglob("*") if path.is_file()}
            assert current_snapshot == file_snapshot
            case = {"mode": label, "recordsUnchanged": True}
            if not formal:
                case.update(callbacks=[row["event"] for row in checks], additionalBodyReads=0)
            cases.append(case)
        recovery = None
        extended_proof = None
        if formal:
            opening_date = record_date(records[0])
            now = datetime.now(timezone.utc)
            zone, day = next((zone, (now + timedelta(hours=offset)).date().isoformat())
                             for zone, offset in (("Pacific/Kiritimati", 14), ("Etc/GMT+12", -12))
                             if (now + timedelta(hours=offset)).date().isoformat() != opening_date)
            for directory_name, answer in zip(("alpha", "beta", "beta"), RESUMES):
                stop_isolated_daemon()
                directory = repo / directory_name
                directory.mkdir(exist_ok=True)
                if answer == RESUMES[-1]:
                    preserved = records[0].read_bytes()
                    (repo / ".gitignore").write_text("/records/\n")
                start(directory, ("-c", 'tui.resume_cwd="current"', "resume", session_id), zone)
                wait(lambda: "gpt-5.4" in screen(), "恢复同一真实交互会话")
                enter(f"请只回复 {answer}")
                wait(lambda: saved_reply(answer), "恢复后的回复已保存")
                end()
                if answer != RESUMES[-1]:
                    assert len(main_records(repo)) == 1
                    assert answer in records[0].read_text() and f"## {day} <!-- turn-" in records[0].read_text()
            relocated = repo / "conversation-recording" / records[0].relative_to(repo)
            assert records[0].read_bytes() == preserved
            assert RESUMES[-1] in relocated.read_text() and "previousRecords" in relocated.read_text()
            assert all(answer not in relocated.read_text() for answer in RESUMES[:-1])
            recovery = {"openingDate": opening_date, "resumedLocalDate": day, "sameRecordAfterTwoResumes": True,
                        "ignoredOriginalPreserved": True, "relocatedStartsWithNewTurn": True}
        if extended:
            (repo / ".gitignore").unlink()
            extended_proof = {"toolMatrix": verify_matrix(), "foreignResume": verify_foreign_resume(),
                              "interruptedStop": verify_interrupted_stop(), "failedWrite": verify_failed_write(),
                              "cancelAndEarlyClose": verify_user_cancellation_and_early_close(),
                              "partialWrite": verify_partial_write(), "parallelMidnight": verify_parallel_midnight(),
                              "sameTurnSupplement": verify_supplement()}
        print(json.dumps({"version": subprocess.check_output([binary, "--version"], text=True).strip(),
                          "preseededTrust": False, "ordinaryLaunch": True, "emptyRecordCount": 0, "formal": formal,
                          "nativeTrustPrompts": ["project", "hooks"], "skillDiscovery": skill_discovery,
                          "installedSkillHashes": installed, "candidateSha256": sha256(candidate.read_bytes()).hexdigest(),
                          "hooks": [{"name": hook["eventName"], "trusted": hook["trustStatus"] == "trusted",
                                     "enabled": hook["enabled"], "currentHash": hook["currentHash"],
                                     "source": ".codex/hooks.json"}
                                    for hook in hook_details],
                          "hostFinal": final_entries, "observed": observed, "recordSha256": sha256(saved).hexdigest(),
                          "commit": commit_proof, "recovery": recovery, "extended": extended_proof,
                          "replySavedAfterHostFinal": len(reply_writes) == len(REPLIES),
                          "recordVisible": bool(subprocess.check_output(
                              ["git", "status", "--short", "--untracked-files=all", "--", "records"], cwd=repo)),
                          "controls": cases}, ensure_ascii=False, indent=2))
    finally:
        (work / "last-screen.txt").write_text(screen())
        subprocess.run([*tmux, "kill-server"], capture_output=True)
        server.shutdown()
        server.server_close()


def main():
    """以只读工作区、独立 CLI 状态、回环网络运行探针。"""
    if len(sys.argv) > 1 and sys.argv[1] == "--isolated":
        binary, work, source, installer, mode = sys.argv[2:]
        run_probe(binary, Path(work), Path(source), Path(installer), formal=mode in {"formal", "extended"}, extended=mode == "extended")
        return

    workspace = Path(__file__).resolve().parents[5]
    source = workspace / "packages/skills/dist/skill/profile"
    installer = workspace / "scripts/dev/actions/link-skills/link-skills.sh"
    binary = shutil.which("codex")
    assert binary, "需要 Codex CLI 0.172.0"
    version = subprocess.check_output([binary, "--version"], text=True).strip()
    assert version == "codex-cli 0.172.0", version

    with tempfile.TemporaryDirectory(prefix="foundry-t035-") as temporary:
        work = Path(temporary).resolve()
        state = work / "state"
        scratch = work / "scratch"
        state.mkdir()
        scratch.mkdir()
        environment = {
            "PATH": "/usr/bin:/bin",
            "TERM": "xterm-256color",
            "LANG": "C.UTF-8",
            "CODEX_HOME": str(state),
            "CODEX_SQLITE_HOME": str(state),
            "XDG_RUNTIME_DIR": str(state),
            "TMPDIR": str(scratch),
            "PYTHONDONTWRITEBYTECODE": "1",
        }
        subprocess.run([
            "/usr/bin/bwrap", "--die-with-parent", "--unshare-user", "--unshare-net", "--unshare-pid",
            "--ro-bind", "/", "/", "--dev", "/dev", "--proc", "/proc", "--tmpfs", "/tmp",
            "--bind", str(work), str(work), "--chdir", str(work), "--",
            sys.executable, str(Path(__file__).resolve()), "--isolated", str(Path(binary).resolve()),
            str(work), str(source), str(installer),
            "extended" if "--extended" in sys.argv else "formal" if "--formal" in sys.argv else "probe",
        ], env=environment, check=True, timeout=230)


if __name__ == "__main__":
    main()
