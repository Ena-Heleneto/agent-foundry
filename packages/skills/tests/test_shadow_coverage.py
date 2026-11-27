"""覆盖事实必须来自真实读回；恢复不能跳过失败或重复保存原文。"""

import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import unittest
from unittest.mock import patch

import test_shadow_runtime as fixtures

SCRIPT = fixtures.SCRIPT


class ShadowCoverageTests(unittest.TestCase):
    """复用宿主事件构造器，通过命令和文件核对跨重启事实。"""

    setUp = fixtures.ShadowRuntimeTests.setUp
    message = fixtures.ShadowRuntimeTests.message
    write_source = fixtures.ShadowRuntimeTests.write_source
    command = fixtures.ShadowRuntimeTests.command
    capture = fixtures.ShadowRuntimeTests.capture
    records = fixtures.ShadowRuntimeTests.records
    assert_error = fixtures.ShadowRuntimeTests.assert_error

    def module(self):
        """独立加载被测模块，只注入文件系统的失败边界。"""
        spec = importlib.util.spec_from_file_location("shadow_coverage_test", SCRIPT)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module

    def inspect(self):
        """新进程读取持久事实，避免内存收据冒充恢复能力。"""
        result = subprocess.run([sys.executable, "-B", str(SCRIPT), "inspect",
                                 "--project-root", str(self.project), "--memory-root", str(self.memory),
                                 "--thread-id", "thread-test"], capture_output=True, text=True, timeout=8)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        return json.loads(result.stdout)

    def test_persists_received_saved_times_and_no_analysis_claim(self):
        """进程退出后仍能查询真实接收、保存时点和未实现的后序覆盖。"""
        self.write_source([self.message("one", "原字\n🙂")])
        result = self.capture()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        receipt = next(json.loads(line) for line in result.stdout.splitlines()
                       if json.loads(line)["event"] == "saved")
        receipt.pop("event")
        facts = self.inspect()
        self.assertEqual(facts["received_count"], 1)
        self.assertEqual(facts["raw_count"], 1)
        self.assertEqual(facts["recorded_count"], 1)
        self.assertEqual(facts["recorded_coverage"], [receipt])
        self.assertEqual(facts["unconfirmed_source_refs"], [])
        self.assertEqual(facts["gaps"], [])
        self.assertIsNone(facts["analyzed_coverage"])
        self.assertIsNone(facts["profile_coverage"])
        self.assertNotIn("原字", (self.memory / "conclusions/coverage.md").read_text())

    def test_raw_success_coverage_failure_recovers_without_fake_old_time(self):
        """原文已存而收据失败时，恢复读回用新时点且不能再追加一份。"""
        module = self.module()
        store = module.RawStore(self.project, self.memory, "thread-test")
        row = module.visible_record(self.message("one", "保留已存"), "thread-test", 123)
        real_write = store.write_coverage

        def fail_receipt(coverage):
            if coverage["threads"]["thread-test"]["recorded"]:
                raise OSError("模拟原文成功后的coverage失败")
            return real_write(coverage)

        with patch.object(store, "write_coverage", side_effect=fail_receipt):
            with self.assertRaises(module.CaptureError):
                store.append(row)
        self.assertEqual(len(self.records()), 1)
        facts = self.inspect()
        self.assertEqual(facts["received_count"], 1)
        self.assertEqual(facts["raw_count"], 1)
        self.assertEqual(facts["recorded_count"], 0)
        self.assertEqual(facts["recorded_coverage"], [])
        self.assertEqual(facts["unconfirmed_source_refs"], [["thread-test", "turn-1", "one"]])
        receipt = store.append(row)
        self.assertEqual(receipt["verification"], "recovery_readback")
        self.assertGreaterEqual(receipt["saved_and_read_back_at_ns"], row["observed_at_ns"])
        self.assertEqual(len(self.records()), 1)
        self.assertEqual(self.inspect()["unconfirmed_source_refs"], [])

    def test_resume_reads_from_verified_checkpoint_and_deduplicates(self):
        """同来源恢复保存新增事件，已存同文本不同身份不合并。"""
        self.write_source([self.message("one", "好")])
        self.assertEqual(self.capture().returncode, 0)
        with self.source.open("a") as target:
            target.write(json.dumps(self.message("two", "好", turn="turn-2")) + "\n")
        result = self.capture("--resume")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual([row["item_id"] for row in self.records()], ["one", "two"])
        self.assertEqual(len(self.inspect()["recorded_coverage"]), 2)
        self.assertEqual(self.capture("--resume").returncode, 0)
        self.assertEqual(len(self.records()), 2)

    def test_resume_rejects_same_size_prefix_edit_and_rotated_source(self):
        """仅检查文件大小或行边界会漏掉同inode前缀改写。"""
        self.write_source([self.message("one", "AAAA")])
        self.assertEqual(self.capture().returncode, 0)
        original = self.source.read_bytes()
        self.source.write_bytes(original.replace(b"AAAA", b"BBBB"))
        self.assert_error(self.capture("--resume"), "source_gap")
        self.assertEqual(self.records()[0]["text"], "AAAA")
        self.source.unlink()
        self.source.write_bytes(original)
        self.assert_error(self.capture("--resume"), "source_gap")
        self.assertTrue(self.inspect()["gaps"])

    def test_partial_source_gap_is_visible_and_resolves_after_exact_replay(self):
        """半行缺口不得冒认已接收或已存；补齐后保持原缺口处理事实。"""
        self.write_source([self.message("one", "已有")])
        data = (json.dumps(self.message("two", "补齐🙂"), ensure_ascii=False) + "\n").encode()
        with self.source.open("ab") as target:
            target.write(data[:-3])
        self.assert_error(self.capture(), "source_gap")
        facts = self.inspect()
        self.assertEqual(facts["received_count"], 1)
        self.assertTrue(any(gap.get("resolved_at_ns") is None for gap in facts["gaps"]))
        with self.source.open("ab") as target:
            target.write(data[-3:])
        self.assertEqual(self.capture("--resume").returncode, 0)
        self.assertEqual(len(self.records()), 2)
        self.assertTrue(all(gap.get("resolved_at_ns") is not None for gap in self.inspect()["gaps"]))

    def test_inspect_rejects_modified_raw_instead_of_reusing_stale_receipt(self):
        """收据只能证明当时读回的字节，正文被外部改写应报冲突。"""
        self.write_source([self.message("one", "AAAA")])
        self.assertEqual(self.capture().returncode, 0)
        self.raw.write_bytes(self.raw.read_bytes().replace(b"AAAA", b"BBBB"))
        module = self.module()
        with self.assertRaises(module.CaptureError) as failure:
            module.RawStore(self.project, self.memory, "thread-test").inspect()
        self.assertEqual(failure.exception.code, "identity_conflict")

    def test_existing_checkpoint_cannot_be_bypassed_by_new_default_attach(self):
        """重新从EOF接入会跳过停机窗口，必须显式恢复已核验检查点。"""
        self.write_source([self.message("one", "已有")])
        self.assertEqual(self.capture().returncode, 0)
        with self.source.open("a") as target:
            target.write(json.dumps(self.message("two", "停机窗口")) + "\n")
        result = subprocess.run(self.command(), capture_output=True, text=True, timeout=8)
        self.assert_error(result, "source_gap")
        self.assertEqual(len(self.records()), 1)
        self.assertEqual(self.capture("--resume").returncode, 0)
        self.assertEqual(len(self.records()), 2)

    def test_once_cannot_skip_unprocessed_window_with_explicit_eof(self):
        """诊断入口也不能把尚未处理的窗口标为已消费。"""
        self.write_source([self.message("one", "已有")])
        self.assertEqual(self.capture().returncode, 0)
        with self.source.open("a") as target:
            target.write(json.dumps(self.message("two", "不得跳过")) + "\n")
        self.assert_error(self.capture("--start-offset", str(self.source.stat().st_size)), "source_gap")
        self.assertEqual(self.capture("--resume").returncode, 0)
        self.assertEqual([row["item_id"] for row in self.records()], ["one", "two"])

    def test_running_source_prefix_rewrite_does_not_replace_checkpoint(self):
        """同inode同大小篡改必须在下一次读取前拒绝，不能洗成新检查点。"""
        module = self.module()
        store = module.RawStore(self.project, self.memory, "thread-test")
        self.write_source([self.message("one", "AAAA")])
        source = module.Source(self.source, self.project, "thread-test", 0)
        self.addCleanup(source.file.close)
        store.checkpoint(source)
        with patch.object(module, "emit"):
            source.drain(store)
        before = store.source_facts()
        self.source.write_bytes(self.source.read_bytes().replace(b"AAAA", b"BBBB"))
        with self.source.open("a") as target:
            target.write(json.dumps(self.message("two", "后续")) + "\n")
        with self.assertRaises(module.CaptureError) as failure:
            source.drain(store)
        self.assertEqual(failure.exception.code, "source_gap")
        self.assertEqual(store.source_facts(), before)
        self.assertEqual([row["item_id"] for row in self.records()], ["one"])

    def test_known_coverage_rejects_forget_generation_and_unknown_fields(self):
        """同版本也不能抹掉未解释的失效或分析事实。"""
        self.write_source([self.message("one", "保留")])
        self.assertEqual(self.capture().returncode, 0)
        module = self.module()
        store = module.RawStore(self.project, self.memory, "thread-test")
        original = store.read_coverage()
        path = self.memory / "conclusions/coverage.md"
        raw = self.raw.read_bytes()
        for change in ({"forget_generation": 1}, {"analysis_attempt": []}):
            with self.subTest(change=change):
                coverage = {**original, **change}
                encoded = "# 对话记录覆盖\n\n```json\n" + json.dumps(coverage, ensure_ascii=False, indent=2) + "\n```\n"
                path.write_text(encoded)
                self.assert_error(self.capture(), "unsupported_coverage")
                self.assertEqual(path.read_text(), encoded)
                self.assertEqual(self.raw.read_bytes(), raw)


if __name__ == "__main__":
    unittest.main()
