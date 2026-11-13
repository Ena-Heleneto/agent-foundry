"""验证实际安装脚本向官方 CLI 提交单 Increment及传播失败。"""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / 'packages/skills/script/register-commands/register-commands.sh'
MODES = ('increment',)


class RegisterCommandsTests(unittest.TestCase):
    """只替换外部 CLI，实际执行 shell、临时输入生成及文件复制。"""

    def setUp(self):
        """准备含空格路径、单 Increment 来源和记录调用输入的 CLI。"""
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.project = self.root / 'project with spaces'
        (self.project / '.specify').mkdir(parents=True)
        (self.project / '.specify/init-options.json').write_text(json.dumps({'ai': 'codex', 'ai_skills': True, 'speckit_version': '1.2.6'}))
        self.skills = self.root / 'installed skills'
        for mode in MODES:
            source = self.skills / f'task-{mode}'
            source.mkdir(parents=True)
            (source / 'SKILL.md').write_text(f'---\nname: task-{mode}\ndescription: 测试来源\n---\n正文 {mode}\n')
        (self.skills / 'task-increment/references').mkdir()
        (self.skills / 'task-increment/references/example.md').write_text('附属资料')
        self.cli = self.root / 'specify'
        self.cli.write_text("#!/usr/bin/env python3\nimport json, os, pathlib, sys\nif sys.argv[1:] == ['--version']:\n print('specify 1.2.6')\n sys.exit(0)\nsource = pathlib.Path(sys.argv[sys.argv.index('--dev') + 1])\nmanifest = json.loads((source / 'extension.yml').read_text())\nfiles = {p.relative_to(source).as_posix(): p.read_text() for p in source.rglob('*') if p.is_file()}\nwith pathlib.Path('calls.jsonl').open('a') as log:\n log.write(json.dumps({'args': sys.argv[1:], 'manifest': manifest, 'files': files}) + chr(10))\nsys.exit(int(os.environ.get('TEST_CLI_EXIT', '0')))\n")
        self.cli.chmod(0o755)

    def run_mount(self, **environment):
        """调用真实脚本并捕获退出状态；不模拟脚本内部实现。"""
        return subprocess.run(['bash', str(SCRIPT), '--project', str(self.project), '--skills-dir', str(self.skills), '--cli', str(self.cli)], capture_output=True, text=True, env={**os.environ, **environment})

    def calls(self):
        """读取外部 CLI 实际接收的输入，作为生产脚本边界证据。"""
        return [json.loads(line) for line in (self.project / 'calls.jsonl').read_text().splitlines()]

    def test_installs_increment_and_attachments(self):
        """漏装 Increment 或附件、生成 .start 都必须失败。"""
        run = self.run_mount()
        self.assertEqual(run.returncode, 0, run.stderr)
        call, = self.calls()
        self.assertEqual(call['args'][:3], ['extension', 'add', '--dev'])
        self.assertEqual(call['args'][-1], '--force')
        self.assertEqual(call['manifest']['extension']['id'], 'modes')
        self.assertEqual([item['name'] for item in call['manifest']['provides']['commands']], ['speckit.modes.increment'])
        self.assertEqual(call['files']['skills/task-increment/references/example.md'], '附属资料')
        for item in call['manifest']['provides']['commands']:
            self.assertIn('正文', call['files'][item['file']])

    def test_every_run_reinstalls_all_sources(self):
        """已有登记或相同内容不得跳过官方重装；改动须进入本次输入。"""
        for _ in range(2):
            run = self.run_mount()
            self.assertEqual(run.returncode, 0, run.stderr)
        (self.skills / 'task-increment/SKILL.md').write_text('---\nname: task-increment\ndescription: 测试更新来源\n---\n更新正文\n')
        run = self.run_mount()
        self.assertEqual(run.returncode, 0, run.stderr)
        calls = self.calls()
        self.assertEqual(len(calls), 3)
        self.assertTrue(all('--force' in call['args'] for call in calls))
        self.assertIn('更新正文', calls[-1]['files']['skills/task-increment/SKILL.md'])

    def test_cli_failure_is_reported(self):
        """CLI 非零不能被安装器误报为成功。"""
        run = self.run_mount(TEST_CLI_EXIT='7')
        self.assertNotEqual(run.returncode, 0)
        self.assertTrue((self.project / 'calls.jsonl').is_file(), run.stderr)
        self.assertEqual(len(self.calls()), 1)
        self.assertNotIn('安装完成', run.stdout)

    def test_missing_source_does_not_submit_partial_install(self):
        """缺少 Increment 时不能提交输入并误删已有入口。"""
        (self.skills / 'task-increment/SKILL.md').unlink()
        run = self.run_mount()
        self.assertNotEqual(run.returncode, 0)
        self.assertFalse((self.project / 'calls.jsonl').exists())


if __name__ == '__main__':
    unittest.main()
