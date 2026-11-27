"""验证主线记录安装、宿主范围判定及项目内首末轮落盘。"""

from base64 import b64encode
from contextlib import closing
import json
import os
from pathlib import Path
import re
import shlex
from shutil import copytree
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from urllib.parse import unquote
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
        self.record = self.repo / f"records/2026-11-25/{self.session}/record.md"

    def install(self, check=True):
        return subprocess.run([sys.executable, "-B", str(SOURCE / "install.py"), "--project", str(self.repo)],
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
            index.execute("DELETE FROM thread_turns WHERE thread_id = ?", (self.session,))
            index.execute("INSERT INTO thread_turns VALUES (?, ?, 'inProgress', ?)", (self.session, self.turn, len(first)))

    def callback(self, event, **values):
        hooks = json.loads(self.hooks.read_text())["hooks"]
        self.assertIn(event, hooks, f"安装应登记 {event}")
        groups = hooks[event]
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
        self.assertEqual({file.name for file in (skill / "scripts").iterdir()},
                         {"user_prompt_submit.py", "post_tool_use.py", "stop.py", "subagent_stop.py"})
        for event, script in (("UserPromptSubmit", "user_prompt_submit.py"),
                              ("PostToolUse", "post_tool_use.py"), ("Stop", "stop.py"),
                              ("SubagentStop", "subagent_stop.py")):
            command = shlex.split(hooks[event][-1]["hooks"][0]["command"])
            self.assertEqual(Path(command[3]), skill / "scripts" / script)
            self.assertTrue(Path(command[3]).is_file())
        self.install()
        self.assertEqual(self.hooks.read_bytes(), initial)

    def append_host_events(self, transcript, *events):
        with transcript.open("a", encoding="utf-8") as output:
            for event in events:
                output.write(json.dumps(event, ensure_ascii=False) + "\n")

    def parent_status(self, status):
        with closing(sqlite3.connect(self.state / "thread_history_1.sqlite")) as index, index:
            index.execute("UPDATE thread_turns SET status = ? WHERE thread_id = ? AND turn_id = ?",
                          (status, self.session, self.turn))

    def next_parent_turn(self, timestamp):
        self.parent_status("completed")
        self.turn = str(uuid4())
        offset = self.transcript.stat().st_size
        self.append_host_events(self.transcript, {
            "type": "event_msg", "timestamp": timestamp, "payload": {
                "type": "task_started", "turn_id": self.turn, "turn_attribution": {"turn_trigger": "user"}}},
            {"type": "turn_context", "payload": {"turn_id": self.turn, "cwd": str(self.repo)}})
        with closing(sqlite3.connect(self.state / "thread_history_1.sqlite")) as index, index:
            index.execute("INSERT INTO thread_turns VALUES (?, ?, 'inProgress', ?)",
                          (self.session, self.turn, offset))

    @staticmethod
    def final_answer(timestamp, text):
        return {"type": "response_item", "timestamp": timestamp, "payload": {
            "type": "message", "role": "assistant", "phase": "final_answer",
            "content": [{"type": "output_text", "text": text}]}}

    def launch_child(self, call, child, prompt, timestamp, *, v2=True, followup=False, directory=None, task_name=None):
        kind = "interacted" if followup else "started"
        name = ("collaborationfollowup_task" if followup else "collaborationspawn_agent") if v2 else "spawn_agent"
        arguments = {"message": prompt}
        native = []
        if v2 and task_name:
            arguments["task_name"] = task_name
            native.append({"type": "response_item", "timestamp": timestamp, "payload": {
                "type": "function_call", "namespace": "collaboration", "name": "followup_task" if followup else "spawn_agent",
                "call_id": call, "arguments": json.dumps(arguments)}})
        activity = (
            {"type": "SubAgentActivity", "id": call, "kind": kind, "agent_thread_id": child,
             "agent_path": f"/root/{task_name or '核对'}"}
            if v2 else
            {"type": "CollabAgentToolCall", "id": call, "tool": name, "status": "completed",
             "receiver_thread_ids": [child], "receiver_agents": [{"thread_id": child, "agent_nickname": "核对"}],
             "prompt": prompt}
        )
        self.append_host_events(self.transcript, {
            "type": "turn_context", "payload": {"turn_id": self.turn, "cwd": str(directory or self.repo)}}, *native, {
            "type": "event_msg", "timestamp": timestamp,
            "payload": {"type": "item_completed", "turn_id": self.turn, "item": activity}})
        if directory is None:
            self.callback("PostToolUse", tool_name=name, tool_use_id=call, tool_input=arguments)

    def child_reply(self, child, parent_turn, reply, timestamp, *, parent=None, agent_path="/root/核对"):
        target = self.transcript.with_name(f"rollout-2026-11-25T20-01-00-{child}.jsonl")
        if not target.exists():
            self.append_host_events(target, {"type": "session_meta", "payload": {
                "id": child, "cwd": str(self.repo), "originator": "codex-tui",
                "source": {"subagent": {"thread_spawn": {
                    "parent_thread_id": parent or self.session, "agent_path": agent_path}}}}})
        child_turn = str(uuid4())
        offset = target.stat().st_size
        self.append_host_events(target, {"type": "event_msg", "timestamp": timestamp, "payload": {
            "type": "task_started", "turn_id": child_turn, "turn_attribution": {"parent_turn_id": parent_turn}}},
            {"type": "event_msg", "timestamp": timestamp, "payload": {
                "type": "item_completed", "turn_id": child_turn, "item": {
                    "type": "AgentMessage", "phase": "final_answer", "content": [{"type": "Text", "text": reply}]}}},
            self.final_answer(timestamp, reply))
        with closing(sqlite3.connect(self.state / "thread_history_1.sqlite")) as index, index:
            index.execute("INSERT INTO thread_turns VALUES (?, ?, 'inProgress', ?)", (child, child_turn, offset))
        with closing(sqlite3.connect(self.state / "state_5.sqlite")) as index, index:
            index.execute("CREATE TABLE IF NOT EXISTS threads (id TEXT PRIMARY KEY, rollout_path TEXT)")
            index.execute("INSERT OR IGNORE INTO threads VALUES (?, ?)", (child, str(target)))
        return {"agent_id": child, "turn_id": child_turn, "agent_transcript_path": str(target),
                "last_assistant_message": reply}

    def title_candidate(self):
        return self.recording_metadata(self.record).get("titleCandidate")

    def finish_naming(self, title):
        child = str(uuid4())
        self.launch_child(f"name-directory-{child}", child, "为当前会话生成标题", "2026-11-26T12:00:04Z",
                          task_name="recording_title")
        self.parent_status("completed")
        reply = self.child_reply(child, self.turn, json.dumps({"title": title}), "2026-11-26T12:00:08Z",
                                 agent_path="/root/recording_title")
        self.assertEqual(self.callback("SubagentStop", **reply), {})
        return reply

    def start_another_session(self, session=None):
        self.turn, self.session = str(uuid4()), session or str(uuid4())
        self.transcript = self.transcript.with_name(f"rollout-2026-11-25T20-00-00-{self.session}.jsonl")
        self.record = self.record.parents[1] / self.session / "record.md"
        self.seed_turn()

    def recording_metadata(self, path):
        prefix = "<!-- foundry-recording "
        header = next(line for line in path.read_text().splitlines() if line.startswith(prefix))
        return json.loads(header.removeprefix(prefix).removesuffix(" -->"))

    def test_title_directory_moves_linked_files_and_resumes_by_id_across_days(self):
        self.install()
        original = b"fixture image"
        self.seed_turn(events=[self.tool_call(2, "image", {"cmd": "cat README.md"}),
                               self.tool_output(3, "image", [{"type": "image", "name": "实测 附件.png",
                                   "mimeType": "image/png", "data": b64encode(original).decode()}])])
        prompt = "核对目录和附件\r\n保留原换行"
        self.callback("UserPromptSubmit", prompt=prompt)
        day = self.repo / "records/2026-11-25"
        initial = day / self.session / "record.md"
        self.assertTrue(initial.is_file())
        self.callback("Stop", last_assistant_message="已记录附件")

        reply = self.finish_naming("中文 标题/目录\\附件")
        named = day / "中文 标题-目录-附件" / "record.md"
        self.assertFalse(initial.parent.exists())
        saved = named.read_text()
        self.assertIn(prompt.encode(), named.read_bytes())
        self.assertTrue(saved.startswith("# 中文 标题/目录\\\\附件\n"))
        detail_link = re.search(r"\[查看经过\]\(([^)]+)\)", saved)[1]
        self.assertEqual(detail_link, f"details/{self.turn}.md")
        detail = named.parent / detail_link
        attachment_link = re.search(r"\[附件\]\(([^)]+)\)", detail.read_text())[1]
        self.assertTrue(attachment_link.startswith("../attachments/"))
        self.assertEqual((detail.parent / unquote(attachment_link)).read_bytes(), original)
        self.callback("SubagentStop", **reply)
        self.assertEqual(named.read_text(), saved)

        self.next_parent_turn("2026-11-28T12:00:00Z")
        self.callback("UserPromptSubmit", prompt="隔天恢复仍沿原目录续写")
        self.callback("Stop", last_assistant_message="恢复后的回复")
        resumed = named.read_text()
        self.assertTrue(resumed.startswith(saved))
        self.assertIn(f"## 2026-11-28 <!-- turn-{self.turn} -->", resumed)
        self.assertIn("恢复后的回复", resumed)
        self.assertEqual(list(day.glob("*/record.md")), [named])

    def test_same_day_title_collision_renames_both_sessions(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="第一场")
        self.finish_naming("同名 会话")
        day = self.repo / "records/2026-11-25"
        bare = day / "同名 会话" / "record.md"
        self.assertIn("第一场", bare.read_text())
        first = self.session
        different = "c0de" if first[-12:-8] != "c0de" else "beef"
        self.start_another_session(f"{str(uuid4())[:-12]}{different}{first[-8:]}")
        self.callback("UserPromptSubmit", prompt="第二场")
        self.finish_naming("同名 会话")
        self.assertFalse(bare.parent.exists())
        self.assertIn("第一场", (day / f"同名 会话--{first[-8:]}" / "record.md").read_text())
        second = day / f"同名 会话--{self.session[-12:]}" / "record.md"
        self.assertIn("第二场", second.read_text())
        self.next_parent_turn("2026-11-28T12:00:00Z")
        self.callback("UserPromptSubmit", prompt="第二场恢复")
        self.assertIn("第二场恢复", second.read_text())
        self.assertEqual(len(list(day.glob("*/record.md"))), 2)

    def test_archived_bare_title_survives_another_sessions_collision(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="原位置首条")
        empty = self.finish_naming(None)
        self.next_parent_turn("2026-11-26T12:01:00Z")
        self.callback("UserPromptSubmit", prompt="给出补充后再生成标题")
        reply = self.finish_naming("共同标题")
        day = self.record.parents[1]
        archive = day / "共同标题/record.md"
        archived = archive.read_bytes()
        ignore = self.repo / ".gitignore"
        ignore.write_text(f"/{archive.parent.relative_to(self.repo)}/\n")
        self.next_parent_turn("2026-11-27T12:00:00Z")
        self.callback("UserPromptSubmit", prompt="忽略后从新位置接续")
        self.launch_child("new-business", str(uuid4()), "新业务派发", "2026-11-27T12:00:01Z")
        self.callback("Stop", last_assistant_message="新位置结束")
        self.parent_status("completed")
        successor = day / f"共同标题--{self.session[-8:]}" / "record.md"
        self.assertEqual(self.recording_metadata(successor)["previousRecords"], [str(archive.relative_to(self.repo))])
        self.assertNotIn(empty["last_assistant_message"], successor.read_text())
        self.assertNotIn(reply["last_assistant_message"], successor.read_text())
        successor_bytes = successor.read_bytes()
        self.assertEqual(self.callback("SubagentStop", **reply), {})
        self.assertEqual(successor.read_bytes(), successor_bytes)
        first = self.transcript, self.session, self.turn, self.record
        ignore.unlink()
        self.start_another_session()
        self.callback("UserPromptSubmit", prompt="第二场同标题")
        self.finish_naming("共同标题")
        self.assertIn("第二场同标题", (day / f"共同标题--{self.session[-8:]}" / "record.md").read_text())
        self.assertEqual(archive.read_bytes(), archived)
        self.transcript, self.session, self.turn, self.record = first
        self.next_parent_turn("2026-11-28T12:00:00Z")
        self.assertEqual(self.callback("UserPromptSubmit", prompt="第一场恢复"), {})
        self.assertIn("第一场恢复", successor.read_text())

    def test_same_title_peer_with_an_active_turn_gets_suffix_in_its_safe_callback(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="第一场首条")
        self.finish_naming("共同标题")
        self.next_parent_turn("2026-11-27T12:00:00Z")
        self.callback("UserPromptSubmit", prompt="第一场仍在工作")
        day = self.record.parents[1]
        bare = day / "共同标题/record.md"
        saved = bare.read_bytes()
        first = self.transcript, self.session, self.turn, self.record
        self.start_another_session()
        self.callback("UserPromptSubmit", prompt="第二场")
        self.finish_naming("共同标题")
        self.assertEqual(bare.read_bytes(), saved)
        self.assertIn("第二场", (day / f"共同标题--{self.session[-8:]}" / "record.md").read_text())
        self.transcript, self.session, self.turn, self.record = first
        self.callback("Stop", last_assistant_message="第一场的安全收尾")
        self.assertFalse(bare.parent.exists())
        self.assertIn("第一场的安全收尾", (day / f"共同标题--{self.session[-8:]}" / "record.md").read_text())

    def test_recovers_renamed_directory_even_if_display_title_was_not_written(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="标题写入中断样例")
        destination = self.record.parent.with_name("待补标题")
        ignore = self.repo / ".gitignore"
        ignore.write_text(f"/{destination.relative_to(self.repo)}/\n")
        self.finish_naming("待补标题")
        self.assertIsNone(self.recording_metadata(self.record).get("title"))
        ignore.unlink()
        self.record.parent.rename(destination)
        self.next_parent_turn("2026-11-28T12:00:00Z")
        self.assertEqual(self.callback("UserPromptSubmit", prompt="恢复移动后的同一份文件"), {})
        record = destination / "record.md"
        self.assertEqual(self.recording_metadata(record)["title"], "待补标题")
        self.assertIn("恢复移动后的同一份文件", record.read_text())
        self.assertFalse(self.record.exists())

    def test_unusable_directory_title_does_not_prevent_next_naming_attempt(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="保留初始目录")
        self.finish_naming(".git")
        self.assertTrue(self.record.is_file())
        self.next_parent_turn("2026-11-28T12:00:00Z")
        self.callback("UserPromptSubmit", prompt="提供可以命名的主题")
        self.finish_naming("可以采用")
        self.assertIn("提供可以命名的主题", (self.record.parent.with_name("可以采用") / "record.md").read_text())

    def test_directory_metadata_is_readable_with_a_multiline_origin(self):
        self.install()
        origin = self.repo / "工作\n目录"
        origin.mkdir()
        self.seed_turn(origin=origin)
        self.assertEqual(self.callback("UserPromptSubmit", prompt="按真实工作目录核对"), {})
        self.assertEqual(self.callback("Stop", last_assistant_message="第一轮已保存"), {})
        self.assertEqual(self.recording_metadata(self.record)["origin"], str(origin))
        self.assertIn("第一轮已保存", self.record.read_text())

    def test_valid_title_directory_is_used_when_a_handmade_copy_exists(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="会话保存")
        self.finish_naming("实际标题")
        named = self.record.parent.with_name("实际标题")
        backup = named.with_name("手工备份")
        copytree(named, backup)
        copytree(self.repo / "records", self.repo / "备份整份资料/records")
        before = (backup / "record.md").read_bytes()
        self.next_parent_turn("2026-11-28T12:00:00Z")
        self.assertEqual(self.callback("UserPromptSubmit", prompt="原会话继续"), {})
        self.assertIn("原会话继续", (named / "record.md").read_text())
        self.assertEqual((backup / "record.md").read_bytes(), before)

    def test_title_directory_does_not_replace_a_tracked_deletion(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="已有会话")
        self.finish_naming("跟踪的标题")
        named = self.record.parent.with_name("跟踪的标题")
        subprocess.run(["git", "add", str(named)], cwd=self.repo, check=True)
        subprocess.run(["git", "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid",
                        "commit", "-qm", "记录样例"], cwd=self.repo, check=True)
        subprocess.run(["git", "rm", "-qr", str(named)], cwd=self.repo, check=True)
        self.start_another_session()
        self.callback("UserPromptSubmit", prompt="另一会话")
        self.finish_naming("跟踪的标题")
        new_name = self.record.parent.with_name(f"跟踪的标题--{self.session[-8:]}")
        self.assertFalse(named.exists())
        self.assertIn("另一会话", (new_name / "record.md").read_text())

    def test_title_candidate_has_verified_origin_and_is_saved_once(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="排查会话记录")
        child = str(uuid4())
        self.launch_child("name-task", child, "宿主提供的派发正文", "2026-11-26T12:00:01Z", task_name="recording_title")
        self.callback("Stop", last_assistant_message="主回复已经发送")
        self.parent_status("completed")
        at = "2026-11-26T12:00:03Z"
        reply = self.child_reply(child, self.turn, '{"title":"排查会话记录"}', at, agent_path="/root/recording_title")
        self.assertEqual(self.callback("SubagentStop", **reply), {})
        self.record = self.record.parent.with_name("排查会话记录") / "record.md"
        self.assertEqual(self.title_candidate(), {
            "title": "排查会话记录", "parentTurn": self.turn, "dispatchCall": "name-task",
            "childThread": child, "childTurn": reply["turn_id"], "repliedAt": at,
        })
        saved = self.record.read_bytes()
        self.assertEqual(self.callback("SubagentStop", **reply), {})
        self.assertEqual(self.record.read_bytes(), saved)
        self.next_parent_turn("2026-11-26T12:00:04Z")
        self.callback("UserPromptSubmit", prompt="继续核对")
        newer = str(uuid4())
        self.launch_child("later-name", newer, "再次尝试命名", "2026-11-26T12:00:05Z", task_name="recording_title")
        self.parent_status("completed")
        new_reply = self.child_reply(newer, self.turn, '{"title":"另一标题"}', "2026-11-26T12:00:06Z",
                                     agent_path="/root/recording_title")
        self.assertEqual(self.callback("SubagentStop", **new_reply), {})
        self.assertEqual(self.title_candidate()["title"], "排查会话记录")

    def test_title_candidate_empty_result_can_be_followed_by_a_valid_attempt(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="帮我看看")
        empty_child = str(uuid4())
        self.launch_child("name-empty", empty_child, "首次尝试", "2026-11-26T12:00:01Z", task_name="recording_title")
        self.parent_status("completed")
        empty = self.child_reply(empty_child, self.turn, '{"title":null}', "2026-11-26T12:00:02Z",
                                 agent_path="/root/recording_title")
        self.assertEqual(self.callback("SubagentStop", **empty), {})
        self.assertIsNone(self.title_candidate())

        self.next_parent_turn("2026-11-26T12:00:03Z")
        self.callback("UserPromptSubmit", prompt="核对详情链接")
        child = str(uuid4())
        self.launch_child("name-retry", child, "主题已有补充", "2026-11-26T12:00:04Z", task_name="recording_title")
        self.parent_status("completed")
        reply = self.child_reply(child, self.turn, '{"title":"核对详情 --> 链接"}', "2026-11-26T12:00:05Z",
                                 agent_path="/root/recording_title")
        self.assertEqual(self.callback("SubagentStop", **reply), {})
        self.record = self.record.parent.with_name("核对详情 --> 链接") / "record.md"
        self.assertEqual(self.title_candidate()["title"], "核对详情 --> 链接")
        header = next(line for line in self.record.read_text().splitlines() if line.startswith("<!-- foundry-recording "))
        self.assertEqual(header.count("-->"), 1)

    def test_title_candidate_distinguishes_business_reply_and_foreign_child(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="先核对操作结果")
        business = str(uuid4())
        self.launch_child("business", business, "核对", "2026-11-26T12:00:01Z", task_name="review_result")
        foreign = str(uuid4())
        self.launch_child("foreign-title", foreign, "尝试命名", "2026-11-26T12:00:02Z", task_name="recording_title")
        self.parent_status("completed")
        body = '{"title":"同样的 JSON"}'
        business_reply = self.child_reply(business, self.turn, body, "2026-11-26T12:00:03Z",
                                          agent_path="/root/review_result")
        self.assertEqual(self.callback("SubagentStop", **business_reply), {})
        self.assertIn(body, self.record.read_text())
        self.assertIsNone(self.title_candidate())
        saved = self.record.read_bytes()
        foreign_reply = self.child_reply(foreign, self.turn, body, "2026-11-26T12:00:04Z", parent=str(uuid4()),
                                         agent_path="/root/recording_title")
        self.assertEqual(self.callback("SubagentStop", **foreign_reply), {})
        self.assertEqual(self.record.read_bytes(), saved)

    def test_title_candidate_rejects_invalid_json_shape(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="接收标题时核对格式")
        variants = [("number", '{"title": 123}'), ("duplicate", '{"title":null,"title":"歧义标题"}')]
        children = {}
        for name, body in variants:
            child = str(uuid4())
            self.launch_child(f"name-{name}", child, "生成标题", "2026-11-26T12:00:01Z", task_name="recording_title")
            children[child] = body
        self.parent_status("completed")
        for child, body in children.items():
            invalid = self.child_reply(child, self.turn, body, "2026-11-26T12:00:02Z",
                                       agent_path="/root/recording_title")
            self.assertEqual(self.callback("SubagentStop", **invalid), {})
        self.assertIsNone(self.title_candidate())

    def test_title_candidate_is_never_taken_from_later_child_turn_in_same_parent_turn(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="帮我看看")
        child = str(uuid4())
        self.launch_child("first-name", child, "尝试命名", "2026-11-26T12:00:01Z", task_name="recording_title")
        empty = self.child_reply(child, self.turn, '{"title":null}', "2026-11-26T12:00:02Z",
                                 agent_path="/root/recording_title")
        self.callback("SubagentStop", **empty)
        self.launch_child("business-followup", child, "复述业务对象", "2026-11-26T12:00:03Z",
                          followup=True, task_name="recording_title")
        body = '{"title":"业务对象"}'
        followed = self.child_reply(child, self.turn, body, "2026-11-26T12:00:04Z")
        self.callback("SubagentStop", **followed)
        self.callback("Stop", last_assistant_message="业务问答结束")
        self.assertIn(body, self.record.read_text())
        self.assertIsNone(self.title_candidate())

    def test_title_candidate_is_deferred_during_commit_then_recovered(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="先命名，再提交")
        child = str(uuid4())
        self.launch_child("name-delayed", child, "生成短标题", "2026-11-26T12:00:01Z", task_name="recording_title")
        self.append_host_events(self.transcript, self.tool_call(8, "commit", {"cmd": "git commit -m fixture"}))
        before = self.record.read_bytes()
        reply = self.child_reply(child, self.turn, '{"title":"会话标题恢复"}', "2026-11-26T12:00:02Z",
                                 agent_path="/root/recording_title")
        self.callback("SubagentStop", **reply)
        self.callback("Stop", last_assistant_message="本次提交已完成")
        self.parent_status("completed")
        self.assertEqual(self.record.read_bytes(), before)

        self.next_parent_turn("2026-11-26T12:00:04Z")
        self.callback("UserPromptSubmit", prompt="继续普通对话")
        self.record = self.record.parent.with_name("会话标题恢复") / "record.md"
        self.assertEqual(self.title_candidate()["title"], "会话标题恢复")
        self.assertEqual(self.title_candidate()["childTurn"], reply["turn_id"])

    def test_title_candidate_can_arrive_after_parent_commit_is_complete(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="验证提交后的标题回传")
        child = str(uuid4())
        self.launch_child("name-after-commit", child, "尝试命名", "2026-11-26T12:00:01Z", task_name="recording_title")
        self.append_host_events(self.transcript, self.tool_call(8, "commit", {"cmd": "git commit -m fixture"}),
                                self.final_answer("2026-11-26T12:00:04Z", "提交完成"))
        self.callback("Stop", last_assistant_message="提交完成")
        self.parent_status("completed")
        reply = self.child_reply(child, self.turn, '{"title":"提交完成后的标题"}', "2026-11-26T12:01:00Z",
                                 agent_path="/root/recording_title")
        self.assertEqual(self.callback("SubagentStop", **reply), {})
        self.record = self.record.parent.with_name("提交完成后的标题") / "record.md"
        self.assertEqual(self.title_candidate()["title"], "提交完成后的标题")
        self.assertNotIn("主代理 · 回复", self.record.read_text())

    def test_title_candidate_updates_legacy_record_with_visible_session_identity(self):
        self.install()
        self.seed_turn()
        self.record = self.record.parent.with_suffix(".md")
        self.record.parent.mkdir(parents=True)
        self.record.write_text(f"# 对话记录\n\n会话 `{self.session}`\n\n"
                               f"> **{self.turn_date()}** <!-- turn-{self.turn} -->\n>\n"
                               "> - **发起** 旧记录的用户原话\n")
        child = str(uuid4())
        self.launch_child("legacy-title", child, "旧记录的命名", "2026-11-26T12:00:01Z", task_name="recording_title")
        self.parent_status("completed")
        reply = self.child_reply(child, self.turn, '{"title":"历史会话标题"}', "2026-11-26T12:00:03Z",
                                 agent_path="/root/recording_title")
        self.assertEqual(self.callback("SubagentStop", **reply), {})
        self.assertEqual(self.title_candidate()["title"], "历史会话标题")
        self.assertIn("旧记录的用户原话", self.record.read_text())

    def test_idle_subagent_reply_is_written_once_to_the_parent_record(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="检查两个来源")
        child = str(uuid4())
        self.launch_child("spawn", child, "核对第一处\n\n保留这行  ", "2026-11-26T12:00:01Z", v2=False)
        self.callback("Stop", last_assistant_message="主代理先回复")
        self.parent_status("completed")
        body = "第一处结果\n\n---\n\n含分隔符 😀"
        data = self.child_reply(child, self.turn, body, "2026-11-26T12:00:04Z")
        self.assertEqual(self.callback("SubagentStop", **data), {})
        result = self.record.read_text()
        self.assertEqual(result.count(f"`{child}`"), 2)
        self.assertEqual(result.count(body), 1)
        self.assertLess(result.index("核对第一处"), result.index("主代理先回复"))
        self.assertLess(result.index("主代理先回复"), result.index(body))
        self.assertIn("核对", result)
        self.callback("SubagentStop", **data)
        self.assertEqual(self.record.read_text(), result)

    def test_subagent_reply_moves_into_next_turn_in_host_time_order(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="第一轮用户")
        child = str(uuid4())
        self.launch_child("spawn", child, "派发核对", "2026-11-26T12:00:01Z")
        self.callback("Stop", last_assistant_message="主回复一")
        first_turn = self.turn
        self.next_parent_turn("2026-11-26T12:00:04Z")
        reply = self.child_reply(child, first_turn, "跨轮子代理回复", "2026-11-26T12:00:07Z")
        self.assertEqual(self.callback("SubagentStop", **reply), {})
        self.callback("UserPromptSubmit", prompt="第二轮用户")
        self.append_host_events(self.transcript, self.final_answer("2026-11-26T12:00:06Z", "主回复二"))
        self.callback("Stop", last_assistant_message="主回复二")
        text = self.record.read_text()
        self.assertEqual(text.count("跨轮子代理回复"), 1)
        offsets = [text.index(value) for value in ("主回复一", f"turn-{self.turn}", "第二轮用户", "主回复二",
                                                  "跨轮子代理回复")]
        self.assertEqual(offsets, sorted(offsets))
        self.assertIn("\n---\n\n", text)
        detail = self.record.parent / f"details/{first_turn}.md"
        self.assertTrue(detail.is_file())
        self.assertIn(f"[查看经过](details/{first_turn}.md)", text)

    def test_subagent_stop_during_parent_index_completion_can_save_the_reply(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="让子代理核对")
        child = str(uuid4())
        self.launch_child("spawn", child, "请核对一处", "2026-11-26T12:00:01Z")
        self.callback("Stop", last_assistant_message="父轮已经保存")
        reply = self.child_reply(child, self.turn, "两次索引读取间的子回复", "2026-11-26T12:00:04Z")
        installed = self.repo / ".agents/skills/conversation-recording"
        # 用实际索引模拟宿主在子回调读到 inProgress 后完成父轮。
        driver = """
from pathlib import Path
import os, runpy, sqlite3, sys
sys.path.insert(0, sys.argv[1])
from recording import subagents
verify = subagents.verify_scope
def complete_after_first_read(*args, **kwargs):
    scope = verify(*args, **kwargs)
    if scope and scope.active:
        with sqlite3.connect(Path(os.environ["CODEX_SQLITE_HOME"]) / "thread_history_1.sqlite") as db:
            db.execute("UPDATE thread_turns SET status = 'completed' WHERE thread_id = ? AND turn_id = ?",
                       (scope.session, scope.turn))
    return scope
subagents.verify_scope = complete_after_first_read
runpy.run_path(sys.argv[1] + "/scripts/subagent_stop.py", run_name="__main__")
"""
        payload = {"hook_event_name": "SubagentStop", "session_id": self.session, "cwd": str(self.repo),
                   "transcript_path": str(self.transcript), **reply}
        result = subprocess.run([sys.executable, "-B", "-c", driver, str(installed)], input=json.dumps(payload),
                                cwd=self.repo, env=self.env, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.record.read_text().count("两次索引读取间的子回复"), 1)

    def test_supplement_and_different_child_turns_with_the_same_reply_are_distinct(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="先检查")
        child = str(uuid4())
        self.launch_child("spawn", child, "检查初始项", "2026-11-26T12:00:01Z")
        self.callback("SubagentStop", **self.child_reply(child, self.turn, "已核对。", "2026-11-26T12:00:02Z"))
        self.launch_child("followup", child, "再检查一项", "2026-11-26T12:00:03Z", followup=True)
        reply = self.child_reply(child, self.turn, "已核对。", "2026-11-26T12:00:04Z")
        self.callback("SubagentStop", **reply)
        self.callback("SubagentStop", **reply)
        self.callback("Stop", last_assistant_message="核对完成")
        text = self.record.read_text()
        self.assertEqual(text.count("已核对。"), 2)
        self.assertEqual(text.count("再检查一项"), 1)
        self.assertLess(text.index("已核对。"), text.index("再检查一项"))
        self.assertLess(text.index("再检查一项"), text.rindex("已核对。"))

    def test_subagent_callback_respects_parent_commit_suppression(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="检查后提交")
        child = str(uuid4())
        self.launch_child("spawn", child, "检查一处", "2026-11-26T12:00:01Z")
        self.append_host_events(self.transcript, self.tool_call(8, "commit", {"cmd": "git commit -m fixture"}))
        before = {path: (path.read_bytes(), path.stat().st_mtime_ns)
                  for path in self.record.parents[1].rglob("*.md")}
        reply = self.child_reply(child, self.turn, "提交中到达的结果", "2026-11-26T12:00:05Z")
        self.callback("SubagentStop", **reply)
        self.assertEqual({path: (path.read_bytes(), path.stat().st_mtime_ns)
                          for path in self.record.parents[1].rglob("*.md")}, before)

    def test_ordinary_parent_code_cell_recovers_deferred_subagent_reply(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="检查已派发的事项")
        child = str(uuid4())
        self.launch_child("spawn", child, "检查一处", "2026-11-26T12:00:01Z")
        self.append_host_events(self.transcript, self.code_call("pending", "text(await tools.unknown_call({}))"))
        reply = self.child_reply(child, self.turn, "子代理实际回传", "2026-11-26T12:00:02Z")
        child_path = Path(reply["agent_transcript_path"])
        self.callback("SubagentStop", **reply)
        self.assertNotIn("子代理实际回传", self.record.read_text())

        self.append_host_events(child_path, {"type": "event_msg", "timestamp": "2026-11-26T12:00:03Z",
                                             "payload": {"type": "task_complete", "turn_id": reply["turn_id"],
                                                         "last_agent_message": reply["last_assistant_message"]}})
        with closing(sqlite3.connect(self.state / "thread_history_1.sqlite")) as index, index:
            index.execute("UPDATE thread_turns SET status = 'completed' WHERE thread_id = ?", (child,))
        self.append_host_events(self.transcript, self.tool_output(9, "pending", "普通代码调用已结束"),
                                self.final_answer("2026-11-26T12:00:04Z", "主代理正常回复"))
        for _ in range(2):
            self.callback("Stop", last_assistant_message="主代理正常回复")
        data = self.record.read_text()
        self.assertEqual(data.count("子代理实际回传"), 1)
        self.assertLess(data.index("子代理实际回传"), data.index("主代理正常回复"))

    def test_subagent_with_foreign_provenance_cannot_write_parent_record(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="只记录当前会话")
        child = str(uuid4())
        self.launch_child("spawn", child, "检查一处", "2026-11-26T12:00:01Z")
        before = self.record.read_bytes()
        self.parent_status("completed")
        reply = self.child_reply(child, self.turn, "其他会话的原文", "2026-11-26T12:00:02Z", parent=str(uuid4()))
        self.callback("SubagentStop", **reply)
        self.assertEqual(self.record.read_bytes(), before)

    def test_reply_to_a_foreign_followup_is_skipped_after_parent_returns(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="本项目发起")
        child = str(uuid4())
        self.launch_child("spawn", child, "本项目派发", "2026-11-26T12:00:01Z")
        self.next_parent_turn("2026-11-26T12:00:02Z")
        self.launch_child("foreign-followup", child, "其他工作树补充", "2026-11-26T12:00:03Z",
                          followup=True, directory=self.root)
        foreign_turn = self.turn
        self.next_parent_turn("2026-11-26T12:00:04Z")
        self.callback("UserPromptSubmit", prompt="回到本项目")
        self.parent_status("completed")
        reply = self.child_reply(child, foreign_turn, "其他工作树的回复", "2026-11-26T12:00:05Z")
        self.callback("SubagentStop", **reply)
        self.assertNotIn("其他工作树的回复", self.record.read_text())

    def test_legacy_turn_can_receive_new_subagent_messages(self):
        self.install()
        self.seed_turn()
        self.record = self.record.parent.with_suffix(".md")
        self.record.parent.mkdir(parents=True)
        self.record.write_text(f"# 对话记录\n\n会话 `{self.session}`\n\n"
                               f"> **{self.turn_date()}** <!-- turn-{self.turn} -->\n>\n"
                               "> - **发起** 旧版原话\n")
        child = str(uuid4())
        self.launch_child("spawn", child, "派发到子代理", "2026-11-26T12:00:01Z", v2=False)
        self.callback("Stop", last_assistant_message="主代理已回复")
        self.parent_status("completed")
        self.assertEqual(self.callback("SubagentStop",
                                      **self.child_reply(child, self.turn, "子代理已回复", "2026-11-26T12:00:03Z")), {})
        data = self.record.read_text()
        self.assertEqual(data.count("旧版原话"), 1)
        self.assertEqual(data.count("派发到子代理"), 1)
        self.assertEqual(data.count("子代理已回复"), 1)

    def test_user_message_event_places_subagent_reply_before_later_supplement(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="用户发起")
        child = str(uuid4())
        self.launch_child("spawn", child, "请核对", "2026-11-26T12:00:01Z")
        self.append_host_events(self.transcript, {
            "type": "event_msg", "timestamp": "2026-11-26T12:00:03Z", "payload": {
                "type": "item_completed", "turn_id": self.turn,
                "item": {"type": "UserMessage", "content": [{"type": "text", "text": "稍后用户补充"}]}}})
        self.callback("UserPromptSubmit", prompt="稍后用户补充")
        self.callback("SubagentStop", **self.child_reply(child, self.turn, "较早子代理回复", "2026-11-26T12:00:02Z"))
        self.callback("Stop", last_assistant_message="主代理已完成")
        contents = self.record.read_text()
        self.assertLess(contents.index("较早子代理回复"), contents.index("稍后用户补充"))

    def test_resumed_partial_host_history_preserves_old_child_message_once(self):
        self.install()
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="首轮")
        child = str(uuid4())
        self.launch_child("spawn", child, "派发", "2026-11-26T12:00:01Z")
        self.callback("Stop", last_assistant_message="主代理首轮回复")
        self.parent_status("completed")
        self.callback("SubagentStop", **self.child_reply(child, self.turn, "仅保存一次的子回复",
                                                        "2026-11-26T12:00:05Z"))
        previous = self.record.read_text()
        self.turn = str(uuid4())
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="恢复发言")
        self.callback("Stop", last_assistant_message="恢复完成")
        resumed = self.record.read_text()
        self.assertTrue(resumed.startswith(previous))
        self.assertEqual(resumed.count("仅保存一次的子回复"), 1)

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
        self.assertNotIn("### 主代理 · 回复", self.record.read_text())
        for _ in range(2):
            self.callback("Stop", last_assistant_message=reply)
        data = self.record.read_text()
        self.assertEqual(data.count(f"<!-- turn-{self.turn} -->"), 1)
        self.assertEqual(data.count("### 主代理 · 回复"), 1)
        self.assertIn("保留行尾  ", data)
        self.assertIn("第二行  ", data)
        self.assertFalse((self.record.parent / f"details/{self.turn}.md").exists())

    def test_message_layout_preserves_body_and_separates_supplement_and_resumed_turn(self):
        """安装版保存正文里的伪标题与标记，续写不重排也不重复。"""
        self.install()
        prompt = (f"首条原话 😀\n\n---\n\n## 2026-11-26 <!-- turn-{uuid4()} -->\n"
                  f"> **2026-11-26** <!-- turn-{self.turn} -->\n"
                  "<!-- foundry-message 回复 4 -->\n\n### 主代理 · 回复\n\n伪造边界\n"
                  "[查看经过](details/fake.md)\n"
                  '<!-- foundry-recording {"session":"wrong"} -->\n')
        supplement = "同轮补充\n\n1. 查日志\n2. 不改代码"
        reply = "真实回复\n\n```text\n---\n### 标题\n```\n\n末行  \n"
        self.seed_turn(events=[self.tool_call(2, "read", {"cmd": "cat README.md"})])
        self.assertEqual(self.callback("UserPromptSubmit", prompt=prompt), {})
        first = self.record.read_bytes().decode()
        self.assertIn(f"## {self.turn_date()} <!-- turn-{self.turn} -->", first)
        self.assertIn(f"### 用户 · 发起\n\n{prompt}", first)
        self.assertEqual(self.callback("UserPromptSubmit", prompt=prompt), {})
        self.assertEqual(self.record.read_bytes().decode(), first)
        self.callback("UserPromptSubmit", prompt=supplement)
        self.callback("PostToolUse", tool_name="Bash", tool_use_id="read",
                      tool_input={"cmd": "cat README.md"}, tool_response="文件内容")
        self.callback("Stop", last_assistant_message=reply)
        saved = self.record.read_bytes().decode()
        self.callback("Stop", last_assistant_message=reply)
        self.assertEqual(self.record.read_bytes().decode(), saved)
        self.assertIn(f"{prompt}\n\n---\n\n<!-- foundry-message 补充", saved)
        self.assertIn(f"### 用户 · 补充\n\n{supplement}\n\n---\n\n<!-- foundry-message 回复", saved)
        self.assertIn(f"### 主代理 · 回复\n\n{reply}", saved)
        self.assertIn("[查看经过](details/fake.md)", saved)
        link = f"details/{self.turn}.md"
        self.assertEqual(saved.count(f"[查看经过]({link})"), 1)
        self.assertTrue((self.record.parent / link).is_file())

        self.turn = str(uuid4())
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="恢复后的首条")
        self.callback("Stop", last_assistant_message="恢复后的回复")
        resumed = self.record.read_bytes().decode()
        self.assertTrue(resumed.startswith(f"{saved}\n---\n\n## "))
        self.assertIn("### 用户 · 发起\n\n恢复后的首条", resumed)
        self.assertIn("### 主代理 · 回复\n\n恢复后的回复", resumed)
        self.assertEqual(resumed.count("恢复后的回复"), 1)

    def test_legacy_record_is_preserved_when_appending_a_new_layout_turn(self):
        """既有引用块可补记，下一轮用新布局而不重写旧内容。"""
        self.install()
        self.seed_turn()
        date = self.turn_date()
        self.record = self.record.parent.with_suffix(".md")
        self.record.parent.mkdir(parents=True)
        previous = (f"# 对话记录\n\n会话 `{self.session}`\n\n"
                    f"> **{date}** <!-- turn-{self.turn} -->\n>\n> - **发起** 旧轮原话\n")
        self.record.write_text(previous)
        self.callback("Stop", last_assistant_message="旧轮回复")
        legacy = self.record.read_text()
        self.assertEqual(legacy, previous + "> - **回复** 旧轮回复\n")
        self.turn = str(uuid4())
        self.seed_turn()
        self.callback("UserPromptSubmit", prompt="新轮原话")
        self.callback("Stop", last_assistant_message="新轮回复")
        self.assertTrue(self.record.read_text().startswith(f"{legacy}\n---\n\n## "))
        self.assertIn("### 主代理 · 回复\n\n新轮回复", self.record.read_text())

    @staticmethod
    def turn_date():
        """返回夹具宿主时间在当前时区的日期。"""
        from datetime import datetime
        return datetime.fromisoformat("2026-11-26T12:00:00+00:00").astimezone().date().isoformat()

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
        detail = self.record.parent / f"details/{self.turn}.md"
        self.assertIn("查看经过", self.record.read_text())
        self.assertIn("cat README.md", detail.read_text())
        self.assertEqual({path.read_bytes() for path in (self.record.parent / "attachments").iterdir()},
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

    def native_command(self, call, script, output, exit_code=0):
        return {"type": "event_msg", "payload": {"type": "item_completed", "turn_id": self.turn,
                "item": {"type": "CommandExecution", "id": call, "command": ["/bin/bash", "-lc", script],
                         "cwd": self.repo.as_uri(), "aggregated_output": output, "exit_code": exit_code}}}

    @staticmethod
    def code_call(call, code):
        return {"type": "response_item", "payload": {"type": "custom_tool_call", "name": "exec",
                "call_id": call, "input": code}}

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
        detail = self.record.parent / f"details/{self.turn}.md"
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

    def test_multiline_native_verification_keeps_commit_reply_suppressed(self):
        self.install()
        commit = "set -e\ngit add README.md\ngit -c user.name=Fixture commit -qm retry"
        verify = "git status --short\ngit log -1 --format=%s"
        self.seed_turn(events=[self.tool_call(2, "commit", {"cmd": commit}),
                               self.native_command("exec-commit", commit, "成功重试"),
                               self.tool_output(4, "commit", "成功重试"),
                               self.tool_call(5, "verify", {"cmd": verify}),
                               self.native_command("exec-verify", verify, "只读核对"),
                               self.tool_output(7, "verify", "只读核对")])
        self.callback("UserPromptSubmit", prompt="提交")
        previous = self.record.read_bytes(), self.record.stat().st_mtime_ns
        self.callback("PostToolUse", tool_name="Bash", tool_use_id="verify",
                      tool_input={"command": verify}, tool_response="只读核对")
        self.callback("Stop", last_assistant_message="提交完成")
        self.assertEqual((self.record.read_bytes(), self.record.stat().st_mtime_ns), previous)
        self.assertFalse((self.record.parent / "details").exists())

    def test_code_mode_callback_waits_for_host_command_and_output(self):
        self.install()
        code = "text(await tools.exec_command({cmd: buildCommand()}))"
        call = self.code_call("pending", code)
        self.seed_turn(events=[call])
        self.callback("UserPromptSubmit", prompt="执行操作")
        previous = self.record.read_bytes(), self.record.stat().st_mtime_ns
        self.callback("PostToolUse", tool_name="exec", tool_use_id="pending",
                      tool_input=code, tool_response="回调抢先到达")
        self.assertEqual((self.record.read_bytes(), self.record.stat().st_mtime_ns), previous)
        self.assertFalse((self.record.parent / "details").exists())
        self.seed_turn(events=[call, self.native_command("exec-read", "cat README.md", "宿主文件正文"),
                               self.tool_output(4, "pending", "确认的普通工具回包")])
        self.callback("Stop", last_assistant_message="已读取")
        detail = self.record.parent / f"details/{self.turn}.md"
        self.assertIn("确认的普通工具回包", detail.read_text())
        self.assertNotIn("回调抢先到达", detail.read_text())

    def test_failed_code_mode_commit_is_omitted_when_saving_later_repair(self):
        self.install()
        commit = "set -e\ngit add README.md\ngit commit -qm first"
        repair = "printf repaired > README.md"
        self.seed_turn(events=[self.code_call("failed", "text(await tools.exec_command({cmd: buildCommit()}))"),
                               self.native_command("exec-failed", commit, "作者名缺失", exit_code=128),
                               self.tool_output(4, "failed", "失败提交回包"),
                               self.code_call("repair", f"text(await tools.exec_command({{cmd: {json.dumps(repair)}}}))"),
                               self.native_command("exec-repair", repair, "修复已执行"),
                               self.tool_output(7, "repair", "修复工具回包")])
        self.callback("UserPromptSubmit", prompt="失败后修复")
        self.callback("PostToolUse", tool_name="exec", tool_use_id="repair", tool_input={},
                      tool_response="修复工具回包")
        detail = self.record.parent / f"details/{self.turn}.md"
        repaired = detail.read_text()
        self.assertIn("修复已执行", repaired)
        self.assertIn("修复工具回包", repaired)
        self.assertNotIn("buildCommit()", repaired)
        self.assertNotIn("作者名缺失", repaired)
        self.assertNotIn("失败提交回包", repaired)

    def test_multiline_quoted_and_continued_commit_shell_arguments_are_omitted(self):
        self.install()
        for script in ("git commit -m '标题\n\n正文'", "git \\\n commit -m continued"):
            with self.subTest(script=script):
                self.turn = str(uuid4())
                self.seed_turn(events=[self.code_call("dynamic", "text(await tools.exec_command({cmd: buildCommit()}))"),
                                       self.native_command("exec-commit", script, "成功提交"),
                                       self.tool_output(4, "dynamic", "提交回包")])
                self.callback("UserPromptSubmit", prompt="提交")
                previous = self.record.read_bytes(), self.record.stat().st_mtime_ns
                self.callback("Stop", last_assistant_message="提交结果")
                self.assertEqual((self.record.read_bytes(), self.record.stat().st_mtime_ns), previous)

    def test_shell_data_with_git_commit_text_remains_recordable(self):
        self.install()
        for script in ("cat <<'EOF' > README.md\ngit commit -m example\nEOF",
                       "printf '%s' '&&' git commit -m example"):
            with self.subTest(script=script):
                self.turn = str(uuid4())
                self.seed_turn(events=[self.tool_call(2, "write", {"cmd": script}),
                                       self.native_command("exec-write", script, "文档数据"),
                                       self.tool_output(4, "write", "文档工具回包")])
                self.callback("UserPromptSubmit", prompt="写文档")
                self.callback("Stop", last_assistant_message="文档已处理")
                detail = self.record.parent / f"details/{self.turn}.md"
                self.assertTrue(detail.is_file())
                self.assertIn("文档工具回包", detail.read_text())

    def test_repairs_after_failed_commit_are_recorded_even_with_readonly_checks(self):
        self.install()
        for repair_events, label in (
            ([self.code_call("patch", "text(await tools.apply_patch(patch))"),
              {"type": "event_msg", "payload": {"type": "item_completed", "item": {"type": "FileChange",
               "id": "edit", "status": "completed", "changes": {"README.md": {}}, "stdout": "", "stderr": ""}}},
              self.tool_output(6, "patch", "修复补丁回包")], "修复补丁回包"),
            ([self.tool_call(4, "mixed", {"cmd": "printf repaired > README.md\ngit status --short"}),
              self.native_command("exec-mixed", "printf repaired > README.md\ngit status --short", "修复核对"),
              self.tool_output(6, "mixed", "修复核对回包")], "修复核对回包"),
        ):
            with self.subTest(label=label):
                # 每个子例用独立轮次；宿主完成事件也使用相同轮次标识。
                self.turn = str(uuid4())
                repair_events[1]["payload"]["turn_id"] = self.turn
                self.seed_turn(events=[self.tool_call(2, "failed", {"cmd": "git commit -qm first"}),
                                       self.tool_output(3, "failed", "提交失败"), *repair_events])
                self.callback("UserPromptSubmit", prompt="失败后修复")
                self.callback("Stop", last_assistant_message="修复完成")
                detail = self.record.parent / f"details/{self.turn}.md"
                self.assertTrue(detail.is_file())
                self.assertIn(label, detail.read_text())
                self.assertNotIn("提交失败", detail.read_text())

    def test_yielded_code_mode_commit_and_wait_are_excluded_from_details(self):
        self.install()
        code = self.code_call("yielded", "text(await tools.exec_command({cmd: buildCommit()}))")
        pending = self.tool_output(3, "yielded", "Script running with cell ID g4:16\nWall time 1.0 seconds\nOutput:\n")
        wait = {"type": "response_item", "payload": {"type": "function_call", "name": "wait",
                "call_id": "poll", "arguments": json.dumps({"cell_id": "g4:16", "yield_time_ms": 1000})}}
        self.seed_turn(events=[code, pending])
        self.callback("UserPromptSubmit", prompt="提交")
        previous = self.record.read_bytes(), self.record.stat().st_mtime_ns
        self.callback("PostToolUse", tool_name="exec", tool_use_id="yielded", tool_response="尚在运行")
        self.assertEqual((self.record.read_bytes(), self.record.stat().st_mtime_ns), previous)
        repoll = {**wait, "payload": {**wait["payload"], "call_id": "poll-again"}}
        # 相同的宿主进度有纯文本与结构化两种交付形式。
        pending_text = pending["payload"]["output"]
        self.seed_turn(events=[code, pending, wait,
                               self.tool_output(5, "poll", [{"type": "input_text", "text": pending_text}]),
                               self.native_command("exec-done", "git commit -qm done", "提交已执行"),
                               repoll, self.tool_output(8, "poll-again", "提交回包")])
        self.callback("PostToolUse", tool_name="wait", tool_use_id="poll-again",
                      tool_input={"cell_id": "g4:16"}, tool_response="提交回包")
        self.callback("Stop", last_assistant_message="提交完成")
        self.assertEqual((self.record.read_bytes(), self.record.stat().st_mtime_ns), previous)
        self.assertFalse((self.record.parent / "details").exists())

    def test_stop_keeps_detail_already_confirmed_by_tool_hook(self):
        self.install()
        self.seed_turn(events=[self.tool_call(2, "during", {"cmd": "cat README.md"})])
        self.callback("UserPromptSubmit", prompt="读一下")
        self.callback("PostToolUse", tool_name="Bash", tool_use_id="during", tool_input={"command": "cat README.md"},
                      tool_response="CALLBACK_ONLY")
        detail = self.record.parent / f"details/{self.turn}.md"
        self.assertIn("CALLBACK_ONLY", detail.read_text())
        self.callback("Stop", last_assistant_message="已读")
        self.assertIn("CALLBACK_ONLY", detail.read_text())

    def test_stop_backfills_attachment_after_callback_result(self):
        self.install()
        arguments = {"cmd": "cat README.md"}
        call = self.tool_call(2, "during", arguments)
        self.seed_turn(events=[call])
        self.callback("UserPromptSubmit", prompt="取附件")
        self.callback("PostToolUse", tool_name="Bash", tool_use_id="during", tool_input=arguments,
                      tool_response="回调先收到文本")
        detail = self.record.parent / f"details/{self.turn}.md"
        self.assertIn("回调先收到文本", detail.read_text())

        original = b"attachment from the host"
        output = self.tool_output(3, "during", [{"type": "image", "name": "report.png",
                                  "mimeType": "image/png", "data": b64encode(original).decode()}])
        self.seed_turn(events=[call, output])
        self.callback("Stop", last_assistant_message="完成")
        self.assertEqual({path.read_bytes() for path in self.record.parent.glob("attachments/*")}, {original})
        self.assertEqual(detail.read_text().count("## 工具结果 `during`"), 1)

    def test_unowned_detail_and_same_turn_supplement(self):
        self.install()
        self.seed_turn(events=[self.tool_call(2, "read", {"cmd": "cat README.md"})])
        self.callback("UserPromptSubmit", prompt="读一下")
        self.callback("UserPromptSubmit", prompt="同时检查文件末尾")
        self.assertIn("### 用户 · 补充\n\n同时检查文件末尾", self.record.read_text())
        detail = self.record.parent / f"details/{self.turn}.md"
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
        detail = self.record.parent / f"details/{self.turn}.md"
        self.assertNotIn("T035_FIXTURE_AUTH_FILE_CONTENT", detail.read_text())


if __name__ == "__main__":
    unittest.main()
