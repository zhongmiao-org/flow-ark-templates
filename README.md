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

BOSS 的可视化制作检查点位于 `templates/boss-job-search/authoring/login-checkpoint/boss-job-search-0.1.1.flowark-template.zip`，名称明确为“制作中”。这是客户端原始导出，`package/`为逐字节相同的可审阅内容；流程不能在仓库手改后冒充客户端制作。三个小脚本只整理只读观察、登记本人待办及返回结果，网页读取和条件分流由独立可视化节点完成。原有适配检查包继续保留，不代表完整新模板已经交付。

导入并创建实例后，只需为两个手动入口绑定同一个“BOSS 求职者会话浏览器”。“打开指定 BOSS 起点”访问用户指定城市页；该地址不替代使用者的期望城市。“核对当前页面（只读）”读取前后网址与标题，核对地址一致，再分流为需要本人登录、账号尚待核验或站点不匹配，保存本地待办后结束运行。它不以网址或页面打开成功认定求职者身份，也不等待扫码、发送短信验证码或接受网站协议。

本检查点无需 AI Key，不调用模型，没有投递、简历发送、聊天或“不感兴趣”动作；这些后续入口仍需完成真实账号/JD校准及明确权限。真实模型调用继续使用使用者自己的 Key，不使用开发者共享额度。仓库已固定采用 `contracts-v0.28.0`；格式/来源校验不等于登录、招聘或完整蒸馏验收。

0.1.2 增强检查点位于 `templates/boss-job-search/authoring/inline-login-checkpoint/boss-job-search-0.1.2.flowark-template.zip`，通过客户端从准确0.1.1包复制制作，再新增可见页面文字读取并导出；原0.1.1归档和源码映射保留。预检现在也识别职位详情正文的“登录查看完整内容”，输出 `jdContentStatus: login-gated` 并登记本人登录待办；不存在该标记时仍为 `unverified`，不据此声称完整JD或账号通过核验。

页面文字仅用于本机标记检查，不传给模型；分类结果与待办只保存网页来源、状态和原因，不复制整页正文。空文字、超过65536字符或前后地址变化会停止，本次各项读取仍不是原子网页快照。两个手动入口仍只共享一个浏览器，无招聘动作；公开城市页、账号/会话绑定和真正完整JD分别核对，不将可见文字当作隐藏内容获取或职位适配结论。

安装版测试会临时隐藏模板源码目录，使用复制到临时目录的正式 ZIP，经公共 IPC 验证文件、多入口、完整表单提交／附件／回执及重开；不访问真实招聘账号。可选真实 AI 验证需显式设置 `FLOWARK_TEST_ENCRYPTED_CREDENTIAL` 为本机 DeepSeek 加密凭据文件路径，并设置 `FLOWARK_TEST_AI_MODEL` 为用户选择的模型。凭据只临时复制到隔离数据目录，结束后删除；不在命令行传明文 Key。

个人蒸馏模板正在通过客户端制作：公开规程与固定来源位于 `templates/personal-distillation/authoring`，nuwa 上游快照与许可位于 `vendor/nuwa-skill`。这些资料尚不是完整可用模板；正式流程须由客户端可视化编排并导出后纳入，不从源码生成业务大脚本代替。当前 UI/UE 阶段保留既有测试，暂不新增或运行单元测试。

客户端导出的访谈检查点为 `templates/personal-distillation/authoring/interview-checkpoint/personal-distillation-interview-checkpoint.flowark-template.zip`（0.2.0，制作中），保留原0.1.0资料检查点。导入后创建独立实例，在资源页选择自己的资料目录及AI供应商/模型，并在本地设置配置自己的Key；资料核对入口可以单独离线使用。访谈入口填写目录内选定文件名与访谈标识，先解析并检查资料完整可读，再建立或读取引导会话。相同实例、标识、内容及完整会话配置对应同一访谈；更换标识表示新访谈。

首次建立会话的步骤本身不调用模型，但运行前仍要求可用的自有Key；每轮发送在会话面板显式核对后进行。Key只在本地设置录入，不粘贴进聊天或公开文件。该检查点已核对原生导出、另一工作区复导、资源重新绑定和缺Key阻断；真实多轮、确认后生成Skill、局部更新及完整闭环仍待制作和验收。`package/`为同一ZIP的逐字节提取文件，不能手改其中JSON补完流程；后续改动继续由客户端编排、核对带回和导出。

确认后生成草稿的0.3.0检查点位于 `templates/personal-distillation/authoring/synthesis-checkpoint`，仍为制作中。在同一访谈入口增加`confirmed`条件分支、来源映射、结构化AI整理和Skill待确认草稿；未确认时结束本批，用户到待办继续，确认后显式重新运行同一入口。除资料与自有AI服务，还须选择个人Skill工作区。来源映射是独立、无依赖的数据转换；`source-evidence.ts`与输出格式Schema供审阅，现有校验同时核对脚本编译字节和AI节点Schema，未重新生成ZIP。

0.3.0已在独立原生工作区安装并创建未绑定三类资源的新实例，旧版本与记录保留。七步生成路径已制作和静态核对；真实自有Key执行、Skill确认、局部更新及完整复用仍待验收。初始草稿不带父版本，已有确认版本的修改须使用后续独立局部更新入口，不能把本入口当作覆盖旧版本的操作。

0.4.0局部更新检查点位于 `templates/personal-distillation/authoring/update-checkpoint`，仍为制作中，并保留前三个原始检查点。通过客户端新增独立update入口：读取固定确认版本、核对范围、补充访谈、确认条件、结构化局部提案、明确性断言、单项应用和待确认Skill草稿。使用者选择修改项目和准确原文片段，模型只建议新值与片段替换，不决定修改路径；无关手工内容及旧来源从父版本保留，再追加真实确认会话来源。父版本和目标工作区分别绑定，不能通过初始生成入口覆盖既有确认版本。

`update-prepare.ts`、`update-apply.ts`和两份Schema是公开审阅来源；流程节点通过客户端添加、映射、核对带回并导出，`package/`仍为原ZIP的逐字节提取文件。校验核对全部三个映射脚本的编译字节及两个AI节点的格式，未执行模型或重建业务ZIP。真实自有Key补充访谈、单处变化、外部修改冲突、本人确认及完整G3/BOSS验收仍待完成。

0.1.3客户端原始检查点位于`templates/boss-job-search/authoring/conditions-checkpoint/boss-job-search-0.1.3.flowark-template.zip`，新增共享求职条件和无资源依赖的独立一致性核对入口，README随包公开。初始空条件会通知本人，格式通过不代表JD匹配或发送授权；没有模型调用或招聘动作。三个新增TS源与原始导出编译字节核对，旧网页流程不改。本批仍为制作检查点，完整账号/JD/会话、个人Skill/自有Key和外发回执继续验收。

0.1.4客户端原始检查点位于`templates/boss-job-search/authoring/profile-sources-checkpoint/boss-job-search-0.1.4.flowark-template.zip`。新增独立只读入口，明确选择简历相对文件和已注册固定确认Skill，保存来源摘要；空或部分提取登记本人待办。此入口只需自己的资料目录与Skill，浏览器可未绑定，不调用模型。来源就绪不表示同一身份、事实一致、完整JD、模型采用或招聘授权通过。三个新增TS编译来源与原始ZIP逐字节核对，前三个流程原样保留；真实个人蒸馏、完整匹配和外发仍待验收。

0.1.5客户端原始检查点位于`templates/boss-job-search/authoring/jd-assessment-checkpoint/boss-job-search-0.1.5.flowark-template.zip`。新增十二步JD方向建议入口：固定共享配置、明确JD输入及完整性声明、固定确认Skill、自有AI服务、原句/规则核对和match/mismatch/review分支；缺口或不确定登记本人待办。配置自己的profile和ai资源，其他四入口保持原资源要求。来源备注不是实际账号/会话核验，明确符合仅准备草稿，明确不符合仅准备独立不感兴趣建议；当前不执行投递、简历发送、回复或不感兴趣动作。

公开规程、四份小脚本及输出Schema分别供审阅；原ZIP与逐字节提取资产来自客户端，未生成或手改流程JSON。缺Key/未确认Skill阻止运行；真实模型判断、同键运行行为、登录后完整JD关联及完整业务仍待验收。公开默认JD为空、完整性为false，不携带作者的简历、Key、Skill或本机绑定。

BOSS 0.1.8 来信草稿检查点由客户端可视化复用JD编排并扩为16步后原始导出，六入口并存。普通事实/介绍/技术交流形成内部草稿，索要简历/正式题目/身份质疑/承诺或不确定交本人，来源与动作边界显式保留。来信默认空、未完整、接管中；最多两次用户自己的Key请求，不发送消息/附件，不代表真实账号会话或完整业务已验收。原始ZIP与48文件位于 `templates/boss-job-search/authoring/message-draft-checkpoint/`，TS/Schema来源由validate重新编译和核对；个人资料与绑定不进入包。0.1.6/0.1.7为本机未发布候选，修正名称、说明及独立导入发现的中文表单后，按版本不可变规则升至0.1.8，未覆盖旧候选。

BOSS 0.1.11 原生检查点位于 `templates/boss-job-search/authoring/ai-failure-checkpoint/`。三个可见AI节点显式使用v2/result，正常化步骤读取完整outcome，成功继续事实核对，已知请求故障保留阶段/固定来源并转本人待办，无可采用草稿。取消、缺资源、节点期限、程序和存储异常仍中断；不自动重试/换服务/执行招聘动作。两个v2正常化TS源仅用于核对原始导出编译字节；未手改流程或ZIP。0.1.9发现辅助功能赋值未写入代码，只保留本机失败候选；改用完整编辑器后按不可变规则递增至0.1.10，独立复导再发现来信入口缺结果/提醒SDK能力，取消安装后通过客户端补齐并升0.1.11。真实用户Key、账号会话及完整业务继续独立验收。

BOSS 0.2.1 原生七入口检查点位于 `templates/boss-job-search/authoring/conversation-control-checkpoint/`。新增无需模型/浏览器/Skill的独立会话控制入口，按显式账号与会话来源键隔离，默认暂停与状态写动作deny；核对最新JD/来信和配置修订后仅恢复内部草稿。来信入口在模型前、两次模型之间和草稿后读取持久状态，变化则转本人，重复同范围控制不改写状态。控制入口按当前单运行槽排队，不能立即打断在途模型；需先取消当前Run并核对结束，再执行暂停。0.2.0为本机未发布候选，补充此限制后原生递增0.2.1，原ZIP及精确提取文件均未手改。受控Runtime/Worker与原生消费证据在治理仓库分别记录，真实Key、账号来源、完整onmessage及外发仍未验收。
