"""验证单次构建的内容目录与源码一致；MCP 应用消费契约不在本轮范围。"""
import json
from pathlib import Path
import re
import unittest

PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = PACKAGE_ROOT.parents[1]


class ArtifactTests(unittest.TestCase):
    """确认交付完整目录、技能治理引用及退役内容保护。"""

    def assert_project_governance_is_reachable(self, skill: str) -> None:
        """解析目标项目治理引用，发现失效文件或旧子任务标题锚点。"""
        candidates = re.findall(r'\[[^\]]*\]\(([^)]+)\)|`([^`\n]+)`', skill)
        references = [link or inline for link, inline in candidates if '.specify/memory/constitution.md' in (link or inline)]
        self.assertTrue(references, '技能缺少目标项目治理引用')
        for reference in set(references):
            relative, _, anchor = reference.partition('#')
            self.assertEqual(Path(relative), Path('.specify/memory/constitution.md'), f'治理引用并非项目根目录路径：{relative}')
            path = REPO_ROOT / relative
            self.assertTrue(path.is_file(), f'治理文件不可达：{relative}')
            content = path.read_text()
            self.assertRegex(content, r'(?m)^### VII\. ')
            if anchor:
                headings = re.findall(r'^#{1,6}\s+(.+)$', content, re.MULTILINE)
                anchors = {re.sub(r'[^\w\s-]', '', heading.lower()).replace(' ', '-') for heading in headings}
                self.assertIn(anchor, anchors, f'治理锚点不可达：{reference}')

    def test_business_node_delivery_is_independent_coding_skill(self) -> None:
        """通用实施规则独立分发，不进入工作流挂载或项目治理前置。"""
        name = 'business-node-delivery'
        source = PACKAGE_ROOT / 'src/skills/coding' / name / 'SKILL.md'
        delivered = PACKAGE_ROOT / 'dist/skills/coding' / name / 'SKILL.md'
        self.assertTrue(source.is_file(), '通用实施规则应属于 coding 分类')
        self.assertFalse((PACKAGE_ROOT / 'src/skills/workflow' / name).exists())
        self.assertTrue(delivered.is_file(), '默认构建应交付独立规则')
        self.assertFalse((PACKAGE_ROOT / 'dist/skills/workflow' / name).exists())
        self.assertEqual(source.read_bytes(), delivered.read_bytes())

        release = json.loads((PACKAGE_ROOT / 'dist/release.json').read_text())
        entries = [skill for skill in release['skills'] if skill['name'] == name]
        self.assertEqual(len(entries), 1, '默认发行清单应包含唯一的通用规则')
        skill = entries[0]
        self.assertEqual(skill['category'], 'coding')
        self.assertEqual(skill['directory'], f'skills/coding/{name}')
        self.assertEqual(skill['requiresSkills'], [])
        self.assertEqual(skill['projectPrerequisites'], [])
        self.assertEqual(skill['mountMappingIds'], [])

    def test_mode_sources_link_project_governance(self) -> None:
        """迁移后的模式正文仍提供正确治理入口。"""
        for name in ('task-tutor', 'task-pair', 'task-direct'):
            with self.subTest(skill=name):
                path = PACKAGE_ROOT / 'src/skills/workflow' / name / 'SKILL.md'
                self.assertTrue(path.is_file(), f'待实现的模式来源：{path.relative_to(PACKAGE_ROOT)}')
                self.assert_project_governance_is_reachable(path.read_text())

    def test_delivered_modes_link_project_governance(self) -> None:
        """线下交付文件仍包含完整治理引用。"""
        for name in ('task-tutor', 'task-pair', 'task-direct'):
            with self.subTest(skill=name):
                path = PACKAGE_ROOT / 'dist/skills/workflow' / name / 'SKILL.md'
                self.assertTrue(path.is_file(), f'未交付的模式文件：{path.relative_to(PACKAGE_ROOT)}')
                self.assert_project_governance_is_reachable(path.read_text())

    def test_increment_delivery_matches_source_with_reachable_governance(self) -> None:
        """独立核验 Increment 实际交付，避免其他待迁移模式遮蔽其结果。"""
        source = PACKAGE_ROOT / 'src/skills/workflow/task-increment/SKILL.md'
        delivered = PACKAGE_ROOT / 'dist/skills/workflow/task-increment/SKILL.md'
        for path in (source, delivered):
            self.assertTrue(path.is_file(), f'Increment 来源或交付缺失：{path.relative_to(PACKAGE_ROOT)}')
            self.assert_project_governance_is_reachable(path.read_text())
        self.assertEqual(delivered.read_bytes(), source.read_bytes(), 'Increment 交付不是当前完整来源')

    def test_direct_delivery_replaces_explore_with_complete_source(self) -> None:
        """消费者收到同版 Direct 全目录，旧 Explore 不随构建继续交付。"""
        source = PACKAGE_ROOT / 'src/skills/workflow/task-direct'
        delivered = PACKAGE_ROOT / 'dist/skills/workflow/task-direct'
        for root in (source, delivered):
            self.assertTrue((root / 'SKILL.md').is_file(), f'Direct 入口缺失：{root}')
            text = (root / 'SKILL.md').read_text()
            self.assertRegex(text, r'(?m)^name: task-direct$')
            self.assert_project_governance_is_reachable(text)
            self.assertFalse((root.parent / 'task-explore').exists(), '旧 Explore 仍作为来源或构建交付存在')
        expected = {p.relative_to(source): p.read_bytes() for p in source.rglob('*') if p.is_file()}
        actual = {p.relative_to(delivered): p.read_bytes() for p in delivered.rglob('*') if p.is_file()}
        self.assertEqual(actual, expected, 'Direct 正文或附件不是同版完整来源')

    def test_direct_has_no_repository_specific_dependencies(self) -> None:
        """分发正文不依赖作者工作区、个人画像或已退役模式的路径。"""
        source = PACKAGE_ROOT / 'src/skills/workflow/task-direct'
        self.assertTrue(source.is_dir(), 'Direct 来源尚未迁移')
        for path in source.rglob('*.md'):
            with self.subTest(path=path.relative_to(source)):
                text = path.read_text()
                for forbidden in (str(REPO_ROOT), 'user-shadow/', 'Foundry', 'task-guide/', 'task-explore/'):
                    self.assertNotIn(forbidden, text)

    def test_tutor_delivery_includes_reachable_report_reference(self) -> None:
        """独立消费者获得完整 Tutor 正文与可达的共同报告附件。"""
        source = PACKAGE_ROOT / 'src/skills/workflow/task-tutor'
        delivered = PACKAGE_ROOT / 'dist/skills/workflow/task-tutor'
        for root in (source, delivered):
            with self.subTest(root=root.relative_to(PACKAGE_ROOT)):
                entry = root / 'SKILL.md'
                self.assertTrue(entry.is_file())
                text = entry.read_text()
                self.assert_project_governance_is_reachable(text)
                references = re.findall(r'\[[^\]]*\]\((references/[^)#]+)(?:#[^)]*)?\)', text)
                self.assertIn('references/learning-report.md', references)
                for reference in references:
                    self.assertTrue((root / reference).is_file(), f'Tutor 引用附件缺失：{reference}')
        expected = {p.relative_to(source): p.read_bytes() for p in source.rglob('*') if p.is_file()}
        actual = {p.relative_to(delivered): p.read_bytes() for p in delivered.rglob('*') if p.is_file()}
        self.assertEqual(actual, expected, 'Tutor 正文和附件必须同版完整交付')

    def test_tutor_is_portable_to_target_project(self) -> None:
        """通用 Tutor 及报告附件不依赖作者仓库或已退役管理核心。"""
        source = PACKAGE_ROOT / 'src/skills/workflow/task-tutor'
        for path in source.rglob('*.md'):
            with self.subTest(path=path.relative_to(source)):
                for forbidden in (str(REPO_ROOT), 'Foundry', 'user-shadow/', 'apps/personal-hub/', 'workflow-task-context'):
                    self.assertNotIn(forbidden, path.read_text())

    def test_built_content_matches_all_source_files(self) -> None:
        """完整目录及附属文件按字节交付，MCP 派生清单另行验证。"""
        for name in ('mcp', 'skills'):
            with self.subTest(content=name):
                source = PACKAGE_ROOT / 'src' / name
                output = PACKAGE_ROOT / 'dist' / name
                self.assertTrue(source.is_dir())
                self.assertTrue(output.is_dir())
                expected = {p.relative_to(source): p.read_bytes() for p in source.rglob('*') if p.is_file() and p.name != '.gitkeep'}
                actual = {p.relative_to(output): p.read_bytes() for p in output.rglob('*') if p.is_file() and not (name == 'mcp' and p.relative_to(output) == Path('manifest.json'))}
                self.assertEqual(actual, expected)
        self.assertGreater(len(list((PACKAGE_ROOT / 'dist/skills').rglob('SKILL.md'))), 0)

    def test_mcp_manifest_contains_real_smoke_skill_and_reference(self) -> None:
        """真实构建清单取自 MCP 源，样例及附件完整且不混入线下技能。"""
        source = PACKAGE_ROOT / 'src/mcp'
        manifest = json.loads((PACKAGE_ROOT / 'dist/mcp/manifest.json').read_text())
        self.assertEqual(set(manifest), {'version', 'skills'})
        self.assertEqual(manifest['version'], 1)
        entries = {entry['name']: entry for entry in manifest['skills']}
        self.assertEqual(len(entries), len(list(source.rglob('SKILL.md'))))
        self.assertIn('mcp-build-smoke', entries)
        offline_names = {path.parent.name for path in (PACKAGE_ROOT / 'src/skills').rglob('SKILL.md')}
        self.assertTrue(set(entries).isdisjoint(offline_names), 'MCP 清单不得混入线下技能')
        smoke = entries['mcp-build-smoke']
        self.assertFalse(smoke['destructive'])
        self.assertIsNone(smoke['category'])
        self.assertEqual(smoke['skill'], (source / 'mcp-build-smoke/SKILL.md').read_text())
        self.assertEqual(smoke['references'], [{'name': 'verification.md', 'content': (source / 'mcp-build-smoke/references/verification.md').read_text()}])
        self.assertFalse((source / 'manifest.json').exists())
        self.assertFalse((PACKAGE_ROOT / 'dist/manifest.json').exists())

    def test_retired_workflow_has_no_active_callers(self) -> None:
        """退役技能及 helper 不得出现在交付正文和附属资料中。"""
        source = PACKAGE_ROOT / 'src/skills'
        self.assertFalse((source / 'speckit/workflow-task-context').exists())
        for path in (PACKAGE_ROOT / 'dist/skills').rglob('*.md'):
            with self.subTest(path=path):
                self.assertNotIn('workflow-task-context', path.read_text())

    def test_constitution_prompt_skill_is_retired(self) -> None:
        """旧治理提示词技能不得在迁移或构建时重新出现。"""
        for root in (PACKAGE_ROOT / 'src/skills', PACKAGE_ROOT / 'dist/skills'):
            self.assertFalse(any(p.parent.name == 'artifact-constitution-prompt' for p in root.rglob('SKILL.md')))

    def test_single_build_has_only_consumer_directories(self) -> None:
        """构建不存在旧清单、空 JS 或含混的 install 目录。"""
        self.assertEqual({p.name for p in (PACKAGE_ROOT / 'dist').iterdir()}, {'mcp', 'skills', 'script', 'release.json', 'projections'})


if __name__ == '__main__':
    unittest.main()
