"""维护同一主记录里的异步消息位置和可回查身份。"""

from base64 import urlsafe_b64decode, urlsafe_b64encode
from bisect import bisect_right
from dataclasses import asdict, dataclass
from datetime import datetime
import json
import re

from .events import redacted, rollout_rows


SEPARATOR = "\n---\n\n"


@dataclass(frozen=True)
class AgentMessage:
    """关联子代理消息的可核实宿主属性。"""

    kind: str
    at: str
    child: str
    name: str
    dispatch_turn: str
    identity: str


@dataclass(frozen=True)
class MessageSpan:
    """原记录的消息字节内容及其在文档内的字符位置。"""

    start: int
    end: int
    label: str
    text: str
    agent: AgentMessage | None = None


def event_time(value):
    """把带时区的宿主时间转换为可比较的时刻。"""
    timestamp = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if timestamp.tzinfo is None:
        raise ValueError("子代理时间线缺少可核实的时区")
    return timestamp


def agent_block(message, value):
    """将稳定身份写入隐藏标记，正文保留原有边界。"""
    token = urlsafe_b64encode(json.dumps(asdict(message), ensure_ascii=False).encode()).decode()
    name = re.sub(r"[\s<>`\[\]*_]+", " ", redacted(message.name)).strip()
    agent = f"{name} `{message.child}`" if name else f"`{message.child}`"
    timestamp = event_time(message.at).astimezone().isoformat(sep=" ", timespec="milliseconds")
    heading = f"子代理 {agent} · {message.kind} · {timestamp}"
    if message.kind != "派发":
        heading += f" · 原派发轮次 `{message.dispatch_turn}`"
    return f"<!-- foundry-agent-message {token} {len(value)} -->\n\n### {heading}\n\n{value}\n"


def decode_agent(token):
    """读回已保存的子代理事件属性。"""
    return AgentMessage(**json.loads(urlsafe_b64decode(token)))


def output_text(parts):
    """拼回宿主记录中发送的最终回复文本。"""
    return "".join(part["text"] for part in parts if part.get("type") == "output_text")


def parent_times(transcript, saved_turns):
    """读取已核实父会话中需要定位的用户与主代理消息。"""
    started, moments, fallback = {}, {}, {}
    turn = None
    for _, event in rollout_rows(transcript):
        row = event.get("payload", {})
        kind = row.get("type")
        if kind == "task_started" and event.get("type") == "event_msg":
            turn = row.get("turn_id")
            if turn not in saved_turns or (row.get("turn_attribution") or {}).get("turn_trigger") != "user":
                turn = None
            if turn:
                started[turn] = event_time(event["timestamp"])
                moments.setdefault(turn, [])
                fallback.setdefault(turn, [])
        elif turn and event.get("timestamp"):
            if kind == "message" and row.get("role") == "assistant" and row.get("phase") == "final_answer":
                moments[turn].append(("回复", redacted(output_text(row.get("content", []))),
                                      event_time(event["timestamp"])))
            elif kind == "message" and row.get("role") == "user":
                tags = (row.get("internal_chat_message_metadata_passthrough") or {}).get("content_item_kinds", [])
                for tag, part in zip(tags, row.get("content", [])):
                    if tag == "user.text":
                        moments[turn].append(("补充", redacted(part["text"]), event_time(event["timestamp"])))
            elif kind == "item_completed" and row.get("turn_id") == turn:
                item = row.get("item") or {}
                if item.get("type") == "UserMessage":
                    fallback[turn].extend(("补充", redacted(part["text"]), event_time(event["timestamp"]))
                                          for part in item.get("content", []) if part.get("type") == "text")
    for turn, inputs in fallback.items():
        if len(inputs) > sum(role == "补充" for role, _, _ in moments[turn]):
            moments[turn] = inputs + [item for item in moments[turn] if item[0] != "补充"]
    return started, moments


def ordered_group(spans, started, known):
    """按可证时间合并新消息，同一时刻沿已记录次序排列。"""
    known = list(known)
    complete_inputs = sum(role == "补充" for role, _, _ in known) == sum(
        span.agent is None and span.label in ("发起", "补充") for span in spans
    )
    positioned = []
    previous = started
    for index, span in enumerate(spans):
        if span.agent:
            timestamp = event_time(span.agent.at)
        else:
            label = "补充" if span.label == "发起" else span.label
            match = next((i for i, (role, text, _) in enumerate(known)
                          if role == label and text == span.text), None)
            candidates = [i for i, (role, _, _) in enumerate(known) if role == label]
            if match is None and ((label == "回复" and len(candidates) == 1)
                                  or (label == "补充" and complete_inputs and candidates)):
                match = candidates[0]
            timestamp = known.pop(match)[2] if match is not None else None
            if span.label == "发起":
                timestamp = started
        if timestamp is not None:
            previous = timestamp
        positioned.append((previous, index, span))
    return [span for _, _, span in sorted(positioned)]


def order_timeline(transcript, document, turns, messages):
    """把子代理消息放进其发生时已经开始的父轮，保留原消息块。"""
    if not any(message.agent for message in messages):
        return document
    headings = [heading for _, _, heading in turns]
    positions = [start for start, _, _ in turns]
    groups = {heading[3]: [] for heading in headings}
    for message in messages:
        heading = headings[bisect_right(positions, message.start) - 1]
        groups[heading[3]].append(message)

    started, known = parent_times(transcript, groups)
    chronology = sorted((at, turn) for turn, at in started.items() if groups[turn])
    if not chronology:
        return document

    times = [at for at, _ in chronology]
    assigned = {turn: [] for turn in groups}
    for turn, spans in groups.items():
        for span in spans:
            destination = turn
            if span.agent and turn in started:
                position = bisect_right(times, event_time(span.agent.at)) - 1
                if position >= 0:
                    destination = chronology[position][1]
            assigned[destination].append(span)

    replacements = []
    for turn, spans in groups.items():
        target = assigned[turn]
        if turn not in started or not spans or not any(span.agent for span in (*spans, *target)):
            continue
        ordered = ordered_group(target, started[turn], known[turn])
        if ordered == spans:
            continue
        if any(document[before.end:after.start] != SEPARATOR for before, after in zip(spans, spans[1:])):
            raise ValueError("主记录含无法安全重排的消息分隔")
        replacement = SEPARATOR.join(document[span.start:span.end] for span in ordered)
        replacements.append((spans[0].start, spans[-1].end, replacement))
    for start, end, replacement in sorted(replacements, reverse=True):
        document = document[:start] + replacement + document[end:]
    return document
