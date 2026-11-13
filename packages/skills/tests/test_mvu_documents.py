"""在独立项目实际运行原生模板解析及准备脚本；不把文本契约检查当作 agent 行为验证。"""

import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import unittest


REPO_ROOT = Path(__file__).resolve().parents[3]
SPECIFY_ROOT = Path(__file__).resolve().parent / 'fixtures/specify/.specify'


class MvuDocumentTests(unittest.TestCase):
    """验证项目覆盖真实传入原生流程，并保护旧材料及失败现场。"""

    def project(self, overrides: bool = True) -> tuple[Path, Path]:
        """复制官方脚本与模板到临时项目，不读取真实 feature 指针或用户资料。"""
        temp = tempfile.TemporaryDirectory(prefix='skills-mvu-')
        self.addCleanup(temp.cleanup)
        root = Path(temp.name)
        shutil.copytree(SPECIFY_ROOT / 'scripts', root / '.specify/scripts')
        templates = root / '.specify/templates'
        templates.mkdir(parents=True)
        for name in ('plan-template', 'tasks-template'):
            shutil.copy2(SPECIFY_ROOT / f'templates/{name}.md', templates / f'{name}.md')
            source = SPECIFY_ROOT / f'templates/overrides/{name}.md'
            if overrides and source.is_file():
                (templates / 'overrides').mkdir(exist_ok=True)
                shutil.copy2(source, templates / 'overrides' / source.name)
        feature = root / 'specs/notes/001-filter'
        feature.mkdir(parents=True)
        (feature / 'spec.md').write_text('# 标签筛选\n\n选择标签筛选，清除后恢复全部。\n')
        return root, feature

    def run_native(self, root: Path, feature: Path, script: str, *args: str) -> subprocess.CompletedProcess:
        """显式传递目标项目与功能目录，保证脚本不会回落到 monorepo。"""
        env = {**os.environ, 'SPECIFY_INIT_DIR': str(root),
               'SPECIFY_FEATURE_DIRECTORY': str(feature),
               'SPECIFY_FEATURE': '001-filter', 'SPECIFY_FEATURE_NO_PERSIST': '1'}
        return subprocess.run(['bash', str(root / '.specify/scripts/bash' / script), *args],
                              cwd=root, env=env, capture_output=True, text=True, timeout=30)

    def test_overrides_reach_plan_and_task_preparation(self) -> None:
        """原生准备脚本实际使用覆盖，完整原章节仍在，不能只发现文件。"""
        root, feature = self.project()
        plan = self.run_native(root, feature, 'setup-plan.sh', '--json')
        self.assertEqual(plan.returncode, 0, plan.stderr)
        self.assertEqual(Path(json.loads(plan.stdout)['FEATURE_DIR']), feature)
        for name in ('plan-template', 'tasks-template'):
            resolved = self.run_native(root, feature, 'resolve-template.sh', name, '--json')
            self.assertEqual(resolved.returncode, 0, resolved.stderr)
            content = json.loads(resolved.stdout)['TEMPLATE_CONTENT']
            self.assertIn('mvu.md', content, f'{name} 没有明确新文件契约')
            core = (SPECIFY_ROOT / f'templates/{name}.md').read_text()
            for heading in re.findall(r'^#{1,6} .+', core, re.MULTILINE):
                self.assertIn(heading, content, f'覆盖丢失原生结构：{heading}')
            if name == 'plan-template':
                self.assertEqual((feature / 'plan.md').read_text(), content)
            else:
                tasks = self.run_native(root, feature, 'setup-tasks.sh', '--json')
                self.assertEqual(tasks.returncode, 0, tasks.stderr)
                data = json.loads(tasks.stdout)
                self.assertEqual(Path(data['TASKS_TEMPLATE']).parent, root / '.specify/templates/overrides')
                self.assertEqual(data['TASKS_TEMPLATE_CONTENT'], content)
                self.assertFalse((feature / 'tasks.md').exists(), '准备脚本不能伪装成任务生成')
        self.assertFalse((root / '.specify/feature.json').exists())

    def test_without_overrides_remains_a_distinct_control(self) -> None:
        """没有覆盖时返回原核心模板，不把技能包安装误报为模板自动安装。"""
        root, feature = self.project(overrides=False)
        for name in ('plan-template', 'tasks-template'):
            result = self.run_native(root, feature, 'resolve-template.sh', name, '--json')
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(json.loads(result.stdout)['TEMPLATE_CONTENT'],
                             (SPECIFY_ROOT / f'templates/{name}.md').read_text())

    def test_task_preparation_delivers_lightweight_scheme_without_rewriting_history(self) -> None:
        """模板遗漏独立方案职责时失败；重复原生准备不得改已有身份、方案和证据。"""
        root, feature = self.project()
        (feature / 'plan.md').write_text('# 原方案\n\n详情见mvu.md。\n')
        (feature / 'mvu.md').write_text('# 小闭环\n\n关联T001与T002，保留原验收。\n')
        (feature / 'implementation').mkdir()
        proposal = feature / 'implementation/T001.md'
        proposal.write_text('# T001方案\n\n原逻辑及真实认可来源保持，不复制工程状态。\n')
        (feature / 'tasks.md').write_text(
            '- [x] T001 原完成任务，见[方案](implementation/T001.md)。\n'
            '- [ ] T002 原待办，依赖T001；原验收保持。\n')
        (feature / 'evidence.md').write_text('原证据保持。\n')
        before = {str(p.relative_to(feature)): p.read_bytes()
                  for p in feature.rglob('*') if p.is_file()}
        for _ in range(2):
            result = self.run_native(root, feature, 'setup-tasks.sh', '--json')
            self.assertEqual(result.returncode, 0, result.stderr)
            content = json.loads(result.stdout)['TASKS_TEMPLATE_CONTENT']
            for requirement in ('轻量任务', '不强制八栏目', 'implementation/<Task ID>.md',
                                '真实讨论认可', '保存并读回', '唯一工程 checkbox'):
                self.assertIn(requirement, content, f'原生准备未传递方案职责：{requirement}')
            self.assertEqual({str(p.relative_to(feature)): p.read_bytes()
                              for p in feature.rglob('*') if p.is_file()}, before)

    def test_legacy_and_existing_materials_survive_repeated_setup(self) -> None:
        """兼容旧 plan 和已有 mvu；准备、重复和恢复不重写原 Task 或历史证据。"""
        for existing in (False, True):
            with self.subTest(existing_mvu=existing):
                root, feature = self.project()
                (feature / 'plan.md').write_text('# 原方案\n\n## MVU-001\n\n原业务结果。\n')
                (feature / 'tasks.md').write_text('- [x] T001 原任务，验收及历史保持。\n')
                (feature / 'evidence.md').write_text('原证据，不随新规划改写。\n')
                if existing:
                    (feature / 'mvu.md').write_text('# 小闭环\n\n仅在此处的验收条件。\n')
                before = {p.name: p.read_bytes() for p in feature.iterdir()}
                for _ in range(2):
                    for name in ('setup-plan.sh', 'setup-tasks.sh'):
                        result = self.run_native(root, feature, name, '--json')
                        self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual({p.name: p.read_bytes() for p in feature.iterdir()}, before)

    def test_mvu_does_not_replace_required_plan(self) -> None:
        """孤立 mvu/tasks 不满足原生方案前置，失败时原材料保持。"""
        root, feature = self.project()
        (feature / 'mvu.md').write_text('# 有闭环但缺方案\n')
        (feature / 'tasks.md').write_text('- [x] T001 历史完成。\n')
        before = {p.name: p.read_bytes() for p in feature.iterdir()}
        result = self.run_native(root, feature, 'setup-tasks.sh', '--json')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('plan.md not found', result.stderr)
        self.assertEqual({p.name: p.read_bytes() for p in feature.iterdir()}, before)

    def test_real_plan_save_failure_does_not_touch_other_materials(self) -> None:
        """目录占位制造真实保存错误，不更改文件权限或替换保护材料。"""
        root, feature = self.project()
        (feature / 'plan.md').mkdir()
        (feature / 'mvu.md').write_text('# 已保存详情\n')
        (feature / 'tasks.md').write_text('- [x] T001 原任务\n')
        before = {name: (feature / name).read_bytes() for name in ('mvu.md', 'tasks.md')}
        result = self.run_native(root, feature, 'setup-plan.sh', '--json')
        self.assertNotEqual(result.returncode, 0)
        self.assertTrue((feature / 'plan.md').is_dir())
        self.assertEqual({name: (feature / name).read_bytes() for name in before}, before)


if __name__ == '__main__':
    unittest.main()
