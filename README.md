# FlowArk Templates

独立业务模板、demo、example 和模拟网站。客户端只消费 `.flowark-template.zip` 标准包。一个包一个模板，多个入口共享实例普通配置与状态，资源和动作权限由客户端用户绑定。

```sh
pnpm install --frozen-lockfile
pnpm validate
pnpm build
pnpm forms:serve
FLOWARK_TEST_EXECUTABLE=/Applications/FlowArk.app/Contents/MacOS/FlowArk pnpm test:client
```

包生成到 dist。模板库导入 → 安装 → 创建实例 → 配置 → 保存 → 运行入口。纯文件入口只需一个文本文件，多入口模板的离线检查无需 AI/浏览器。模型由用户绑定，测试不会使用真实简历。模板 scripts 在开发阶段静态打包；运行不安装依赖或浏览器。

模板开发在 templates/<id>/template.json、package/、src/；正式包不包含测试、模拟网站和本机资料。构建器验证大小、Schema、入口、所有文件摘要，按固定顺序和时间戳生成 ZIP。包内内容只读；资源由 SDK 获取。普通 Node 可信脚本不是系统级沙箱。

原 BOSS/智联业务模块与测试位于 templates/recruiting，两个适配检查包明确返回未校准；前程无忧真实简历更新属于后续阶段。架构、验收记录、包/SDK 规范在独立治理仓库 flow-ark 的 docs/templates；本仓库不读取父目录，契约已固定复制到 contracts。

安装版测试会临时隐藏模板源码目录，使用复制到临时目录的正式 ZIP，经公共 IPC 验证文件、多入口、完整表单提交／附件／回执及重开；不访问真实招聘账号。可选真实 AI 验证需显式设置 `FLOWARK_TEST_ENCRYPTED_CREDENTIAL` 为本机 DeepSeek 加密凭据文件路径，并设置 `FLOWARK_TEST_AI_MODEL` 为用户选择的模型。凭据只临时复制到隔离数据目录，结束后删除；不在命令行传明文 Key。

个人蒸馏模板正在通过客户端制作：公开规程与固定来源位于 `templates/personal-distillation/authoring`，nuwa 上游快照与许可位于 `vendor/nuwa-skill`。这些资料尚不是完整可用模板；正式流程须由客户端可视化编排并导出后纳入，不从源码生成业务大脚本代替。当前 UI/UE 阶段保留既有测试，暂不新增或运行单元测试。

客户端导出的访谈检查点为 `templates/personal-distillation/authoring/interview-checkpoint/personal-distillation-interview-checkpoint.flowark-template.zip`（0.2.0，制作中），保留原0.1.0资料检查点。导入后创建独立实例，在资源页选择自己的资料目录及AI供应商/模型，并在本地设置配置自己的Key；资料核对入口可以单独离线使用。访谈入口填写目录内选定文件名与访谈标识，先解析并检查资料完整可读，再建立或读取引导会话。相同实例、标识、内容及完整会话配置对应同一访谈；更换标识表示新访谈。

首次建立会话的步骤本身不调用模型，但运行前仍要求可用的自有Key；每轮发送在会话面板显式核对后进行。Key只在本地设置录入，不粘贴进聊天或公开文件。该检查点已核对原生导出、另一工作区复导、资源重新绑定和缺Key阻断；真实多轮、确认后生成Skill、局部更新及完整闭环仍待制作和验收。`package/`为同一ZIP的逐字节提取文件，不能手改其中JSON补完流程；后续改动继续由客户端编排、核对带回和导出。

确认后生成草稿的0.3.0检查点位于 `templates/personal-distillation/authoring/synthesis-checkpoint`，仍为制作中。在同一访谈入口增加`confirmed`条件分支、来源映射、结构化AI整理和Skill待确认草稿；未确认时结束本批，用户到待办继续，确认后显式重新运行同一入口。除资料与自有AI服务，还须选择个人Skill工作区。来源映射是独立、无依赖的数据转换；`source-evidence.ts`与输出格式Schema供审阅，现有校验同时核对脚本编译字节和AI节点Schema，未重新生成ZIP。

0.3.0已在独立原生工作区安装并创建未绑定三类资源的新实例，旧版本与记录保留。七步生成路径已制作和静态核对；真实自有Key执行、Skill确认、局部更新及完整复用仍待验收。初始草稿不带父版本，已有确认版本的修改须使用后续独立局部更新入口，不能把本入口当作覆盖旧版本的操作。
