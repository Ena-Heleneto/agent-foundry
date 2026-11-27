"""Linux/Codex消息记录候选：只保存可核验原文，不执行模型分析。"""

import argparse
from contextlib import contextmanager
import ctypes
import ctypes.util
import fcntl
import json
import os
from pathlib import Path
import re
import select
import struct
import sys
import time


class CaptureError(Exception):
    """携带可报告的失败分类，避免把私人正文拼入错误输出。"""

    def __init__(self, code, message):
        super().__init__(message)
        self.code = code


def emit(event, **fields):
    """即时输出元数据收据，成功时点只在真正读回后生成。"""
    print(json.dumps({"event": event, **fields}, ensure_ascii=False), flush=True)


def identity(row):
    """原文的真实三元组是身份，文本哈希不能替代它。"""
    values = tuple(row.get(key) for key in ("thread_id", "turn_id", "item_id"))
    if not all(isinstance(value, str) and value for value in values):
        raise CaptureError("source_gap", "可见消息缺少真实身份")
    return values


def decode_object(data):
    """完整行必须是UTF-8 JSON对象，解析失败保留缺口。"""
    try:
        value = json.loads(data)
    except (ValueError, UnicodeDecodeError):
        raise CaptureError("source_gap", "存在不能解析的完整记录") from None
    if not isinstance(value, dict):
        raise CaptureError("source_gap", "记录不是JSON对象")
    return value


def visible_record(event, thread, source_offset):
    """仅接受已观察结构的已完成用户/Agent消息，排除工具及思维。"""
    if event.get("type") != "event_msg":
        return None
    payload = event.get("payload")
    if not isinstance(payload, dict):
        raise CaptureError("source_gap", "事件载荷损坏")
    if payload.get("type") in ("user_message", "agent_message"):
        raise CaptureError("unsupported_source", "旧消息格式不提供本候选要求的真实三元组")
    if payload.get("type") != "item_completed":
        return None
    if payload.get("thread_id") != thread:
        raise CaptureError("identity_mismatch", "完成事件不属于已核验线程")
    item = payload.get("item")
    if not isinstance(item, dict):
        raise CaptureError("source_gap", "完成事件缺少item")
    kind = item.get("type")
    if kind not in ("UserMessage", "AgentMessage"):
        return None
    row = {"thread_id": thread, "turn_id": payload.get("turn_id"), "item_id": item.get("id")}
    identity(row)
    content = item.get("content")
    if not isinstance(content, list) or not content:
        raise CaptureError("unsupported_source", "可见消息没有受支持的内容分段")
    parts = []
    for part in content:
        if not isinstance(part, dict) or part.get("type") not in ("Text", "text") or not isinstance(part.get("text"), str):
            raise CaptureError("unsupported_source", "非文本或未知内容须先验证来源引用转换")
        if part.get("text_elements"):
            raise CaptureError("unsupported_source", "带控件或非文本标记的用户内容尚未验证")
        parts.append(part["text"])
    completed = payload.get("completed_at_ms")
    if not isinstance(completed, int) or isinstance(completed, bool):
        raise CaptureError("source_gap", "完成事件缺少真实完成时点")
    phase = item.get("phase")
    if kind == "AgentMessage" and phase not in ("commentary", "final_answer", "final"):
        raise CaptureError("unsupported_source", "Agent消息phase尚未验证")
    row.update(role="user" if kind == "UserMessage" else "assistant", phase=phase,
               text="".join(parts), text_parts=parts, source_completed_at=completed,
               source_offset=source_offset, observed_at_ns=time.time_ns())
    return row


class RawStore:
    """用同根短文件锁协调实际原文，保存失败不推进判重事实。"""

    def __init__(self, project, memory, thread):
        self.project = Path(project).resolve(strict=True)
        self.memory = Path(memory).resolve()
        if not self.project.is_dir() or not self.memory.is_relative_to(self.project) or self.memory == self.project:
            raise CaptureError("identity_mismatch", "资料根必须位于明确项目内的专门目录")
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{0,127}", thread):
            raise CaptureError("identity_mismatch", "线程身份不能用作安全的文件名")
        self.thread = thread

    def path(self, relative):
        """不沿资料根内的软链写到其他项目或目录。"""
        result = self.memory / relative
        if not result.resolve().is_relative_to(self.memory):
            raise CaptureError("identity_mismatch", "资料路径越出当前资料根")
        return result

    @contextmanager
    def locked(self):
        """固定锁文件仅保护I/O，不包含模型调用或工程状态。"""
        self.memory.mkdir(parents=True, exist_ok=True)
        fd = os.open(self.path(".shadow-write.lock"), os.O_RDWR | os.O_CREAT | os.O_CLOEXEC | os.O_NOFOLLOW, 0o600)
        try:
            fcntl.flock(fd, fcntl.LOCK_EX)
            yield
        finally:
            os.close(fd)

    def read_rows(self):
        """从真实完整原文重建身份，坏尾行不能静默跳过。"""
        path = self.path(f"conversations/raw/{self.thread}.jsonl")
        if not path.exists():
            return []
        data = path.read_bytes()
        if data and not data.endswith(b"\n"):
            raise CaptureError("source_gap", "目标原文存在未完成尾行，未自动修复")
        rows = [decode_object(line) for line in data.splitlines()]
        keys = set()
        for row in rows:
            key = identity(row)
            if key[0] != self.thread or key in keys or row.get("role") not in ("user", "assistant") or not isinstance(row.get("text"), str):
                raise CaptureError("source_gap", "目标原文存在身份或内容冲突")
            keys.add(key)
        return rows

    def append(self, row):
        """只有追加、fsync和读回都成功才报告已存；失败尾部留在本次锁内处理。"""
        with self.locked():
            if self.path("conclusions/coverage.md").exists():
                raise CaptureError("unsupported_coverage", "本候选尚不解释既有覆盖/遗忘协议，拒绝写回")
            rows = self.read_rows()
            for previous in rows:
                if identity(previous) == identity(row):
                    fields = ("role", "phase", "text", "text_parts", "source_completed_at")
                    if any(previous.get(key) != row.get(key) for key in fields):
                        raise CaptureError("identity_conflict", "相同身份出现不同原文或元数据")
                    return None
            path = self.path(f"conversations/raw/{self.thread}.jsonl")
            path.parent.mkdir(parents=True, exist_ok=True)
            encoded = (json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n").encode("utf-8")
            fd = os.open(path, os.O_RDWR | os.O_CREAT | os.O_CLOEXEC | os.O_NOFOLLOW, 0o600)
            with os.fdopen(fd, "r+b") as target:
                target.seek(0, os.SEEK_END)
                offset = target.tell()
                try:
                    target.write(encoded)
                    target.flush()
                    os.fsync(target.fileno())
                    target.seek(offset)
                    if target.read(len(encoded)) != encoded:
                        raise OSError("保存后读回不一致")
                except OSError:
                    try:
                        target.seek(0, os.SEEK_END)
                        tail_size = target.tell() - offset
                        if tail_size < 0 or tail_size > len(encoded):
                            raise CaptureError("save_failed", "失败尾部已被外部改动，保留现场待核对")
                        target.seek(offset)
                        if target.read(tail_size) != encoded[:tail_size]:
                            raise CaptureError("save_failed", "不能核实失败尾部属于本次追加，保留现场待核对")
                        target.seek(offset)
                        target.truncate()
                        target.flush()
                        os.fsync(target.fileno())
                    except OSError:
                        raise CaptureError("save_failed", "写入与失败尾部恢复均未完成，需核对实际原文") from None
                    raise CaptureError("save_failed", "本次追加失败，未计入已存") from None
            return {"source_ref": list(identity(row)), "observed_at_ns": row["observed_at_ns"],
                    "saved_and_read_back_at_ns": time.time_ns()}

    def inspect(self):
        """只报告本候选能证实的原文范围，分析/入口覆盖仍为未知。"""
        with self.locked():
            rows = self.read_rows()
            return {"recorded_count": len(rows), "source_refs": [list(identity(row)) for row in rows],
                    "analyzed_coverage": None, "profile_coverage": None,
                    "coverage_protocol_present": self.path("conclusions/coverage.md").exists()}


class Source:
    """验证单个明确来源并按字节读取，半行不会进入原文。"""

    def __init__(self, path, project, thread, offset):
        self.path = Path(path)
        self.file = self.path.open("rb")
        try:
            meta = decode_object(self.file.readline())
            payload = meta.get("payload", {})
            if meta.get("type") != "session_meta" or not isinstance(payload, dict):
                raise CaptureError("unsupported_source", "来源缺少session_meta")
            cwd = payload.get("cwd")
            if not isinstance(cwd, str) or not cwd or not Path(cwd).is_absolute():
                raise CaptureError("unsupported_source", "来源缺少绝对项目目录")
            if payload.get("id") != thread or Path(cwd).resolve() != project:
                raise CaptureError("identity_mismatch", "来源线程或项目不匹配")
            if payload.get("cli_version") != "0.169.0":
                raise CaptureError("unsupported_source", "来源声明版本尚未验证")
            meta_end = self.file.tell()
            stat = os.fstat(self.file.fileno())
            self.fingerprint = (stat.st_dev, stat.st_ino)
            self.offset = stat.st_size if offset is None else (meta_end if offset == 0 else offset)
            if self.offset < meta_end or self.offset > stat.st_size:
                raise CaptureError("source_gap", "起始偏移不在当前来源范围内")
            self.file.seek(self.offset - 1)
            if self.file.read(1) != b"\n":
                raise CaptureError("source_gap", "起始偏移不是完整行边界")
            self.file.seek(self.offset)
            self.buffer = b""
            self.thread = thread
        except BaseException:
            self.file.close()
            raise

    def drain(self, store):
        """读取本次事件到达后的新增完整行，失败时停止而不跳过。"""
        try:
            stat = self.path.stat()
        except OSError:
            raise CaptureError("source_gap", "来源已不可访问") from None
        if (stat.st_dev, stat.st_ino) != self.fingerprint or stat.st_size < self.file.tell():
            raise CaptureError("source_gap", "来源轮转或截断，未自动重接")
        self.buffer += self.file.read()
        while b"\n" in self.buffer:
            line, remaining = self.buffer.split(b"\n", 1)
            event = decode_object(line)
            row = visible_record(event, self.thread, self.offset)
            if row is not None:
                saved = store.append(row)
                if saved is not None:
                    emit("saved", **saved)
            self.offset += len(line) + 1
            self.buffer = remaining


class Watch:
    """沿已验证探针使用inotify，不靠模型轮询或固定寿命采集。"""

    def __init__(self, path):
        if sys.platform != "linux":
            raise CaptureError("unsupported_source", "候选事件适配只支持Linux")
        lib = ctypes.CDLL(ctypes.util.find_library("c"), use_errno=True)
        lib.inotify_init1.argtypes = [ctypes.c_int]
        lib.inotify_init1.restype = ctypes.c_int
        lib.inotify_add_watch.argtypes = [ctypes.c_int, ctypes.c_char_p, ctypes.c_uint32]
        lib.inotify_add_watch.restype = ctypes.c_int
        self.fd = lib.inotify_init1(os.O_NONBLOCK | os.O_CLOEXEC)
        if self.fd < 0:
            raise CaptureError("unsupported_source", "不能建立消息事件监听")
        if lib.inotify_add_watch(self.fd, os.fsencode(path), 0x2 | 0x8 | 0x4 | 0x400 | 0x800) < 0:
            os.close(self.fd)
            raise CaptureError("unsupported_source", "不能监听已核验来源")

    def wait(self):
        """溢出、删除或移动必须显式留下缺口。"""
        select.select([self.fd], [], [])
        data = os.read(self.fd, 65536)
        cursor = 0
        while cursor + 16 <= len(data):
            _, mask, _, length = struct.unpack_from("iIII", data, cursor)
            cursor += 16 + length
            if mask & (0x400 | 0x800 | 0x4000 | 0x8000):
                raise CaptureError("source_gap", "消息监听溢出或来源失效，未自动恢复")


def main():
    """记录以前台命令运行，退出不追加最后一次drain或补录。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("operation", choices=("capture", "inspect"))
    parser.add_argument("--project-root", required=True)
    parser.add_argument("--memory-root", required=True)
    parser.add_argument("--thread-id", required=True)
    parser.add_argument("--source")
    parser.add_argument("--start-offset", type=int)
    parser.add_argument("--once", action="store_true")
    args = parser.parse_args()
    source = watch = None
    try:
        store = RawStore(args.project_root, args.memory_root, args.thread_id)
        if args.operation == "inspect":
            print(json.dumps(store.inspect(), ensure_ascii=False), flush=True)
            return 0
        if not args.source:
            raise CaptureError("unsupported_source", "capture需要明确的当前来源")
        offset = 0 if args.once and args.start_offset is None else args.start_offset
        source = Source(args.source, store.project, store.thread, offset)
        if not args.once:
            watch = Watch(args.source)
        emit("capture_ready", source_profile="codex-0.169.0-item-completed", start_offset=source.offset)
        source.drain(store)
        if args.once:
            if source.buffer:
                raise CaptureError("source_gap", "来源仍有未完成尾行，未计入已存")
            return 0
        while True:
            watch.wait()
            source.drain(store)
    except CaptureError as error:
        emit("error", error=error.code, message=str(error))
        return 2
    except OSError:
        emit("error", error="save_failed", message="文件操作未完成，未报告已保存")
        return 2
    except KeyboardInterrupt:
        return 0
    finally:
        if source is not None:
            source.file.close()
        if watch is not None:
            os.close(watch.fd)


if __name__ == "__main__":
    raise SystemExit(main())
