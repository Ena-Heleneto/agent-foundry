"""验证主线记录安装、宿主范围判定及项目内首末轮落盘。"""

from base64 import b64encode
from contextlib import closing
import json
import os
from pathlib import Path
import shlex
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from uuid import uuid4


SOURCE = Path(__file__).resolve().parents[1] / "src/profile/conversation-recording"


class ConversationRecordingTest(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="foundry-recording-test-")
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.repo = self.root / "repo"
        self.repo.mkdir()
        subprocess.run(["git", "init", "-q", str(self.repo)], check=True)
        self.hooks = self.repo / ".codex/hooks.json"
        self.hooks.parent.mkdir()
        self.other_hook = {"hooks": [{"type": "command", "command": "other-project-hook"}]}
        self.hooks.write_text(json.dumps({"hooks": {"Stop": [self.other_hook]}}))
        self.state = self.root / "state"
        self.turn, self.session = str(uuid4()), str(uuid4())
        self.transcript = self.state / f"sessions/2026/11/25/rollout-2026-11-25T20-00-00-{self.session}.jsonl"
        self.transcript.parent.mkdir(parents=True)
        self.env = {**os.environ, "CODEX_HOME": str(self.state), "CODEX_SQLITE_HOME": str(self.state)}
        self.record = self.repo / f"records/2026-11-25/{self.session}.md"

    def install(self, check=True):
        return subprocess.run([sys.executable, "-B", str(SOURCE / "scripts/install.py"), "--project", str(self.repo)],
                              text=True, capture_output=True, check=check, env=self.env)

    def seed_turn(self, trigger="user", events=(), origin=None):
        header = {"type": "session_meta", "payload": {"id": self.session, "cwd": str(origin or self.repo),
                  "timestamp": "2026-11-25T12:00:00Z", "originator": "codex-tui", "source": "vscode"}}
        started = {"type": "event_msg", "ordinal": 1, "timestamp": "2026-11-26T12:00:00Z", "payload": {
            "type": "task_started", "turn_id": self.turn, "turn_attribution": {"turn_trigger": trigger}}}
        first = (json.dumps(header) + "\n").encode()
        self.transcript.write_bytes(first + "".join(json.dumps(event) + "\n" for event in [started, *events]).encode())
        with closing(sqlite3.connect(self.state / "thread_history_1.sqlite")) as index, index:
            index.execute("CREATE TABLE IF NOT EXISTS thread_turns (thread_id, turn_id, status, rollout_byte_offset)")
            index.execute("DELETE FROM thread_turns")
            index.execute("INSERT INTO thread_turns VALUES (?, ?, 'inProgress', ?)", (self.session, self.turn, len(first)))

    def callback(self, event, **values):
        groups = json.loads(self.hooks.read_text())["hooks"][event]
        cmd = groups[-1]["hooks"][0]["command"]
        data = {"hook_event_name": event, "session_id": self.session, "turn_id": self.turn,
                "cwd": str(self.repo), "transcript_path": str(self.transcript), **values}
        result = subprocess.run(["bash", "-c", cmd], input=json.dumps(data), cwd=self.repo, env=self.env,
                                text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        return json.loads(result.stdout or "{}")

    def test_installer_preserves_other_hooks_and_is_idempotent(self):
        installed = self.install(check=False)
        self.assertEqual(installed.returncode, 0, installed.stderr)
        initial = self.hooks.read_bytes()
        hooks = json.loads(initial)["hooks"]
        self.assertEqual(hooks["Stop"][0], self.other_hook)
        self.assertEqual(len(hooks["UserPromptSubmit"]), 1)
        self.assertEqual(len(hooks["Stop"]), 2)
        skill = self.repo / ".agents/skills/conversation-recording"
        self.assertTrue((skill / "SKILL.md").is_file())
        for event, script in (("UserPromptSubmit", "user_prompt_submit.py"),
                              ("PostToolUse", "post_tool_use.py"), ("Stop", "stop.py")):
            command = shlex.split(hooks[event][-1]["hooks"][0]["command"])
            self.assertEqual(Path(command[3]), skill / "scripts" / script)
            self.assertTrue(Path(command[3]).is_file())
        self.install()
        self.assertEqual(self.hooks.read_bytes(), initial)

    def test_install_conflict_does_not_overwrite_project_files(self):
        existing = self.repo / ".agents/skills/conversation-recording"
        existing.mkdir(parents=True)
        (existing / "SKILL.md").write_text("用户维护的同名技能\n")
        initial = self.hooks.read_bytes()
        self.assertNotEqual(self.install(check=False).returncode, 0)
        self.assertEqual(self.hooks.read_bytes(), initial)
        self.assertEqual((existing / "SKILL.md").read_text(), "用户维护的同名技能\n")

    def test_prompt_and_final_are_saved_once_in_the_original_date_file(self):
        self.install()
        self.seed_turn()
        prompt, reply = "读一下 README\n\n保留行尾  ", "第一行\n\n第二行  \n"
        self.callback("UserPromptSubmit", prompt=prompt)
        self.assertIn("读一下 README", self.record.read_text())
        self.assertNotIn("**回复**", self.record.read_text())
        for _ in range(2):
            self.callback("Stop", last_assistant_message=reply)
        data = self.record.read_text()
        self.assertEqual(data.count(f"<!-- turn-{self.turn} -->"), 1)
        self.assertEqual(data.count("**回复**"), 1)
        self.assertIn("保留行尾  ", data)
        self.assertIn("第二行  ", data)
        self.assertFalse((self.record.parent / f"details/{self.session}/{self.turn}.md").exists())

    def test_exec_and_foreign_session_do_not_create_records(self):
        self.install()
        for values in ({"trigger": "exec"}, {"origin": self.root / "repo-outside"}):
            self.seed_turn(**values)
            # 正文的无效 JSON 一旦被记录器解析就会产生缺口提示。
            with self.transcript.open("ab") as stream:
                stream.write(b"BODY_MUST_NOT_BE_READ\n")
            self.assertEqual(self.callback("UserPromptSubmit", prompt="不在记录范围"), {})
            self.assertEqual(self.callback("Stop", last_assistant_message="不在记录范围的回复"), {})
            self.assertFalse(self.record.exists())

    def test_resumed_turn_records_with_an_older_in_progress_index_entry(self):
        self.install()
        self.seed_turn()
        first, start = self.transcript.read_bytes().splitlines(keepends=True)
        abandoned_id = str(uuid4())
        abandoned = json.loads(start)
        abandoned["payload"]["turn_id"] = abandoned_id
        old_start = (json.dumps(abandoned) + "\n").encode()
        self.transcript.write_bytes(first + old_start + start)
        with closing(sqlite3.connect(self.state / "thread_history_1.sqlite")) as index, index:
            index.execute("UPDATE thread_turns SET rollout_byte_offset = ? WHERE turn_id = ?",
                          (len(first) + len(old_start), self.turn))
            index.execute("INSERT INTO thread_turns VALUES (?, ?, 'inProgress', ?)",
                          (self.session, abandoned_id, len(first)))

        self.callback("UserPromptSubmit", turn_id=abandoned_id, prompt="滞留轮次的回调")
        self.assertFalse(self.record.exists())
        self.callback("UserPromptSubmit", prompt="刚恢复的新消息")
        self.callback("Stop", last_assistant_message="恢复后的实发回复")
        self.assertTrue(self.record.is_file(), "恢复后的新轮次应落盘")
        recorded = self.record.read_text()
        self.assertIn("刚恢复的新消息", recorded)
        self.assertIn("恢复后的实发回复", recorded)
        self.assertNotIn(abandoned_id, recorded)

        with closing(sqlite3.connect(self.state / "thread_history_1.sqlite")) as index, index:
            index.execute("UPDATE thread_turns SET status = 'completed' WHERE turn_id = ?", (self.turn,))
        self.callback("UserPromptSubmit", turn_id=abandoned_id, prompt="新轮完成后再次收到滞留回调")
        self.assertEqual(self.record.read_text(), recorded)

    def test_tool_detail_creates_distinct_same_name_attachments(self):
        self.install()
        arguments = {"cmd": "cat README.md", "workdir": str(self.repo)}
        events = []
        for i, original in enumerate((b"first attachment", b"second attachment"), 2):
            events.extend([
                self.tool_call(i * 2, str(i), arguments),
                self.tool_output(i * 2 + 1, str(i), [{"type": "image", "name": "report.png",
                  "mimeType": "image/png", "data": b64encode(original).decode()}]),
            ])
        self.seed_turn(events=events)
        self.callback("UserPromptSubmit", prompt="保存两个附件")
        self.callback("Stop", last_assistant_message="完成")
        detail = self.record.parent / f"details/{self.session}/{self.turn}.md"
        self.assertIn("查看经过", self.record.read_text())
        self.assertIn("cat README.md", detail.read_text())
        self.assertEqual({path.read_bytes() for path in (detail.parent / "attachments").iterdir()},
                         {b"first attachment", b"second attachment"})
        self.assertEqual(detail.read_text().count("attachments/"), 2)

    @staticmethod
    def tool_call(ordinal, call, arguments):
        return {"ordinal": ordinal, "type": "response_item", "payload": {"type": "function_call",
                "name": "exec_command", "call_id": call, "arguments": json.dumps(arguments)}}

    @staticmethod
    def tool_output(ordinal, call, output):
        return {"ordinal": ordinal, "type": "response_item", "payload": {"type": "function_call_output",
                "call_id": call, "output": output}}

    def test_commit_and_result_are_omitted_without_losing_repair(self):
        self.install()
        events = [
            self.tool_call(2, "failure", {"cmd": "git -c user.name=Fixture commit -qm first"}),
            self.tool_output(3, "failure", "first commit failed"),
            self.tool_call(4, "repair", {"cmd": "printf repaired > README.md"}),
            self.tool_output(5, "repair", "repair output"),
        ]
        self.seed_turn(events=events)
        self.callback("UserPromptSubmit", prompt="修好后提交")
        self.callback("PostToolUse", tool_name="Bash", tool_use_id="repair",
                      tool_input={"command": "printf repaired > README.md"}, tool_response="repair output")
        detail = self.record.parent / f"details/{self.session}/{self.turn}.md"
        before = self.record.read_bytes(), detail.read_bytes()
        self.seed_turn(events=[*events, self.tool_call(6, "last", {"cmd": "git commit -qm fixed"}),
                      self.tool_output(7, "last", "last commit succeeded")])
        self.callback("PostToolUse", tool_name="Bash", tool_use_id="last",
                      tool_input={"command": "git commit -qm fixed"}, tool_response="last commit succeeded")
        self.callback("Stop", last_assistant_message="提交完成")
        self.assertEqual((self.record.read_bytes(), detail.read_bytes()), before)
        self.assertIn("repair output", detail.read_text())
        self.assertNotIn("commit", detail.read_text())

    def test_git_ignored_previous_location_stays_unchanged(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="首轮原话")
        original = self.record.read_bytes()
        (self.repo / ".gitignore").write_text("/records/\n")
        self.turn = str(uuid4())
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="次轮原话")
        self.callback("Stop", last_assistant_message="次轮回复")
        relocated = self.repo / "conversation-recording" / self.record.relative_to(self.repo)
        self.assertEqual(self.record.read_bytes(), original)
        self.assertIn("previousRecords", relocated.read_text())
        self.assertIn("次轮回复", relocated.read_text())
        self.assertNotIn("首轮原话", relocated.read_text())
        (self.repo / ".gitignore").unlink()
        self.turn = str(uuid4())
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="继续在迁移后的文件")
        self.assertIn("继续在迁移后的文件", relocated.read_text())
        self.assertEqual(self.record.read_bytes(), original)

    def test_code_mode_git_commit_result_is_omitted(self):
        self.install()
        call = {"ordinal": 2, "type": "response_item", "payload": {"type": "custom_tool_call", "name": "exec",
                "call_id": "code-commit", "input": 'const cmd = "git commit -m literal"; text(await tools.exec_command({cmd}));'}}
        self.seed_turn(events=[call, self.tool_output(3, "code-commit", "[main] literal")])
        self.callback("UserPromptSubmit", prompt="提交")
        saved = self.record.read_bytes()
        self.callback("Stop", last_assistant_message="提交完成")
        self.assertEqual(self.record.read_bytes(), saved)

    def test_native_execution_evidence_covers_opaque_code_mode_commit(self):
        self.install()
        code = {"type": "response_item", "payload": {"type": "custom_tool_call", "name": "exec",
                "call_id": "opaque", "input": "text(await tools.exec_command({cmd: buildCommand()}))"}}
        executed = {"type": "event_msg", "payload": {"type": "item_completed", "turn_id": self.turn,
                    "item": {"type": "CommandExecution", "id": "native", "command": ["/bin/bash", "-lc", "env -i git commit -m safe"],
                             "aggregated_output": "已提交", "cwd": self.repo.as_uri(), "exit_code": 0}}}
        self.seed_turn(events=[code, executed, self.tool_output(4, "opaque", "提交结果")])
        self.callback("UserPromptSubmit", prompt="完成提交")
        previous = self.record.read_bytes()
        self.callback("Stop", last_assistant_message="提交完成")
        self.assertEqual(self.record.read_bytes(), previous)

    def test_stop_keeps_detail_already_confirmed_by_tool_hook(self):
        self.install()
        self.seed_turn(events=[self.tool_call(2, "during", {"cmd": "cat README.md"})])
        self.callback("UserPromptSubmit", prompt="读一下")
        self.callback("PostToolUse", tool_name="Bash", tool_use_id="during", tool_input={"command": "cat README.md"},
                      tool_response="CALLBACK_ONLY")
        detail = self.record.parent / f"details/{self.session}/{self.turn}.md"
        self.assertIn("CALLBACK_ONLY", detail.read_text())
        self.callback("Stop", last_assistant_message="已读")
        self.assertIn("CALLBACK_ONLY", detail.read_text())

    def test_unowned_detail_and_same_turn_supplement(self):
        self.install()
        self.seed_turn(events=[self.tool_call(2, "read", {"cmd": "cat README.md"})])
        self.callback("UserPromptSubmit", prompt="读一下")
        self.callback("UserPromptSubmit", prompt="同时检查文件末尾")
        self.assertIn("**补充** 同时检查文件末尾", self.record.read_text())
        detail = self.record.parent / f"details/{self.session}/{self.turn}.md"
        detail.parent.mkdir(parents=True)
        detail.write_text("既有未受管详情\n")
        self.callback("Stop", last_assistant_message="已读")
        self.assertEqual(detail.read_text(), "既有未受管详情\n")
        self.assertIn("已读", self.record.read_text())

    def test_later_callback_recovers_prompt_only_from_actual_host_input(self):
        self.install()
        input_event = {"ordinal": 3, "type": "response_item", "payload": {"type": "message", "role": "user",
                       "content": [{"type": "input_text", "text": "可取得的真实输入"}],
                       "internal_chat_message_metadata_passthrough": {"content_item_kinds": ["user.text"]}}}
        self.seed_turn(events=[input_event])
        exclusions = self.repo / ".gitignore"
        exclusions.write_text("/records/\n/conversation-recording/\n")
        self.assertIn("缺口", self.callback("UserPromptSubmit", prompt="可取得的真实输入")["systemMessage"])
        self.assertFalse(self.record.exists())
        exclusions.unlink()
        self.callback("Stop", last_assistant_message="正常回复")
        self.assertIn("可取得的真实输入", self.record.read_text())
        self.assertIn("正常回复", self.record.read_text())

    def test_environment_values_and_auth_file_contents_are_omitted(self):
        self.install()
        value = "T035_TEST_PRIVATE_VALUE"
        self.env["T035_TEST_TOKEN"] = value
        self.env["T035_SHORT_TOKEN"] = "a1b2c3"
        self.env["DATABASE_URL"] = "https://fixture-user:fixture-pass@example.invalid/database"
        events = [self.tool_call(2, "auth", {"cmd": "cat .codex/auth.json"}),
                  self.tool_output(3, "auth", "T035_FIXTURE_AUTH_FILE_CONTENT")]
        self.seed_turn(events=events)
        self.callback("UserPromptSubmit", prompt=f"环境值 {value} a1b2c3 {self.env['DATABASE_URL']}")
        self.callback("Stop", last_assistant_message=f"答复 {value}")
        self.assertNotIn(value, self.record.read_text())
        self.assertNotIn("a1b2c3", self.record.read_text())
        self.assertNotIn("fixture-pass", self.record.read_text())
        self.assertIn("已省略", self.record.read_text())
        detail = self.record.parent / f"details/{self.session}/{self.turn}.md"
        self.assertNotIn("T035_FIXTURE_AUTH_FILE_CONTENT", detail.read_text())


if __name__ == "__main__":
    unittest.main()
