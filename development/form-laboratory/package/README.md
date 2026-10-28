# 复杂表单实验室 1.0.2

虚构数据验收模板；不含用户资料或密钥

状态：示例/适配候选。只证明下述入口，不代表真实求职业务完成。

## 导入与前置条件

在模板库导入本目录唯一的 `.flowark-template.zip`，核对并安装，创建自己的实例。无需解包或复制脚本。只有配置和授权完整后才可运行；示例资料均为虚构。

## 配置与资源

- 浏览器（browser）：browser / use，必需，通过资源页绑定自己的资源。
- 虚构样本与结果目录（work）：directory / readwrite，必需，通过资源页绑定自己的资源。

## 入口与流程

### 填写并核对收据（run）

- 模拟网站地址（baseUrl）：填写入口参数。

open → fill_name → read_name → assert → fill_email → read_email → assert → fill_phone → read_phone → assert → fill_website → read_website → assert → fill_quantity → read_quantity → assert → fill_search → read_search → assert → fill_language → read_language → assert → fill_notes → read_notes → assert → fill_start → read_start → assert → fill_end → read_end → assert → fill_time → read_time → assert → fill_local → read_local → assert → fill_month → read_month → assert → fill_week → read_week → assert → fill_color → read_color → assert → fill_password → fill_rich → readonly → assert → priority_home → priority_right → priority_right_again → priority_value → assert → check_phone → check_email → check_email_again → check_export → check_export_again → check_audit → check_audit_again → check_alert → check_agreement → department → skills_first → skills_clear → assert → skills → assert → province_first → province → cities_ready → city → fill_project → project_choose → sync → invoice_on → fill_invoice → read_invoice → assert → fill_contact_name_1 → read_contact_name_1 → assert → fill_contact_email_1 → read_contact_email_1 → assert → add_contact → fill_contact_name_2 → read_contact_name_2 → assert → fill_contact_email_2 → read_contact_email_2 → assert → add_unused → remove_unused → upload → before_submit → open_events → events_visible → changes → event-counts.json → submit → receipt_ready → receipt → form-receipt.json → after_submit

## 授权、结果与恢复

- 提交虚构表单：向配置网页写入虚构测试数据 默认禁止，运行前单独核对。

运行后阅读准确终态及输出；失败、取消或 unknown 先核对原记录，不自动重放。重新打开客户端不自动执行；更新包不覆盖已有实例、计划或 Run。

## 当前限制

依赖专用本地表单实验服务。维护者在本仓库运行 `pnpm forms:serve`，使用者下载服务提供的 fictional.txt 到自己的 work 目录，填写可访问的 baseUrl；输出为 event-counts.json 与 form-receipt.json。服务是外部被操作网站，不属于需要复制的模板脚本。
