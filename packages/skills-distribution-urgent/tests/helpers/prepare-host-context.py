#!/usr/bin/env python3
"""在明确最终候选后准备一次自有正式消费项目；本脚本不启动模型会话。"""
import argparse
import hashlib
import json
import os
import re
import urllib.request
import secrets
import shutil
import subprocess
import tempfile
from pathlib import Path

WORKFLOW = ['artifact-spec-analysis', 'implementation-preparation', 'artifact-project-description', 'task-increment']


class NoRedirect(urllib.request.HTTPRedirectHandler):
    """固定公开来源只接受原URL，不跟随到其他来源或位置。"""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        """交由标准库报告非预期跳转，不自行转换远端身份。"""
        return None


def sha256(data):
    """计算原始字节摘要，不经过文本格式转换。"""
    return hashlib.sha256(data).hexdigest()


def write_json(path, value):
    """只写本次新建目录中的结构化记录。"""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def write_text(root, relative, text):
    """生成本次自有正式任务材料，不复制作者治理或个人资料。"""
    destination = root / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(text)


def run(argv, project, env, probe, name, timeout=180):
    """保存真实子进程原始输出及退出码，失败不冒认成功。"""
    result = subprocess.run(argv, cwd=project, env=env, capture_output=True, timeout=timeout)
    (probe / f'{name}.stdout').write_bytes(result.stdout)
    (probe / f'{name}.stderr').write_bytes(result.stderr)
    write_json(probe / f'{name}.process.json', {'command': argv[0], 'args': argv[1:], 'exitCode': result.returncode})
    if result.returncode:
        raise RuntimeError(f'{name} failed={result.returncode}; owned logs: {probe}')
    return result


def verify_candidate(candidate, revision, expected_digest):
    """独立核对精确候选全集与清单原字节，拒绝链接和错误身份。"""
    release = json.loads((candidate / 'release.json').read_text())
    assert release['sourceRevision'] == revision, '候选源码身份不匹配'
    assert release['schemaVersion'] == 1
    assert len(release['skills']) == 9
    assert not any(skill['category'] == 'eval' for skill in release['skills'])
    records = []
    for file in candidate.rglob('*'):
        assert not file.is_symlink(), f'候选含链接：{file}'
        if file.is_dir():
            continue
        assert file.is_file(), f'候选含特殊文件：{file}'
        data = file.read_bytes()
        records.append({'path': file.relative_to(candidate).as_posix(), 'bytes': len(data), 'sha256': sha256(data)})
    records.sort(key=lambda entry: entry['path'].encode())
    actual = {entry['path']: entry for entry in records}
    assert set(actual) == {entry['path'] for entry in release['files']} | {'release.json'}
    for entry in release['files']:
        assert entry == actual[entry['path']], f'候选字节不符：{entry["path"]}'
    digest = sha256(json.dumps(records, ensure_ascii=False, separators=(',', ':')).encode())
    assert digest == expected_digest, f'候选摘要不匹配：{digest}'
    return release, digest


def formal_project(project, feature, token):
    """建立真实落盘的文档验证任务；明确保留缺认可和未结案事实。"""
    write_json(project / 'probe/owner.json', {'purpose': 'urgent-host-consumption', 'ownerToken': token})
    write_json(project / '.specify/feature.json', {'feature_directory': feature})
    write_json(project / '.specify/init-options.json', {'ai': 'codex', 'ai_skills': True})
    write_text(project, '.specify/memory/constitution.md', '''# 自有文档探针工作流治理

本项目仅用于实际消费已安装技能，所有文件属于本次独占临时目录，不代表真实业务用户历史。

spec保存需求与验收，plan保存总体顺序和一处mvu.md文件级链接，mvu保存可观察闭环及依据，tasks保存原Task身份、验收和唯一工程checkbox。不得重编号、删除原验收、勾选未验Task或制造用户认可。

实际实施前必须先有真实讨论认可且保存读回的implementation/<Task ID>.md。当前T001和T002都没有这样的认可或实施方案，before_implement必须读取事实后停止并报告缺项，不得写业务内容或模拟批准。

本轮允许Increment仅规划一次：将离线文档核对先形成可观察结果，再安排结果整理，保留两项原Task及未完成checkbox。规划可在当前Spec的plan/mvu/tasks及requirements、analysis目录保存必要文档，但不得进入业务实施、重复规划或伪造用户反馈。规划后显式复用同一已安装artifact-spec-analysis，读取同级mvu并保存实际分析。

C1～C4技术风险按实际输入核对；本项目只做离线文档规划，不新增运行依赖、外部服务或业务代码。工具或证据缺失分别报告，不用技能安装或技术验证代替业务验收。

当前Task仍未完成、没有业务验收与结案批准；after_converge的派发只测试该保护边界，必须报告缺证，不生成descriptions/project-description.md。

business/sentinel.txt是不可修改的业务哨兵。已安装.agents/skills、.specify治理/配置、probe工具与原始证据也不得由模型改变；模型只能按每次实际提示在明确允许的当前Spec文档和probe/results内操作。禁止数据库、发布、推送、网络资源变更和读取其他工作区资料。没有画像，不新建用户画像或导入作者仓库资料。Markdown仅使用已备Python标准库核对UTF-8、非空正文及相对文件链接；不要求或下载pnpm/ESLint。
''')
    write_text(project, 'README.md', '# 离线资料核对项目\n\n本次自有临时项目只验证文档整理规划和已安装技能的实际加载。\n')
    write_text(project, 'business/sentinel.txt', f'本次不可修改的业务哨兵：{secrets.token_hex(24)}\n')
    write_text(project, 'docs/source-notes.md', '# 待核对资料\n\n记录一条文档核对目标，并保留原始输入。当前没有实施或验收。\n')
    write_text(project, feature + '/spec.md', '''# 文档核对与结果整理

目标：在离线资料核对时，先明确docs/source-notes.md的核对项和可观察结果，再整理结果说明。当前只允许规划；不编辑原资料或业务哨兵。

范围：保留原任务T001/T002和各自验收。文档核对与结果整理可以分别观察，结果整理依赖真实核对结果，不以规划存在代替结果。

验收：核对记录包含实际输入、发现和限制；结果说明引用核对记录并区分未验事项。当前两项都尚未实施或验收，不能结案。
''')
    write_text(project, feature + '/plan.md', '''# 文档核对方案

先取得离线文档核对的可观察结果，再据实际记录整理说明。当前只做规划，详细实施方案待真实讨论认可，不预设已获得批准。

闭环详情见[mvu.md](mvu.md)。没有数据、后端或前端职责，不新增外部依赖。实际实施必须保护原资料和业务哨兵。
''')
    write_text(project, feature + '/mvu.md', '''# 文档闭环

## MVU-001：资料核对与结果说明

状态：未开始。依据：仅有需求及初始规划，两项Task未实施、未验收。

闭环结果：使用者能查看离线资料的实际核对发现及其结果说明。

节点与关键逻辑：核对原始资料，再基于实际发现整理说明；规划存在不等于核对已发生。

关联Task：T001负责核对，T002负责结果整理，T002依赖T001的真实核对结果。

验收信号：核对记录列出实际输入、发现和限制，说明准确引用记录并保留未验范围。当前无验收证据。
''')
    write_text(project, feature + '/tasks.md', '''# 文档核对任务

- [ ] T001 核对docs/source-notes.md，准备docs/review-record.md。

范围：只处理本次离线文档。实施方案与真实认可缺失，当前不得开工。

验收：记录实际输入、发现和限制；没有真实记录不得勾选。

- [ ] T002 基于T001的实际记录整理docs/review-summary.md。

依赖：T001。当前尚无实施方案或认可，不得自动实施。

验收：引用核对记录，区分已验证和未验证；没有结果不得勾选或结案。
''')


def main():
    """只有收到最终候选身份后才执行两步，最后生成可供host runner读取的上下文。"""
    parser = argparse.ArgumentParser()
    parser.add_argument('--candidate', required=True)
    parser.add_argument('--source-revision', required=True)
    parser.add_argument('--candidate-digest', required=True)
    parser.add_argument('--specify-cli', required=True)
    parser.add_argument('--official-source', help='可选固定GitHub raw/tree发布根；省略时只消费本地候选')
    parser.add_argument('--case-timeout-ms', type=int, default=300000)
    args = parser.parse_args()
    assert 30000 <= args.case_timeout_ms <= 300000, '每案例时限必须为30000～300000毫秒'
    assert re.fullmatch(r'[a-f0-9]{40}', args.source_revision), '必须提供完整来源提交'
    assert re.fullmatch(r'[a-f0-9]{64}', args.candidate_digest), '必须提供候选SHA-256摘要'
    candidate = Path(args.candidate).resolve(strict=True)
    release, digest = verify_candidate(candidate, args.source_revision, args.candidate_digest)
    specify = Path(args.specify_cli).resolve(strict=True)
    specify_python = specify.parent / 'python'
    assert specify_python.is_file()
    owned = Path(tempfile.mkdtemp(prefix='urgent-host-consumption-'))
    project = owned / 'project'
    project.mkdir()
    probe = project / 'probe'
    probe.mkdir()
    feature = 'specs/docs/001-note-review'
    token = secrets.token_hex(32)
    formal_project(project, feature, token)
    env = dict(os.environ)
    env.update({'HOME': str(owned / 'tool-home'), 'XDG_CONFIG_HOME': str(owned / 'tool-home/.config'), 'XDG_CACHE_HOME': str(owned / 'tool-home/.cache'), 'npm_config_cache': str(owned / 'npm-cache'), 'TMPDIR': str(owned / 'tmp'), 'GIT_CONFIG_NOSYSTEM': '1', 'GIT_CONFIG_GLOBAL': '/dev/null', 'DISABLE_TELEMETRY': '1', 'DO_NOT_TRACK': '1', 'CI': '1'})
    for directory in [Path(env['HOME']), Path(env['TMPDIR']), owned / 'bin']:
        directory.mkdir(parents=True)
    git_env = dict(env)
    git_env.update({'GIT_AUTHOR_NAME': 'Owned host probe', 'GIT_AUTHOR_EMAIL': 'probe@example.invalid', 'GIT_COMMITTER_NAME': 'Owned host probe', 'GIT_COMMITTER_EMAIL': 'probe@example.invalid'})
    run(['git', 'init', '--quiet'], project, git_env, probe, 'git-init')
    run([str(specify_python), '-B', '-c', 'from importlib.metadata import version; assert version("specify-cli")=="1.2.6"; print(version("specify-cli"))'], project, env, probe, 'specify-version')
    online_program = '''import {pathToFileURL} from 'node:url';
/**
 * 读取当前同版产品模块，真实取得当次上游版本及完整性。
 */
const {readOnlineAgents}=await import(pathToFileURL(process.argv[2]).href);
/**
 * 不向消费目录写入查询结果或缓存。
 */
const result=await readOnlineAgents();
process.stdout.write(JSON.stringify(result.upstream));'''
    upstream_run = run(['node', '--input-type=module', '-e', online_program, 'urgent-host-context-reader', str(candidate / 'script/install-skills/read-agents.mjs')], project, env, probe, 'upstream')
    upstream = json.loads(upstream_run.stdout)
    names = [skill['name'] for skill in release['skills']]
    resolved_source = None
    official_location = str(candidate)
    if args.official_source:
        resolver = '''import {pathToFileURL} from 'node:url';
/**
 * 复用同版产品对固定GitHub来源的严格解析，不维护第二套URL规则。
 */
const {resolveOfficialSource}=await import(pathToFileURL(process.argv[2]).href);
process.stdout.write(JSON.stringify(resolveOfficialSource(process.argv[3])));'''
        resolved_run = run(['node', '--input-type=module', '-e', resolver, 'urgent-host-context-source', str(candidate / 'script/install-skills/read-agents.mjs'), args.official_source], project, env, probe, 'resolved-source')
        resolved_source = json.loads(resolved_run.stdout)
        official_location = resolved_source['officialSkillsRoot']
        remote_url = resolved_source['rawRoot'] + '/release.json'
        opener = urllib.request.build_opener(NoRedirect())
        with opener.open(remote_url, timeout=30) as response:
            assert response.geturl() == remote_url, '固定来源发生跳转'
            assert response.read(16 * 1024 * 1024 + 1) == (candidate / 'release.json').read_bytes(), '固定来源与本地严格候选清单字节不同'
        list_args = ['--yes', 'skills@' + upstream['version'], 'add', official_location, '--agent', 'codex', '--copy', '--yes', '--list']
        listed = run(['npx', *list_args], project, env, probe, 'official-list')
        output = re.sub(r'\x1b\[[0-?]*[ -/]*[@-~]', '', listed.stdout.decode())
        discovered = []
        for line in output.splitlines():
            match = re.fullmatch(r'│ {4}([a-z][\w-]*)', line.strip())
            if match:
                discovered.append(match.group(1))
        assert sorted(discovered) == sorted(names), '正式来源发现集合必须精确等于九项，不接受含eval源码根'
        assert not (project / '.agents').exists(), '官方列表不应创建技能目标'
    install_args = ['--yes', 'skills@' + upstream['version'], 'add', official_location, '--agent', 'codex', '--copy', '--yes', '--json', '--skill', *names]
    installed = run(['npx', *install_args], project, env, probe, 'official-install')
    assert sorted(file.name for file in (project / '.agents/skills').iterdir()) == sorted(names), '实际安装集合不能静默增加其他技能'
    expected_count = 0
    for skill in release['skills']:
        root = project / '.agents/skills' / skill['name']
        assert root.is_dir() and not root.is_symlink()
        expected = release['projections']['identity'][skill['name']]
        actual = sorted(file.relative_to(root).as_posix() for file in root.rglob('*') if file.is_file())
        assert actual == sorted(file['path'] for file in expected)
        for file in expected:
            location = root / file['path']
            assert not location.is_symlink()
            data = location.read_bytes()
            assert len(data) == file['bytes'] and sha256(data) == file['sha256']
            expected_count += 1
    write_json(probe / 'official-install.json', {'command': 'npx', 'args': install_args, 'exitCode': installed.returncode, 'upstream': upstream, 'candidateDigest': digest, 'version': release['version'], 'sourceRevision': release['sourceRevision'], 'selectedSkills': names, 'installedFileCount': expected_count, 'stdoutFile': 'probe/official-install.stdout', 'stderrFile': 'probe/official-install.stderr', 'resolvedSource': resolved_source})
    uvx = owned / 'bin/uvx'
    uvx.write_text('''#!/usr/bin/env bash
set -euo pipefail
if [[ "$1" == --offline ]]; then shift; fi
[[ "$1" == --from && "$2" == specify-cli==1.2.6 ]] || exit 71
shift 2
case "$1" in
  python) shift; exec "$URGENT_PREPARED_PYTHON" "$@";;
  specify) shift;;
  *) exit 72;;
esac
printf '%s|%s\\n' "$PWD" "$*" >> "$TMPDIR/specify-calls"
exec "$URGENT_PREPARED_SPECIFY" "$@"
''')
    uvx.chmod(0o700)
    env.update({'PATH': str(owned / 'bin') + os.pathsep + env.get('PATH', ''), 'URGENT_PREPARED_SPECIFY': str(specify), 'URGENT_PREPARED_PYTHON': str(specify_python)})
    source_args = ['--source', resolved_source['rawRoot']] if resolved_source else ['--source-dir', str(candidate)]
    mount_command = ['node', str(candidate / 'script/index.mjs'), *source_args, '--version', release['version'], '--agent', 'codex', '--project', str(project)]
    for name in WORKFLOW:
        mount_command.extend(['--skill', name])
    for retry in range(2):
        result = run(mount_command, project, env, probe, 'mount' if retry == 0 else 'mount-retry')
        report = json.loads(result.stdout)
        assert report['stages']['installation']['status'] == 'success'
        assert report['stages']['integrity']['status'] == 'success'
        assert report['stages']['hooks']['status'] == 'success'
        assert len(report['stages']['hooks']['results']) == 3
        assert len(report['stages']['hooks']['retired']) == 6
        assert report['stages']['commands']['status'] == 'success'
        assert report['stages']['loading']['status'] == 'not-run'
        write_json(probe / ('mount.json' if retry == 0 else 'mount-retry.json'), report)
    context = {'projectRoot': str(project), 'ownerToken': token, 'featureDirectory': feature, 'businessSentinel': 'business/sentinel.txt', 'specifyPython': str(specify_python), 'caseTimeoutMs': args.case_timeout_ms, 'version': release['version'], 'sourceRevision': release['sourceRevision'], 'candidateDigest': digest, 'officialInstallEvidence': 'probe/official-install.json', 'mountEvidence': 'probe/mount.json', 'mountRetryEvidence': 'probe/mount-retry.json'}
    context_path = owned / 'probe-context.json'
    write_json(context_path, context)
    print(json.dumps({'contextPath': str(context_path), 'projectRoot': str(project), 'version': release['version'], 'sourceRevision': release['sourceRevision'], 'candidateDigest': digest, 'installedSkills': len(names), 'installedFiles': expected_count, 'hostSessionsStarted': 0}, ensure_ascii=False))


if __name__ == '__main__':
    main()
