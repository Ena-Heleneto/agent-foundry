"""验收探针自身的回归：防止错误轮次、活动文件或失败状态形成假证明。"""

import importlib.util
import json
from pathlib import Path
from types import SimpleNamespace
import tempfile
import unittest
from unittest.mock import patch


SCRIPT = Path(__file__).with_name("probe_native_final.py")
spec = importlib.util.spec_from_file_location("native_final_probe", SCRIPT)
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)


class NativeFinalProofTests(unittest.TestCase):
    """真实临时文件承载来源和原文；不模拟比较逻辑。"""

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.project = Path(self.temp.name)
        self.source = self.project / "source.jsonl"
        self.raw = self.project / "raw.jsonl"
        prefix = [{"type": "session_meta", "payload": {
            "id": "synthetic-thread", "cwd": str(self.project), "cli_version": "0.169.0"}},
                  {"type": "event_msg", "payload": {"type": "task_started", "turn_id": "target-turn"}}]
        self.source.write_bytes(b"".join(self.encode(row) for row in prefix))
        self.offset = self.source.stat().st_size

    def encode(self, row):
        """手工给定的源字段与预期不依赖被测解码函数。"""
        return (json.dumps(row, ensure_ascii=False) + "\n").encode()

    def append_message(self, turn="target-turn", role="assistant", save=True):
        """模拟已确认事件和可独立到达的尚未保存用户事件。"""
        offset = self.source.stat().st_size
        item_id = "final-item" if role == "assistant" else "next-user"
        phase = "final_answer" if role == "assistant" else None
        text = "普通最终回复" if role == "assistant" else "下一轮新输入"
        event = {"type": "event_msg", "payload": {
            "type": "item_completed", "thread_id": "synthetic-thread", "turn_id": turn,
            "completed_at_ms": 2000, "item": {
                "id": item_id, "type": "AgentMessage" if role == "assistant" else "UserMessage",
                "phase": phase, "content": [{"type": "Text", "text": text}]}}}
        with self.source.open("ab") as target:
            target.write(self.encode(event))
        row = {"thread_id": "synthetic-thread", "turn_id": turn, "item_id": item_id,
               "role": role, "phase": phase, "text": text, "text_parts": [text],
               "source_completed_at": 2000, "source_offset": offset}
        if save:
            with self.raw.open("ab") as target:
                target.write(self.encode(row))
        return row

    def test_next_turn_final_cannot_prove_target_turn(self):
        """相同线程里后来一轮的final不能替代待验轮次。"""
        self.append_message(turn="later-turn")
        with self.assertRaises(AssertionError):
            probe.check_saved(self.source, self.raw, "synthetic-thread", self.offset)

    def test_user_already_in_source_but_not_raw_invalidates_no_next_input(self):
        """不能只查raw而漏掉宿主已经收到的下一轮用户输入。"""
        self.append_message()
        self.append_message(turn="later-turn", role="user", save=False)
        with self.assertRaises(AssertionError):
            probe.check_saved(self.source, self.raw, "synthetic-thread", self.offset)

    def test_later_partial_raw_does_not_change_confirmed_final(self):
        """目标final之后的半行不能破坏已确认前缀的独立比对。"""
        row = self.append_message()
        with self.raw.open("ab") as target:
            target.write(b'{"thread_id":')
        try:
            saved = probe.check_saved(self.source, self.raw, "synthetic-thread", self.offset)
        except ValueError:
            self.fail("已确认final被之后的未完成尾行破坏")
        self.assertEqual(saved, [row])

    def args(self, case):
        """失败注入只替代不可稳定制造的子进程创建故障。"""
        script = self.project / "skill/scripts/shadow_runtime.py"
        script.parent.mkdir(parents=True, exist_ok=True)
        script.write_text("# 合成入口，仅用于创建失败前的摘要读取\n")
        return SimpleNamespace(project=self.project, case=case, thread="synthetic-thread",
                               skill=script.parents[1], result=self.project / "result.json",
                               scope="primary", observation_seconds=1)

    def test_unignored_case_rejected_before_directory_creation(self):
        """误指向可提交目录时连空目录也不应创建。"""
        case = self.project / "versioned-private-data"
        with patch.object(Path, "rglob", return_value=iter([])):
            with self.assertRaises(AssertionError):
                probe.run(self.args(case))
        self.assertFalse(case.exists())

    def test_process_creation_failure_does_not_leave_waiting_status(self):
        """创建记录器失败属于已知失败，不能留下永久等待。"""
        args = self.args(self.project / ".cache/case")
        with patch.object(Path, "rglob", return_value=iter([self.source])):
            with patch.object(probe.subprocess, "Popen", side_effect=OSError("合成创建失败")):
                with self.assertRaises(OSError):
                    probe.run(args)
        self.assertEqual(json.loads(args.result.read_text())["status"], "probe_failed")


if __name__ == "__main__":
    unittest.main()
