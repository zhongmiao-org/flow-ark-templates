import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const reviewed = input?.reviewed, prepared = reviewed?.prepared, current = input?.snapshot;
  if (reviewed?.confirmed !== true || typeof reviewed.reviewedAt !== "string" || !Number.isFinite(Date.parse(reviewed.reviewedAt)) || prepared?.readyForReview !== true || prepared.result?.kind !== "boss-account-source" || prepared.result.status !== "account-review-required" || prepared.result.accountVerified !== false || prepared.result.platformUniqueIdVerified !== false || prepared.result.eligibleForActions !== false || prepared.snapshot?.complete !== true) throw new Error("\u7F3A\u5C11\u672C\u6B21\u660E\u786E\u672C\u4EBA\u786E\u8BA4\u53CA\u539F\u59CB\u8D26\u53F7\u6765\u6E90");
  if (!current || current.version !== 3 || current.operation !== "collect" || !Array.isArray(current.fields)) throw new Error("\u7F3A\u5C11\u786E\u8BA4\u540E\u7684\u540C\u6B21\u7F51\u9875\u91C7\u96C6");
  const same = current.complete === true && JSON.stringify(current) === JSON.stringify(prepared.snapshot);
  const checkedAt = (/* @__PURE__ */ new Date()).toISOString();
  const result = { ...prepared.result, status: same ? "account-source-confirmed" : "account-source-changed", accountVerified: same, confirmedAt: same ? reviewed.reviewedAt : null, checkedAt, reason: same ? "\u672C\u4EBA\u5DF2\u786E\u8BA4\uFF0C\u5F53\u524D\u8D26\u53F7\u9875\u9762\u4E0E\u56FA\u5B9A\u6765\u6E90\u9010\u9879\u4E00\u81F4\uFF0C\u5DF2\u4FDD\u7559\u672C\u6B21\u8D26\u53F7\u6765\u6E90\u3002\u59D3\u540D\u53CA\u63A9\u7801\u4E0D\u662F\u5E73\u53F0\u552F\u4E00\u8D26\u53F7ID\uFF1B\u6295\u9012\u3001\u804A\u5929\u548C\u7B80\u5386\u53D1\u9001\u4ECD\u987B\u72EC\u7ACB\u6838\u5BF9\u4E0E\u6388\u6743\u3002" : "\u672C\u4EBA\u56DE\u5E94\u540E\u9875\u9762\u3001\u59D3\u540D\u3001\u624B\u673A\u53F7\u63A9\u7801\u3001\u6C42\u804C\u8005\u5165\u53E3\u6216\u5B57\u6BB5\u72B6\u6001\u53D1\u751F\u53D8\u5316\uFF0C\u65E7\u786E\u8BA4\u5931\u6548\uFF1B\u505C\u6B62\u91C7\u7528\u5E76\u8BF7\u672C\u4EBA\u91CD\u65B0\u6838\u5BF9\u3002" };
  await template.result(result);
  signal.throwIfAborted();
  await template.attention({ key: "account-source:" + createHash("sha256").update(JSON.stringify(result)).digest("hex"), title: same ? "\u6C42\u804C\u8D26\u53F7\u6765\u6E90\u5DF2\u786E\u8BA4\u5E76\u4FDD\u5B58" : "\u6C42\u804C\u8D26\u53F7\u6765\u6E90\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u6838\u5BF9", detail: { accountAlias: result.accountAlias, reason: result.reason, checkedAt } });
  return result;
};
export {
  stdin_default as default
};
