"""核对子代理活动的宿主身份，只读取本会话实际关联的消息。"""

from dataclasses import dataclass
from hashlib import sha256
import json
from pathlib import Path
from time import monotonic, sleep
from uuid import UUID

from .events import as_mapping, collect, redacted, rollout_rows
from .record import (
    apply_title_directory, event_header, find_record, git_root, index_path, open_turn, record_sections, session_lock,
    thread_index, title_basename, transcript_location, verify_scope, with_title_candidate, write_timeline,
)
from .timeline import AgentMessage, event_time, output_text


TITLE_TASK_NAME = "recording_title"


@dataclass(frozen=True)
class Activity:
    """父会话已持久化的派发或补充活动。"""

    call: str
    turn: str
    kind: str
    child: str
    name: str
    at: str
    message: str | None
    naming_path: str | None = None


@dataclass(frozen=True)
class VerifiedReply:
    """从真实子轮读回的一条回复及其可选标题候选。"""

    note: AgentMessage
    text: str
    title_candidate: dict[str, str] | None


def activities(scope):
    """保留父用户轮下已完成的 V1、V2 子代理工具活动。"""
    user_turns, directories, arguments = {}, {}, {}
    title_calls = set()
    active = None
    for _, event in rollout_rows(scope.transcript):
        row = event.get("payload", {})
        if event.get("type") == "turn_context":
            directory = row.get("cwd")
            if isinstance(directory, str) and directory not in directories:
                directories[directory] = in_worktree(scope.project, directory)
            if row.get("turn_id") in user_turns:
                user_turns[row["turn_id"]] = directories.get(directory, False)
        if event.get("type") == "response_item" and row.get("type") == "function_call" and active:
            if row.get("name") in ("spawn_agent", "send_input", "followup_task"):
                key = (active, row.get("call_id"))
                fields = as_mapping(row.get("arguments"))
                arguments[key] = fields.get("message")
                if (row.get("namespace") == "collaboration" and row["name"] == "spawn_agent"
                        and fields.get("task_name") == TITLE_TASK_NAME):
                    title_calls.add(key)
        if event.get("type") != "event_msg":
            continue
        if row.get("type") == "task_started":
            active = row.get("turn_id") if (row.get("turn_attribution") or {}).get("turn_trigger") == "user" else None
            if active:
                user_turns[active] = False
        if row.get("type") != "item_completed" or not user_turns.get(row.get("turn_id")):
            continue
        item = row.get("item") or {}
        naming_path = None
        if item.get("type") == "SubAgentActivity":
            kind = {"started": "派发", "interacted": "补充"}.get(item.get("kind"))
            child = item.get("agent_thread_id")
            name = item.get("agent_path")
            key = (row["turn_id"], item.get("id"))
            message = arguments.get(key)
            if kind == "派发" and isinstance(name, str) and name and key in title_calls:
                naming_path = name
        elif item.get("type") == "CollabAgentToolCall" and item.get("status") == "completed":
            kind = {"spawn_agent": "派发", "send_input": "补充"}.get(item.get("tool"))
            receivers = item.get("receiver_thread_ids") or []
            child = receivers[0] if len(receivers) == 1 else None
            agent = next((entry for entry in item.get("receiver_agents") or [] if entry.get("thread_id") == child), {})
            name = agent.get("agent_nickname")
            message = item.get("prompt")
        else:
            continue
        call, at = item.get("id"), event.get("timestamp")
        if kind and child and call and at:
            yield Activity(call, row["turn_id"], kind, str(UUID(child)), redacted(name or ""), at,
                           message if isinstance(message, str) else None, naming_path)


def tool_message(call, dispatch, original):
    """使用调用身份保留可重复正文的所有实际业务事件。"""
    identity = sha256(f"{call.turn}:{call.call}".encode()).hexdigest()
    return (AgentMessage(call.kind, call.at, call.child, dispatch.name, dispatch.turn, f"tool:{identity}"),
            redacted(original))


def agent_tool_message(scope, data):
    """在父工具回调中取实际派发或补充的原文与关联。"""
    name = data.get("tool_name")
    arguments = data.get("tool_input")
    if not isinstance(name, str) or not name.endswith(("spawn_agent", "send_input", "followup_task")):
        return None
    if not isinstance(arguments, dict) or not isinstance(arguments.get("message"), str):
        return None
    calls = list(activities(scope))
    call = next((call for call in calls if (call.turn, call.call) == (scope.turn, data.get("tool_use_id"))), None)
    if call is None:
        return None
    dispatch = next((entry for entry in calls if entry.child == call.child and entry.kind == "派发"), None)
    if dispatch is None:
        raise ValueError("子代理补充缺少可核实的原派发")
    return tool_message(call, dispatch, arguments["message"])


def in_worktree(project, value):
    """确认宿主提供的有效目录仍位于目标 Git 工作树。"""
    directory = Path(value).resolve()
    return directory.is_relative_to(project) and git_root(directory) == project


def parent_directory_matches(scope):
    """子回调的 cwd 属于子线程，从父轮宿主上下文确认父目录。"""
    directory = None
    for _, event in rollout_rows(scope.transcript, scope.offset):
        row = event.get("payload", {})
        if row.get("type") == "task_started" and row.get("turn_id") != scope.turn:
            return False
        if event.get("type") == "turn_context" and row.get("turn_id") == scope.turn:
            directory = row.get("cwd")
    return bool(directory and in_worktree(scope.project, directory))


def child_turn_offset(child, child_turn):
    """按真实子轮身份取得宿主索引中的唯一字节位置。"""
    with thread_index() as connection:
        matches = connection.execute(
            "SELECT rollout_byte_offset FROM thread_turns WHERE thread_id = ? AND turn_id = ?", (child, child_turn)
        ).fetchall()
    if len(matches) == 1 and isinstance(matches[0][0], int) and matches[0][0] >= 0:
        return matches[0][0]
    raise ValueError("找不到可核实的子线程轮次位置")


def verified_child(scope, child, location_value, *, agent_path=None):
    """只允许访问父会话实际派发的目标子线程文件。"""
    location = transcript_location(location_value, child)
    if location is None:
        return None
    transcript, _ = location
    with transcript.open("rb", buffering=0) as stream:
        header = event_header(stream, 0, "session_meta")
        meta = (header or {}).get("payload", {})
        source = meta.get("source")
        subagent = source.get("subagent") if isinstance(source, dict) else None
        spawn = subagent.get("thread_spawn") if isinstance(subagent, dict) else None
        if (meta.get("id") != child or not isinstance(spawn, dict) or spawn.get("parent_thread_id") != scope.session
                or not meta.get("cwd") or not in_worktree(scope.project, meta["cwd"])):
            return None
        if agent_path is not None and spawn.get("agent_path") != agent_path:
            return None
    return transcript


def title_from_reply(text):
    """从明确的 JSON 回包取得适合保存在元数据中的单行标题。"""
    try:
        result = json.loads(text, object_pairs_hook=lambda fields: dict(fields) if len(fields) == 1 else None)
    except (ValueError, RecursionError):
        return None
    if not isinstance(result, dict) or set(result) != {"title"} or not isinstance(result["title"], str):
        return None
    title = result["title"].strip()
    if title and title.isprintable() and title == redacted(title):
        return title
    return None


def first_child_turn_offset(transcript):
    """用实际日志首轮区分命名派发和后来的同线程补充。"""
    return next((position for position, event in rollout_rows(transcript)
                 if event.get("type") == "event_msg" and event["payload"].get("type") == "task_started"), None)


def indexed_reply(transcript, offset, child_turn, dispatch, calls, reply=None):
    """从已确认的子轮还原实际回复及时间。"""
    with transcript.open("rb", buffering=0) as stream:
        start = event_header(stream, offset, "event_msg", "task_started")
    payload = (start or {}).get("payload", {})
    parent_turn = (payload.get("turn_attribution") or {}).get("parent_turn_id")
    if payload.get("turn_id") != child_turn or not parent_turn:
        return None
    if not any(call.turn == parent_turn for call in calls):
        return None
    finalized, answers = set(), []
    for position, event in rollout_rows(transcript, offset):
        row = event.get("payload", {})
        if position != offset and row.get("type") == "task_started":
            break
        if (event.get("type") == "response_item" and row.get("type") == "message"
                and row.get("role") == "assistant" and row.get("phase") == "final_answer"):
            answers.append((event["timestamp"], output_text(row.get("content", []))))
        elif row.get("turn_id") == child_turn and row.get("type") == "task_complete":
            if isinstance(row.get("last_agent_message"), str):
                finalized.add(row["last_agent_message"])
        elif row.get("turn_id") == child_turn and row.get("type") == "item_completed":
            item = row.get("item") or {}
            if item.get("type") == "AgentMessage" and item.get("phase") == "final_answer":
                finalized.add("".join(part["text"] for part in item.get("content", []) if part.get("type") == "Text"))
    confirmed = {reply} if reply is not None else finalized
    matches = [(at, text) for at, text in answers if text and text in confirmed]
    if len(matches) != 1:
        if reply is not None:
            raise ValueError("无法核对该子轮的实发回复及宿主时间")
        return None
    at, text = matches[0]
    event_time(at)
    child = dispatch.child
    note = AgentMessage("回复", at, child, dispatch.name, dispatch.turn, f"reply:{child}:{child_turn}")
    candidate = None
    if dispatch.naming_path and parent_turn == dispatch.turn and (title := title_from_reply(text)):
        if first_child_turn_offset(transcript) == offset:
            candidate = {"title": title, "parentTurn": dispatch.turn, "dispatchCall": dispatch.call,
                         "childThread": child, "childTurn": child_turn, "repliedAt": at}
    return VerifiedReply(note, redacted(text), candidate)


def save_subagent_updates(scope, path, document, *, tool_messages=(), replies=()):
    """在已有写入锁内一起保存标题候选和对应的子代理消息。"""
    candidates = [reply for reply in replies if reply.title_candidate
                  and (path.name != "record.md" or title_basename(reply.title_candidate["title"]))]
    if candidates:
        first = min(candidates, key=lambda reply: (event_time(reply.note.at), reply.note.identity))
        document = with_title_candidate(scope, path, document, first.title_candidate)
    messages = list(tool_messages)
    messages.extend((reply.note, reply.text) for reply in replies)
    return write_timeline(scope, path, document, messages)


def recover_subagent_messages(scope, path, document, *, current_activity=False):
    """在安全的父回调补齐可证事件，跳过已保存的宿主身份。"""
    if not current_activity and "foundry-agent-message" not in document:
        apply_title_directory(scope, path, document)
        return
    _, messages, _ = record_sections(document)
    recorded = [message.agent for message in messages if message.agent]
    known = {note.identity for note in recorded}
    children = {note.child for note in recorded if note.kind == "派发"}
    calls = {}
    for call in activities(scope):
        calls.setdefault(call.child, []).append(call)
    additions = []
    replies = []
    for child, entries in calls.items():
        dispatch = next((entry for entry in entries if entry.kind == "派发"), None)
        if not dispatch:
            continue
        if dispatch.naming_path:
            children.add(child)
        for entry in entries:
            if entry.turn == scope.turn and entry.message is not None:
                note, value = tool_message(entry, dispatch, entry.message)
                if note.identity not in known:
                    additions.append((note, value))
                children.add(child)

    if index_path("state_5.sqlite").is_file():
        with thread_index("state_5.sqlite") as state, thread_index() as history:
            for child in children & calls.keys():
                entries = calls[child]
                dispatch = next((entry for entry in entries if entry.kind == "派发"), None)
                if dispatch is None:
                    continue
                pending = [(turn, offset) for turn, offset in history.execute(
                    "SELECT turn_id, rollout_byte_offset FROM thread_turns WHERE thread_id = ?", (child,)
                ) if f"reply:{child}:{turn}" not in known and isinstance(offset, int) and offset >= 0]
                if not pending:
                    continue
                location = state.execute("SELECT rollout_path FROM threads WHERE id = ?", (child,)).fetchone()
                if not location or not location[0]:
                    continue
                transcript = verified_child(scope, child, location[0], agent_path=dispatch.naming_path)
                if transcript is None:
                    continue
                replies.extend(message for turn, offset in pending
                               if (message := indexed_reply(transcript, offset, turn, dispatch, entries)) is not None)
    if additions or replies:
        document = save_subagent_updates(scope, path, document, tool_messages=additions, replies=replies)
    apply_title_directory(scope, path, document)


class SubagentStopHook:
    """处理业务子代理完成回复后的项目记录回调。"""

    def record_reply(self, scope, data):
        """在父轮空闲时保存，活跃父轮交由父会话回调补齐。"""
        deadline = None
        while True:
            with session_lock(scope):
                scope = verify_scope(scope.project, data, scope.cwd, allow_idle=True)
                if scope is None or not parent_directory_matches(scope):
                    return
                if not scope.active:
                    # 下一次主代理业务动作仍须通过同一把锁保存用户输入。
                    self._save_idle_reply(scope, data)
                    return
                if not any(label == "回复" for label, _ in open_turn(scope).messages):
                    return
            # Stop 已保存父回复，宿主可能尚未完成索引更新。复查期间释放写入锁。
            if deadline is None:
                deadline = monotonic() + 0.5
            remaining = deadline - monotonic()
            if remaining <= 0:
                return
            sleep(min(0.025, remaining))

    @staticmethod
    def _save_idle_reply(scope, data):
        """核对子回调的实发回复，并写入已存在的父会话记录。"""
        if collect(scope).pending_code_calls:
            return
        child = str(UUID(data["agent_id"]))
        child_turn = str(UUID(data["turn_id"]))
        reply = data.get("last_assistant_message")
        if not isinstance(reply, str) or not reply:
            return
        calls = [call for call in activities(scope) if call.child == child]
        dispatch = next((call for call in calls if call.kind == "派发"), None)
        if dispatch is None:
            return
        transcript = verified_child(scope, child, data["agent_transcript_path"],
                                    agent_path=dispatch.naming_path)
        if transcript is None:
            return
        offset = child_turn_offset(child, child_turn)
        message = indexed_reply(transcript, offset, child_turn, dispatch, calls, reply=reply)
        if message is None:
            return
        path, document = find_record(scope)
        if path.is_file():
            document = save_subagent_updates(scope, path, document, replies=(message,))
            apply_title_directory(scope, path, document)
