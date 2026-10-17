var stdin_default = async ({ input, template, signal }) => {
  signal.throwIfAborted();
  if (!input?.result || !["ask-user", "resume-proposal"].includes(input.result.nextAction) || input.result.accountVerified !== false || input.result.eligibleForActions !== false || typeof input.reviewKey !== "string") throw Error("\u7F3A\u5C11\u6709\u6548\u7684\u672C\u4EBA\u6838\u5BF9\u5EFA\u8BAE");
  await template.attention({ key: input.reviewKey, title: "BOSS \u6765\u4FE1\u9700\u8981\u672C\u4EBA\u6838\u5BF9\uFF0C\u5C1A\u672A\u53D1\u9001\u6D88\u606F\u6216\u9644\u4EF6", detail: input.result });
  await template.result(input.result);
  return input.result;
};
export {
  stdin_default as default
};
