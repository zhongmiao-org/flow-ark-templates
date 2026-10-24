import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  if (input?.readyForReview !== true || input.result?.version !== 1 || input.result?.kind !== "boss-account-source" || input.result.status !== "account-review-required" || input.result.accountVerified !== false || input.result.platformUniqueIdVerified !== false || input.result.eligibleForActions !== false || input.snapshot?.complete !== true || input.review?.version !== 1 || typeof input.review.target !== "string" || !input.review.target.trim() || typeof input.review.content !== "string" || !input.review.content.trim()) throw new Error("\u7F3A\u5C11\u672C\u6B21\u5B8C\u6574\u3001\u56FA\u5B9A\u4E14\u672A\u786E\u8BA4\u7684\u8D26\u53F7\u6765\u6E90");
  const accepted = "\u786E\u8BA4\u8FD9\u662F\u672C\u6B21\u4F7F\u7528\u7684\u6C42\u804C\u8D26\u53F7", rejected = "\u4E0D\u91C7\u7528\u672C\u6B21\u8D26\u53F7\u6765\u6E90";
  const decision = await template.human({ title: "\u8BF7\u6838\u5BF9\u5F53\u524DBOSS\u6C42\u804C\u8D26\u53F7", description: "\u8BF7\u5B8C\u6574\u6838\u5BF9\u8D26\u53F7\u522B\u540D\u3001\u9875\u9762\u59D3\u540D\u3001\u624B\u673A\u53F7\u63A9\u7801\u548C\u6C42\u804C\u8005\u6765\u6E90\u3002\u786E\u8BA4\u540E\u4F1A\u518D\u6B21\u91C7\u96C6\u5F53\u524D\u9875\u9762\uFF1B\u6765\u6E90\u53D8\u5316\u5C06\u4F7F\u786E\u8BA4\u5931\u6548\u3002\u672C\u6B21\u4E0D\u6388\u6743\u6295\u9012\u3001\u804A\u5929\u3001\u7B80\u5386\u53D1\u9001\u6216\u6A21\u578B\u8BF7\u6C42\u3002\u62FF\u4E0D\u51C6\u8BF7\u9009\u62E9\u4E0D\u91C7\u7528\u3002\u53D6\u6D88\u3001\u8D85\u65F6\u548C\u9000\u51FA\u4F7F\u672C\u8BF7\u6C42\u5931\u6548\u3002", schema: { type: "string", enum: [accepted, rejected] }, review: input.review });
  signal.throwIfAborted();
  if (decision !== accepted && decision !== rejected) throw new Error("\u8D26\u53F7\u6838\u5BF9\u56DE\u6267\u4E0D\u662F\u672C\u6B21\u660E\u786E\u9009\u62E9");
  const confirmed = decision === accepted, reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
  if (!confirmed) {
    const result = { ...input.result, status: "account-source-rejected", checkedAt: reviewedAt, reason: "\u672C\u4EBA\u672A\u91C7\u7528\u672C\u6B21\u8D26\u53F7\u6765\u6E90\uFF1B\u4E0D\u8FDB\u5165\u590D\u9A8C\u6216\u62DB\u8058\u52A8\u4F5C\u3002" };
    await template.result(result);
    signal.throwIfAborted();
    await template.attention({ key: "account-source:" + createHash("sha256").update(JSON.stringify(result)).digest("hex"), title: "\u672C\u6B21\u6C42\u804C\u8D26\u53F7\u6765\u6E90\u672A\u91C7\u7528", detail: { accountAlias: result.accountAlias, reason: result.reason } });
  }
  return { confirmed, reviewedAt, prepared: input };
};
export {
  stdin_default as default
};
