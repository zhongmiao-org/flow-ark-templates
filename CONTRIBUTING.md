# 贡献约定

使用 Node 24.3+、pnpm 10.14.0。`pnpm install --frozen-lockfile && pnpm check`。

提交与 PR 标题使用 Conventional Commits：`feat(templates): 添加文件检查模板`。分支 `feat/file-inspector` 等 `type/小写英文数字连字符`，不使用工具名前缀。功能分支 → 本地检查 → PR → `automerge` → 当前最新提交 Validate 成功 → CI 自动合并。不得直接推 main、手工绕过 CI。

仅初次初始化允许一个不含文件的空提交。破坏兼容变更记录 `BREAKING CHANGE:`。示例只用虚构数据；禁止提交密钥、简历、浏览器登录态、数据库和运行产物。治理说明集中在 flow-ark 仓库 docs/templates，不在此复制 AGENTS 或总体架构。不得导入相邻客户端源码、建立跨仓库 workspace 或符号链接依赖。
