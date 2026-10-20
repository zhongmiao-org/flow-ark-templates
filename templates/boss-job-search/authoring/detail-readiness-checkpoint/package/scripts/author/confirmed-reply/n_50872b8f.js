var stdin_default = async ({ input, template, signal }) => {
  signal.throwIfAborted();
  const result = input?.result;
  if (input?.ready !== false || result?.kind !== "reply-readiness" || result.eligibleForActions !== false || result.accountVerified !== false || !Array.isArray(result.issues) || result.issues.some((v) => typeof v !== "string") || typeof input.reviewKey !== "string" || !result.quota || !result.observedPage) throw Error("\u7F3A\u5C11\u672C\u6B21\u56DE\u590D\u68C0\u67E5\u7ED3\u679C\uFF0C\u4E0D\u901A\u77E5\u6210\u529F\u6216\u6267\u884C\u540E\u7EE7");
  const detail = {
    "\u68C0\u67E5\u7ED3\u8BBA": result.reason,
    "\u9700\u8981\u5904\u7406": result.issues.join("\uFF1B"),
    "\u5F53\u524D\u9875\u9762": result.observedPage.origin === "null" ? "\u7A7A\u767D\u6216\u975E\u7AD9\u70B9\u9875\u9762" : result.observedPage.origin + result.observedPage.pathname,
    "\u8D26\u53F7\u4E0E\u4F1A\u8BDD": "\u5C1A\u672A\u6838\u9A8C\uFF0C\u4E0D\u80FD\u53D1\u9001",
    "\u6BCF\u65E5\u56DE\u590D\u4E0A\u9650": result.quota.limit,
    "\u989D\u5EA6\u65F6\u533A": result.quota.timeZone,
    "\u989D\u5EA6\u65E5\u671F": result.quota.day,
    "\u5DF2\u4FDD\u5B58\u610F\u56FE\u8BB0\u5F55": result.quota.reservedRecords,
    "\u56FA\u5B9A\u914D\u7F6E\u4FEE\u8BA2": result.configurationRevision,
    "\u8BFB\u53D6\u7684\u72B6\u6001\u4FEE\u8BA2": result.stateRevision,
    "\u672C\u6B21\u5B9E\u9645\u884C\u4E3A": "\u672A\u9884\u7559\u989D\u5EA6\u3001\u672A\u5199\u72B6\u6001\u3001\u672A\u586B\u5199\u6216\u70B9\u51FB\u53D1\u9001\u3001\u672A\u8BF7\u6C42\u6A21\u578B",
    "\u540E\u7EED\u6838\u5BF9": "\u5B8C\u6574\u6765\u6E90\u548C\u7ED3\u6784\u5316\u7ED3\u679C\u4ECD\u4FDD\u7559\u5728\u539F\u8FD0\u884C\uFF0C\u67E5\u770B\u6216\u91CD\u5F00\u4E0D\u4F1A\u6388\u6743\u53D1\u9001\u3002"
  };
  await template.attention({ key: input.reviewKey, title: "BOSS \u56DE\u590D\u5C1A\u672A\u5C31\u7EEA\uFF0C\u8BF7\u6838\u5BF9\u5F53\u524D\u6765\u6E90\u4E0E\u989D\u5EA6", detail });
  signal.throwIfAborted();
  await template.result(result);
  return result;
};
export {
  stdin_default as default
};
