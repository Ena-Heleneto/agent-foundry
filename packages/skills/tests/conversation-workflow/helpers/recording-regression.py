"""驱动真实交互 CLI 的合成业务并取证，记录产物只从实际资料区读取。"""

import ctypes
import errno
import hashlib
import http.server
import json
import os
import re
import shlex
import struct
import subprocess
import sys
import threading
import time
import uuid
from pathlib import Path

import recording_host


def message(text, phase="final_answer"):
    """构造固定业务回复，实际发出与否由宿主会话校验。"""
    return {
        "id": "msg_" + uuid.uuid4().hex,
        "type": "message",
        "role": "assistant",
        "phase": phase,
        "content": [{"type": "output_text", "text": text}],
    }


def snapshot(root):
    """读取磁盘实际文件，记录字节摘要与 Markdown 原文。"""
    result = {}
    for path in sorted(root.rglob("*")):
        if path.is_file():
            data = path.read_bytes()
            result[path.relative_to(root).as_posix()] = {
                "sha256": hashlib.sha256(data).hexdigest(),
                **({"text": data.decode()} if path.suffix == ".md" else {}),
            }
    return result


class RecordWriteWatch:
    """观察提交窗口内的实际文件变化，包括写回同样字节的情况。"""

    def __init__(self, records):
        libc = ctypes.CDLL(None, use_errno=True)
        self.fd = libc.inotify_init1(os.O_NONBLOCK | os.O_CLOEXEC)
        if self.fd < 0:
            raise OSError(ctypes.get_errno(), "无法观察资料写入")
        try:
            # 内容、属性、创建、删除、移动及被观察目录自身的变化。
            for directory in [records, *records.rglob("*")]:
                if directory.is_dir():
                    descriptor = libc.inotify_add_watch(
                        self.fd, os.fsencode(directory), 0xFCE
                    )
                    if descriptor < 0:
                        raise OSError(
                            ctypes.get_errno(), f"无法观察资料目录 {directory}"
                        )
        except BaseException:
            os.close(self.fd)
            raise

    def finish(self):
        """读取全部变化并关闭，队列溢出时明确中止观测。"""
        events = 0
        try:
            while True:
                try:
                    data = os.read(self.fd, 65536)
                except BlockingIOError:
                    return events
                if not data:
                    return events
                offset = 0
                while offset < len(data):
                    _, mask, _, name_length = struct.unpack_from("iIII", data, offset)
                    if mask & 0x4000:
                        raise RuntimeError("资料写入观测队列溢出")
                    events += 1
                    offset += 16 + name_length
        finally:
            os.close(self.fd)


class Endpoint(recording_host.Responses):
    """按主请求中的实际工具结果推进合成场景。"""

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))))
        case = self.path.split("/")[1]
        state = self.server.cases[case]
        if not body.get("tools"):
            self.emit([message("T006_AUXILIARY")])
            return
        if state.get("stop") is not None:
            self.emit([message(state["unavailable"], "commentary")], state["stop"])
            return
        for item in body.get("input", []):
            call_id = item.get("call_id")
            if item.get("type") == "function_call_output" and call_id in state["calls"]:
                state["calls"][call_id]["output"] = item.get("output")
        while state["next"] < len(state["steps"]):
            label, command, directory, reply = state["steps"][state["next"]]
            if state["pending"] is None:
                if label.startswith("commit-") and not reply:
                    state["watch"] = RecordWriteWatch(self.server.records)
                    state["windows"][label] = {"before": snapshot(self.server.records)}
                call_id = "call_" + uuid.uuid4().hex
                state["pending"] = call_id
                args = {
                    "cmd": command,
                    "workdir": str(directory),
                    "yield_time_ms": 1000,
                    "max_output_tokens": 1000,
                }
                state["checkpoints"][label] = snapshot(self.server.records)
                state["calls"][call_id] = {
                    "label": label,
                    "name": "exec_command",
                    "arguments": args,
                }
                items = [message(reply, "commentary")] if reply else []
                items.append(
                    {
                        "type": "function_call",
                        "id": "fc_" + uuid.uuid4().hex,
                        "call_id": call_id,
                        "name": "exec_command",
                        "arguments": json.dumps(args),
                    }
                )
                self.emit(items)
                return
            if "output" not in state["calls"][state["pending"]]:
                raise RuntimeError(f"主请求缺少工具返回 {label}")
            if reply:
                window = state["windows"][label.removesuffix("-result")]
                window["writeEvents"] = state.pop("watch").finish()
                window["after"] = snapshot(self.server.records)
            state["pending"] = None
            state["next"] += 1
        self.emit([message(state["final"])])

    def emit(self, items, stop=None):
        """把工具调用与进度消息交给宿主并等待真正执行。"""
        response = {
            "id": "response-" + uuid.uuid4().hex,
            "output": items,
            "usage": {"input_tokens": 1, "output_tokens": 1, "total_tokens": 2},
        }
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Connection", "close")
        self.end_headers()
        self.write_event(
            {"type": "response.created", "response": {"id": response["id"]}}
        )
        for item in items:
            self.write_event({"type": "response.output_item.done", "item": item})
        if stop is not None:
            stop.wait(12)
            return
        self.write_event({"type": "response.completed", "response": response})


def thread_events(thread_id):
    """只读取本次独占状态中的实际线程事件，不读取模型推理。"""
    path = Path.home() / ".codex" / recording_host.stored_sessions()[thread_id]
    events = []
    for line in path.read_text().splitlines():
        row = json.loads(line)
        payload = row["payload"]
        if row["type"] == "event_msg" and payload["type"] == "turn_aborted":
            events.append({"type": "turn_aborted", "reason": payload.get("reason")})
        if row["type"] == "response_item" and payload["type"] == "message":
            role = payload.get("role")
            for item in payload.get("content", []):
                text = item.get("text", "")
                if role in ("user", "assistant") and text.startswith("T006_"):
                    events.append(
                        {
                            "type": f"{role}_message",
                            "text": text,
                            "phase": payload.get("phase"),
                        }
                    )
    return {"openingDate": path.name[8:18], "events": events}


def run(codex, root):
    """执行两个真实会话、两次恢复、索引故障和真实 Git 提交。"""
    repo = root / "repository"
    alpha, beta = (repo / "projects" / part for part in ("alpha", "beta"))
    outside = root / "repository-outside"
    records = root / "records"
    artifact = root / "input/附件 原件.bin"
    os.environ.update(
        GIT_CONFIG_GLOBAL=str(root / "empty.gitconfig"), GIT_CONFIG_NOSYSTEM="1"
    )
    git = f"git -c user.name=Fixture -c user.email=fixture@example.invalid -c commit.gpgsign=false -c core.hooksPath={shlex.quote(str(root / 'empty-hooks'))}"
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Endpoint)
    server.records = records
    server.cases = {}
    threading.Thread(target=server.serve_forever, daemon=True).start()
    endpoint = f"http://127.0.0.1:{server.server_address[1]}"
    config = Path.home() / ".codex/config.toml"
    config.parent.mkdir()
    config.write_text(f'''model = "gpt-5.4"
model_provider = "fixture"
check_for_update_on_startup = false
approval_policy = "never"
sandbox_mode = "danger-full-access"
[model_providers.fixture]
name = "Foundry fixture"
base_url = "{endpoint}/alpha/v1"
wire_api = "responses"
requires_openai_auth = false
request_max_retries = 0
stream_max_retries = 0
[projects.{json.dumps(str(repo))}]
trust_level = "trusted"
''')

    def launch(case, cwd, tz, *arguments):
        """启动同一隔离环境中的真实终端并等候编辑器。"""
        cli = [
            codex,
            "--no-daemon",
            "--no-alt-screen",
            "-c",
            f'model_providers.fixture.base_url="{endpoint}/{case}/v1"',
            *arguments,
        ]
        terminal = recording_host.Terminal(cli, cwd, {"TZ": tz})
        terminals.append(terminal)
        terminal.wait(lambda: "gpt-5.4" in terminal.text(), f"等待 {case} 编辑器", 12)
        return terminal

    def start_turn(terminal, case, prompt, final, steps):
        """向指定终端发送真实输入，允许两个终端同时进行。"""
        server.cases[case] = {
            "steps": steps,
            "final": final,
            "next": 0,
            "pending": None,
            "calls": {},
            "checkpoints": {},
            "windows": {},
        }
        terminal.submit(prompt)

    def finish_turn(terminal, case):
        """等候最后的实际回复并读回本轮工具与磁盘观测。"""
        state = server.cases[case]
        final = state["final"]
        terminal.wait(lambda: final in terminal.text(), f"等待 {case} 回复 {final}", 20)
        assert state["next"] == len(state["steps"]), state["calls"]
        return {key: state[key] for key in ("calls", "checkpoints", "windows")}

    def turn(terminal, case, prompt, final, steps=()):
        """依次发送、观察本轮输入与回复。"""
        start_turn(terminal, case, prompt, final, steps)
        return finish_turn(terminal, case)

    def exit_terminal(terminal):
        """先正常退出以保留实际范围和线程 ID，再在 finally 关描述符。"""
        terminal.submit("/exit")
        terminal.wait(terminal.exited, "等待合成会话退出", 12)
        assert terminal.status == 0

    terminals = []
    try:
        boundary, offset, tz = recording_host.timezone_boundary(8)
        a = launch("alpha", alpha, tz)
        b = launch("beta", beta, tz)
        date_at = lambda ts: time.strftime("%Y-%m-%d", time.gmtime(ts + offset))
        opened = date_at(time.time())
        assert time.time() < boundary, "编辑器启动时已越过测试午夜"
        idle = snapshot(records)
        a.wait(lambda: time.time() >= boundary + 0.15, "等待本地跨午夜", 12)
        first_day = date_at(time.time())

        watch_control = root / "watch-control"
        watch_control.mkdir()
        control = RecordWriteWatch(watch_control)
        transient = watch_control / "transient"
        transient.write_bytes(b"T006_TRANSIENT_WRITE")
        transient.unlink()
        control_events = control.finish()
        assert not snapshot(watch_control) and control_events > 0

        first = "T006_SAME_USER_TEXT"
        identity = "printf 'T006_THREAD_ID=%s\\n' \"$CODEX_THREAD_ID\"; "
        read = (
            f"printf '%s\\n' T006_BUSINESS_TOOL; sha256sum {shlex.quote(str(artifact))}"
        )
        start_turn(
            a,
            "alpha",
            first,
            "T006_ALPHA_FINAL",
            [("business", identity + read, outside, None)],
        )
        start_turn(
            b,
            "beta",
            first,
            "T006_BETA_FINAL",
            [("business", identity + "printf '%s\\n' T006_BETA_TOOL", beta, None)],
        )
        first_a, first_b = finish_turn(a, "alpha"), finish_turn(b, "beta")
        a_id, b_id = (
            re.search(
                r"T006_THREAD_ID=([a-f0-9-]{36})",
                next(iter(result["calls"].values()))["output"],
            )[1]
            for result in (first_a, first_b)
        )
        assert set(recording_host.stored_sessions()) == {a_id, b_id}
        parallel = snapshot(records)
        turn(a, "alpha", first, "T006_ALPHA_REPEATED")
        exit_terminal(b)

        failed = records / opened / "index" / f"{a_id}.md"
        failed.parent.mkdir(parents=True, exist_ok=True)
        held = root / "blocked-index.md"
        if failed.is_file():
            failed.rename(held)
        failed.mkdir()
        try:
            with failed.open("ab"):
                raise AssertionError("索引目标应拒绝写入")
        except IsADirectoryError as error:
            assert error.errno == errno.EISDIR
        fault = turn(
            a,
            "alpha",
            "T006_PARTIAL_WRITE_INPUT",
            "T006_PARTIAL_BUSINESS_FINAL",
            [("fault-business", "printf '%s\\n' T006_PARTIAL_CONTINUE", alpha, None)],
        )
        fault_snapshot = snapshot(records)
        failed.rmdir()
        if held.exists():
            held.rename(failed)
        retry = turn(a, "alpha", "T006_PARTIAL_RETRY_INPUT", "T006_PARTIAL_RETRY_FINAL")
        retry_snapshot = snapshot(records)

        simple_commit = turn(
            a,
            "alpha",
            "T006_SINGLE_REPAIR_AND_COMMIT",
            "T006_SINGLE_COMMIT_TURN_FINAL",
            [
                (
                    "single-fix",
                    f"printf '%s\\n' T006_SINGLE_FIX > README.md; {git} add README.md; cat README.md",
                    repo,
                    None,
                ),
                ("commit-single", f"{git} commit -m T006_SINGLE_COMMIT", repo, None),
                ("commit-single-result", "true", repo, "T006_SINGLE_COMMIT_SUCCEEDED"),
            ],
        )
        commit = turn(
            a,
            "alpha",
            "T006_REPAIR_AND_COMMIT",
            "T006_GIT_TURN_FINAL",
            [
                (
                    "before",
                    "printf '%s\\n' T006_FIX_BEFORE > README.md; cat README.md",
                    repo,
                    None,
                ),
                ("commit-first", f"{git} commit -m T006_COMMIT_FIRST", repo, None),
                ("commit-first-result", "true", repo, "T006_FIRST_COMMIT_FAILED"),
                (
                    "repair",
                    f"printf '%s\\n' T006_FIX_BETWEEN >> README.md; {git} add README.md; cat README.md",
                    repo,
                    None,
                ),
                ("commit-second", f"{git} commit -m T006_COMMIT_SECOND", repo, None),
                ("commit-second-result", "true", repo, "T006_SECOND_COMMIT_SUCCEEDED"),
            ],
        )
        turn(a, "alpha", "T006_POST_COMMIT_INPUT", "T006_POST_COMMIT_FINAL")
        before_resume = snapshot(records)

        unavailable = "T006_UNAVAILABLE_ASSISTANT_ORIGINAL"
        interrupted = {"stop": threading.Event(), "unavailable": unavailable}
        server.cases["alpha"] = interrupted
        a.submit("T006_STOPPED_TURN")
        a.wait(lambda: unavailable in a.text(), "等待实际发出的进度消息")
        a.interrupt()
        a.wait(
            lambda: any(
                e["type"] == "turn_aborted" for e in thread_events(a_id)["events"]
            ),
            "等待宿主中断事件",
        )
        interrupted["stop"].set()
        exit_terminal(a)
        # 只在本次独占状态中移除已见原文，保留用户轮次及中断事件。
        lost_source = Path.home() / ".codex" / recording_host.stored_sessions()[a_id]
        available_lines = lost_source.read_text().splitlines(keepends=True)
        retained_lines = [line for line in available_lines if unavailable not in line]
        if available_lines != retained_lines:
            lost_source.write_text("".join(retained_lines))
        del interrupted["unavailable"]
        assert unavailable not in lost_source.read_text()

        resume_snapshots = []
        for case, tag in (("resume1", "ONE"), ("resume2", "TWO")):
            resumed = launch(case, alpha, tz, "resume", a_id)
            turn(resumed, case, f"T006_RESUME_{tag}_INPUT", f"T006_RESUME_{tag}_FINAL")
            exit_terminal(resumed)
            assert set(recording_host.stored_sessions()) == {a_id, b_id}
            resume_snapshots.append(snapshot(records))

        def git_read(*args):
            """独立读取真实 Git 结果，记录不会污染业务仓库。"""
            return subprocess.check_output(["git", *args], cwd=repo, text=True).strip()

        return {
            "version": subprocess.check_output([codex, "--version"], text=True).strip(),
            "root": str(root),
            "recordsRoot": str(records),
            "repository": str(repo),
            "opened": opened,
            "firstDay": first_day,
            "resumeDay": date_at(time.time()),
            "threads": {
                "alpha": {"id": a_id, **thread_events(a_id)},
                "beta": {"id": b_id, **thread_events(b_id)},
            },
            "idle": idle,
            "firstAlpha": first_a,
            "firstBeta": first_b,
            "parallel": parallel,
            "attachmentSha256": hashlib.sha256(artifact.read_bytes()).hexdigest(),
            "fault": fault,
            "faultErrno": "EISDIR",
            "faultSnapshot": fault_snapshot,
            "retry": retry,
            "retrySnapshot": retry_snapshot,
            "simpleCommit": simple_commit,
            "commit": commit,
            "transientWriteControlEvents": control_events,
            "beforeResume": before_resume,
            "resumes": resume_snapshots,
            "originalUnavailable": {
                "visibleBeforeStop": unavailable in a.text(),
                "removedSourceRows": len(available_lines) - len(retained_lines),
                "sourceAfterStopContainsText": unavailable in lost_source.read_text(),
            },
            "git": {
                "status": git_read("status", "--porcelain=v1"),
                "worktree": git_read("diff", "--binary"),
                "index": git_read("diff", "--cached", "--binary"),
                "subject": git_read("log", "-1", "--format=%s"),
                "previousSubject": git_read("log", "-1", "--format=%s", "HEAD^"),
                "readme": (repo / "README.md").read_text(),
                "changed": git_read(
                    "diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"
                ),
            },
        }
    finally:
        for terminal in terminals:
            terminal.close()
        server.shutdown()


if __name__ == "__main__":
    print(json.dumps(run(sys.argv[1], Path(sys.argv[2])), ensure_ascii=False))
