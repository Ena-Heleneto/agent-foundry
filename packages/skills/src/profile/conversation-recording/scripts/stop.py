"""Codex 的 Stop 命令入口，保存并读回正常发出的最终回复。"""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from recording.events import collect, redacted
from recording.record import link_details, load_turn, run_hook, session_lock


def record_reply(scope, data):
    """从 Stop 回调保存实发回复，收尾时补齐宿主可提供的详情。"""
    reply = data.get("last_assistant_message")
    with session_lock(scope):
        contents = collect(scope)
        if contents.commit_result:
            return
        turn = load_turn(scope, contents.inputs)
        if turn is None:
            return

        failure = link_details(scope, turn, contents.events)
        if isinstance(reply, str) and reply and not any(label == "回复" for label, _ in turn.messages):
            turn.append("回复", redacted(reply))
        turn.save()
        if failure is not None:
            raise failure


if __name__ == "__main__":
    run_hook("Stop", record_reply)
