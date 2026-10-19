var stdin_default = async ({ input, template, signal }) => {
  signal.throwIfAborted();
  if (!input?.result || input.result.decision !== "review" || input.result.accountVerified !== false || input.result.eligibleForActions !== false || typeof input.reviewKey !== "string") throw Error("\u7F3A\u5C11\u6709\u6548\u7684\u672C\u4EBA\u6838\u5BF9\u7ED3\u679C");
  await template.attention({ key: input.reviewKey, title: "BOSS \u804C\u4F4D\u65B9\u5411\u9700\u8981\u672C\u4EBA\u5224\u65AD\uFF0C\u8BF7\u6838\u5BF9JD\u4E0E\u6C42\u804C\u6761\u4EF6", detail: input.result });
  await template.result(input.result);
  return input.result;
};
export {
  stdin_default as default
};
