"""在自有临时项目观察真实 CLI 生命周期；不采集正文，不运行模型。"""

import argparse
import fcntl
import json
import os
from pathlib import Path
import pty
import select
import shlex
import signal
import struct
import subprocess
import tempfile
import termios
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import threading


HOOK = '''"""仅保存本隔离项目的宿主事件元数据。"""
import json, os, sys, time
from pathlib import Path
event = json.load(sys.stdin)
root = Path(__file__).resolve().parent.parent
row = {
    "event": event.get("hook_event_name"),
    "session_id": event.get("session_id"),
    "turn_id": event.get("turn_id"),
    "source": event.get("source"),
    "reason": event.get("reason"),
    "observed_at_ns": time.time_ns(),
    "cwd_matches": event.get("cwd") == str(root),
    "transcript_path_provided": bool(event.get("transcript_path")),
}
with (root / "receipts.jsonl").open("a") as target:
    target.write(json.dumps(row) + "\\n")
    target.flush()
    os.fsync(target.fileno())
if event.get("hook_event_name") == "UserPromptSubmit":
    if (root / "barrier-enabled").exists():
        deadline = time.monotonic() + 45
        while not (root / "release-prompt").exists() and time.monotonic() < deadline:
            time.sleep(0.02)
    print(json.dumps({"continue": False, "decision": "block", "reason": "隔离生命周期实验在模型请求前停止"}))
'''


def receipts(root):
    """只读测试处理器已实际写入的收据。"""
    path = root / "receipts.jsonl"
    return [json.loads(line) for line in path.read_text().splitlines()] if path.exists() else []


def child_terminal():
    """为当前新建测试进程建立自己的控制终端。"""
    os.setsid()
    fcntl.ioctl(0, termios.TIOCSCTTY, 0)


def run_exec_case(binary, root, case, startup_seconds, hook_source):
    """通过非交互式CLI验证真实hook，模型请求前以测试屏障停住。"""
    root.mkdir()
    subprocess.run(["git", "init", "-q", str(root)], check=True)
    config = root / ".codex"
    config.mkdir()
    (config / "config.toml").write_text("[features]\nhooks = true\n")
    (config / "observe.py").write_text(HOOK)
    (root / "barrier-enabled").touch()
    command = "python3 " + shlex.quote(str(config / "observe.py"))
    definition = {"hooks": {
        event: [{"hooks": [{"type": "command", "command": command, "timeout": 45 if event == "UserPromptSubmit" else 3}]}]
        for event in ("SessionStart", "SessionEnd", "UserPromptSubmit", "PreModelRequest")
    }}
    if hook_source == "project":
        (config / "hooks.json").write_text(json.dumps(definition, indent=2) + "\n")
    guard_receipts = []

    class RequestGuard(BaseHTTPRequestHandler):
        """拒绝本地测试请求，不转发模型请求，也不保存请求正文。"""

        def do_POST(self):
            guard_receipts.append({"method": "POST", "observed_at_ns": time.time_ns()})
            self.send_response(503)
            self.end_headers()
            self.wfile.write(b'{"error":{"message":"lifecycle probe guard"}}')

        def log_message(self, *args):
            pass

    guard = ThreadingHTTPServer(("127.0.0.1", 0), RequestGuard)
    guard_thread = threading.Thread(target=guard.serve_forever, daemon=True)
    guard_thread.start()
    argv = [binary, "exec", "--ignore-user-config", "--ephemeral", "--json",
            "--cd", str(root), "--sandbox", "read-only", "--dangerously-bypass-hook-trust",
            "-c", "features.hooks=true",
            "-c", 'model_provider="lifecycle_probe_guard"',
            "-c", 'model_providers.lifecycle_probe_guard.name="本地实验拒绝器"',
            "-c", 'model_providers.lifecycle_probe_guard.wire_api="responses"',
            "-c", 'model_providers.lifecycle_probe_guard.requires_openai_auth=false',
            "-c", 'model_providers.lifecycle_probe_guard.request_max_retries=0',
            "-c", 'model_providers.lifecycle_probe_guard.stream_max_retries=0',
            "-c", 'model_providers.lifecycle_probe_guard.base_url="http://127.0.0.1:' + str(guard.server_port) + '/v1"',
            "-c", "projects." + json.dumps(str(root)) + '.trust_level="trusted"',
            "这是隔离生命周期实验合成输入；UserPromptSubmit会在模型请求前阻断。不要使用工具。"]
    if hook_source == "inline":
        prompt = argv.pop()
        for event, groups in definition["hooks"].items():
            timeout = groups[0]["hooks"][0]["timeout"]
            override = 'hooks.' + event + '=[{hooks=[{type="command",command=' + json.dumps(command) + ',timeout=' + str(timeout) + '}]}]'
            argv += ["-c", override]
        argv.append(prompt)
    process = subprocess.Popen(argv, cwd=root, stdin=subprocess.DEVNULL,
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE, start_new_session=True)
    row = {"case": case, "transport": "exec", "synthetic_prompt_submitted": True,
           "hook_source": hook_source, "user_config_ignored": True, "started_at_ns": time.time_ns()}
    try:
        deadline = time.monotonic() + startup_seconds
        while process.poll() is None and time.monotonic() < deadline:
            if any(x["event"] == "UserPromptSubmit" for x in receipts(root)):
                break
            time.sleep(0.05)
        row["start_seen_before_close"] = any(x["event"] == "SessionStart" for x in receipts(root))
        row["submit_barrier_reached"] = any(x["event"] == "UserPromptSubmit" for x in receipts(root))
        row["alive_before_close"] = process.poll() is None
        row["close_requested_at_ns"] = time.time_ns()
        if process.poll() is None:
            if case == "normal":
                (root / "release-prompt").touch()
            else:
                process.send_signal(signal.SIGTERM if case == "sigterm" else signal.SIGKILL)
        try:
            process.wait(timeout=8)
        except subprocess.TimeoutExpired:
            pass
        row["exited_after_requested_close"] = process.poll() is not None
        row["exit_code_before_cleanup"] = process.poll()
        row["exit_observed_at_ns"] = time.time_ns() if process.poll() is not None else None
        time.sleep(0.5)
        row["receipts_before_cleanup"] = receipts(root)
        row["pre_model_request_hook_observed"] = any(x["event"] == "PreModelRequest" for x in receipts(root))
    finally:
        row["cleanup_required"] = process.poll() is None
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        out, err = process.communicate(timeout=3)
        row["process_reaped"] = True
        row["stderr_present"] = bool(err)
        diagnostics = err.decode("utf-8", "replace").lower()
        row["stderr_markers"] = {
            marker: marker in diagnostics
            for marker in ("untrusted", "config files are disabled", "hook", "trust", "error", "warning")
        }
        row["local_guard_request_count"] = len(guard_receipts)
        row["external_model_provider_configured"] = False
        guard.shutdown()
        guard.server_close()
        guard_thread.join(timeout=2)
        types = []
        item_types = []
        for line in out.splitlines():
            try:
                value = json.loads(line)
            except ValueError:
                continue
            if isinstance(value.get("type"), str):
                types.append(value["type"])
            if isinstance(value.get("item"), dict):
                item_types.append(value["item"].get("type"))
        row["cli_json_event_types"] = types
        row["cli_item_types"] = item_types
    return row


def run_case(binary, root, case, startup_seconds, synthetic_turn, no_daemon):
    """建立隔离配置并观察指定退出方式，不推定生产宿主效果。"""
    root.mkdir()
    subprocess.run(["git", "init", "-q", str(root)], check=True)
    config = root / ".codex"
    config.mkdir()
    (config / "observe.py").write_text(HOOK)
    command = "python3 " + shlex.quote(str(config / "observe.py"))
    events = ["SessionStart", "SessionEnd"]
    if synthetic_turn:
        events += ["UserPromptSubmit", "PreModelRequest"]
    definition = {
        "hooks": {
            event: [{"hooks": [{"type": "command", "command": command, "timeout": 3}]}]
            for event in events
        }
    }
    (config / "hooks.json").write_text(json.dumps(definition, indent=2) + "\n")
    argv = [
        binary,
        "--cd", str(root),
        "--no-alt-screen",
        "--dangerously-bypass-hook-trust",
        "-c", "features.hooks=true",
        "-c", "check_for_update_on_startup=false",
        "-c", "projects." + json.dumps(str(root)) + '.trust_level="trusted"',
    ]
    if no_daemon:
        argv.append("--no-daemon")
    if synthetic_turn:
        argv.append("这是隔离生命周期实验合成输入，由UserPromptSubmit在模型请求前停止。")
    master, slave = pty.openpty()
    fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack("HHHH", 40, 120, 0, 0))
    env = os.environ.copy()
    env["TERM"] = "xterm-256color"
    process = subprocess.Popen(argv, cwd=root, stdin=slave, stdout=slave, stderr=slave,
                               env=env, preexec_fn=child_terminal)
    os.close(slave)
    row = {"case": case, "synthetic_prompt_submitted": synthetic_turn,
           "no_daemon": no_daemon, "started_at_ns": time.time_ns()}
    terminal = bytearray()

    def drain(seconds):
        """只在内存响应光标查询，不保存终端正文。"""
        ready, _, _ = select.select([master], [], [], seconds)
        if ready:
            try:
                chunk = os.read(master, 65536)
            except OSError:
                return
            terminal.extend(chunk)
            if b"\x1b[6n" in chunk:
                os.write(master, b"\x1b[1;1R")

    try:
        deadline = time.monotonic() + startup_seconds
        while process.poll() is None and time.monotonic() < deadline:
            drain(0.1)
            if any(x["event"] == "SessionStart" for x in receipts(root)):
                # 给空白输入界面完成加载，避免将加载中断当正常退出。
                end = time.monotonic() + 1
                while time.monotonic() < end:
                    drain(0.1)
                break
        row["start_seen_before_close"] = any(x["event"] == "SessionStart" for x in receipts(root))
        row["alive_before_close"] = process.poll() is None
        row["close_requested_at_ns"] = time.time_ns()
        if process.poll() is None:
            if case == "normal":
                os.write(master, b"\x04")
            elif case == "sigterm":
                process.send_signal(signal.SIGTERM)
            else:
                process.send_signal(signal.SIGKILL)
        deadline = time.monotonic() + 8
        while process.poll() is None and time.monotonic() < deadline:
            drain(0.1)
        row["exited_after_requested_close"] = process.poll() is not None
        row["exit_code_before_cleanup"] = process.poll()
        row["exit_observed_at_ns"] = time.time_ns() if process.poll() is not None else None
        # 仅留给已启动处理器落收据的短观察窗口；不据此推断会话结束。
        end = time.monotonic() + 1
        while time.monotonic() < end:
            drain(0.1)
        row["receipts_before_cleanup"] = receipts(root)
        row["pre_model_request_hook_observed"] = any(x["event"] == "PreModelRequest" for x in receipts(root))
        text = bytes(terminal).decode("utf-8", "replace").lower()
        row["terminal_byte_count"] = len(terminal)
        row["diagnostic_markers"] = {
            "trust_prompt": "do you trust" in text,
            "login_prompt": "sign in with chatgpt" in text,
            "hook_failure": "hook failed" in text,
            "update_prompt": "update available" in text,
            "welcome_prompt": "welcome" in text,
            "model_selection": "select a model" in text,
            "error_marker": "error" in text,
            "loading_marker": "loading" in text,
            "cursor_query": "\x1b[6n" in text,
        }
    finally:
        # 仅清理本实验自己创建的进程组；与被测正常关闭分开记录。
        row["cleanup_required"] = process.poll() is None
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        process.wait(timeout=3)
        os.close(master)
        row["process_reaped"] = True
    return row


def main():
    """接收明确程序定位，输出不含机器路径或正文的实际结果。"""
    parser = argparse.ArgumentParser()
    parser.add_argument("--codex", required=True)
    parser.add_argument("--case", choices=["normal", "sigterm", "sigkill", "all"], default="all")
    parser.add_argument("--startup-seconds", type=float, default=15)
    parser.add_argument("--synthetic-turn", action="store_true")
    parser.add_argument("--no-daemon", action="store_true")
    parser.add_argument("--transport", choices=["tui", "exec"], default="tui")
    parser.add_argument("--hook-source", choices=["project", "inline"], default="project")
    args = parser.parse_args()
    if args.synthetic_turn and args.transport == "tui":
        parser.error("合成输入须使用exec入口及其本地请求拒绝器")
    root = Path(tempfile.mkdtemp(prefix="foundry-shadow-lifecycle-"))
    version = subprocess.check_output([args.codex, "--version"], text=True).strip()
    cases = ["normal", "sigterm", "sigkill"] if args.case == "all" else [args.case]
    result = {"scope": "isolated_linux_codex_cli_hooks_only", "version": version,
              "current_chat_capture_started": False, "cases": []}
    for case in cases:
        if args.transport == "exec":
            row = run_exec_case(args.codex, root / case, case, args.startup_seconds, args.hook_source)
        else:
            row = run_case(args.codex, root / case, case, args.startup_seconds,
                           args.synthetic_turn, args.no_daemon)
        result["cases"].append(row)
        print(json.dumps({"case_completed": case, "result": row}), flush=True)
    (root / "results.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({"results": result}), flush=True)


if __name__ == "__main__":
    main()
