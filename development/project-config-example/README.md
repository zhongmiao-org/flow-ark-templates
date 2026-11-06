# 本地工程配置示例

在本轮安装候选的「本地流程工程」打开此目录。示例仅等待并读取配置、嵌套只读常量，不联网、不写业务文件、不调用AI。通过正常核对后运行。

公开默认值为 amount=1、label=public。开发时在本机 `.flowark/profiles/local.json` 写入 `{"amount":2,"label":"profile"}`，并参考 `.env.example` 在根目录 `.env.local` 填写 `FLOWARK_AMOUNT=3`；二者均不包含Key且不进ZIP。显式选择 profile 后生效，显式覆盖amount=4优先于env；普通运行仍使用实例值。脚本前后读取同一固定快照，常量不能被配置覆盖。

安装包MCP工具 `flowark_project_configuration` 可静态检查分层，`flowark_runtime_preview/run` 的 profile/overrides/input 只作用本次运行，不保存到实例。`flowark_runtime_configure` 仅持久化本人实例值。实际运行仍须客户端核对。
