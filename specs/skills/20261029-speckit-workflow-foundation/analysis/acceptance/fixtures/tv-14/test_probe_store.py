"""锁验收必须取得内核等待事实并覆盖不同新事件，不能仅靠静默窗口。"""

import importlib.util
from pathlib import Path
import tempfile
import unittest


SCRIPT = Path(__file__).with_name("probe_store.py").resolve()
spec = importlib.util.spec_from_file_location("store_probe", SCRIPT)
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)
SKILL = SCRIPT.parents[7] / "packages/skills/src/profile/shadow-profile"


class StoreProofTests(unittest.TestCase):
    """执行真实writer及真实跨进程文件锁。"""

    def test_kernel_waiter_and_distinct_new_events_are_proven(self):
        with tempfile.TemporaryDirectory() as directory:
            project = Path(directory)
            result = probe.run(project, project / ".cache/case", SKILL)
        self.assertTrue(result.get("kernel_waiter_matches_lock"), "尚未确认writer在等待同一把锁")
        self.assertEqual(result.get("concurrent_distinct_new_events"), 2,
                         "已有事件重放不能抵扣不同新事件竞争追加")


if __name__ == "__main__":
    unittest.main()
