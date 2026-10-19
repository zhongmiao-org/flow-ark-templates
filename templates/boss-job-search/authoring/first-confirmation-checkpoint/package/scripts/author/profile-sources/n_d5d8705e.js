var stdin_default = async ({ input, template, signal }) => {
  signal.throwIfAborted();
  if (!input || input.version !== 1 || input.ready !== true || input.status !== "sources-ready" || input.resume?.status !== "ready" || input.accountVerified !== false || input.eligibleForActions !== false) throw new Error("\u8D44\u6599\u6765\u6E90\u5C31\u7EEA\u7ED3\u679C\u4E0D\u4E00\u81F4");
  return template.result(input);
};
export {
  stdin_default as default
};
