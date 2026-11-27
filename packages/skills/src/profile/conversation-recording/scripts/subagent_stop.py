"""Codex 的 SubagentStop 命令入口，保存业务子代理的实发回复。"""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from recording.record import run_hook
from recording.subagents import SubagentStopHook


if __name__ == "__main__":
    run_hook("SubagentStop", SubagentStopHook().record_reply)
