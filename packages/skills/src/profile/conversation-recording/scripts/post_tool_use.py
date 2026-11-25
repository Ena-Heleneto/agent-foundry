"""Codex 的 PostToolUse 命令入口，在工具完成后补记当轮详情。"""

from events import is_commit
from record import run_hook, update_turn


class PostToolUseHook:
    """将工具调用及已有结果保存到当前轮次的详情。"""

    def run(self):
        """由共用入口接收回调并核实会话归属。"""
        run_hook(("PostToolUse",), self.handle)

    def handle(self, scope, data):
        """处理通过归属核验的工具回调。

        共用写入流程在会话锁内采集事件。宿主事件里暂时缺少的工具结果，可以用回调里的结果补齐。
        """
        # 明确的 Git 提交步骤直接跳过。共用采集还会识别实际执行命令及对应结果。
        if is_commit(data.get("tool_input")):
            return
        update_turn(scope, data)


if __name__ == "__main__":
    PostToolUseHook().run()
