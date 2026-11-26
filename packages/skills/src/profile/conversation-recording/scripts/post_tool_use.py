"""Codex 的 PostToolUse 命令入口，在工具完成后补记当轮详情。"""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from recording.events import (
    Event, captured_output, collect, commit_verification, is_commit, pretty, private_output, redacted,
)
from recording.record import link_details, load_turn, run_hook, session_lock


def record_tool(scope, data):
    """跳过提交步骤，从宿主和本次回调保存可取得的工具详情。"""
    arguments = data.get("tool_input")
    if is_commit(arguments):
        return

    with session_lock(scope):
        contents = collect(scope)
        call = data.get("tool_use_id")
        if contents.commit_result and (not call or commit_verification(arguments)):
            return
        turn = load_turn(scope, contents.inputs)
        if turn is None:
            return

        events = list(contents.events)
        if call:
            # 回调可能早于宿主落盘。仅补齐尚未从宿主读到的调用和结果。
            location = f"工具事件 {call}"
            if call not in contents.tool_privacy:
                name = redacted(str(data.get("tool_name") or "工具"))
                value = redacted(f"工作目录：{data.get('cwd')}\n{pretty(arguments)}")
                events.append(Event(location, f"工具调用 `{name}` · `{call}`", value, identity=f"call:{call}"))
            if call not in contents.tool_outputs:
                omit = contents.tool_privacy.get(call)
                if omit is None:
                    omit = private_output(arguments)
                events.append(captured_output(location, call, data.get("tool_response"), omit, provisional=True))

        failure = link_details(scope, turn, events)
        turn.save()
        if failure is not None:
            raise failure


if __name__ == "__main__":
    # 回调的 cwd 属于工具调用，进程工作目录属于当前交互会话。
    run_hook("PostToolUse", record_tool, cwd=Path.cwd())
