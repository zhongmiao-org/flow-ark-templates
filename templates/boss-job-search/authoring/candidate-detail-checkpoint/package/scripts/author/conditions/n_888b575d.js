var stdin_default = async ({ input, template, signal }) => {
  signal.throwIfAborted();
  if (!input || input.version !== 1 || input.ready !== true || input.status !== "ready" || input.accountVerified !== false || input.eligibleForActions !== false || !Array.isArray(input.issues) || input.issues.length) throw new Error("\u6C42\u804C\u6761\u4EF6\u6838\u5BF9\u7ED3\u679C\u4E0D\u4E00\u81F4");
  return template.result(input);
};
export {
  stdin_default as default
};
