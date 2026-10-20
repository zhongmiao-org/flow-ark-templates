import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const result = input?.result;
  if (input?.readyForReview !== false || result?.version !== 1 || result.kind !== "boss-account-source" || result.status !== "account-source-incomplete" || result.accountVerified !== false || result.platformUniqueIdVerified !== false || result.eligibleForActions !== false || typeof result.reason !== "string" || !result.reason.trim()) throw new Error("\u7F3A\u5C11\u672C\u6B21\u660E\u786E\u7684\u8D26\u53F7\u6765\u6E90\u505C\u6B62\u539F\u56E0");
  await template.result(result);
  signal.throwIfAborted();
  await template.attention({ key: "account-source:" + createHash("sha256").update(JSON.stringify(result)).digest("hex"), title: "\u6C42\u804C\u8D26\u53F7\u6765\u6E90\u9700\u8981\u672C\u4EBA\u5904\u7406", detail: { accountAlias: result.accountAlias, reason: result.reason } });
  return result;
};
export {
  stdin_default as default
};
