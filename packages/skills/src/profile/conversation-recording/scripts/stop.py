"""Codex 的 Stop 命令入口，保存并读回正常发出的最终回复。"""

from record import run_hook, update_turn


class StopHook:
    """在 Codex 完成一轮回复后收尾当轮记录。"""

    def run(self):
        """由共用入口接收回调并核实会话归属。"""
        run_hook(("Stop",), self.handle)

    def handle(self, scope, data):
        """从宿主事件取得实发回复，交给共用流程落盘并读回。

        共用流程会先核对当轮是否属于 Git 提交结果，再确认可保存的详情和回复。
        """
        update_turn(scope, data, reply=data.get("last_assistant_message"))


if __name__ == "__main__":
    StopHook().run()
