var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const result = input?.result;
  const statuses = ["site-mismatch", "login-required", "not-job-page", "source-incomplete", "source-changed", "body-incomplete", "review-too-large", "body-source-confirmed", "body-source-rejected"];
  if (!result || result.version !== 1 || result.kind !== "web-jd-body" || !statuses.includes(result.status) || result.accountVerified !== false || result.eligibleForActions !== false || result.modelInputAllowed !== false || typeof input.attentionKey !== "string" || !/^web-jd-body:[a-f0-9]{64}$/.test(input.attentionKey) || result.source?.companyVerified !== false || result.source?.descriptionComplete !== (result.status === "body-source-confirmed"))
    throw Error("\u7F3A\u5C11\u672C\u6B21\u5DF2\u505C\u6B62\u6216\u5DF2\u4EBA\u5DE5\u6838\u5BF9\u7684\u6B63\u6587\u7ED3\u679C");
  await template.result(result);
  signal.throwIfAborted();
  const source = result.source;
  const detail = {
    "\u5904\u7406\u7ED3\u679C": result.status === "body-source-confirmed" ? "\u672C\u4EBA\u5DF2\u786E\u8BA4\uFF0C\u4EC5\u4FDD\u7559\u672C\u6B21\u6765\u6E90" : result.status === "body-source-rejected" ? "\u672C\u4EBA\u5DF2\u62D2\u7EDD\u672C\u6B21\u6B63\u6587" : "\u505C\u6B62\u91C7\u7528\uFF0C\u8BF7\u672C\u4EBA\u6838\u5BF9",
    "\u539F\u56E0": result.reason,
    "\u6765\u6E90\u9875\u9762": source.page.origin + source.page.pathname,
    "\u9875\u9762\u6807\u9898": source.page.title ?? "\u5C1A\u672A\u53D6\u5F97\u552F\u4E00\u6807\u9898",
    "\u5C97\u4F4D\u5019\u9009": source.jobTitle ?? "\u5C1A\u672A\u53D6\u5F97\u552F\u4E00\u5C97\u4F4D",
    "\u516C\u53F8\u5019\u9009\uFF08\u672A\u6838\u9A8C\uFF09": source.companyLabel ?? "\u5C1A\u672A\u53D6\u5F97\u552F\u4E00\u516C\u53F8\u6807\u7B7E",
    "\u6B63\u6587\u72B6\u6001": source.descriptionComplete ? "\u672C\u4EBA\u5DF2\u9605\u8BFB\u5E76\u58F0\u660E\u5B8C\u6574\uFF1B\u8BE5\u58F0\u660E\u4EC5\u4F5C\u7528\u672C\u6B21\u56FA\u5B9A\u6765\u6E90" : source.descriptionRead ? "\u4EC5\u53D6\u5F97\u5F85\u6838\u5BF9\u5019\u9009\uFF0C\u672A\u786E\u8BA4\u5B8C\u6574" : "\u672A\u8BFB\u53D6\u53EF\u91C7\u7528\u6B63\u6587",
    "\u540E\u7EED\u5904\u7406": result.status === "body-source-confirmed" ? "\u6765\u6E90\u5DF2\u4FDD\u7559\u3002\u7F51\u9875\u65B9\u5411\u8BC4\u4F30\u4ECD\u9700\u72EC\u7ACB\u5165\u53E3\u4E0E\u81EA\u5DF1\u7684Key\uFF0C\u672C\u6B21\u672A\u8C03\u7528\u6A21\u578B\u3002" : "\u6838\u5BF9\u9875\u9762\u3001\u767B\u5F55\u9650\u5236\u6216\u5B9A\u4F4D\u540E\uFF0C\u7531\u672C\u4EBA\u660E\u786E\u91CD\u65B0\u8FD0\u884C\uFF1B\u4E0D\u81EA\u52A8\u91CD\u8BD5\u3002",
    "\u6743\u9650\u8FB9\u754C": "\u672A\u6838\u9A8C\u8D26\u53F7\u6216\u516C\u53F8\uFF0C\u4E0D\u8C03\u7528\u6A21\u578B\uFF0C\u4E0D\u6295\u9012\u3001\u4E0D\u53D1\u6D88\u606F\u6216\u7B80\u5386\u3001\u4E0D\u70B9\u51FB\u4E0D\u611F\u5174\u8DA3\u3002",
    "\u6765\u6E90\u6458\u8981": result.sourceSha256
  };
  const attention = await template.attention({ key: input.attentionKey, title: result.status === "body-source-confirmed" ? "\u7F51\u9875JD\u6B63\u6587\u5DF2\u7531\u672C\u4EBA\u786E\u8BA4\uFF0C\u4EC5\u4FDD\u7559\u6765\u6E90" : "\u7F51\u9875JD\u6B63\u6587\u6765\u6E90\u9700\u8981\u672C\u4EBA\u5904\u7406", detail });
  signal.throwIfAborted();
  return { ...result, attention };
};
export {
  stdin_default as default
};
