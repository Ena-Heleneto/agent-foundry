"""Codex 的 UserPromptSubmit 命令入口，负责保存并读回用户消息。"""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from recording.events import collect, redacted
from recording.record import open_turn, run_hook, session_lock


def record_prompt(scope, data):
    """在业务开始前保存并读回用户发起的消息或同轮补充。"""
    prompt = data.get("prompt")
    if not isinstance(prompt, str):
        return
    prompt = redacted(prompt)

    with session_lock(scope):
        turn = open_turn(scope)
        if not turn.messages:
            turn.append("发起", prompt)
            turn.save()
            return

        count = sum(label in {"发起", "补充"} for label, _ in turn.messages)
        repeated = turn.messages[-1] in (("发起", prompt), ("补充", prompt))
        # 用宿主输入条数区分重复回调和真实的同文补充。
        if not repeated or len(collect(scope).inputs) >= count:
            turn.append("补充", prompt)
            turn.save()


if __name__ == "__main__":
    run_hook("UserPromptSubmit", record_prompt)
