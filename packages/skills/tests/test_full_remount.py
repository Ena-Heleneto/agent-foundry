"""全量刷新回归：真实 shell 和文件操作，模拟 CLI 不代表官方验收。"""
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parent / 'fixtures/foundry-dev'


class FullRemountTests(unittest.TestCase):
    """已有配置不能使刷新跳过，失败的前置不能进入模式挂载。"""

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.project = self.root / 'project'
        (self.project / '.specify/extensions').mkdir(parents=True)
        (self.project / '.specify/init-options.json').write_text(json.dumps({'ai': 'codex', 'ai_skills': True, 'speckit_version': '1.2.6'}))
        self.config = self.project / '.specify/extensions.yml'
        self.config.write_text('hooks:\n  before_plan:\n  - extension: custom\n    command: keep\n    enabled: false\ninstalled: []\nsettings:\n  auto_execute_hooks: false\ncustom: keep\n')

    def test_dev_hooks_delegates_to_native_script(self):
        action = self.project / 'scripts/dev/actions/register-hooks'
        shutil.copytree(ROOT / 'scripts/dev/actions/register-hooks', action)
        native = self.project / 'packages/skills/script/register-hooks/register-hooks.sh'
        native.parent.mkdir(parents=True)
        native.write_text('#!/bin/bash\nprintf "%s\\n" "$@"\nexit 7\n')
        run = subprocess.run(['bash', str(action / 'register-hooks.sh')], capture_output=True, text=True)
        self.assertEqual(run.returncode, 7)
        self.assertEqual(run.stdout.splitlines(), ['--project', str(self.project), '--skills-dir', str(self.project / '.agents/skills')])

    def test_full_entry_calls_modes_after_hooks_and_skips_on_failure(self):
        entry = self.project / 'scripts/dev/nuxt-prepare/nuxt-prepare.sh'
        entry.parent.mkdir(parents=True)
        shutil.copyfile(ROOT / 'scripts/dev/nuxt-prepare/nuxt-prepare.sh', entry)
        for action, label in [('install-opensource-skills', 'install'), ('link-skills', 'skills'), ('register-hooks', 'hooks')]:
            file = self.project / f'scripts/dev/actions/{action}/{action}.sh'
            file.parent.mkdir(parents=True)
            file.write_text(f'#!/bin/bash\necho {label} >> "{self.project}/order"\n')
        mode = self.project / 'packages/skills/script/register-commands/register-commands.sh'
        mode.parent.mkdir(parents=True)
        mode.write_text(f'#!/bin/bash\necho "$*" >> "{self.project}/order"\n')
        for _ in range(2):
            run = subprocess.run(['bash', str(entry)], capture_output=True, text=True)
            self.assertEqual(run.returncode, 0, run.stderr)
        lines = (self.project / 'order').read_text().splitlines()
        self.assertEqual(len(lines), 8)
        self.assertEqual(lines[:3], ['install', 'skills', 'hooks'])
        self.assertIn('--skills-dir', lines[3])
        self.assertNotIn('--mode', lines[3])
        hook = self.project / 'scripts/dev/actions/register-hooks/register-hooks.sh'
        hook.write_text('#!/bin/bash\nexit 1\n')
        run = subprocess.run(['bash', str(entry)], capture_output=True, text=True)
        self.assertNotEqual(run.returncode, 0)
        self.assertEqual(len((self.project / 'order').read_text().splitlines()), 10)


if __name__ == '__main__':
    unittest.main()
