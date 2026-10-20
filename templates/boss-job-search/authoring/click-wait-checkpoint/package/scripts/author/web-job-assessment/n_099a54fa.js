var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const result = input?.result;
  if (!result || result.version !== 1 || result.kind !== "web-job-assessment-advice" || !["match", "mismatch", "review"].includes(result.decision) || result.accountVerified !== false || result.eligibleForActions !== false || typeof input.reviewKey !== "string" || !/^(web-jd-input|jd-advice|jd-ai-failure):[a-f0-9]{64}$/.test(input.reviewKey) || result.source?.kind !== "reviewed-web-jd-assessment-source" || result.source?.companyVerified !== false) throw Error("\u7F3A\u5C11\u672C\u6B21\u7F51\u9875\u6765\u6E90\u4E0E\u5185\u90E8\u8BC4\u4F30\u7ED3\u679C");
  const source = result.source;
  const decision = result.decision === "match" ? "\u660E\u786E\u7B26\u5408\u5EFA\u8BAE\uFF0C\u4EC5\u51C6\u5907\u5185\u90E8\u8349\u7A3F" : result.decision === "mismatch" ? "\u660E\u786E\u4E0D\u7B26\u5408\u5EFA\u8BAE\uFF0C\u4EC5\u4FDD\u7559\u4E0D\u611F\u5174\u8DA3\u63D0\u6848" : "\u9700\u8981\u672C\u4EBA\u5224\u65AD";
  const detail = {
    "\u5904\u7406\u7ED3\u679C": decision,
    "\u539F\u56E0": result.reason || "\u8BF7\u6838\u5BF9\u672C\u6B21\u6765\u6E90\u4E0E\u5185\u90E8\u5EFA\u8BAE",
    "\u9700\u6838\u5BF9\u9879": Array.isArray(result.issues) && result.issues.length ? result.issues.join("\uFF1B") : "\u683C\u5F0F\u53CA\u539F\u53E5\u6838\u5BF9\u901A\u8FC7\u4E0D\u8BC1\u660E\u8BED\u4E49\u6B63\u786E",
    "\u6765\u6E90\u9875\u9762": source.page.origin + source.page.pathname,
    "\u7F51\u9875\u5C97\u4F4D": source.jobTitle ?? "\u672A\u53D6\u5F97\u552F\u4E00\u5C97\u4F4D",
    "\u516C\u53F8\u5019\u9009\uFF08\u672A\u6838\u9A8C\uFF09": source.companyLabel ?? "\u672A\u53D6\u5F97\u552F\u4E00\u516C\u53F8\u5019\u9009",
    "\u6B63\u6587\u6458\u8981": source.descriptionSha256,
    "\u672C\u4EBA\u6838\u5BF9": "\u4EC5\u4F5C\u7528\u672C\u6B21\u56FA\u5B9A\u6765\u6E90\uFF1B\u786E\u8BA4\u540E\u518D\u6B21\u91C7\u96C6\u5E76\u6838\u5BF9\u7CBE\u786E\u6B63\u6587",
    "\u6C42\u804C\u6761\u4EF6\u4FEE\u8BA2": String(source.configurationRevision),
    "\u56FA\u5B9ASkill": source.profile ? source.profile.key + " \xB7 " + source.profile.versionId + " \xB7 " + source.profile.sha256 : "\u672C\u5206\u652F\u672A\u8BFB\u53D6Skill\uFF0C\u4E0D\u4F2A\u9020\u7248\u672C",
    "\u6A21\u578B\u72B6\u6001": result.failure ? "\u672C\u6B21\u8BF7\u6C42\u5931\u8D25\uFF1A" + result.failure.error.message : source.profile ? "\u672C\u6B21\u5185\u90E8\u5EFA\u8BAE\uFF1B\u5B9E\u9645\u8BF7\u6C42\u4E0E\u7528\u91CF\u89C1\u5173\u8054Run" : "\u51C6\u5907\u9636\u6BB5\u505C\u6B62\uFF0C\u672A\u8BF7\u6C42\u6A21\u578B",
    "\u4F9D\u636E\u539F\u53E5": result.recommendation?.quotes?.length ? result.recommendation.quotes.join("\n") : "\u65E0\u53EF\u91C7\u7528\u7684\u660E\u786E\u7ED3\u8BBA\u539F\u53E5",
    "\u540E\u7EED\u64CD\u4F5C": result.decision === "review" ? "\u8BF7\u672C\u4EBA\u6838\u5BF9\u7F3A\u53E3\u6216\u6545\u969C\uFF1B\u4E0D\u81EA\u52A8\u91CD\u8BD5\u3002\u518D\u6B21\u8FD0\u884C\u91CD\u65B0\u91C7\u96C6\u5E76\u786E\u8BA4\u6765\u6E90\u3002" : "\u4EC5\u5185\u90E8\u5EFA\u8BAE\u3002\u5B9E\u9645\u7AD9\u70B9\u52A8\u4F5C\u53E6\u884C\u6838\u5BF9\u8D26\u53F7/\u4F1A\u8BDD/\u6388\u6743\u4E0E\u56DE\u6267\u3002",
    "\u6743\u9650\u8FB9\u754C": "\u672A\u6838\u9A8C\u8D26\u53F7\u6216\u516C\u53F8\uFF0C\u4E0D\u6295\u9012\u3001\u4E0D\u53D1\u9001\u6D88\u606F\u6216\u7B80\u5386\u3001\u4E0D\u70B9\u51FB\u4E0D\u611F\u5174\u8DA3\u3002"
  };
  await template.result(result);
  signal.throwIfAborted();
  const attention = await template.attention({ key: input.reviewKey, title: result.decision === "review" ? "\u7F51\u9875JD\u65B9\u5411\u9700\u8981\u672C\u4EBA\u6838\u5BF9" : "\u7F51\u9875JD\u65B9\u5411\u5EFA\u8BAE\u5DF2\u4FDD\u5B58\uFF0C\u5C1A\u672A\u6267\u884C\u62DB\u8058\u52A8\u4F5C", detail });
  signal.throwIfAborted();
  return { ...result, attention };
};
export {
  stdin_default as default
};
