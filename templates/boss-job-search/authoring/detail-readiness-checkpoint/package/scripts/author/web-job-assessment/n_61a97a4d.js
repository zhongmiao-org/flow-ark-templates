import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const result = input?.result, review = input?.review;
  if (input?.readyForReview !== true || result?.version !== 1 || result.kind !== "web-jd-body" || result.status !== "body-review-required" || result.accountVerified !== false || result.eligibleForActions !== false || result.modelInputAllowed !== false || result.source?.descriptionComplete !== false || review?.version !== 1 || typeof review.target !== "string" || !review.target.trim() || review.target.length > 4096 || typeof review.content !== "string" || !review.content.trim() || review.content.length > 1e5 || Buffer.byteLength(review.content) > 65536 || createHash("sha256").update(review.content).digest("hex") !== result.source.descriptionSha256)
    throw Error("\u7F3A\u5C11\u672C\u6B21\u5B8C\u6574\u4E14\u56FA\u5B9A\u7684\u6B63\u6587\u6838\u5BF9\u5019\u9009");
  const accepted = "\u786E\u8BA4\u672C\u6B21\u6B63\u6587\u5E76\u8BC4\u4F30", rejected = "\u62D2\u7EDD\u672C\u6B21\u8BC4\u4F30";
  const decision = await template.human({
    title: "\u5B8C\u6574\u6838\u5BF9\u672C\u6B21\u7F51\u9875JD\u5E76\u9009\u62E9\u662F\u5426\u8BC4\u4F30",
    description: "\u8BF7\u5B8C\u6574\u9605\u8BFB\u56FA\u5B9A\u76EE\u6807\u548C\u5168\u90E8\u539F\u6587\uFF0C\u4E0E\u5F53\u524D\u771F\u5B9E\u9875\u9762\u6838\u5BF9\u5B8C\u6574\u3001\u672A\u88AB\u767B\u5F55\u906E\u6321\u6216\u5220\u8282\u3002\u786E\u8BA4\u540E\u590D\u6838\u6765\u6E90\u3001\u6C42\u804C\u6761\u4EF6\u4E0E\u56FA\u5B9ASkill\uFF0C\u518D\u4EE5\u672C\u5165\u53E3\u660E\u786E\u7ED1\u5B9A\u7684\u81EA\u6709Key\u6700\u591A\u8BF7\u6C42\u4E00\u6B21\u5185\u90E8\u65B9\u5411\u8BC4\u4F30\uFF1B\u7F3A\u53E3\u6216\u53D8\u5316\u505C\u6B62\u3002\u62FF\u4E0D\u51C6\u8BF7\u62D2\u7EDD\uFF1B\u62D2\u7EDD\u4E0D\u8C03\u7528\u6A21\u578B\u3002\u8D26\u53F7/\u4F01\u4E1A\u4ECD\u672A\u6838\u9A8C\uFF0C\u4E0D\u6388\u4E88\u6295\u9012\u3001\u804A\u5929\u3001\u7B80\u5386\u6216\u4E0D\u611F\u5174\u8DA3\u52A8\u4F5C\u3002\u53D6\u6D88\u3001\u8D85\u65F6\u6216\u9000\u51FA\u4F7F\u8BF7\u6C42\u5931\u6548\uFF0C\u518D\u6B21\u8FD0\u884C\u91CD\u65B0\u91C7\u96C6\uFF0C\u4E0D\u81EA\u52A8\u91CD\u8BD5\u3002",
    schema: { type: "string", enum: [accepted, rejected] },
    review
  });
  signal.throwIfAborted();
  if (decision !== accepted && decision !== rejected) throw Error("\u6B63\u6587\u6838\u5BF9\u56DE\u6267\u4E0D\u662F\u672C\u6B21\u660E\u786E\u9009\u62E9");
  const confirmed = decision === accepted;
  const source = { ...result.source, descriptionComplete: confirmed, humanCompletenessDeclaration: confirmed, humanDecision: decision, humanReviewedAt: (/* @__PURE__ */ new Date()).toISOString() };
  const status = confirmed ? "body-source-confirmed" : "body-source-rejected";
  const digest = createHash("sha256").update(JSON.stringify({ parent: result.sourceSha256, status })).digest("hex");
  return {
    attentionKey: "web-jd-body:" + digest,
    result: {
      ...result,
      source,
      sourceSha256: digest,
      status,
      assessmentRequested: confirmed,
      reason: confirmed ? "\u672C\u4EBA\u5DF2\u58F0\u660E\u672C\u6B21\u56FA\u5B9A\u6B63\u6587\u5B8C\u6574\u5E76\u8BF7\u6C42\u5185\u90E8\u8BC4\u4F30\uFF1B\u4ECD\u987B\u590D\u6838\u6765\u6E90\u3001\u914D\u7F6E\u4E0E\u56FA\u5B9ASkill\uFF0C\u4E0D\u5F00\u542F\u62DB\u8058\u52A8\u4F5C\u3002" : "\u672C\u4EBA\u62D2\u7EDD\u672C\u6B21\u8BC4\u4F30\uFF0C\u505C\u6B62\u91C7\u7528\uFF0C\u4E0D\u8C03\u7528\u6A21\u578B\u6216\u62DB\u8058\u52A8\u4F5C\u3002",
      nextAction: confirmed ? "assessment-requested" : "ask-user",
      checkedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
};
export {
  stdin_default as default
};
