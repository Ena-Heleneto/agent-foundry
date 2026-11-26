"""从已核实的当前轮次提取可见过程、原件及提交边界。"""

from ast import literal_eval
from base64 import b64decode
from binascii import Error as Base64Error
from dataclasses import dataclass
import json
import mimetypes
import os
from pathlib import Path
import re
import shlex
from urllib.parse import unquote, urlsplit


CALLS = {"function_call", "custom_tool_call", "mcp_tool_call"}
OUTPUTS = {"function_call_output", "custom_tool_call_output", "mcp_tool_call_output"}
SECRET_NAME = re.compile(r"password|passwd|secret|token|credential|(?:^|_)key(?:_|$)|authorization", re.I)
STRUCTURAL_PATHS = {"PWD", "OLDPWD", "HOME", "CODEX_HOME", "CODEX_SQLITE_HOME", "PATH", "TMPDIR", "XDG_RUNTIME_DIR"}
SECRET_VALUE = re.compile(r"(?i)(sk-[a-z0-9_-]{12,}|gh[pousr]_[a-z0-9]{15,}|bearer\s+[^\s,;]+|[a-z][a-z0-9+.-]*://[^\s/:@]+:[^\s/@]+@)")
ASSIGNMENT = re.compile(r"(?m)(\b[A-Z][A-Z0-9_]*(?:_TOKEN|_KEY|_PASSWORD|_SECRET)\s*=\s*)([^\s,;]+)")
SENSITIVE_PATH = re.compile(r'''(?i)(?:^|[/\s'"])(?:\.env(?:\.[\w.-]+)?|\.netrc|auth\.json|credentials(?:\.json)?|id_rsa|id_ed25519)(?=$|[/\s'"])''')
JS_LITERAL = r'''"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`'''
CODE_COMMAND = re.compile(rf'''\btools\.(?:exec_command|shell_command)\s*\(\s*\{{[^{{}}]*?\b(cmd|command)\s*(?::\s*({JS_LITERAL}|\w+)|(?=[,}}]))''')
CODE_ASSIGNMENT = re.compile(rf"\bconst\s+(\w+)\s*=\s*({JS_LITERAL})\s*[;\n]")
CODE_YIELD = re.compile(r"\AScript running with cell ID (\S+)\nWall time [^\n]+ seconds\nOutput:\n")
SHELL_WORD_PART = r'''(?:'[^']*'|"(?:\\.|[^"\\])*"|\\.|[^\s'"\\;&|<>]+)'''
SHELL_WORD_PARTS = re.compile(SHELL_WORD_PART, re.DOTALL)
SHELL_TOKEN = re.compile(
    rf"(?P<space>[ \t\r]+)|(?P<comment>\#[^\n]*)|(?P<breaks>[;&|]+|\n)|"
    rf"(?P<heredoc><<-|<<(?!<))|(?P<redirection>[<>]+)|(?P<word>{SHELL_WORD_PART}+)",
    re.DOTALL,
)


@dataclass(frozen=True)
class Attachment:
    name: str
    data: bytes


@dataclass(frozen=True)
class Event:
    location: str
    label: str
    value: str
    attachments: tuple[Attachment, ...] = ()
    identity: str | None = None
    provisional: bool = False


@dataclass(frozen=True)
class TurnContents:
    """当轮宿主事件与供工具回调补齐结果的调用身份。"""

    events: tuple[Event, ...]
    inputs: tuple[str, ...]
    commit_result: bool
    tool_privacy: dict[str, bool]
    tool_outputs: frozenset[str]
    withheld_calls: frozenset[str]


def redacted(text):
    """保留可记录原文，明确标记宿主账号或密钥值的省略。"""
    values = {value for name, value in os.environ.items() if name not in STRUCTURAL_PATHS
              and value and (len(value) >= 8 or SECRET_NAME.search(name))}
    if values:
        alternatives = "|".join(re.escape(value) for value in sorted(values, key=len, reverse=True))
        text = re.sub(alternatives, "[已省略环境变量值]", text)
    text = SECRET_VALUE.sub("[已省略凭据]", text)
    return ASSIGNMENT.sub(r"\1[已省略环境变量值]", text)


def pretty(value):
    return value if isinstance(value, str) else json.dumps(value, ensure_ascii=False, indent=2)


def as_mapping(value):
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except ValueError:
            return {}
    return value if isinstance(value, dict) else {}


def commands_from(value):
    """取得直接调用或 Code Mode 中可核实的字面命令。"""
    arguments = as_mapping(value)
    direct = arguments.get("cmd") or arguments.get("command")
    if isinstance(direct, str):
        yield direct
    elif isinstance(value, str):
        for match in CODE_COMMAND.finditer(value):
            literal = match[2] or match[1]
            if literal.isidentifier():
                available = dict(CODE_ASSIGNMENT.findall(value[:match.start()]))
                literal = available.get(literal, "")
            if literal.startswith("`"):
                if "${" not in literal:
                    yield literal[1:-1]
                continue
            try:
                decoded = literal_eval(literal)
            except (ValueError, SyntaxError):
                continue
            if isinstance(decoded, str):
                yield decoded


def command_segments(command):
    """只解析命令字面量，不执行记录里的任何命令。"""
    if not isinstance(command, str):
        return
    segment, heredocs = [], []
    position = 0
    heredoc_operator = None
    while position < len(command):
        match = SHELL_TOKEN.match(command, position)
        if match is None:
            return
        position = match.end()
        if boundary := match["breaks"]:
            if segment:
                yield segment
                segment = []
            if boundary == "\n":
                for delimiter, strip_tabs in heredocs:
                    position = heredoc_end(command, position, delimiter, strip_tabs)
                heredocs.clear()
            heredoc_operator = None
        elif operator := match["heredoc"]:
            heredoc_operator = operator
        elif raw := match["word"]:
            # 匹配时保留引号；只有真实续行符会从命令词中移除。
            word = "".join(part[0] for part in SHELL_WORD_PARTS.finditer(raw) if part[0] != "\\\n")
            if word:
                token = shlex.split(word)[0]
                if heredoc_operator:
                    heredocs.append((token, heredoc_operator == "<<-"))
                    heredoc_operator = None
                else:
                    segment.append(token)
        elif redirection := match["redirection"]:
            segment.append(redirection)
    if segment:
        yield segment


def heredoc_end(command, position, delimiter, strip_tabs):
    """跨过 shell 重定向正文，其中的命令示例不会执行。"""
    while position < len(command):
        end = command.find("\n", position)
        if end < 0:
            return len(command)
        line = command[position:end]
        position = end + 1
        terminator = line.lstrip("\t") if strip_tabs else line
        if terminator == delimiter:
            break
    return position


def git_actions(command, depth=0):
    for tokens in command_segments(command):
        yield from git_argv_actions(tokens, depth)


def git_argv_actions(argv, depth=0):
    """保留宿主参数边界，只在 shell 的命令参数内解析脚本。"""
    tokens = list(argv)
    while tokens:
        launcher = Path(tokens[0]).name
        if launcher == "env":
            tokens.pop(0)
            while tokens and tokens[0].startswith("-"):
                flag = tokens.pop(0)
                if flag in ("-u", "--unset", "-C", "--chdir") and tokens:
                    tokens.pop(0)
        elif "=" in tokens[0] or launcher in ("command", "builtin"):
            tokens.pop(0)
        else:
            break
    if not tokens:
        return

    executable = Path(tokens[0]).name
    if executable in ("bash", "sh", "zsh") and depth < 2:
        for flag, script in zip(tokens[1:], tokens[2:]):
            if re.fullmatch(r"-[a-zA-Z]*c[a-zA-Z]*", flag):
                yield from git_actions(script, depth + 1)
                break
    elif executable == "git":
        arguments = iter(tokens[1:])
        for token in arguments:
            if token in ("-c", "-C", "--git-dir", "--work-tree", "--namespace", "--config-env"):
                next(arguments, None)
            elif not token.startswith("-"):
                yield token, tuple(arguments)
                break
    else:
        # 保留普通命令的存在，避免把同一脚本中的修复误判为只读核对。
        yield None, ()


def readonly_git_actions(actions):
    return bool(actions) and all(action in {"status", "log", "diff", "show", "rev-parse"}
                                 or (action == "branch" and "--show-current" in arguments)
                                 for action, arguments in actions)


def is_commit(value):
    return any(action == "commit" for command in commands_from(value) for action, _ in git_actions(command))


def commit_verification(value):
    return readonly_git_actions([action for command in commands_from(value) for action in git_actions(command)])


def is_code_exec(name):
    return name in ("exec", "functions.exec")


def code_wait_cell(name, arguments):
    if name in ("wait", "functions.wait"):
        cell = as_mapping(arguments).get("cell_id")
        if isinstance(cell, str):
            return cell


def running_code_cell(output):
    """从宿主的文本或结构化首段识别仍在运行的 Code Mode 调用。"""
    if isinstance(output, list) and output and isinstance(output[0], dict):
        output = output[0].get("text")
    if isinstance(output, str) and (running := CODE_YIELD.match(output)):
        return running[1]


def private_output(value):
    # 明确读取凭据文件、打印环境或展开环境值时省略回包。
    return bool(SENSITIVE_PATH.search(pretty(value))) or any(SENSITIVE_PATH.search(command)
        or re.search(r"(?:^|[;&|]\s*)(?:env|printenv|set|export)\s*(?:$|[^\n]*)", command)
        or re.search(r"\$\{?\w+", command)
        for command in commands_from(value))


def attachment_value(value, attachments):
    """从宿主媒介项取得字节，避免把编码副本重复写入详情。"""
    if isinstance(value, list):
        return [attachment_value(item, attachments) for item in value]
    if not isinstance(value, dict):
        return value
    kind = value.get("type")
    mime = value.get("mimeType") or value.get("mime_type")
    data = value.get("blob") or (value.get("data") if kind in {"image", "audio", "resource"} else None)
    image_url = value.get("image_url")
    if isinstance(image_url, str) and image_url.startswith("data:"):
        encoding, _, encoded = image_url[5:].partition(",")
        if encoding.endswith(";base64"):
            mime, data = encoding.removesuffix(";base64"), encoded
    if data is None:
        if kind in {"resource_link", "input_image", "input_file"}:
            return {"附件缺口": "宿主仅提供引用，原件未取得"}
        return {key: attachment_value(item, attachments) for key, item in value.items()}
    name = value.get("name") or value.get("filename") or unquote(urlsplit(value.get("uri") or "").path).rsplit("/", 1)[-1]
    name = Path(name or f"attachment{mimetypes.guess_extension(mime or '') or '.bin'}").name
    if SENSITIVE_PATH.search(name):
        return {"附件缺口": "已省略认证或环境文件"}
    try:
        content = b64decode(data, validate=True)
    except (ValueError, TypeError, Base64Error):
        return {"附件缺口": "宿主原件编码无效"}
    attachments.append(Attachment(name, content))
    return {"附件": name}


def captured_output(location, call, output, omit, *, provisional=False):
    identity = f"result:{call}"
    if omit:
        return Event(location, f"工具结果 `{call}`", "[已省略环境变量值或认证内容]", identity=identity)
    attachments = []
    value = output
    if isinstance(output, str) and output.lstrip().startswith(("{", "[")):
        try:
            parsed = json.loads(output)
        except ValueError:
            parsed = None
        if parsed is not None:
            converted = attachment_value(parsed, attachments)
            if converted != parsed:
                value = converted
    elif isinstance(output, (dict, list)):
        value = attachment_value(output, attachments)
    # 只有回调文本时，允许同一工具稍后用宿主完整回包补齐。
    return Event(location, f"工具结果 `{call}`", redacted(pretty(value)), tuple(attachments), identity,
                 provisional=provisional and not attachments)


def visible_message(row, location, events, inputs, during_commit):
    content = row.get("content") or []
    if during_commit:
        return
    if row.get("role") == "assistant" and row.get("phase") == "commentary":
        text = "".join(part["text"] for part in content if part.get("type") == "output_text" and "text" in part)
        if text:
            events.append(Event(location, "进度原话", redacted(text)))
    if row.get("role") == "user":
        kinds = (row.get("internal_chat_message_metadata_passthrough") or {}).get("content_item_kinds") or []
        if len(kinds) != len(content):
            return
        for kind, part in zip(kinds, content):
            if kind == "user.text" and isinstance(part.get("text"), str):
                inputs.append(redacted(part["text"]))
            elif kind.startswith("user.") and part.get("type") in {"input_image", "input_file"}:
                events.append(captured_output(location, "用户附件", part, False))


def completed_item(item, location, events, fallback_inputs, during_commit, code_calls, withheld):
    """使用宿主完成事件核对实际命令及带身份的可见消息。"""
    kind = item.get("type")
    if kind == "UserMessage":
        parts = item.get("content") or []
        fallback_inputs.extend(redacted(part["text"]) for part in parts
                               if part.get("type") == "text" and isinstance(part.get("text"), str))
    elif kind == "CommandExecution":
        argv = item.get("command") or []
        if not isinstance(argv, list) or not all(isinstance(arg, str) for arg in argv):
            return during_commit
        actions = list(git_argv_actions(argv))
        during_commit = any(action == "commit" for action, _ in actions) or (
            during_commit and readonly_git_actions(actions))
        if during_commit:
            # Code Mode 的原始调用与聚合回包也可能包含此次提交。
            withheld.update(code_calls)
        arguments = {"command": shlex.join(argv), "workdir": item.get("cwd")}
        if code_calls and not during_commit:
            identifier = item.get("id") or location
            value = {**arguments, "exitCode": item.get("exit_code"), "status": item.get("status")}
            events.append(Event(location, "宿主命令执行", redacted(pretty(value)), identity=f"command:{identifier}"))
            events.append(captured_output(location, identifier, item.get("aggregated_output", ""), private_output(arguments)))
    elif kind == "FileChange" and code_calls:
        # apply_patch 的宿主完成事件确认这是一次普通文件操作。
        during_commit = False
    elif not during_commit and kind == "Reasoning" and item.get("summary"):
        events.append(Event(location, "已展示推理摘要", redacted(pretty(item["summary"]))))
    elif not during_commit and kind in ("CollabAgentToolCall", "SubAgentActivity"):
        events.append(Event(location, "子代理活动", redacted(pretty(item))))
    return during_commit


def collect(scope):
    """按当前轮的宿主事件重建详情，剔除实际提交及对应结果。"""
    events, inputs, fallback_inputs = [], [], []
    calls, outputs, code_calls, withheld = {}, set(), set(), set()
    code_cells, code_waits = {}, {}
    during_commit = False
    with scope.transcript.open("rb") as stream:
        stream.seek(scope.offset)
        stream.readline()
        while line := stream.readline():
            offset = stream.tell() - len(line)
            if not line.endswith(b"\n"):
                break
            entry = json.loads(line)
            row = entry.get("payload") or {}
            kind = row.get("type")
            location = f"字节 {offset}"
            if entry.get("type") == "event_msg" and kind == "task_started":
                break
            if entry.get("type") == "event_msg" and kind == "item_completed" and row.get("turn_id") == scope.turn:
                during_commit = completed_item(row.get("item") or {}, location, events, fallback_inputs,
                                               during_commit, code_calls, withheld)
            if entry.get("type") != "response_item":
                continue
            call = row.get("call_id")
            if kind in CALLS and call:
                arguments = row.get("arguments", row.get("input"))
                is_code = kind == "custom_tool_call" and is_code_exec(row.get("name"))
                parent = code_cells.get(code_wait_cell(row.get("name"), arguments))
                if is_code:
                    code_calls.add(call)
                elif parent:
                    code_waits[call] = parent
                skipped = is_commit(arguments) or (during_commit and not is_code and commit_verification(arguments))
                if (not is_code and not parent) or skipped:
                    during_commit = skipped
                calls[call] = private_output(arguments)
                if skipped:
                    withheld.add(call)
                else:
                    name = redacted(str(row.get("name") or "工具"))
                    cwd = as_mapping(arguments).get("workdir", str(scope.cwd))
                    events.append(Event(location, f"工具调用 `{name}` · `{call}`",
                                        redacted(f"工作目录：{cwd}\n{pretty(arguments)}"), identity=f"call:{call}"))
            elif kind in OUTPUTS and call in calls:
                output = row.get("output")
                code_call = code_waits.get(call, call)
                if code_call in code_calls:
                    if cell := running_code_cell(output):
                        code_cells[cell] = code_call
                    else:
                        if during_commit:
                            withheld.add(code_call)
                        code_calls.discard(code_call)
                if call not in withheld and code_call not in withheld:
                    outputs.add(call)
                    events.append(captured_output(location, call, output, calls[call]))
            elif kind == "message":
                visible_message(row, location, events, inputs, during_commit)
    # 在确认 Code Mode 回包边界前，调用仍可能执行提交，暂缓保存其原始输入。
    withheld.update(code_calls)
    withheld.update(wait for wait, parent in code_waits.items() if parent in withheld)
    blocked_events = {f"{label}:{call}" for call in withheld for label in ("call", "result")}
    return TurnContents(tuple(event for event in events if event.identity not in blocked_events),
                        tuple(inputs or fallback_inputs), during_commit, calls, frozenset(outputs - withheld),
                        frozenset(withheld))
