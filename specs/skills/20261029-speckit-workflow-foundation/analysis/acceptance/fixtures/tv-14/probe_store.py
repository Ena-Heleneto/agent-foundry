"""T114隔离保存验收：只使用合成资料，不承担产品调度或工程状态。"""

import argparse
import json
import os
from pathlib import Path
import select
import subprocess
import sys
import time


def run(project, case, skill):
    """运行真实复制入口，核对跨进程锁和不支持内容的拒收行为。"""
    case.mkdir(parents=True, exist_ok=False)
    script = skill / "scripts/shadow_runtime.py"
    thread = "t114-synthetic-input"
    meta = {"type": "session_meta", "payload": {
        "id": thread, "cwd": str(project), "cli_version": "0.169.0"}}
    texts = [
        "后续在这个合成项目讨论方案时，请先给结论，再补依据。",
        "接下来两个月，我希望把这个合成项目的离线导出做成可以独立交付的功能。",
        "纠正一下：刚才说的离线导出只包含CSV，不包含PDF。",
        "请分析这段合成对话，整理对持续协作有帮助的认识。",
        "收到，先运行当前用例。",
        "Agent刚才建议‘以后都用英文’，我只是引用这句话，还没有同意。",
    ]
    rows = [{"type": "event_msg", "payload": {
        "type": "item_completed", "thread_id": thread, "turn_id": f"synthetic-turn-{n}",
        "item": {"type": "UserMessage", "id": f"synthetic-item-{n}",
                 "content": [{"type": "Text", "text": text, "text_elements": []}]},
        "completed_at_ms": 2000 + n}} for n, text in enumerate(texts, 1)]
    source = case / "source.jsonl"
    source.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in [meta, *rows]))
    memory = case / "memory"

    def command(destination=memory, origin=source, source_thread=thread):
        """以同一复制入口构造显式隔离参数。"""
        return [sys.executable, "-B", str(script), "capture", "--once",
                "--project-root", str(project), "--memory-root", str(destination),
                "--thread-id", source_thread, "--source", str(origin)]

    holder_code = """
import importlib.util, sys
s=importlib.util.spec_from_file_location('candidate', sys.argv[1])
m=importlib.util.module_from_spec(s); s.loader.exec_module(m)
store=m.RawStore(*sys.argv[2:])
with store.locked():
    print('holding', flush=True)
    sys.stdin.buffer.read(1)
"""
    holder = subprocess.Popen([sys.executable, "-B", "-c", holder_code, str(script),
                               str(project), str(memory), thread], stdin=subprocess.PIPE,
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    writer = None
    try:
        assert select.select([holder.stdout], [], [], 5)[0], "持锁进程未就绪"
        assert holder.stdout.readline() == b"holding\n"
        lock = memory / ".shadow-write.lock"
        inode = (lock.stat().st_dev, lock.stat().st_ino)
        writer = subprocess.Popen(command(), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        # T115读取检查点也受共同锁保护，ready可能晚于首次锁等待。
        # 确认实际writer正在等待同一设备/inode的FLOCK，静默时间不作为证明。
        deadline = time.monotonic() + 5
        waiting = False
        while time.monotonic() < deadline and not waiting:
            for line in Path("/proc/locks").read_text().splitlines():
                fields = line.split()
                if "->" not in fields or "FLOCK" not in fields:
                    continue
                position = fields.index("FLOCK")
                device, minor, number = fields[position+4].split(":")
                waiting = (int(fields[position+3]) == writer.pid and
                           (int(device, 16), int(minor, 16), int(number)) ==
                           (os.major(inode[0]), os.minor(inode[0]), inode[1]))
                if waiting:
                    break
            if not waiting:
                time.sleep(0.01)
        assert waiting, "未取得writer等待同一FLOCK的内核事实"
        assert writer.poll() is None
        raw = memory / f"conversations/raw/{thread}.jsonl"
        assert not raw.exists(), "writer越过了另一进程持有的锁"
        holder.terminate()
        holder.communicate(timeout=5)
        out, err = writer.communicate(timeout=5)
        assert writer.returncode == 0, err.decode()
        events = [json.loads(line) for line in out.splitlines()]
        assert events[0]["event"] == "capture_ready"
        receipts = events[1:]
        assert len(receipts) == 6 and all(r["event"] == "saved" for r in receipts)
        assert (lock.stat().st_dev, lock.stat().st_ino) == inode
    finally:
        for process in (writer, holder):
            if process is not None:
                if process.poll() is None:
                    process.terminate()
                process.communicate(timeout=5)

    processes = []
    try:
        for _ in range(2):
            processes.append(subprocess.Popen(command(), stdout=subprocess.PIPE, stderr=subprocess.PIPE))
        for process in processes:
            out, err = process.communicate(timeout=5)
            assert process.returncode == 0, err.decode()
            assert [json.loads(line)["event"] for line in out.splitlines()] == ["capture_ready"]
    finally:
        for process in processes:
            if process.poll() is None:
                process.terminate()
            process.communicate(timeout=5)
    saved = [json.loads(line) for line in raw.read_text().splitlines()]
    assert [r["text"] for r in saved] == texts
    assert len({(r["thread_id"], r["turn_id"], r["item_id"]) for r in saved}) == 6

    concurrent = case / "concurrent-memory"
    processes = []
    try:
        for n in (7, 8):
            event = json.loads(json.dumps(rows[0]))
            source_thread = f"t114-concurrent-thread-{n}"
            source_meta = {"type": "session_meta", "payload": {
                "id": source_thread, "cwd": str(project), "cli_version": "0.169.0"}}
            event["payload"]["thread_id"] = source_thread
            event["payload"]["turn_id"] = f"synthetic-turn-{n}"
            event["payload"]["item"]["id"] = f"synthetic-item-{n}"
            event["payload"]["item"]["content"][0]["text"] = f"不同的新事件{n}"
            origin = case / f"concurrent-{n}.jsonl"
            origin.write_text("".join(json.dumps(r) + "\n" for r in (source_meta, event)))
            processes.append(subprocess.Popen(command(concurrent, origin, source_thread),
                                              stdout=subprocess.PIPE, stderr=subprocess.PIPE))
        for process in processes:
            out, err = process.communicate(timeout=5)
            assert process.returncode == 0, err.decode()
            assert [json.loads(line)["event"] for line in out.splitlines()] == ["capture_ready", "saved"]
    finally:
        for process in processes:
            if process.poll() is None:
                process.terminate()
            process.communicate(timeout=5)
    distinct = [json.loads(line) for n in (7, 8) for line in
                (concurrent / f"conversations/raw/t114-concurrent-thread-{n}.jsonl").read_text().splitlines()]
    assert {r["item_id"] for r in distinct} == {"synthetic-item-7", "synthetic-item-8"}
    assert len(distinct) == 2

    rejected = {}
    for name in ("control", "nontext", "coverage"):
        event = json.loads(json.dumps(rows[0]))
        destination = case / name
        if name == "control":
            event["payload"]["item"]["content"][0]["text_elements"] = [{"type": "unverified"}]
        elif name == "nontext":
            event["payload"]["item"]["content"] = [{"type": "Image", "url": "synthetic-only"}]
        else:
            coverage = destination / "conclusions/coverage.md"
            coverage.parent.mkdir(parents=True)
            coverage.write_text("forget_generation: 1\n")
        origin = case / f"{name}.jsonl"
        origin.write_text("".join(json.dumps(r) + "\n" for r in (meta, event)))
        result = subprocess.run(command(destination, origin), capture_output=True, timeout=5)
        events = [json.loads(line) for line in result.stdout.splitlines()]
        expected = "unsupported_coverage" if name == "coverage" else "unsupported_source"
        assert result.returncode == 2 and events[-1].get("error") == expected
        assert not (destination / f"conversations/raw/{thread}.jsonl").exists()
        rejected[name] = expected

    return {"synthetic_only": True, "checked_at_ns": time.time_ns(),
            "lock_contention_blocked": True, "holder_exit_released_lock": True,
            "kernel_waiter_matches_lock": True, "concurrent_distinct_new_events": len(distinct),
            "fixed_lock_inode_unchanged": True, "concurrent_replay_duplicates": 0,
            "recorded_count": len(saved), "rejected_without_raw_write": rejected,
            "full_control_or_nontext_support": False}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True, type=Path)
    parser.add_argument("--case", required=True, type=Path)
    parser.add_argument("--skill", required=True, type=Path)
    parser.add_argument("--result", required=True, type=Path)
    args = parser.parse_args()
    result = run(args.project.resolve(), args.case.resolve(), args.skill.resolve())
    args.result.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(result, ensure_ascii=False))
