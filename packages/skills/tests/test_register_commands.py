"""通过真实构建产物验证同包引擎提交 Increment 和传播错误。"""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

PACKAGE = Path(__file__).resolve().parents[1]
SKILL_PATH = Path('.agents/skills/task-increment')
SKILL_BODY = (
    '---\nname: task-increment\ndescription: 回归测试技能\n---\n'
    'Increment 业务正文。[附件](references/example.md)\n'
)
ATTACHMENT = '附属资料\n'

CLI_RECORDER = """#!/usr/bin/env python3
import json
import os
from pathlib import Path
import sys

args = sys.argv[1:]
if args == ['--version']:
    print('specify 1.2.6')
    sys.exit(0)
assert args[:3] == ['extension', 'add', '--dev'], args
source = Path(args[3])
with Path('calls.jsonl').open('a', encoding='utf-8') as log:
    log.write(json.dumps({
        'args': args,
        'manifest': json.loads((source / 'extension.yml').read_text(encoding='utf-8')),
        'files': {
            path.relative_to(source).as_posix(): path.read_text(encoding='utf-8')
            for path in source.rglob('*') if path.is_file()
        },
    }) + '\\n')
sys.exit(int(os.environ['TEST_CLI_EXIT']))
"""


class RegisterCommandsTests(unittest.TestCase):
    """在已安装技能的临时项目中运行生成的统一引擎。"""

    @classmethod
    def setUpClass(cls):
        """用现行 Vite 配置从单 Increment 来源生成技能和引擎。"""
        temporary = tempfile.TemporaryDirectory(prefix='foundry increment build ')
        cls.addClassCleanup(temporary.cleanup)
        root = Path(temporary.name)
        for name in ('package.json', 'vite.config.ts'):
            shutil.copy2(PACKAGE / name, root / name)
        for name in ('build', 'utils', 'src/workflow/plugin/vite-plugin-speckit-mount'):
            shutil.copytree(PACKAGE / name, root / name)
        (root / 'node_modules').mkdir()
        for name in ('vite', 'sh-syntax', 'yaml'):
            (root / 'node_modules' / name).symlink_to(
                PACKAGE / 'node_modules' / name, target_is_directory=True,
            )

        collection = root / 'src/workflow'
        source = collection / 'task-increment'
        (source / 'references').mkdir(parents=True)
        (source / 'SKILL.md').write_text(SKILL_BODY, encoding='utf-8')
        (source / 'references/example.md').write_text(ATTACHMENT, encoding='utf-8')
        config = {
            'packageName': 'workflow',
            'plugin': True,
            'skill': {'task-increment': {'enabled': True, 'command': 'speckit.modes.increment'}},
        }
        (collection / 'collection.config.ts').write_text(
            'export default ' + json.dumps(config), encoding='utf-8',
        )
        build = subprocess.run(
            ['node', str(PACKAGE / 'node_modules/vite/bin/vite.js'), 'build'],
            cwd=root, capture_output=True, text=True, timeout=30,
        )
        if build.returncode != 0:
            raise RuntimeError(f'Increment 隔离构建失败\n{build.stdout}{build.stderr}')
        cls.dist = root / 'dist'

    def setUp(self):
        """用本轮构建出的技能准备目标项目，用记录器替换外部 CLI。"""
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        self.project = root / 'project with spaces'
        (self.project / '.specify').mkdir(parents=True)
        self.installed = self.project / SKILL_PATH
        shutil.copytree(self.dist / 'skill/workflow/task-increment', self.installed)
        self.bin_dir = root / 'bin'
        self.bin_dir.mkdir()
        self.temporary = root / 'registration inputs'
        self.temporary.mkdir()
        cli = self.bin_dir / 'specify'
        cli.write_text(CLI_RECORDER, encoding='utf-8')
        cli.chmod(0o755)

    def run_mount(self, cli_exit=0):
        """调用本次构建的统一入口，核对注册输入按次清理。"""
        env = {
            **os.environ,
            'PATH': str(self.bin_dir) + os.pathsep + os.environ.get('PATH', os.defpath),
            'TMPDIR': str(self.temporary),
            'TEST_CLI_EXIT': str(cli_exit),
        }
        result = subprocess.run(
            ['bash', str(self.dist / 'engine/install.sh')],
            cwd=self.project, capture_output=True, text=True, env=env, timeout=15,
        )
        self.assertEqual(list(self.temporary.iterdir()), [])
        return result

    def calls(self):
        """读取外部 CLI 实际接收的输入。"""
        log = (self.project / 'calls.jsonl').read_text(encoding='utf-8')
        return [json.loads(line) for line in log.splitlines()]

    def assert_increment_registration(self, call):
        """提交仅含 Increment 的官方扩展，命令引用目标目录的完整技能。"""
        self.assertEqual(call['args'][:3], ['extension', 'add', '--dev'])
        self.assertEqual(call['manifest']['extension']['id'], 'modes')
        self.assertEqual(call['manifest']['provides']['commands'], [{
            'name': 'speckit.modes.increment',
            'file': 'commands/increment.md',
            'description': '回归测试技能',
        }])
        self.assertEqual(set(call['files']), {'commands/increment.md', 'extension.yml'})
        command = call['files']['commands/increment.md']
        self.assertIn((SKILL_PATH / 'SKILL.md').as_posix(), command)
        self.assertIn('$ARGUMENTS', command)
        self.assertNotIn('Increment 业务正文', command)

    def test_increment_and_attachments_survive_mount(self):
        """真实产物交付完整正文和附件，并注册引用这份内容的入口。"""
        run = self.run_mount()
        self.assertEqual(run.returncode, 0, run.stderr)
        call, = self.calls()
        self.assert_increment_registration(call)
        self.assertEqual((self.installed / 'SKILL.md').read_bytes(), SKILL_BODY.encode('utf-8'))
        self.assertEqual((self.installed / 'references/example.md').read_bytes(), ATTACHMENT.encode('utf-8'))

    def test_each_mount_submits_increment_reference(self):
        """重复挂载继续提交当前引用，保留官方冲突的退出状态。"""
        first = self.run_mount()
        self.assertEqual(first.returncode, 0, first.stderr)
        second = self.run_mount(cli_exit=1)
        self.assertEqual(second.returncode, 1, second.stderr)
        updated_body = '更新后的 Increment 正文\n'
        (self.installed / 'SKILL.md').write_text(updated_body, encoding='utf-8')
        third = self.run_mount(cli_exit=1)
        self.assertEqual(third.returncode, 1, third.stderr)
        calls = self.calls()
        self.assertEqual(len(calls), 3)
        for call in calls:
            self.assert_increment_registration(call)
        self.assertEqual(len({call['args'][3] for call in calls}), 3)
        self.assertEqual((self.installed / 'SKILL.md').read_text(encoding='utf-8'), updated_body)
        self.assertEqual((self.installed / 'references/example.md').read_bytes(), ATTACHMENT.encode('utf-8'))

    def test_cli_failure_is_reported(self):
        """指定的 CLI 失败码经实际引擎返回。"""
        run = self.run_mount(cli_exit=7)
        self.assertEqual(run.returncode, 7, run.stderr)
        call, = self.calls()
        self.assert_increment_registration(call)
        self.assertNotIn('安装完成', run.stdout)

    def test_missing_source_does_not_submit_partial_install(self):
        """合法引擎拒绝缺少 Increment 正文的项目并保留已有入口。"""
        existing = self.project / '.specify/extensions/modes/commands/increment.md'
        existing.parent.mkdir(parents=True)
        existing.write_text('已有 Increment 入口\n', encoding='utf-8')
        (self.installed / 'SKILL.md').unlink()
        run = self.run_mount()
        self.assertEqual(run.returncode, 1, run.stderr)
        self.assertIn(f'缺少已安装技能：{SKILL_PATH.as_posix()}/SKILL.md', run.stderr)
        self.assertFalse((self.project / 'calls.jsonl').exists())
        self.assertEqual(existing.read_text(encoding='utf-8'), '已有 Increment 入口\n')


if __name__ == '__main__':
    unittest.main()
