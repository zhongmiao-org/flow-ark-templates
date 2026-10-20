var stdin_default = async ({ input, template, signal }) => {
  signal.throwIfAborted();
  if (!input || input.version !== 1 || input.ready !== false || input.status !== "needs-review" || !Number.isSafeInteger(input.configurationRevision) || input.configurationRevision < 0 || input.accountVerified !== false || input.eligibleForActions !== false || !Array.isArray(input.issues) || !input.issues.length) throw new Error("\u5F85\u6838\u5BF9\u6761\u4EF6\u4E0E\u914D\u7F6E\u4FEE\u8BA2\u4E0D\u4E00\u81F4");
  await template.attention({ key: "conditions-review:" + input.configurationRevision, title: "BOSS \u6C42\u804C\u6761\u4EF6\u9700\u8981\u672C\u4EBA\u8865\u5145\u6216\u6838\u5BF9", detail: input });
  return template.result(input);
};
export {
  stdin_default as default
};
