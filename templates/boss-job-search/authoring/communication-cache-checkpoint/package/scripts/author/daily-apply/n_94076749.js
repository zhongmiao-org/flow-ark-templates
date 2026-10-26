import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  if (!input || input.version !== 1 || input.kind !== "daily-apply-configuration" || input.readyForLoop !== false || !Number.isSafeInteger(input.configurationRevision) || !Array.isArray(input.issues) || !input.issues.length || input.dayTaskComplete !== false) throw Error("\u7F3A\u5C11\u672C\u6B21\u672A\u51C6\u5907\u7684\u56FA\u5B9A\u914D\u7F6E\u7ED3\u679C");
  const reasons = input.issues.map((v) => {
    if (!v || typeof v.field !== "string" || typeof v.reason !== "string") throw Error("\u672A\u51C6\u5907\u539F\u56E0\u65E0\u6548");
    return { field: v.field, reason: v.reason };
  });
  const result = { version: 1, kind: "daily-apply", status: "needs-configuration", dayTaskComplete: false, siteDailyLimitConfirmed: false, configurationRevision: input.configurationRevision, dailyTarget: 150, userDailyLimit: input.userDailyLimit, reasons, accountVerified: false, eligibleForActions: false, nextAction: "configure-and-review", note: "\u5F53\u5929\u6295\u9012\u672A\u5B8C\u6210\uFF1B\u5148\u8865\u9F50\u7528\u6237\u914D\u7F6E\u53CA\u7AD9\u70B9\u6821\u51C6\u3002\u6CA1\u6709\u6295\u9012\u3001\u6A21\u578B\u8BF7\u6C42\u6216\u7F51\u7AD9\u4E0A\u9650\u5B8C\u6210\u8BC1\u660E\u3002", checkedAt: (/* @__PURE__ */ new Date()).toISOString() };
  const key = "daily-apply-preparation:" + createHash("sha256").update(JSON.stringify({ revision: input.configurationRevision, reasons })).digest("hex");
  const attention = await template.attention({ key, title: "\u6BCF\u65E5\u6295\u9012\u5C1A\u672A\u5F00\u59CB\uFF0C\u9700\u8981\u8865\u9F50\u914D\u7F6E", detail: result });
  signal.throwIfAborted();
  await Promise.resolve(result);
  return { result, attention };
};
export {
  stdin_default as default
};
