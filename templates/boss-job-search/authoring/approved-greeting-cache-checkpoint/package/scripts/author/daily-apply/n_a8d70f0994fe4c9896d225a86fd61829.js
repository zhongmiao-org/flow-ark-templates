var stdin_default = async ({ input, template, signal }) => {
  signal.throwIfAborted();
  if (!input?.result || input.result.accountVerified !== false || input.result.eligibleForActions !== false) throw Error("\u7F3A\u5C11\u6709\u6548\u7684\u5185\u90E8\u5EFA\u8BAE\u7ED3\u679C");
  await Promise.resolve(input.result);
  return input.result;
};
export {
  stdin_default as default
};
