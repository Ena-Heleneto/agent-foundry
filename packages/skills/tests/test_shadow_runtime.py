"""运行真实记录入口，防止原文丢失、错误判重或不可信来源混入。"""

import json
import importlib.util
import os
from pathlib import Path
import select
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import patch


# 保留已撤回的记录器候选回归；该脚本不再随 Skill 交付。
SCRIPT = (Path(__file__).resolve().parents[3]
          / "specs/skills/20261029-speckit-workflow-foundation/history"
          / "retired-shadow-runtime-2026-11-18/scripts/shadow_runtime.py")


class ShadowRuntimeTests(unittest.TestCase):
    """临时项目和真实文件I/O保持真实，不模拟被测保存逻辑。"""

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.project = Path(self.temp.name).resolve()
        self.memory = self.project / "docs/user-shadow"
        self.source = self.project / "source.jsonl"
        self.raw = self.memory / "conversations/raw/thread-test.jsonl"
        self.meta = {"type": "session_meta", "payload": {
            "id": "thread-test", "cwd": str(self.project), "cli_version": "0.169.0",
        }}

    def message(self, item_id, text, kind="UserMessage", turn="turn-1", phase=None):
        """生成已观察宿主结构的合成事件，身份与文本是独立输入。"""
        item = {"type": kind, "id": item_id,
                "content": [{"type": "Text", "text": text}]}
        if kind == "UserMessage":
            item["client_id"] = None
            item["content"][0]["text_elements"] = []
        else:
            item["phase"] = phase
        return {"type": "event_msg", "payload": {
            "type": "item_completed", "thread_id": "thread-test", "turn_id": turn,
            "item": item, "started_at_ms": 1000, "completed_at_ms": 2000,
        }}

    def write_source(self, events):
        self.source.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n"
                                       for row in [self.meta, *events]), encoding="utf-8")

    def command(self, *extra):
        return [sys.executable, "-B", str(SCRIPT), "capture",
                "--project-root", str(self.project), "--memory-root", str(self.memory),
                "--thread-id", "thread-test", "--source", str(self.source), *extra]

    def capture(self, *extra):
        return subprocess.run(self.command("--once", *extra), capture_output=True,
                              text=True, timeout=8)

    def records(self):
        return [json.loads(line) for line in self.raw.read_text().splitlines()] if self.raw.exists() else []

    def assert_error(self, result, code):
        self.assertNotEqual(result.returncode, 0)
        try:
            errors = [json.loads(line) for line in result.stdout.splitlines()]
        except ValueError:
            self.fail("记录入口未提供可核验的错误事实")
        self.assertTrue(any(row.get("error") == code for row in errors), result.stdout + result.stderr)

    def test_preserves_visible_text_and_excludes_tool_and_reasoning(self):
        """截断中文换行、混入工具/思维或遗漏最终回复会失败。"""
        self.write_source([
            self.message("user-1", "你好\n**原文**：`$x`"),
            self.message("tool-1", "工具私人明细", "CommandExecution"),
            self.message("thought-1", "不应保存的思维", "Reasoning"),
            self.message("assistant-1", "正在处理。", "AgentMessage", phase="commentary"),
            self.message("assistant-2", "最终回复。", "AgentMessage", phase="final_answer"),
        ])
        result = self.capture()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        rows = self.records()
        self.assertEqual([r["text"] for r in rows], ["你好\n**原文**：`$x`", "正在处理。", "最终回复。"])
        self.assertEqual([r["role"] for r in rows], ["user", "assistant", "assistant"])
        self.assertEqual([r["item_id"] for r in rows], ["user-1", "assistant-1", "assistant-2"])
        self.assertEqual(rows[2]["phase"], "final_answer")
        self.assertNotIn("工具私人明细", self.raw.read_text())
        self.assertNotIn("不应保存的思维", self.raw.read_text())

    def test_replay_and_restart_deduplicate_identity_but_not_same_text(self):
        """按文本判重或仅在内存判重会丢失不同轮次或增加重启副本。"""
        first = self.message("user-1", "好")
        self.write_source([first, first, self.message("user-2", "好", turn="turn-2")])
        for _ in range(2):
            result = self.capture()
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual([r["item_id"] for r in self.records()], ["user-1", "user-2"])

    def test_async_question_metadata_is_not_promoted_to_user_answer(self):
        """已观察的异步题目仍归Agent，重复A分别保留，不猜造点击或题目关联。"""
        question = self.message("call-synthetic-question", "合成题目\n- 测试选项 A\n- 测试选项 B",
                                "AgentMessage", turn="question-turn", phase="final_answer")
        question["payload"]["item"].update(delivery="async", questions=[
            {"title": "合成题目", "options": ["测试选项 A", "测试选项 B"]}])
        first = self.message("first-answer", "A", turn="first-answer-turn")
        second = self.message("second-answer", "A", turn="second-answer-turn")
        for event in (first, second):
            event["payload"]["item"]["content"][0]["type"] = "text"
        self.write_source([question, first,
                           {"type": "event_msg", "payload": {"type": "turn_aborted"}}, second])
        result = self.capture()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        rows = self.records()
        self.assertEqual([r["role"] for r in rows], ["assistant", "user", "user"])
        self.assertEqual([r["text"] for r in rows],
                         ["合成题目\n- 测试选项 A\n- 测试选项 B", "A", "A"])
        self.assertEqual([r["item_id"] for r in rows],
                         ["call-synthetic-question", "first-answer", "second-answer"])
        self.assertNotIn("questions", rows[1])
        self.assertNotIn("delivery", rows[1])

    def test_long_unicode_text_parts_are_saved_without_truncation_or_insertions(self):
        """长中文/emoji/换行分段不得截断，也不得在分段之间插入新字符。"""
        first = "中文🙂\n**段落**\n" * 2000
        second = "末段\n" * 1000
        event = self.message("long-user", first)
        event["payload"]["item"]["content"].append(
            {"type": "text", "text": second, "text_elements": []})
        self.write_source([event])
        result = self.capture()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        rows = self.records()
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["text"], first + second)
        self.assertEqual(rows[0]["text_parts"], [first, second])
        self.assertEqual(rows[0]["role"], "user")

    def test_rejects_changed_payload_for_same_identity(self):
        """同一身份内容变化不能被静默当成重复或覆盖原文。"""
        self.write_source([self.message("user-1", "原文"), self.message("user-1", "被替换")])
        self.assert_error(self.capture(), "identity_conflict")
        self.assertEqual([r["text"] for r in self.records()], ["原文"])

    def test_rejects_wrong_project_and_thread_before_writing(self):
        """来源属于其他项目或线程时不能写入目标画像根。"""
        for field, value in [("id", "other-thread"), ("cwd", str(self.project / "other"))]:
            with self.subTest(field=field):
                original = self.meta["payload"][field]
                self.meta["payload"][field] = value
                self.write_source([self.message("user-1", "不应写入")])
                self.assert_error(self.capture(), "identity_mismatch")
                self.assertFalse(self.raw.exists())
                self.meta["payload"][field] = original

    def test_rejects_unverified_source_version(self):
        """未知结构版本不能靠字段碰巧相似冒认为已支持。"""
        self.meta["payload"]["cli_version"] = "0.999.0"
        self.write_source([self.message("user-1", "测试")])
        self.assert_error(self.capture(), "unsupported_source")
        self.assertFalse(self.raw.exists())

    def test_missing_visible_identity_is_not_silently_skipped(self):
        """漏掉可见消息身份必须标缺口，不能继续声称完整覆盖。"""
        event = self.message("user-1", "测试")
        del event["payload"]["turn_id"]
        self.write_source([event])
        self.assert_error(self.capture(), "source_gap")
        self.assertFalse(self.raw.exists())

    def test_invalid_source_metadata_is_reported_without_traceback(self):
        """来源字段类型错误也必须报告可核验缺口，不能崩溃后假装已接入。"""
        self.meta["payload"]["cwd"] = None
        self.write_source([self.message("user-1", "测试")])
        self.assert_error(self.capture(), "unsupported_source")
        self.assertFalse(self.raw.exists())

    def test_fsync_failure_rolls_back_unconfirmed_append_before_retry(self):
        """磁盘同步失败后不得提前判重，重试必须实际写入并读回。"""
        spec = importlib.util.spec_from_file_location("shadow_runtime_test", SCRIPT)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        store = module.RawStore(self.project, self.memory, "thread-test")
        row = module.visible_record(self.message("user-1", "未确认原文"), "thread-test", 123)
        real_fsync = module.os.fsync
        failed = False

        def fail_raw_once(fd):
            nonlocal failed
            if Path(f"/proc/self/fd/{fd}").resolve() == self.raw and not failed:
                failed = True
                raise OSError("模拟原文同步失败")
            return real_fsync(fd)

        with patch.object(module.os, "fsync", side_effect=fail_raw_once):
            with self.assertRaises(module.CaptureError) as failure:
                store.append(row)
        self.assertEqual(failure.exception.code, "save_failed")
        self.assertEqual(self.records(), [])
        receipt = store.append(row)
        self.assertEqual(receipt["source_ref"], ["thread-test", "turn-1", "user-1"])
        self.assertEqual([r["text"] for r in self.records()], ["未确认原文"])

    def test_failed_save_preserves_external_append_instead_of_truncating(self):
        """外部非合作写入发生后，失败恢复必须保留现场而非连带删除。"""
        spec = importlib.util.spec_from_file_location("shadow_runtime_external_test", SCRIPT)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        store = module.RawStore(self.project, self.memory, "thread-test")
        row = module.visible_record(self.message("user-1", "本次原文"), "thread-test", 123)
        external = module.visible_record(self.message("user-2", "外部追加"), "thread-test", 456)

        real_fsync = module.os.fsync

        def append_then_fail(fd):
            if Path(f"/proc/self/fd/{fd}").resolve() != self.raw:
                return real_fsync(fd)
            with self.raw.open("ab") as target:
                target.write((json.dumps(external, ensure_ascii=False) + "\n").encode())
            raise OSError("同步期间出现外部写入")

        with patch.object(module.os, "fsync", side_effect=append_then_fail):
            with self.assertRaises(module.CaptureError) as failure:
                store.append(row)
        self.assertEqual(failure.exception.code, "save_failed")
        self.assertEqual([r["text"] for r in self.records()], ["本次原文", "外部追加"])

    def test_partial_source_line_is_not_saved_and_can_complete(self):
        """UTF-8半行或未完成JSON不能提前确认，补齐后应原样保存。"""
        self.write_source([])
        encoded = (json.dumps(self.message("user-1", "中文🙂"), ensure_ascii=False) + "\n").encode()
        with self.source.open("ab") as target:
            target.write(encoded[:-3])
        self.assert_error(self.capture(), "source_gap")
        self.assertEqual(self.records(), [])
        with self.source.open("ab") as target:
            target.write(encoded[-3:])
        result = self.capture()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(self.records()[0]["text"], "中文🙂")

    def test_partial_destination_is_preserved_and_rejected(self):
        """未完成目标尾行不能被新追加覆盖或被误认已存。"""
        self.raw.parent.mkdir(parents=True)
        self.raw.write_bytes(b'{"thread_id":')
        self.write_source([self.message("user-1", "测试")])
        self.assert_error(self.capture(), "source_gap")
        self.assertEqual(self.raw.read_bytes(), b'{"thread_id":')

    def test_failed_file_write_is_not_reported_as_saved_and_retry_works(self):
        """真实文件路径冲突失败后，同一消息仍可重新保存。"""
        self.memory.parent.mkdir(parents=True)
        self.memory.write_text("阻止创建目录")
        self.write_source([self.message("user-1", "重试原文")])
        self.assert_error(self.capture(), "save_failed")
        self.memory.unlink()
        result = self.capture()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual([r["text"] for r in self.records()], ["重试原文"])

    def test_existing_coverage_is_not_ignored_before_forget_protocol_exists(self):
        """候选尚不理解遗忘代际时必须拒绝写回，不能忽略已有失效资料。"""
        coverage = self.memory / "conclusions/coverage.md"
        coverage.parent.mkdir(parents=True)
        coverage.write_text("forget_generation: 1\n")
        self.write_source([self.message("user-1", "不能回写")])
        self.assert_error(self.capture(), "unsupported_coverage")
        self.assertFalse(self.raw.exists())

    def test_inspect_reports_saved_identity_without_claiming_analysis(self):
        self.write_source([self.message("user-1", "原文")])
        result = self.capture()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        result = subprocess.run([sys.executable, "-B", str(SCRIPT), "inspect",
                                 "--project-root", str(self.project), "--memory-root", str(self.memory),
                                 "--thread-id", "thread-test"], capture_output=True, text=True, timeout=8)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        row = json.loads(result.stdout)
        self.assertEqual(row["recorded_count"], 1)
        self.assertEqual(row["source_refs"], [["thread-test", "turn-1", "user-1"]])
        self.assertIsNone(row["analyzed_coverage"])

    @unittest.skipUnless(sys.platform == "linux", "事件驱动候选仅支持Linux")
    def test_follow_captures_new_user_and_reply_without_another_prompt(self):
        """只在下一次模型调用才保存、半行损坏或漏掉普通回复都会失败。"""
        self.write_source([])
        process = subprocess.Popen(self.command(), stdout=subprocess.PIPE, stderr=subprocess.PIPE, bufsize=0)

        def cleanup():
            if process.poll() is None:
                process.terminate()
            process.communicate(timeout=3)

        self.addCleanup(cleanup)

        def read_event():
            ready, _, _ = select.select([process.stdout], [], [], 5)
            self.assertTrue(ready, "未收到记录器事件")
            line = process.stdout.readline()
            self.assertTrue(line, "记录入口提前结束")
            return json.loads(line)

        self.assertEqual(read_event()["event"], "capture_ready")
        rows = [self.message("user-1", "新的问题"),
                self.message("reply-1", "新的回复", "AgentMessage", phase="final_answer")]
        for row in rows:
            data = (json.dumps(row, ensure_ascii=False) + "\n").encode()
            with self.source.open("ab") as target:
                target.write(data[:17]); target.flush(); os.fsync(target.fileno())
                target.write(data[17:]); target.flush(); os.fsync(target.fileno())
            saved = read_event()
            self.assertEqual(saved["event"], "saved")
            self.assertGreaterEqual(saved["saved_and_read_back_at_ns"], saved["observed_at_ns"])
        self.assertEqual([r["text"] for r in self.records()], ["新的问题", "新的回复"])


if __name__ == "__main__":
    unittest.main()
