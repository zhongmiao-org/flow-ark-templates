# FlowArk Templates

独立业务模板、demo、example 和模拟网站。客户端只消费 `.flowark-template.zip` 标准包。一个包一个模板，多个入口共享实例普通配置与状态，资源和动作权限由客户端用户绑定。

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm forms:serve
FLOWARK_TEST_EXECUTABLE=/Applications/FlowArk.app/Contents/MacOS/FlowArk pnpm test:client
```

包生成到 dist。模板库导入 → 安装 → 创建实例 → 配置 → 保存 → 运行入口。纯文件入口只需一个文本文件，多入口模板的离线检查无需 AI/浏览器。模型由用户绑定，测试不会使用真实简历。模板 scripts 在开发阶段静态打包；运行不安装依赖或浏览器。

模板开发在 templates/<id>/template.json、package/、src/；正式包不包含测试、模拟网站和本机资料。构建器验证大小、Schema、入口、所有文件摘要，按固定顺序和时间戳生成 ZIP。包内内容只读；资源由 SDK 获取。普通 Node 可信脚本不是系统级沙箱。

原 BOSS/智联业务模块与测试位于 templates/recruiting，两个适配检查包明确返回未校准；前程无忧真实简历更新属于后续阶段。架构、验收记录、包/SDK 规范在独立治理仓库 flow-ark 的 docs/templates；本仓库不读取父目录，契约已固定复制到 contracts。
