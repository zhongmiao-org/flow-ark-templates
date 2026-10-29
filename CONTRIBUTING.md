# 贡献约定

使用 Node 24.3+、pnpm 10.14.0。`pnpm install --frozen-lockfile` 后执行 `pnpm validate` 与 `pnpm build`。当前 UI 阶段不新增或运行单元测试，已有测试保留。

CI 在 PR、main 推送及手动触发时执行上述校验和构建；分支/PR 标题检查及自动合并仅在 PR 执行。主线与 PR 分别控制并发，Validate 检查名称保持。

提交与 PR 标题使用 Conventional Commits：`feat(templates): 添加文件检查模板`。分支 `feat/file-inspector` 等 `type/小写英文数字连字符`，不使用工具名前缀。功能分支 → 本地检查 → PR → `automerge` → 当前最新提交 Validate 成功 → CI 自动合并。不得直接推 main、手工绕过 CI。

仅初次初始化允许一个不含文件的空提交。破坏兼容变更记录 `BREAKING CHANGE:`。示例只用虚构数据；禁止提交密钥、简历、浏览器登录态、数据库和运行产物。治理说明集中在 flow-ark 仓库 docs/templates，不在此复制 AGENTS 或总体架构。不得导入相邻客户端源码、建立跨仓库 workspace 或符号链接依赖。

使用者模板目录只保留 README 与一个当前 ZIP，二者说明逐字节一致；源码示例归 development。修改示例后递增模板版本并同步 catalog.json，再运行 pnpm package:templates。客户端模板由作者 UI 导出，原 ZIP 摘要固定在 client-checkpoints.json；不得手改或重打包该归档。
