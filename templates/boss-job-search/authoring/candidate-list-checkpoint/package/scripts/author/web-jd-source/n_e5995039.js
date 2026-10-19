var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  if (!input?.result || input.result.version !== 1 || input.result.kind !== "web-jd-source" || input.result.accountVerified !== false || input.result.eligibleForActions !== false || input.result.modelInputAllowed !== false || typeof input.attentionKey !== "string") throw Error("\u7F3A\u5C11\u672C\u6B21\u7F51\u9875JD\u6765\u6E90\u6838\u5BF9\u7ED3\u679C");
  await template.result(input.result);
  signal.throwIfAborted();
  const attention = await template.attention({ key: input.attentionKey, title: "\u7F51\u9875JD\u6765\u6E90\u4ECD\u9700\u672C\u4EBA\u6838\u5BF9", detail: input.result });
  signal.throwIfAborted();
  return { ...input.result, attention };
};
export {
  stdin_default as default
};
