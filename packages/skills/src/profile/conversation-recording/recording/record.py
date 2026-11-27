"""供各 Codex Hook 共用的会话核验和记录写入。"""

from contextlib import closing, contextmanager
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

from .events import redacted
from .timeline import MessageSpan, SEPARATOR as MESSAGE_SEPARATOR, agent_block, decode_agent, order_timeline


TURN_HEADER = re.compile(r"^(?:(> \*\*)|## )(\d{4}-\d{2}-\d{2})(?(1)\*\*) <!-- turn-([\da-f-]{36}) -->\n", re.M)
MESSAGE_HEADER = re.compile(r"^<!-- foundry-message (发起|补充|回复) (\d{1,20}) -->\n", re.M)
AGENT_MESSAGE_HEADER = re.compile(r"^<!-- foundry-agent-message ([A-Za-z0-9_=-]+) (\d{1,20}) -->\n", re.M)
DETAIL_LINK = re.compile(r"^\[查看经过\]\((details/[^)\n]+)\)\n", re.M)
RECORD_SECTION = re.compile("|".join(f"(?:{rule.pattern})" for rule in (
    TURN_HEADER, MESSAGE_HEADER, AGENT_MESSAGE_HEADER, DETAIL_LINK)), re.M)
LEGACY_MESSAGE = re.compile(r"^> - \*\*(发起|补充|回复)\*\* (.*(?:\n>   .*)*)$", re.M)
LEGACY_DETAIL = re.compile(r"^> - \[查看经过\]\((details/[^)\n]+)\)\n", re.M)
MESSAGE_TITLES = {"发起": "用户 · 发起", "补充": "用户 · 补充", "回复": "主代理 · 回复"}
RECORD_HEADER = re.compile(r"^<!-- foundry-recording (.+) -->$", re.M)
DETAIL_EVENT = re.compile(r"^<!-- foundry-(event|pending) ([\da-f]{64}) -->$")
OPENING = re.compile(r"^rollout-(\d{4}-\d{2}-\d{2})T[\d-]+-([\da-f-]{36})\.jsonl$")
TITLE_SUFFIX_LENGTHS = range(8, 33, 4)


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
    active: bool


def transcript_location(path, session):
    """核对宿主日志位置和文件名中的真实会话身份。"""
    state = Path(os.environ.get("CODEX_HOME") or Path.home() / ".codex").resolve()
    transcript = Path(path).resolve()
    opening = OPENING.fullmatch(transcript.name)
    if not opening or opening[2] != session or not transcript.is_relative_to(state / "sessions"):
        return None
    if not transcript.is_file():
        return None
    return transcript, opening[1]


def index_path(name):
    """定位宿主分页索引或会话路径索引。"""
    state = Path(os.environ.get("CODEX_HOME") or Path.home() / ".codex").resolve()
    return Path(os.environ.get("CODEX_SQLITE_HOME") or state).resolve() / name


def thread_index(name="thread_history_1.sqlite"):
    """以只读方式访问宿主自身的索引。"""
    return closing(sqlite3.connect(f"{index_path(name).as_uri()}?mode=ro", uri=True))


def verify_scope(project, data, cwd, *, allow_idle=False):
    """在读取会话正文前核对分页索引及项目范围。"""
    session = str(UUID(data["session_id"]))
    turn = None if allow_idle else str(UUID(data["turn_id"]))
    cwd = cwd.resolve()
    if not cwd.is_relative_to(project) or git_root(cwd) != project:
        return None
    location = transcript_location(data["transcript_path"], session)
    if location is None:
        return None
    transcript, opening = location
    if not index_path("thread_history_1.sqlite").is_file():
        return None
    with thread_index() as connection:
        recent = connection.execute(
            "SELECT turn_id, status, rollout_byte_offset FROM thread_turns WHERE thread_id = ? "
            "ORDER BY rollout_byte_offset DESC LIMIT 2",
            (session,),
        ).fetchall()
    if not recent:
        return None
    # 宿主强制中断后，旧轮次可能继续标为 inProgress。
    indexed_turn, status, offset = recent[0]
    if allow_idle:
        turn = str(UUID(indexed_turn))
    if indexed_turn != turn or status not in (("inProgress", "completed") if allow_idle else ("inProgress",)):
        return None
    if not isinstance(offset, int) or offset < 0:
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
    if isinstance(original.get("source"), dict) and "subagent" in original["source"]:
        return None
    origin = Path(original["cwd"]).resolve()
    if not origin.is_relative_to(project) or git_root(origin) != project:
        return None
    date = datetime.fromisoformat(current["timestamp"].replace("Z", "+00:00")).astimezone().date().isoformat()
    return Scope(project, transcript, session, turn, opening, origin, original["timestamp"], date, offset, cwd,
                 status == "inProgress")


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


def record_prelude(document):
    """取第一轮之前的主记录前言。"""
    first_turn = TURN_HEADER.search(document)
    return document[:first_turn.start()] if first_turn else document


def record_metadata(scope, base, reason):
    """保存选址和可核实的会话来源。"""
    return {"session": scope.session, "project": str(scope.project), "origin": str(scope.origin),
            "root": str(base.relative_to(scope.project)), "reason": reason}


def encoded_metadata(metadata):
    """保留元数据原值并转义可能提前结束注释的字符。"""
    return json.dumps(metadata, ensure_ascii=False).replace(">", r"\u003e")


def with_title_candidate(scope, path, document, candidate):
    """在主记录头部保留首个已核对的候选。"""
    prelude = record_prelude(document)
    header = RECORD_HEADER.search(prelude)
    if header:
        metadata = json.loads(header[1])
    else:
        if f"会话 `{scope.session}`" not in prelude:
            return document
        base = path.parents[3] if path.name == "record.md" else path.parents[2]
        metadata = record_metadata(scope, base, "沿用已有主记录")
    if "titleCandidate" in metadata and (path.name != "record.md" or directory_title(metadata)):
        return document
    metadata["titleCandidate"] = candidate
    encoded = encoded_metadata(metadata)
    if header:
        return document[:header.start(1)] + encoded + document[header.end(1):]
    return f"<!-- foundry-recording {encoded} -->\n\n{document}"


def title_basename(title):
    """清理标题中的路径分隔符，为 Linux 文件名留出后缀空间。"""
    if not isinstance(title, str) or not title.isprintable():
        return None
    normalized = title.replace("/", "-").replace("\\", "-").strip()
    name = normalized.encode("utf-8")[:221].decode("utf-8", errors="ignore").rstrip()
    return name if name.casefold() not in {"", ".", "..", ".git"} else None


def directory_title(metadata):
    """取得候选对应的目录名。"""
    candidate = metadata.get("titleCandidate")
    return title_basename(candidate.get("title")) if isinstance(candidate, dict) else None


def title_directory_names(base, session):
    """从 UUID 的末段得到稳定短后缀，冲突时逐步延长。"""
    identity = UUID(session).hex
    return (f"{base}--{identity[-length:]}" for length in TITLE_SUFFIX_LENGTHS)


def session_identity(value):
    """区分标准会话 ID 与可用于显示的普通目录名。"""
    try:
        return isinstance(value, str) and str(UUID(value)) == value
    except ValueError:
        return False


def read_directory_metadata(path):
    """只读新布局固定的前言，无需打开其他会话的正文。"""
    with path.open("rb") as stream:
        for _ in range(5):
            line = stream.readline().decode("utf-8", errors="replace").rstrip("\r\n")
            if marker := RECORD_HEADER.fullmatch(line):
                try:
                    metadata = json.loads(marker[1])
                except (ValueError, RecursionError):
                    return {}
                return metadata if isinstance(metadata, dict) else {}
    return {}


def git_record_paths(project, *patterns):
    """列出工作树中的记录候选，包含需保留的 Git 忽略位置。"""
    files = git(project, "ls-files", "-z", "--cached", "--others", "--exclude-standard", "--", *patterns)
    ignored = git(project, "ls-files", "-z", "--ignored", "--others", "--exclude-standard", "--", *patterns)
    if files.returncode or ignored.returncode:
        raise OSError("无法核对项目内的记录位置")
    return {project / os.fsdecode(path) for path in (files.stdout + ignored.stdout).split(b"\0") if path}


def known_directory_name(name, metadata):
    """从真实会话身份和候选核对当前目录名。"""
    session = metadata.get("session")
    if not session_identity(session):
        return False
    if name == session:
        return True
    base = directory_title(metadata)
    return bool(base and ((name == base and not session_identity(base)) or name in title_directory_names(base, session)))


def previous_record_paths(project, metadata):
    """取因 Git 忽略而由记录器保留的先前位置。"""
    previous = metadata.get("previousRecords")
    return {project / item for item in previous if isinstance(item, str)} if isinstance(previous, list) else set()


def matches_record_identity(scope, metadata):
    """核对主记录声明的实际会话与工作树。"""
    return (metadata.get("session"), metadata.get("project"), metadata.get("origin")) == (
        scope.session, str(scope.project), str(scope.origin)
    )


def matches_session_directory(scope, path, metadata):
    """检查新布局的存储根、会话身份和目录名。"""
    return (matches_record_identity(scope, metadata)
            and metadata.get("root") == str(path.parents[3].relative_to(scope.project))
            and known_directory_name(path.parent.name, metadata))


def find_record(scope):
    """优先复用经来源核实的记录，绕开新命中的 Git 忽略位置。"""
    day = Path("records") / scope.opening
    legacy = day / f"{scope.session}.md"
    initial = day / scope.session / "record.md"
    roots = list(candidate_roots(scope.project))
    patterns = [f":(glob)**/{legacy.as_posix()}", f":(glob)**/{day.as_posix()}/*/record.md"]
    known = {base / suffix for base, _ in roots for suffix in (legacy, initial)}
    known.update(git_record_paths(scope.project, *patterns))
    existing = []
    superseded = set()
    unverified = []
    for path in sorted(known):
        if not inside_project(scope.project, path) or not path.is_file():
            continue
        if path.name == "record.md":
            saved = read_directory_metadata(path)
            if saved.get("session") != scope.session and path.parent.name != scope.session:
                continue
            if not matches_session_directory(scope, path, saved):
                unverified.append(path)
                continue
            content = path.read_bytes().decode("utf-8")
        else:
            content = path.read_bytes().decode("utf-8")
            prelude = record_prelude(content)
            marker = RECORD_HEADER.search(prelude)
            saved = json.loads(marker[1]) if marker else None
            if not marker and f"会话 `{scope.session}`" not in prelude:
                raise ValueError(f"主记录同名文件归属不明：{path}")
        if saved is not None:
            if not matches_record_identity(scope, saved):
                raise ValueError(f"主记录会话来源不符：{path}")
            superseded.update(previous_record_paths(scope.project, saved))
        existing.append((path, content))
    current = [(path, content) for path, content in existing if path not in superseded]
    eligible = [(path, content) for path, content in current if visible(scope.project, path)]
    if len(eligible) > 1:
        raise ValueError("存在多份可写的同一会话主记录")
    if eligible:
        return eligible[0]
    if unverified and not current:
        raise ValueError(f"主记录目录名称或归属未核实：{unverified[0]}")
    for base, reason in roots:
        path = base / initial
        if not path.exists() and visible(scope.project, path):
            details = record_metadata(scope, base, reason)
            if existing:
                details["previousRecords"] = [str(path.relative_to(scope.project)) for path, _ in existing]
                details["restartTurn"] = scope.turn
            if len(current) == 1 and current[0][0].name == "record.md":
                previous = read_directory_metadata(current[0][0])
                if "titleCandidate" in previous:
                    details["titleCandidate"] = previous["titleCandidate"]
            heading = (f"# 对话记录\n\n<!-- foundry-recording {encoded_metadata(details)} -->\n\n"
                       f"会话 `{scope.session}` · 开启 `{scope.opened_at}` · 目录 `{scope.origin}`\n")
            return path, heading
    raise OSError("找不到 Git 可见的项目内记录位置")


def title_peers(scope, day, base):
    """筛出仍用于续写的同日同名会话，保留被替代的历史位置。"""
    matches = {}
    for directory in day.iterdir():
        if directory.name != base and not directory.name.startswith(f"{base}--"):
            continue
        path = directory / "record.md"
        if not inside_project(scope.project, path) or not path.is_file():
            continue
        saved = read_directory_metadata(path)
        if (saved.get("session") not in (scope.session, directory.name)
                and saved.get("project") == str(scope.project)
                and saved.get("root") == str(path.parents[3].relative_to(scope.project))
                and isinstance(saved.get("origin"), str) and Path(saved["origin"]).is_relative_to(scope.project)
                and directory_title(saved) == base and known_directory_name(directory.name, saved)
                and visible(scope.project, path)):
            matches[directory] = saved
    if not matches:
        return {}
    related = {(saved["session"], saved.get("origin")) for saved in matches.values()}
    superseded = set()
    for path in git_record_paths(scope.project, f":(glob)**/records/{scope.opening}/*/record.md"):
        if not inside_project(scope.project, path) or not path.is_file():
            continue
        saved = read_directory_metadata(path)
        if (saved.get("project") == str(scope.project)
                and saved.get("root") == str(path.parents[3].relative_to(scope.project))
                and known_directory_name(path.parent.name, saved)
                and isinstance(saved.get("origin"), str)
                and (saved["session"], saved.get("origin")) in related):
            superseded.update(previous_record_paths(scope.project, saved))
    return {directory: saved["session"] for directory, saved in matches.items()
            if directory / "record.md" not in superseded}


def occupied_title_paths(project, day):
    """保留工作树已有位置和索引中仍属于其他记录的位置。"""
    relative = day.relative_to(project)
    pathspec = f":(literal){relative}"
    tracked = git(project, "ls-files", "-z", "--cached", "--", pathspec)
    removed = git(project, "diff", "--cached", "--no-renames", "--name-only", "--diff-filter=D", "-z", "--", pathspec)
    if tracked.returncode or removed.returncode:
        raise OSError("无法核对已跟踪的会话目录")
    occupied = set(day.iterdir())
    for name in (tracked.stdout + removed.stdout).split(b"\0"):
        if name and (parts := Path(os.fsdecode(name)).relative_to(relative).parts):
            occupied.add(day / parts[0])
    return occupied


def title_target(day, base, session, occupied):
    """寻找此会话可用的后缀目录，保留已有文件与其他拟用路径。"""
    return next((day / name for name in title_directory_names(base, session) if day / name not in occupied), None)


def can_move_directory(project, source, target):
    """所有已保存文件都能在同一工作树的新位置继续使用时才移动。"""
    if target is None or target.exists() or target.is_symlink():
        return False
    return all(not path.is_symlink() and (path.is_dir() or (
        path.is_file() and visible(project, target / path.relative_to(source))
    )) for path in source.rglob("*"))


def active_session(session):
    """以宿主最近的状态保护可能仍在执行 Git 操作的会话。"""
    with thread_index() as connection:
        status = connection.execute(
            "SELECT status FROM thread_turns WHERE thread_id = ? ORDER BY rollout_byte_offset DESC LIMIT 1", (session,),
        ).fetchone()
    return status == ("inProgress",)


def apply_title_directory(scope, path, document):
    """在安全回调末尾采纳候选，整份会话一起移动并确认新位置。"""
    if path.name != "record.md" or "titleCandidate" not in document:
        return
    marker = RECORD_HEADER.search(record_prelude(document))
    if marker is None:
        return
    metadata = json.loads(marker[1])
    base = directory_title(metadata)
    if not base:
        return
    current = path.parent
    day = current.parent
    plain = day / base
    initial = current.name == scope.session
    peers = title_peers(scope, day, base)
    needs_peer_move = current != plain and plain in peers
    needs_own_move = initial or (current == plain and bool(peers))
    if not needs_own_move and not needs_peer_move and "title" in metadata:
        return
    occupied = occupied_title_paths(scope.project, day)
    moves = []
    if needs_peer_move and not active_session(peers[plain]):
        peer_target = title_target(day, base, peers[plain], occupied)
        if can_move_directory(scope.project, plain, peer_target):
            moves.append((plain, peer_target))
            occupied.add(peer_target)
    target = current
    if needs_own_move:
        needs_suffix = peers or plain in occupied or session_identity(base)
        target = title_target(day, base, scope.session, occupied) if needs_suffix else plain
        if not can_move_directory(scope.project, current, target):
            return
        moves.append((current, target))
    for source, destination in moves:
        if destination.exists() or destination.is_symlink():
            raise OSError(f"会话目录改名位置已被占用：{destination}")
        source.rename(destination)
    if "title" in metadata:
        return
    # 中断若发生在目录移动之后，恢复会按候选找回目录并补齐标题。
    title = metadata["titleCandidate"]["title"]
    metadata["title"] = title
    display = re.sub(r"([\\`*_{}\[\]<>#+|!&~])", r"\\\1", title)
    updated = document[:marker.start(1)] + encoded_metadata(metadata) + document[marker.end(1):]
    _, newline, body = updated.partition("\n")
    atomic_write(target / path.name, f"# {display}{newline}{body}")


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
    details = path.parent / "details"
    if path.name == "record.md":
        attachments = path.parent / "attachments"
        attachment_link = "../attachments"
    else:
        details /= scope.session
        attachments = details / "attachments"
        attachment_link = "attachments"
    target = details / f"{scope.turn}.md"
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
        complete = not event.provisional
        for attachment in event.attachments:
            checksum = sha256(attachment.data).hexdigest()
            name = Path(redacted(attachment.name))
            filename = f"{name.stem}-{checksum}{name.suffix}"
            text = attachment.data.decode("utf-8", errors="surrogateescape")
            if redacted(text) != text:
                pieces.append("\n- 附件缺口：原件包含需省略的内容。\n")
                continue
            original = attachments / filename
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
            pieces.append(f"\n- [附件]({attachment_link}/{quote(filename)}) · SHA-256 `{checksum}`\n")
        status = "event" if complete else "pending"
        blocks[key] = (complete, f"<!-- foundry-{status} {key} -->\n" + "".join(pieces) + "\n")
    atomic_write(target, prelude + "".join(block for _, block in blocks.values()))
    return target.relative_to(path.parent).as_posix()


@dataclass
class TurnRecord:
    """定位主记录中的一轮，写回时保留前后的其他轮次。"""

    path: Path
    before: str
    text: str
    after: str
    messages: list[tuple[str, str]]
    legacy: bool = False
    detail: str | None = None

    def append(self, label, value):
        """用长度保护原话边界，标题和横线仅用于展示。"""
        if self.legacy:
            self.text += quoted(label, value)
        else:
            separator = MESSAGE_SEPARATOR if self.messages else "\n"
            self.text += (f"{separator}<!-- foundry-message {label} {len(value)} -->\n"
                          f"\n### {MESSAGE_TITLES[label]}\n\n{value}\n")
        self.messages.append((label, value))

    def save(self, scope, agent_message=None):
        """将当前轮块写回并读回核对。"""
        footer = f"\n[查看经过]({self.detail})\n" if self.detail else ""
        additions = (agent_message,) if agent_message is not None else ()
        return write_timeline(scope, self.path, self.before + self.text + footer + self.after, additions)


def archived_agent_identities(scope, document):
    """按已确认的旧位置去重子代理事件，保持新位置从续写点开始。"""
    marker = RECORD_HEADER.search(record_prelude(document))
    if not marker:
        return set()
    previous = previous_record_paths(scope.project, json.loads(marker[1]))
    identities = set()
    for path in previous:
        if not inside_project(scope.project, path) or not path.is_file():
            continue
        nested = path.name == "record.md"
        day = path.parents[1] if nested else path.parent
        if (day.name, day.parent.name) != (scope.opening, "records"):
            continue
        if nested and not matches_session_directory(scope, path, read_directory_metadata(path)):
            continue
        if not nested and path.name != f"{scope.session}.md":
            continue
        data = path.read_bytes().decode("utf-8")
        if not nested:
            prelude = record_prelude(data)
            header = RECORD_HEADER.search(prelude)
            if not (matches_record_identity(scope, json.loads(header[1])) if header else f"会话 `{scope.session}`" in prelude):
                continue
        _, messages, _ = record_sections(data)
        identities.update(message.agent.identity for message in messages if message.agent)
    return identities


def write_timeline(scope, path, document, agent_messages=()):
    """在父会话锁内按事件身份合并子代理消息并保存。"""
    if agent_messages and "previousRecords" in document:
        archived = archived_agent_identities(scope, document)
        agent_messages = [(note, value) for note, value in agent_messages if note.identity not in archived]
    if agent_messages:
        turns, messages, _ = record_sections(document)
        if turns and turns[-1][2][1]:
            document = modernize_last_turn(path, document, turns)
            turns, messages, _ = record_sections(document)
        if not messages or messages[-1].start < turns[-1][0]:
            raise ValueError("主记录缺少可续写子代理消息的轮次")
        known = {message.agent.identity for message in messages if message.agent}
        blocks = []
        for note, value in agent_messages:
            if note.identity not in known:
                blocks.append(MESSAGE_SEPARATOR + agent_block(note, value))
                known.add(note.identity)
        end = messages[-1].end
        document = document[:end] + "".join(blocks) + document[end:]
    if "foundry-agent-message" in document:
        turns, messages, _ = record_sections(document)
        document = order_timeline(scope.transcript, document, turns, messages)
    atomic_write(path, document)
    return document


def modernize_last_turn(path, document, turns):
    """仅转换接入子代理的旧轮次，核对旧正文及详情链接。"""
    start, heading_start, heading = turns[-1]
    body = document[heading_start + heading.end():]
    links = LEGACY_DETAIL.findall(body)
    rest = LEGACY_DETAIL.sub("", LEGACY_MESSAGE.sub("", body))
    if len(links) > 1 or any(line.strip() not in ("", ">") for line in rest.splitlines()):
        raise ValueError("旧轮次含无法安全转换的内容")
    prefix = document[:start]
    if len(turns) > 1 and not prefix.endswith(MESSAGE_SEPARATOR):
        prefix += MESSAGE_SEPARATOR
    turn = TurnRecord(path, prefix, f"## {heading[2]} <!-- turn-{heading[3]} -->\n", "", [])
    for label, text in LEGACY_MESSAGE.findall(body):
        turn.append(label, text.replace("\n>   ", "\n"))
    return turn.before + turn.text + (f"\n[查看经过]({links[0]})\n" if links else "")


def record_sections(document):
    """逐段识别机器标记，跳过消息正文内可能出现的伪标记。"""
    turns, messages, links = [], [], []
    position = 0
    while match := RECORD_SECTION.search(document, position):
        position = match.end()
        if heading := TURN_HEADER.fullmatch(match[0]):
            start = match.start()
            if turns and not heading[1] and document.endswith(MESSAGE_SEPARATOR, 0, start):
                start -= len(MESSAGE_SEPARATOR)
            turns.append((start, match.start(), heading))
        elif (header := MESSAGE_HEADER.fullmatch(match[0])) or (header := AGENT_MESSAGE_HEADER.fullmatch(match[0])):
            if not turns or turns[-1][2][1]:
                raise ValueError("消息标记不属于新版记录轮次")
            label, length = header.groups()
            agent = decode_agent(label) if match[0].startswith("<!-- foundry-agent-message ") else None
            start_of_message = document.find("\n\n", position + 1)
            if start_of_message < 0 or document[position:position + 1] != "\n":
                raise ValueError("主记录消息版式不完整")
            body = start_of_message + 2
            stop = body + int(length)
            if document[stop:stop + 1] != "\n":
                raise ValueError("主记录消息长度不符")
            messages.append(MessageSpan(match.start(), stop + 1, label, document[body:stop], agent))
            position = stop + 1
        elif link := DETAIL_LINK.fullmatch(match[0]):
            links.append((match.start() - 1, link[1]))
    return turns, messages, links


def open_turn(scope):
    """找到本轮，保留旧格式及其他轮次的原始字节。"""
    path, current = find_record(scope)
    turns, messages, links = record_sections(current)
    index = next((i for i, (_, _, heading) in enumerate(turns) if heading[3] == scope.turn), None)
    if index is None:
        separator = MESSAGE_SEPARATOR if turns else "\n"
        return TurnRecord(path, current + separator, f"## {scope.date} <!-- turn-{scope.turn} -->\n", "", [])

    _, start, heading = turns[index]
    end = turns[index + 1][0] if index + 1 < len(turns) else len(current)
    text = current[start:end]
    after = current[end:]
    if heading[1]:
        separator = "\n" if text.endswith("\n\n") else ""
        saved = [(label, value.replace("\n>   ", "\n")) for label, value in LEGACY_MESSAGE.findall(text)]
        return TurnRecord(path, current[:start], text.removesuffix(separator), separator + after, saved, legacy=True)

    saved = [(item.label, item.text) for item in messages if start <= item.start < end and item.agent is None]
    footer = next(((position, link) for position, link in links if start <= position < end), None)
    if footer:
        position, detail = footer
        return TurnRecord(path, current[:start], current[start:position], after, saved, detail=detail)
    return TurnRecord(path, current[:start], text, after, saved)


def load_turn(scope, inputs):
    """按宿主确认过的输入补齐缺失消息。"""
    turn = open_turn(scope)
    if not turn.messages:
        if not inputs:
            return None
        turn.append("发起", inputs[0])
    existing = sum(label == "补充" for label, _ in turn.messages)
    for supplemental in inputs[1 + existing:]:
        turn.append("补充", supplemental)
    return turn


def link_details(scope, turn, events):
    """确认详情后补上链接，返回可在主记录保存后报告的写入错误。"""
    if not events:
        return None
    try:
        link = detail_document(scope, turn.path, events)
    except OSError as error:
        return error
    if not turn.legacy:
        turn.detail = link
    elif "\n> - [查看经过](" not in turn.text:
        turn.text += f"> - [查看经过]({link})\n"
    return None


@contextmanager
def session_lock(scope):
    """协调同会话写入及同一项目内跨会话的目录改名。"""
    with scope.transcript.open("rb") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        project = os.open(scope.project, os.O_RDONLY | os.O_DIRECTORY)
        try:
            fcntl.flock(project, fcntl.LOCK_EX)
            yield
        finally:
            os.close(project)


def run_hook(event_name, handle, *, cwd=None):
    """接收指定的 Codex 事件，核验归属并报告记录缺口。"""
    data = json.load(sys.stdin)
    if data.get("hook_event_name") != event_name:
        return
    # 共享模块安装在 <项目根>/.agents/skills/conversation-recording/recording/。
    project = Path(__file__).resolve().parents[4]
    try:
        scope = verify_scope(project, data, Path(data["cwd"]) if cwd is None else cwd,
                             allow_idle=event_name == "SubagentStop")
        if scope is not None:
            handle(scope, data)
    except (KeyError, ValueError, TypeError, OSError, sqlite3.Error) as error:
        # 记录故障保留为提示，业务轮次继续。
        message = redacted(f"会话记录出现缺口 · {data.get('turn_id')} · {data.get('hook_event_name')}：{error}")
        print(json.dumps({"systemMessage": message}, ensure_ascii=False))
