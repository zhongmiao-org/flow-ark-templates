# P1 0.48.0：明确采用可见文字候选

2026-10-20候选，尚未发布。继承0.47.0；追加browser v11/collect、bounded-visible-text-v1及browser-visible-text-v1，新结果version6及每字段excludedHiddenTextLeaves。旧browser v1–v10、结果、SDK1.0、包2.0及数据库保持。[实际证据、六状态Figma、规则与验收](../../docs/client/browser-visible-text.md)为规范组成部分。

仅在原同步扫描已判隐藏的后代，符合[语言无关政策](browser-visible-text-policy.json)时排除纯文字叶子：标准非嵌入HTML、非自定义元素、无子元素/开放影子树，所有子节点仅文字或注释，display:none或visibility:hidden，前后伪元素无内容，无活动/pending动画，所需API可用。文字可非空，隐藏原文不读取、不返回；子节点仍消耗原扫描预算。目标/祖先、含子元素/生成内容、opacity零或content-visibility单独隐藏、未知仍拒绝。不可声称不存在闭合影子树或核验外部外观。

与空叶子规则独立；新计数不能追加至旧结果。原始/非唯一字段为0，总计最多2000；保留2000元素/6000节点/64祖先、期限/取消/导航代次与整次128KiB限制。格式参考只验证形状、固定源和计数，不证明DOM资格。complete只表示本策略字段候选可用，不代表隐藏全文、JD完整或岗位/外发资格；externalAppearanceVerified始终false。

调用/节点/字段/顺序/网址/Unicode/能力与入口自身browser/use资源严格关联；宿主从固定v11源确定策略。作者显式选规则，导出新能力，旧客户端拒绝，不回退。诊断IPC只在显式新policy分支追加排除计数，无正文读取；旧分支保持。待真实PR/tag后客户端独立采用，再用普通UI制作、导出、复导并真实验证；不能拿本候选代替真实打招呼或网站150次上限。
