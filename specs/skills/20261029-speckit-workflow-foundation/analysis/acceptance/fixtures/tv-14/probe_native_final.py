"""前台验收探针：等待真实新final并独立比对；不向模型发送下一轮输入。"""

import argparse
import ctypes
import hashlib
import json
import os
from pathlib import Path
import select
import signal
import subprocess
import sys
import time


def write_result(path, result):
    """只发布脱离正文、身份及机器路径的验收事实。"""
    data = (json.dumps(result, ensure_ascii=False, indent=2) + "\n").encode()
    temporary = path.with_suffix(".pending")
    with temporary.open("wb") as target:
        target.write(data)
        target.flush()
        os.fsync(target.fileno())
    temporary.replace(path)
    assert path.read_bytes() == data


def saved_prefix(raw, receipt_ref=None):
    """一次读取后只解码到已确认身份，后续半行或新记录不改变这个前缀。"""
    saved = []
    for line in raw.read_bytes().splitlines(keepends=True):
        assert line.endswith(b"\n"), "收据之前存在未完成原文"
        row = json.loads(line)
        saved.append(row)
        ref = (row["thread_id"], row["turn_id"], row["item_id"])
        if ref == receipt_ref or (receipt_ref is None and row["role"] == "assistant"
                                  and row["phase"] in ("final", "final_answer")):
            return saved
    raise AssertionError("原文内没有对应的确认身份")


def check_saved(source, raw, thread, start_offset, receipt_ref=None):
    """冻结来源和收据前缀，绑定启动时目标turn，并独立检查未保存的新输入。"""
    saved = saved_prefix(raw, receipt_ref)
    assert saved, "没有真实已存消息"
    snapshot = source.read_bytes()
    target_turn = None
    for line in snapshot[:start_offset].splitlines():
        event = json.loads(line)
        payload = event.get("payload", {})
        if event.get("type") == "event_msg" and payload.get("type") == "task_started":
            target_turn = payload.get("turn_id")
        if event.get("type") == "event_msg" and payload.get("type") == "task_complete":
            if payload.get("turn_id") == target_turn:
                target_turn = None
    assert target_turn, "监听开始时没有可核验的运行中目标轮次"
    assert saved[-1]["turn_id"] == target_turn, "后来一轮的final不能替代目标轮次"
    assert not saved[-1]["item_id"].startswith("call"), "控件展示不计作普通final"
    last = saved[-1]["source_offset"]
    expected = []
    offset = start_offset
    for line in snapshot[start_offset:].splitlines(keepends=True):
        if not line.endswith(b"\n"):
            assert offset > last, "目标源行尚未完成"
            break
        event = json.loads(line)
        payload = event.get("payload", {})
        current_offset = offset
        offset += len(line)
        if event.get("type") != "event_msg":
            continue
        if payload.get("type") == "task_started":
            assert payload.get("turn_id") == target_turn, "观察窗口已有下一轮开始"
        if payload.get("type") != "item_completed":
            continue
        item = payload["item"]
        if item["type"] not in ("UserMessage", "AgentMessage"):
            continue
        assert payload["thread_id"] == thread
        if item["type"] == "UserMessage":
            assert current_offset <= last, "宿主已收到下一条输入，不能证明无下一输入保存"
            assert payload["turn_id"] == target_turn, "宿主已有下一轮输入"
        if current_offset > last:
            continue
        parts = [part["text"] for part in item["content"]]
        assert all(part["type"] in ("Text", "text") and not part.get("text_elements")
                   for part in item["content"])
        expected.append({"thread_id": thread, "turn_id": payload["turn_id"],
                         "item_id": item["id"],
                         "role": "user" if item["type"] == "UserMessage" else "assistant",
                         "phase": item.get("phase"), "text": "".join(parts),
                         "text_parts": parts, "source_completed_at": payload["completed_at_ms"],
                         "source_offset": current_offset})
    assert len(saved) == len(expected)
    for actual, original in zip(saved, expected):
        assert all(actual[key] == value for key, value in original.items())
    assert len({(r["thread_id"], r["turn_id"], r["item_id"]) for r in saved}) == len(saved)
    return saved


def stop_child(process):
    """先回收已登记的验收子进程，超时则强制回收，之后才发布终态。"""
    if process is None:
        return
    if process.poll() is None:
        process.terminate()
    try:
        process.communicate(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()
        process.communicate(timeout=5)


def bind_to_probe(parent_pid):
    """只绑定本探针直接创建的子进程，父进程消失时终止；不推定CLI身份。"""
    if ctypes.CDLL(None, use_errno=True).prctl(1, signal.SIGTERM) != 0:
        os._exit(127)
    if os.getppid() != parent_pid:
        os.kill(os.getpid(), signal.SIGTERM)


def run(args):
    """调用真实复制附件并观察新final，退出只回收本次验收子进程。"""
    project = args.project.resolve(strict=True)
    case = args.case.resolve()
    cache = project / ".cache"
    assert cache.resolve() == cache, "验收缓存根不能指向外部软链"
    assert case.is_relative_to(cache) and case != cache, "真实原文只允许保存到项目.cache子目录"
    case.mkdir(parents=True, exist_ok=False)
    thread = args.thread or os.environ["CODEX_THREAD_ID"]
    sessions = Path(os.environ.get("CODEX_HOME", str(Path.home() / ".codex"))) / "sessions"
    sources = list(sessions.rglob(f"*{thread}*.jsonl"))
    assert len(sources) == 1, "确切线程来源不唯一"
    source = sources[0]
    with source.open("rb") as origin:
        meta = json.loads(origin.readline())
    assert meta["type"] == "session_meta"
    assert meta["payload"]["id"] == thread
    assert Path(meta["payload"]["cwd"]).resolve() == project
    assert meta["payload"]["cli_version"] == "0.169.0"
    script = args.skill.resolve(strict=True) / "scripts/shadow_runtime.py"
    memory = case / "memory"
    raw = memory / f"conversations/raw/{thread}.jsonl"
    started = time.time_ns()
    result = {"status": "waiting_for_native_final", "host_profile": "codex-0.169.0-item-completed",
              "scope": args.scope, "started_at_ns": started,
              "runtime_sha256": hashlib.sha256(script.read_bytes()).hexdigest(),
              "real_memory_enabled": False, "model_message_saves": 0}
    write_result(args.result, result)
    command = [sys.executable, "-B", str(script), "capture", "--project-root", str(project),
               "--memory-root", str(memory), "--thread-id", thread, "--source", str(source)]
    process = None
    passed = False
    parent_pid = os.getpid()
    previous_handler = signal.getsignal(signal.SIGTERM)

    def terminate_probe(_signum, _frame):
        """让受管终止走相同的子进程回收和失败记录路径。"""
        raise KeyboardInterrupt

    signal.signal(signal.SIGTERM, terminate_probe)
    try:
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, bufsize=0,
                                   preexec_fn=lambda: bind_to_probe(parent_pid))
        buffer = b""
        receipts = []
        offset = None
        deadline = time.monotonic() + args.observation_seconds
        while time.monotonic() < deadline:
            readable = select.select([process.stdout], [], [], min(1, max(0, deadline-time.monotonic())))[0]
            if not readable:
                assert process.poll() is None, "记录器提前停止"
                continue
            chunk = os.read(process.stdout.fileno(), 65536)
            assert chunk, "记录器输出结束但未取得final"
            buffer += chunk
            while b"\n" in buffer:
                line, buffer = buffer.split(b"\n", 1)
                event = json.loads(line)
                assert event["event"] != "error", "记录器明确拒收或保存失败"
                if event["event"] == "capture_ready":
                    offset = event["start_offset"]
                    (case / "ready").write_text("ready\n")
                    print(json.dumps({"event": "probe_ready", "scope": args.scope}), flush=True)
                if event["event"] != "saved":
                    continue
                receipts.append(event)
                assert offset is not None
                # 收据之后仍可能追加新消息；只比对对应收据已确认的前缀。
                receipt_ref = tuple(event["source_ref"])
                row = saved_prefix(raw, receipt_ref)[-1]
                (case / "progress.json").write_text(json.dumps({
                    "receipts": len(receipts), "last_phase": row["phase"],
                    "observed_at_ns": row["observed_at_ns"],
                    "saved_and_read_back_at_ns": event["saved_and_read_back_at_ns"]}))
                if row["role"] != "assistant" or row["phase"] not in ("final", "final_answer"):
                    continue
                saved = check_saved(source, raw, thread, offset, receipt_ref)
                # 冻结比较范围到这条final；不发送新用户输入或靠下一轮保存。
                final_index = saved.index(row)
                assert not any(r["role"] == "user" for r in saved[final_index+1:])
                assert len(receipts) >= final_index + 1
                result.update(checked_at_ns=time.time_ns(),
                              recorded_count=final_index+1, native_final_count=1,
                              text_role_phase_order_identity_equal=True,
                              final_completed_at_ms=row["source_completed_at"],
                              final_observed_at_ns=row["observed_at_ns"],
                              final_saved_and_read_back_at_ns=event["saved_and_read_back_at_ns"],
                              saved_before_next_user_input=True,
                              primary_final_verified=args.scope == "primary")
                passed = True
                return
        result.update(status="observation_window_ended_without_proof", checked_at_ns=time.time_ns())
        write_result(args.result, result)
        raise RuntimeError("验收观察窗口结束，未取得完整final证据")
    except BaseException:
        if result["status"] == "waiting_for_native_final":
            result.update(status="probe_failed", checked_at_ns=time.time_ns())
            write_result(args.result, result)
        raise
    finally:
        try:
            stop_child(process)
        except BaseException:
            result.update(status="cleanup_failed", checked_at_ns=time.time_ns())
            write_result(args.result, result)
            raise
        finally:
            signal.signal(signal.SIGTERM, previous_handler)
        if passed:
            result.update(status="passed", cleanup_complete=True)
            write_result(args.result, result)
            print(json.dumps({"event": "native_final_verified", "scope": args.scope}), flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True, type=Path)
    parser.add_argument("--case", required=True, type=Path)
    parser.add_argument("--skill", required=True, type=Path)
    parser.add_argument("--result", required=True, type=Path)
    parser.add_argument("--thread")
    parser.add_argument("--scope", choices=("primary", "analysis-subagent"), required=True)
    parser.add_argument("--observation-seconds", type=float, default=1800)
    run(parser.parse_args())
