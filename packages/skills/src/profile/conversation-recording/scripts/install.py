#!/usr/bin/env python3
"""从主线构建产物安装项目级记录 Skill 和 Codex Hook。"""

import argparse
from hashlib import sha256
import fcntl
import json
import os
from pathlib import Path
import shlex
import shutil
import sys
import tempfile

sys.dont_write_bytecode = True

from record import atomic_write, git_root


NAME = "conversation-recording"
MANIFEST = ".foundry-recording-install.json"
LEGACY_FINGERPRINT = "1b47e30c91a71b2221298b94570b25e43c9175f19c06c1683a5942a8a89fbd55"
# Codex 事件名映射到安装目录 scripts/ 下的命令入口。
HOOK_SCRIPTS = {
    "UserPromptSubmit": "user_prompt_submit.py",
    "PostToolUse": "post_tool_use.py",
    "Stop": "stop.py",
}


def inventory(directory):
    """逐文件确认来源，拒绝链接或特殊文件进入安装。"""
    entries = {}
    for path in sorted(directory.rglob("*")):
        if path.is_symlink() or (not path.is_file() and not path.is_dir()):
            raise ValueError(f"安装来源包含链接或特殊文件：{path}")
        if path.is_file() and path != directory / MANIFEST:
            entries[path.relative_to(directory).as_posix()] = sha256(path.read_bytes()).hexdigest()
    return entries


def plain_path(path, is_directory):
    """检查属于项目的安装路径，保持已有链接和异类文件。"""
    matches = path.is_dir if is_directory else path.is_file
    if path.is_symlink() or (path.exists() and not matches()):
        raise ValueError(f"安装路径冲突：{path}")


def registration(target, previous, config, fingerprint):
    """按入口映射更新项目的 Hook 配置。

    config 是待写回的项目配置，previous 来自上次安装的归属清单，用来识别本安装可以替换的条目。
    返回本次注册的事件定义，供安装器写入新的归属清单。
    """
    hooks = config.setdefault("hooks", {})
    if not isinstance(hooks, dict):
        raise ValueError("项目 .codex/hooks.json 的 hooks 需要是对象")
    # 安装文件的摘要是命令的一部分，文件变化时 Codex 会重新审核 Hook 定义。
    owned = {}
    for event, script in HOOK_SCRIPTS.items():
        command = shlex.join(["python3", "-E", "-B", str(target / "scripts" / script), fingerprint])
        owned[event] = {"hooks": [{"type": "command", "command": command}]}
    entrypoints = {f"{NAME}/scripts/{script}" for script in HOOK_SCRIPTS.values()}
    # 升级时也识别旧版共用入口，保护已被手动修改的旧定义。
    entrypoints.add(f"{NAME}/scripts/record.py")
    for event in set(previous) | set(owned):
        groups = hooks.get(event, [])
        if not isinstance(groups, list):
            raise ValueError(f"项目 Hook 定义格式无效：{event}")
        old = previous.get(event)
        new = owned.get(event)
        for existing in groups:
            if not isinstance(existing, dict) or existing == old:
                continue
            for handler in existing.get("hooks", []):
                raw_command = str(handler.get("command", "")) if isinstance(handler, dict) else ""
                if any(entrypoint in raw_command for entrypoint in entrypoints):
                    raise ValueError(f"记录 Hook 已被外部修改：{event}")
        if new is not None and new in groups and new != old:
            raise ValueError(f"发现无归属的同名记录 Hook：{event}")
        if old in groups and groups.count(old) != 1:
            raise ValueError(f"记录 Hook 定义重复：{event}")
        if old in groups and old != new:
            groups = [entry for entry in groups if entry != old]
        if new is not None and new not in groups:
            groups.append(new)
        hooks[event] = groups
    return owned


def install(project, source):
    """预检全部冲突后替换受管副本，注册失败时恢复原安装。"""
    if git_root(project) != project:
        raise ValueError("安装目标需要是 Git 工作树根目录")
    codex_dir = project / ".codex"
    skill_parent = project / ".agents/skills"
    target = skill_parent / NAME
    hook_path = codex_dir / "hooks.json"
    manifest = target / MANIFEST
    for path in (codex_dir, skill_parent.parent, skill_parent, target):
        plain_path(path, is_directory=True)
    for path in (hook_path, manifest):
        plain_path(path, is_directory=False)
    same_location = source == target
    files = inventory(source)
    required = {"SKILL.md", "scripts/install.py", "scripts/events.py", "scripts/record.py"}
    required.update(f"scripts/{script}" for script in HOOK_SCRIPTS.values())
    if not required <= files.keys():
        raise ValueError("主线 Skill 安装材料不完整")
    previous = {}
    current = inventory(target) if target.exists() else None
    if manifest.is_file():
        state = json.loads(manifest.read_bytes())
        if state.get("version") != 1 or state.get("files") != current or not isinstance(state.get("hooks"), dict):
            raise ValueError(f"已安装 Skill 发生未确认的改动：{target}")
        previous = state["hooks"]
    elif current != files and current is not None:
        # 旧同步入口无归属文件，只有可证实的原构建快照能接管。
        fingerprint = sha256(json.dumps(current, sort_keys=True).encode()).hexdigest()
        if fingerprint != LEGACY_FINGERPRINT:
            raise ValueError(f"目标已有不同来源的同名 Skill：{target}")
    config = json.loads(hook_path.read_bytes()) if hook_path.is_file() else {}
    if not isinstance(config, dict):
        raise ValueError("项目 .codex/hooks.json 需要是对象")
    original_config = json.dumps(config, sort_keys=True)
    fingerprint = sha256(json.dumps(files, sort_keys=True).encode()).hexdigest()
    owned = registration(target, previous, config, fingerprint)
    if previous == owned and current == files and original_config == json.dumps(config, sort_keys=True):
        return

    codex_dir.mkdir(exist_ok=True)
    skill_parent.mkdir(parents=True, exist_ok=True)
    marker = json.dumps({"version": 1, "files": files, "hooks": owned}, ensure_ascii=False, indent=2) + "\n"
    with tempfile.TemporaryDirectory(prefix=".recording-", dir=skill_parent.parent) as tmp:
        stage, backup = Path(tmp) / "stage", Path(tmp) / "previous"
        if not same_location:
            shutil.copytree(source, stage, ignore=shutil.ignore_patterns(MANIFEST))
            (stage / MANIFEST).write_text(marker, encoding="utf-8")
            if current is not None:
                target.rename(backup)
            try:
                stage.rename(target)
            except OSError:
                if backup.exists():
                    backup.rename(target)
                raise
        try:
            atomic_write(hook_path, json.dumps(config, ensure_ascii=False, indent=2) + "\n")
            if same_location:
                atomic_write(manifest, marker)
        except OSError:
            if not same_location:
                target.rename(stage)
                if backup.exists():
                    backup.rename(target)
            raise


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True, type=Path)
    args = parser.parse_args()
    project = args.project.resolve()
    try:
        # 项目根目录作为锁对象，无需新增持久化锁文件。
        fd = os.open(project, os.O_RDONLY | os.O_DIRECTORY)
        try:
            fcntl.flock(fd, fcntl.LOCK_EX)
            install(project, Path(__file__).resolve().parents[1])
        finally:
            os.close(fd)
    except (ValueError, OSError) as error:
        parser.exit(1, f"记录安装失败：{error}\n")
    print("记录组件已安装。请在 Codex 原生界面核对项目和 Hook 的信任状态。")


if __name__ == "__main__":
    main()
