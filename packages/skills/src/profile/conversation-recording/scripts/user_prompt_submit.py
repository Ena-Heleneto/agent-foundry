"""Codex 的 UserPromptSubmit 命令入口，负责保存并读回用户消息。"""

import fcntl

from events import collect, redacted
from record import TURN_HEADER, atomic_write, find_record, quoted, run_hook


class UserPromptSubmitHook:
    """在业务开始前记录用户发起的消息及同轮补充。

    每次回调由 Codex 启动一个进程。已保存到哪一轮、哪一条消息，以主记录和宿主事件为准。
    """

    def run(self):
        """将本类的处理方法交给共用入口，由它读取标准输入并核实会话归属。"""
        run_hook(("UserPromptSubmit",), self.handle)

    def handle(self, scope, data):
        """保存一条已核实归属的用户消息。

        scope 提供已确认的会话、轮次和工作树。data 是 Codex 传入的事件 JSON，原话来自 prompt 字段。
        """
        # 与工具和末轮回调共用同一会话的锁，持锁完成主记录的读取、更新和读回。
        with scope.transcript.open("rb") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            path, current = find_record(scope)
            prompt = data.get("prompt")
            if not isinstance(prompt, str):
                return
            prompt = redacted(prompt)
            headers = list(TURN_HEADER.finditer(current))
            index = next((i for i, match in enumerate(headers) if match[2] == scope.turn), None)
            # 以宿主轮次 ID 查找记录块。该轮首条创建「发起」，后续输入追加为「补充」。
            if index is None:
                group = f"\n> **{scope.date}** <!-- turn-{scope.turn} -->\n>\n"
                atomic_write(path, current + group + quoted("发起", prompt))
                return

            end = headers[index + 1].start() if index + 1 < len(headers) else len(current)
            block = current[headers[index].start():end]
            prelude = block.rstrip("\n") + "\n"
            count = sum(line.startswith(("> - **发起** ", "> - **补充** ")) for line in block.splitlines())
            repeated = prelude.endswith((quoted("发起", prompt), quoted("补充", prompt)))
            # 末条与本次输入同文时，核对宿主事件中已出现的输入条数，区分重复回调和真实的同文补充。
            if not repeated or len(collect(scope, data).inputs) >= count:
                atomic_write(path, current[:end] + quoted("补充", prompt) + current[end:])


if __name__ == "__main__":
    UserPromptSubmitHook().run()
