"""供各 Codex Hook 共用的会话核验和记录写入。"""

from contextlib import closing
from dataclasses import dataclass
from datetime import datetime
import fcntl
from hashlib import sha256
import json
import os
from pathlib import Path
import re
import sqlite3
import stat
import subprocess
import sys
import tempfile
from urllib.parse import quote
from uuid import UUID

from events import collect, redacted


TURN_HEADER = re.compile(r"^> \*\*(\d{4}-\d{2}-\d{2})\*\* <!-- turn-([\da-f-]{36}) -->$", re.M)
RECORD_HEADER = re.compile(r"^<!-- foundry-recording (.+) -->$", re.M)
DETAIL_EVENT = re.compile(r"^<!-- foundry-(event|pending) ([\da-f]{64}) -->$")
OPENING = re.compile(r"^rollout-(\d{4}-\d{2}-\d{2})T[\d-]+-([\da-f-]{36})\.jsonl$")


def git(path, *arguments):
    """读取实际工作树，避免外部 Git 变量替换选址上下文。"""
    env = {key: value for key, value in os.environ.items() if not key.startswith("GIT_")}
    return subprocess.run(["git", "-C", str(path), *arguments], capture_output=True, env=env)


def git_root(path):
    result = git(path, "rev-parse", "--show-toplevel")
    return Path(os.fsdecode(result.stdout.rstrip(b"\n"))).resolve() if result.returncode == 0 else None


def atomic_write(path, text):
    """在同目录原子替换文件，重开文件确认原始字节。"""
    content = text if isinstance(text, bytes) else text.encode("utf-8")
    if path.is_symlink() or (path.exists() and not path.is_file()):
        raise OSError(f"写入路径冲突：{path}")
    if path.is_file() and path.read_bytes() == content:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=".recording-", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as stream:
            if path.is_file():
                os.fchmod(stream.fileno(), stat.S_IMODE(path.stat().st_mode))
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        Path(temporary).unlink(missing_ok=True)
    if path.read_bytes() != content:
        raise OSError(f"写入后读回不一致：{path}")


def header_byte(stream):
    value = stream.read(1)
    while value in (b" ", b"\t", b"\r"):
        value = stream.read(1)
    return value


def header_string(stream):
    """仅解析受限的宿主事件头字符串。"""
    if header_byte(stream) != b'"':
        return None
    data = bytearray(b'"')
    for _ in range(180):
        char = stream.read(1)
        if not char or char == b"\n":
            return None
        data += char
        if char == b'"':
            return json.loads(data)
        if char == b"\\":
            data += stream.read(1)
    return None


def event_header(stream, offset, outer, inner=None):
    """先核对 JSON 层级的事件头，再读指定宿主元数据行。"""
    stream.seek(offset)
    if header_byte(stream) != b"{":
        return None
    verified = False
    while True:
        key = header_string(stream)
        if key not in ("type", "timestamp", "ordinal", "payload") or header_byte(stream) != b":":
            return None
        if key == "payload":
            if not verified or header_byte(stream) != b"{" or header_string(stream) != "type":
                return None
            if header_byte(stream) != b":" or header_string(stream) != inner:
                return None
            break
        if key == "type":
            if header_string(stream) != outer:
                return None
            if inner is None:
                break
            verified = True
        elif key == "timestamp":
            if header_string(stream) is None:
                return None
        else:
            value = header_byte(stream)
            if value not in b"0123456789" or not value:
                return None
            for _ in range(24):
                value = stream.read(1)
                if not value or value not in b"0123456789":
                    stream.seek(-1, os.SEEK_CUR)
                    break
        if header_byte(stream) != b",":
            return None
    stream.seek(offset)
    line = stream.readline(65536)
    return json.loads(line) if line.endswith(b"\n") else None


@dataclass(frozen=True)
class Scope:
    project: Path
    transcript: Path
    session: str
    turn: str
    opening: str
    origin: Path
    opened_at: str
    date: str
    offset: int
    cwd: Path


def verify_scope(project, data):
    """在读取会话正文前核对分页索引及项目范围。"""
    session = str(UUID(data["session_id"]))
    turn = str(UUID(data["turn_id"]))
    # 工具回调的输入 cwd 属于该工具，进程 cwd 则保留宿主当前工作目录。
    cwd = Path.cwd().resolve() if data["hook_event_name"] == "PostToolUse" else Path(data["cwd"]).resolve()
    if not cwd.is_relative_to(project) or git_root(cwd) != project:
        return None
    state = Path(os.environ.get("CODEX_HOME") or Path.home() / ".codex").resolve()
    transcript = Path(data["transcript_path"]).resolve()
    opening = OPENING.fullmatch(transcript.name)
    if not opening or opening[2] != session or not transcript.is_relative_to(state / "sessions"):
        return None
    sqlite = Path(os.environ.get("CODEX_SQLITE_HOME") or state).resolve() / "thread_history_1.sqlite"
    if not sqlite.is_file() or not transcript.is_file():
        return None
    with closing(sqlite3.connect(f"{sqlite.as_uri()}?mode=ro", uri=True)) as connection:
        recent = connection.execute(
            "SELECT turn_id, status, rollout_byte_offset FROM thread_turns WHERE thread_id = ? "
            "ORDER BY rollout_byte_offset DESC LIMIT 2",
            (session,),
        ).fetchall()
    if not recent:
        return None
    # 宿主强制中断后，旧轮次可能继续标为 inProgress。
    indexed_turn, status, offset = recent[0]
    if indexed_turn != turn or status != "inProgress" or not isinstance(offset, int) or offset < 0:
        return None
    if len(recent) == 2 and recent[1][2] == offset:
        return None
    with transcript.open("rb", buffering=0) as stream:
        current = event_header(stream, offset, "event_msg", "task_started")
        if not current:
            return None
        start = current.get("payload", {})
        if start.get("turn_id") != turn or (start.get("turn_attribution") or {}).get("turn_trigger") != "user":
            return None
        meta = event_header(stream, 0, "session_meta")
    original = (meta or {}).get("payload", {})
    if original.get("id") != session or original.get("originator") != "codex-tui" or not original.get("cwd"):
        return None
    origin = Path(original["cwd"]).resolve()
    if not origin.is_relative_to(project) or git_root(origin) != project:
        return None
    date = datetime.fromisoformat(current["timestamp"].replace("Z", "+00:00")).astimezone().date().isoformat()
    return Scope(project, transcript, session, turn, opening[1], origin, original["timestamp"], date, offset, cwd)


def inside_project(project, target):
    """拒绝通过软链接路由的资料文件。"""
    if not target.resolve().is_relative_to(project) or not target.is_relative_to(project):
        return False
    for path in (target, *target.parents):
        if path == project:
            break
        if path.is_symlink():
            return False
    return True


def visible(project, target):
    """校验拟落盘文件的真实归属与 Git 可见性。"""
    if not inside_project(project, target):
        return False
    ancestor = next(path for path in target.parents if path.exists())
    return git_root(ancestor) == project and git(project, "check-ignore", "--no-index", "--", str(target)).returncode == 1


def candidate_roots(project):
    """沿项目显式设置、已有 Agent 工具资料和项目内默认目录选址。"""
    config = project / ".codex/conversation-recording.json"
    if config.is_file() and not config.is_symlink():
        custom = json.loads(config.read_bytes()).get("recordRoot")
        if isinstance(custom, str) and custom:
            yield project / custom, "项目记录配置"
    if (project / ".specify/feature.json").is_file() and (project / ".specify/memory").is_dir():
        yield project / ".specify/memory/conversation-recording", "Spec Kit 项目资料"
    yield project, "项目根下的 records 目录"
    yield project / "conversation-recording", "项目内独立资料目录"


def find_record(scope):
    """优先复用经来源核实的记录，绕开新命中的 Git 忽略位置。"""
    suffix = Path("records") / scope.opening / f"{scope.session}.md"
    roots = list(candidate_roots(scope.project))
    files = git(scope.project, "ls-files", "-z", "--cached", "--others", "--exclude-standard",
                "--", f":(glob)**/{suffix.as_posix()}")
    ignored = git(scope.project, "ls-files", "-z", "--ignored", "--others", "--exclude-standard",
                  "--", f":(glob)**/{suffix.as_posix()}")
    known = {base / suffix for base, _ in roots}
    known.update(scope.project / os.fsdecode(path) for path in (files.stdout + ignored.stdout).split(b"\0") if path)
    existing = []
    superseded = set()
    for path in sorted(known):
        if not inside_project(scope.project, path) or not path.is_file():
            continue
        content = path.read_bytes().decode("utf-8")
        marker = RECORD_HEADER.search(content)
        if not marker:
            # 保留并复用具备相同会话头的旧版记录。
            if f"会话 `{scope.session}`" not in content:
                raise ValueError(f"主记录同名文件归属不明：{path}")
        else:
            saved = json.loads(marker[1])
            if (saved.get("session"), saved.get("project"), saved.get("origin")) != (
                scope.session, str(scope.project), str(scope.origin)
            ):
                raise ValueError(f"主记录会话来源不符：{path}")
            superseded.update(scope.project / item for item in saved.get("previousRecords", []) if isinstance(item, str))
        existing.append((path, content))
    eligible = [(path, content) for path, content in existing if path not in superseded and visible(scope.project, path)]
    if len(eligible) > 1:
        raise ValueError("存在多份可写的同一会话主记录")
    if eligible:
        return eligible[0]
    for base, reason in roots:
        path = base / suffix
        if not path.exists() and visible(scope.project, path):
            details = {"session": scope.session, "project": str(scope.project), "origin": str(scope.origin),
                       "root": str(base.relative_to(scope.project)), "reason": reason}
            if existing:
                details["previousRecords"] = [str(path.relative_to(scope.project)) for path, _ in existing]
                details["restartTurn"] = scope.turn
            heading = (f"# 对话记录\n\n会话 `{scope.session}` · 开启 `{scope.opened_at}` · 目录 `{scope.origin}`\n\n"
                       f"<!-- foundry-recording {json.dumps(details, ensure_ascii=False)} -->\n")
            return path, heading
    raise OSError("找不到 Git 可见的项目内记录位置")


def quoted(label, value):
    """为多行原话添加可逆的 Markdown 外层前缀。"""
    return f"> - **{label}** " + "\n>   ".join(value.split("\n")) + "\n"


def detail_blocks(document):
    """用围栏外的事件定位保持已确认块，按原位置重试不完整块。"""
    starts = []
    fence = None
    offset = 0
    for raw in document.splitlines(keepends=True):
        line = raw.rstrip("\r\n")
        if fence:
            if line == fence:
                fence = None
        elif re.fullmatch(r"~{3,}text", line):
            fence = line.removesuffix("text")
        elif match := DETAIL_EVENT.fullmatch(line):
            starts.append((offset, match[2], match[1] == "event"))
        offset += len(raw)
    blocks = {}
    for (start, key, complete), (end, _, _) in zip(starts, [*starts[1:], (len(document), None, None)]):
        blocks[key] = (complete, document[start:end])
    return (document[:starts[0][0]] if starts else document), blocks


def detail_document(scope, path, events):
    """逐项确认附件与详情，再把可用的链接交给主记录。"""
    target = path.parent / "details" / scope.session / f"{scope.turn}.md"
    if not visible(scope.project, target):
        raise OSError(f"详情路径不在可写的 Git 范围：{target}")
    owner = f"<!-- foundry-detail {scope.session} {scope.turn} -->"
    header = f"# 对话经过\n\n会话 `{scope.session}` · 轮次 `{scope.turn}`\n\n{owner}\n"
    previous = target.read_bytes().decode("utf-8") if target.is_file() else header
    if not previous.startswith(header):
        raise OSError(f"同名详情归属未确认：{target}")
    prelude, blocks = detail_blocks(previous)
    for event in events:
        key = sha256((event.identity or f"{event.location}:{event.label}").encode()).hexdigest()
        if key in blocks and blocks[key][0]:
            continue
        length = max((len(match[0]) for match in re.finditer(r"~+", event.value)), default=0)
        fence = "~" * max(3, length + 1)
        pieces = [f"## {event.label}\n\n- 来源定位：{event.location}\n\n{fence}text\n{event.value}\n{fence}\n"]
        complete = True
        for attachment in event.attachments:
            checksum = sha256(attachment.data).hexdigest()
            name = Path(redacted(attachment.name))
            filename = f"{name.stem}-{checksum}{name.suffix}"
            text = attachment.data.decode("utf-8", errors="surrogateescape")
            if redacted(text) != text:
                pieces.append("\n- 附件缺口：原件包含需省略的内容。\n")
                continue
            original = target.parent / "attachments" / filename
            if not visible(scope.project, original):
                pieces.append("\n- 附件缺口：原件目标不在 Git 可见范围。\n")
                complete = False
                continue
            if original.is_file() and original.read_bytes() != attachment.data:
                pieces.append("\n- 附件缺口：同一摘要路径已有不同内容。\n")
                complete = False
                continue
            try:
                atomic_write(original, attachment.data)
            except OSError:
                pieces.append("\n- 附件缺口：原件写入或读回失败。\n")
                complete = False
                continue
            pieces.append(f"\n- [附件](attachments/{quote(filename)}) · SHA-256 `{checksum}`\n")
        status = "event" if complete else "pending"
        blocks[key] = (complete, f"<!-- foundry-{status} {key} -->\n" + "".join(pieces) + "\n")
    atomic_write(target, prelude + "".join(block for _, block in blocks.values()))
    return target.relative_to(path.parent).as_posix()


def update_detail_and_reply(scope, path, current, contents, reply):
    """仅更新已归属的当前轮块，详情失败时保存可确认的回复。"""
    matches = list(TURN_HEADER.finditer(current))
    index = next((i for i, match in enumerate(matches) if match[2] == scope.turn), None)
    if index is None:
        if not contents.inputs:
            return
        # 首次写入受阻后仅用实际可取的宿主输入补回发起。
        group = f"\n> **{scope.date}** <!-- turn-{scope.turn} -->\n>\n"
        current += group + quoted("发起", contents.inputs[0])
        matches = list(TURN_HEADER.finditer(current))
        index = len(matches) - 1
    start = matches[index].start()
    end = matches[index + 1].start() if index + 1 < len(matches) else len(current)
    block = current[start:end]
    separator = "\n" if block.endswith("\n\n") else ""
    rendered = block.removesuffix(separator) if separator else block
    existing_supplements = sum(line.startswith("> - **补充** ") for line in rendered.splitlines())
    for supplemental in contents.inputs[1 + existing_supplements:]:
        rendered += quoted("补充", supplemental)
    failure = None
    if contents.events:
        try:
            link = detail_document(scope, path, contents.events)
            if "\n> - [查看经过](" not in rendered:
                rendered += f"> - [查看经过]({link})\n"
        except OSError as error:
            failure = error
    if isinstance(reply, str) and reply and "\n> - **回复** " not in rendered:
        rendered += quoted("回复", redacted(reply))
    atomic_write(path, current[:start] + rendered + separator + current[end:])
    if failure:
        raise failure


def update_turn(scope, data, *, reply=None):
    """在会话锁内补记工具详情和实际发出的回复。"""
    with scope.transcript.open("rb") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        contents = collect(scope, data)
        if contents.commit_result:
            return
        path, current = find_record(scope)
        update_detail_and_reply(scope, path, current, contents, reply)


def run_hook(event_names, handle):
    """从标准输入接收一个 Codex 回调并调用事件处理方法。

    event_names 是入口接收的事件名。通过轮次和工作树归属核验后，将核实结果和原始事件交给 handle。
    """
    data = json.load(sys.stdin)
    if data.get("hook_event_name") not in event_names:
        return
    # 安装路径为 <项目根>/.agents/skills/conversation-recording/scripts/record.py。
    project = Path(__file__).resolve().parents[4]
    try:
        scope = verify_scope(project, data)
        if scope is not None:
            handle(scope, data)
    except (KeyError, ValueError, TypeError, OSError, sqlite3.Error) as error:
        # 记录故障保留为提示，业务轮次继续。
        message = redacted(f"会话记录出现缺口 · {data.get('turn_id')} · {data.get('hook_event_name')}：{error}")
        print(json.dumps({"systemMessage": message}, ensure_ascii=False))
