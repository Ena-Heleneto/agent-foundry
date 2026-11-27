"""Linux/Codex消息记录候选：只保存可核验原文，不执行模型分析。"""

import argparse
from contextlib import contextmanager
import ctypes
import ctypes.util
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import select
import struct
import sys
import tempfile
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


def digest(value):
    """用规范JSON摘要关联真实读回内容，不以摘要替代来源身份。"""
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True,
                                     separators=(",", ":")).encode()).hexdigest()


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

    def read_coverage(self):
        """只解释本版完整协议；未知字段或失效代际不能被重写丢失。"""
        path = self.path("conclusions/coverage.md")
        if not path.exists():
            return {"format": "shadow-recording-v1", "forget_generation": 0, "threads": {}}
        prefix = "# 对话记录覆盖\n\n```json\n"
        suffix = "\n```\n"
        try:
            text = path.read_text(encoding="utf-8")
            if not text.startswith(prefix) or not text.endswith(suffix):
                raise ValueError
            data = json.loads(text[len(prefix):-len(suffix)])
            if (not isinstance(data, dict) or set(data) != {"format", "forget_generation", "threads"}
                    or data["format"] != "shadow-recording-v1" or type(data["forget_generation"]) is not int
                    or data["forget_generation"] != 0 or not isinstance(data["threads"], dict)):
                raise ValueError
            for thread, facts in data["threads"].items():
                if (not isinstance(facts, dict) or set(facts) != {"received", "recorded", "gaps", "source"}
                        or not all(isinstance(facts[key], list) for key in ("received", "recorded", "gaps"))):
                    raise ValueError
                for key in ("received", "recorded"):
                    seen = set()
                    for fact in facts[key]:
                        ref = fact.get("source_ref") if isinstance(fact, dict) else None
                        if (not isinstance(ref, list) or len(ref) != 3
                                or not all(isinstance(item, str) and item for item in ref)
                                or ref[0] != thread or tuple(ref) in seen):
                            raise ValueError
                        seen.add(tuple(ref))
                        required = ({"source_ref", "observed_at_ns", "source_completed_at", "source_offset"}
                                    if key == "received" else
                                    {"source_ref", "observed_at_ns", "saved_and_read_back_at_ns", "verification", "raw_digest"})
                        if set(fact) != required or type(fact["observed_at_ns"]) is not int:
                            raise ValueError
                        if key == "recorded" and (type(fact["saved_and_read_back_at_ns"]) is not int
                                or fact["saved_and_read_back_at_ns"] < fact["observed_at_ns"]
                                or fact["verification"] not in ("append", "recovery_readback")
                                or not re.fullmatch(r"[0-9a-f]{64}", str(fact["raw_digest"]))):
                            raise ValueError
                        if key == "received" and any(type(fact[field]) is not int
                                                     for field in ("source_completed_at", "source_offset")):
                            raise ValueError
                for gap in facts["gaps"]:
                    if (not isinstance(gap, dict) or set(gap) != {"error", "source_offset", "detected_at_ns", "resolved_at_ns"}
                            or not isinstance(gap["error"], str) or type(gap["detected_at_ns"]) is not int
                            or (gap["source_offset"] is not None and type(gap["source_offset"]) is not int)
                            or (gap["resolved_at_ns"] is not None and type(gap["resolved_at_ns"]) is not int)):
                        raise ValueError
                source = facts["source"]
                if source is not None:
                    if (not isinstance(source, dict) or set(source) != {"profile", "fingerprint", "meta_digest", "origin_offset", "checkpoint_offset", "prefix_digest", "attached_at_ns"}
                            or source["profile"] != "codex-0.169.0-item-completed"
                            or not isinstance(source["fingerprint"], list) or len(source["fingerprint"]) != 2
                            or not all(type(item) is int for item in source["fingerprint"])
                            or any(type(source[field]) is not int for field in ("origin_offset", "checkpoint_offset", "attached_at_ns"))
                            or not all(re.fullmatch(r"[0-9a-f]{64}", str(source[field])) for field in ("meta_digest", "prefix_digest"))):
                        raise ValueError
            return data
        except (ValueError, UnicodeDecodeError, TypeError, KeyError, AttributeError):
            raise CaptureError("unsupported_coverage", "既有覆盖协议未知或失效，保留原文件并拒绝写回") from None

    def facts(self, coverage):
        """沿真实线程保存处理事实，不建立另一套工程任务身份。"""
        return coverage["threads"].setdefault(self.thread, {
            "received": [], "recorded": [], "gaps": [], "source": None})

    def write_coverage(self, coverage):
        """短锁内同步替换并读回覆盖；失败不回滚已经成功保存的原文。"""
        path = self.path("conclusions/coverage.md")
        path.parent.mkdir(parents=True, exist_ok=True)
        encoded = ("# 对话记录覆盖\n\n```json\n" + json.dumps(coverage, ensure_ascii=False, indent=2) + "\n```\n").encode()
        fd, temporary = tempfile.mkstemp(prefix=".coverage-", dir=path.parent)
        try:
            with os.fdopen(fd, "wb") as target:
                target.write(encoded)
                target.flush()
                os.fsync(target.fileno())
            os.replace(temporary, path)
            directory = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC)
            try:
                os.fsync(directory)
            finally:
                os.close(directory)
            if path.read_bytes() != encoded:
                raise OSError("覆盖读回不一致")
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)

    def validate_receipts(self, rows, facts):
        """外部改写或删除的原文不能沿用旧成功收据。"""
        indexed = {identity(row): row for row in rows}
        for receipt in facts["recorded"]:
            row = indexed.get(tuple(receipt["source_ref"]))
            if row is None or digest(row) != receipt["raw_digest"]:
                raise CaptureError("identity_conflict", "已存覆盖与当前原文不一致，保留现场")

    def note_gap(self, code, offset=None):
        """只记无正文缺口；资料根本身不可写时由调用方报告未持久化。"""
        with self.locked():
            coverage = self.read_coverage()
            facts = self.facts(coverage)
            if not any(gap["error"] == code and gap["source_offset"] == offset
                       and gap["resolved_at_ns"] is None for gap in facts["gaps"]):
                facts["gaps"].append({"error": code, "source_offset": offset,
                                      "detected_at_ns": time.time_ns(), "resolved_at_ns": None})
                self.write_coverage(coverage)

    def source_facts(self):
        """返回恢复校验输入，不把原机器路径写入共享协议。"""
        with self.locked():
            coverage = self.read_coverage()
            facts = self.facts(coverage)
            self.validate_receipts(self.read_rows(), facts)
            return facts["source"]

    def checkpoint(self, source):
        """只有成功处理的完整行才能推进；补齐后保留缺口及其实际解决时点。"""
        with self.locked():
            coverage = self.read_coverage()
            facts = self.facts(coverage)
            previous = facts["source"]
            if previous is not None and (previous["fingerprint"] != list(source.fingerprint)
                                         or previous["meta_digest"] != source.meta_digest):
                raise CaptureError("source_gap", "来源身份与原覆盖不符")
            if previous is not None and source.prefix_digest(previous["checkpoint_offset"]) != previous["prefix_digest"]:
                raise CaptureError("source_gap", "已确认来源前缀变化，未推进检查点")
            if previous is not None and source.offset < previous["checkpoint_offset"]:
                return
            facts["source"] = {"profile": "codex-0.169.0-item-completed",
                               "fingerprint": list(source.fingerprint), "meta_digest": source.meta_digest,
                               "origin_offset": previous["origin_offset"] if previous else source.offset,
                               "checkpoint_offset": source.offset, "prefix_digest": source.prefix_digest(source.offset),
                               "attached_at_ns": previous["attached_at_ns"] if previous else time.time_ns()}
            for gap in facts["gaps"]:
                if (gap["resolved_at_ns"] is None and gap["source_offset"] is not None
                        and gap["source_offset"] < source.offset
                        and gap["error"] in ("partial_source", "source_gap", "save_failed", "unsupported_source")):
                    gap["resolved_at_ns"] = time.time_ns()
            self.write_coverage(coverage)

    def append(self, row):
        """只有追加、fsync和读回都成功才报告已存；失败尾部留在本次锁内处理。"""
        with self.locked():
            coverage = self.read_coverage()
            facts = self.facts(coverage)
            rows = self.read_rows()
            self.validate_receipts(rows, facts)
            previous = None
            for previous in rows:
                if identity(previous) == identity(row):
                    fields = ("role", "phase", "text", "text_parts", "source_completed_at")
                    if any(previous.get(key) != row.get(key) for key in fields):
                        raise CaptureError("identity_conflict", "相同身份出现不同原文或元数据")
                    if any(receipt["source_ref"] == list(identity(row)) for receipt in facts["recorded"]):
                        return None
                    break
            else:
                previous = None
            if not any(fact["source_ref"] == list(identity(row)) for fact in facts["received"]):
                facts["received"].append({"source_ref": list(identity(row)), "observed_at_ns": row["observed_at_ns"],
                                          "source_completed_at": row["source_completed_at"], "source_offset": row["source_offset"]})
                try:
                    self.write_coverage(coverage)
                except OSError:
                    raise CaptureError("save_failed", "接收事实未确认，尚未追加原文") from None
            if previous is not None:
                path = self.path(f"conversations/raw/{self.thread}.jsonl")
                with path.open("rb") as target:
                    os.fsync(target.fileno())
                verified = next((saved for saved in self.read_rows() if identity(saved) == identity(previous)), None)
                if verified is None or digest(verified) != digest(previous):
                    raise CaptureError("identity_conflict", "恢复同步后的原文读回变化，未补收据")
                return self.confirm(coverage, verified, "recovery_readback")
            self.append_raw(row)
            return self.confirm(coverage, row, "append")

    def confirm(self, coverage, row, verification):
        """原文已读回才保存收据；失败后恢复不得编造原先成功时点。"""
        receipt = {"source_ref": list(identity(row)), "observed_at_ns": row["observed_at_ns"],
                   "saved_and_read_back_at_ns": time.time_ns(), "verification": verification, "raw_digest": digest(row)}
        self.facts(coverage)["recorded"].append(receipt)
        try:
            self.write_coverage(coverage)
        except OSError:
            raise CaptureError("save_failed", "原文已读回，但覆盖收据未确认；恢复须核对实际原文") from None
        return receipt

    def append_raw(self, row):
        """沿既有追加/回退骨架保存原文，调用方已持有同根固定锁。"""
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

    def inspect(self):
        """只报告本候选能证实的原文范围，分析/入口覆盖仍为未知。"""
        with self.locked():
            rows = self.read_rows()
            coverage = self.read_coverage()
            facts = self.facts(coverage)
            self.validate_receipts(rows, facts)
            confirmed = {tuple(receipt["source_ref"]) for receipt in facts["recorded"]}
            return {"recorded_count": len(confirmed), "source_refs": [list(identity(row)) for row in rows if identity(row) in confirmed],
                    "raw_count": len(rows), "raw_source_refs": [list(identity(row)) for row in rows],
                    "received_count": len(facts["received"]), "received_coverage": facts["received"],
                    "recorded_coverage": facts["recorded"], "gaps": facts["gaps"], "source": facts["source"],
                    "unconfirmed_source_refs": [list(identity(row)) for row in rows if identity(row) not in confirmed],
                    "received_but_not_saved": [fact["source_ref"] for fact in facts["received"]
                                               if tuple(fact["source_ref"]) not in confirmed],
                    "analyzed_coverage": None, "profile_coverage": None,
                    "coverage_protocol_present": self.path("conclusions/coverage.md").exists()}


class Source:
    """验证单个明确来源并按字节读取，半行不会进入原文。"""

    def __init__(self, path, project, thread, offset, resume=None):
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
            self.meta_digest = digest(meta)
            if resume is not None:
                if (resume["fingerprint"] != list(self.fingerprint) or resume["meta_digest"] != self.meta_digest
                        or resume["checkpoint_offset"] > stat.st_size
                        or self.prefix_digest(resume["checkpoint_offset"]) != resume["prefix_digest"]):
                    raise CaptureError("source_gap", "恢复来源身份或已确认前缀变化，未自动重接")
                offset = resume["checkpoint_offset"]
            self.offset = stat.st_size if offset is None else (meta_end if offset == 0 else offset)
            if self.offset < meta_end or self.offset > stat.st_size:
                raise CaptureError("source_gap", "起始偏移不在当前来源范围内")
            self.file.seek(self.offset - 1)
            if self.file.read(1) != b"\n":
                raise CaptureError("source_gap", "起始偏移不是完整行边界")
            self.file.seek(self.offset)
            self.buffer = b""
            self.thread = thread
            self.verified_offset = self.offset
            self.verified_digest = self.prefix_digest(self.offset)
        except BaseException:
            self.file.close()
            raise

    def prefix_digest(self, offset):
        """核对已消费前缀，保留流读取位置，不把源路径写入覆盖文件。"""
        position = self.file.tell()
        self.file.seek(0)
        result = hashlib.sha256()
        remaining = offset
        while remaining:
            block = self.file.read(min(remaining, 1024 * 1024))
            if not block:
                raise CaptureError("source_gap", "来源前缀已截断")
            result.update(block)
            remaining -= len(block)
        self.file.seek(position)
        return result.hexdigest()

    def drain(self, store):
        """读取本次事件到达后的新增完整行，失败时停止而不跳过。"""
        try:
            stat = self.path.stat()
        except OSError:
            raise CaptureError("source_gap", "来源已不可访问") from None
        if (stat.st_dev, stat.st_ino) != self.fingerprint or stat.st_size < self.file.tell():
            raise CaptureError("source_gap", "来源轮转或截断，未自动重接")
        if self.prefix_digest(self.verified_offset) != self.verified_digest:
            raise CaptureError("source_gap", "运行中的来源前缀已改变，未继续采集")
        if self.buffer:
            position = self.file.tell()
            self.file.seek(self.offset)
            buffered = self.file.read(len(self.buffer))
            self.file.seek(position)
            if buffered != self.buffer:
                raise CaptureError("source_gap", "未完成源行已改写，保留缺口")
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
        store.checkpoint(self)
        self.verified_offset = self.offset
        self.verified_digest = self.prefix_digest(self.offset)
        if self.buffer:
            store.note_gap("partial_source", self.offset)


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
    parser.add_argument("--resume", action="store_true")
    args = parser.parse_args()
    source = watch = store = None
    try:
        store = RawStore(args.project_root, args.memory_root, args.thread_id)
        if args.operation == "inspect":
            print(json.dumps(store.inspect(), ensure_ascii=False), flush=True)
            return 0
        if not args.source:
            raise CaptureError("unsupported_source", "capture需要明确的当前来源")
        if args.resume and args.start_offset is not None:
            raise CaptureError("source_gap", "resume不能同时猜定起始偏移")
        saved_source = store.source_facts()
        if args.resume and saved_source is None:
            raise CaptureError("source_gap", "尚无可核验来源检查点，不能自动恢复")
        if saved_source is not None and not args.resume and not args.once:
            raise CaptureError("source_gap", "已有来源检查点，请显式resume核验恢复，不能从新EOF跳过窗口")
        offset = 0 if args.once and args.start_offset is None else args.start_offset
        source = Source(args.source, store.project, store.thread, offset, saved_source if args.resume else None)
        if saved_source is not None:
            if (saved_source["fingerprint"] != list(source.fingerprint)
                    or saved_source["meta_digest"] != source.meta_digest
                    or source.prefix_digest(saved_source["checkpoint_offset"]) != saved_source["prefix_digest"]):
                raise CaptureError("source_gap", "来源与既有覆盖不一致，不能绕过resume核验")
            if source.offset > saved_source["checkpoint_offset"]:
                raise CaptureError("source_gap", "起点越过未处理窗口，不能推进检查点")
        store.checkpoint(source)
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
        persisted = False
        if store is not None and args.operation == "capture":
            try:
                store.note_gap(error.code, source.offset if source is not None else None)
                persisted = True
            except (CaptureError, OSError):
                pass
        emit("error", error=error.code, message=str(error), gap_persisted=persisted)
        return 2
    except OSError:
        persisted = False
        if store is not None and args.operation == "capture":
            try:
                store.note_gap("save_failed", source.offset if source is not None else None)
                persisted = True
            except (CaptureError, OSError):
                pass
        emit("error", error="save_failed", message="文件操作未完成，未报告已保存", gap_persisted=persisted)
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
