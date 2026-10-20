var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  if (typeof input !== "string" || input.length > 100) throw new Error("\u8D26\u53F7\u522B\u540D\u5E94\u4E3A\u4E0D\u8D85\u8FC7100\u5B57\u7684\u6587\u672C");
  const accountAlias = input.trim();
  if (!accountAlias || /[\r\n]/.test(accountAlias)) throw new Error("\u8BF7\u5148\u586B\u5199\u56FA\u5B9A\u7684\u672C\u5730\u8D26\u53F7\u522B\u540D\uFF0C\u518D\u91CD\u65B0\u8FD0\u884C");
  return { version: 1, accountAlias };
};
export {
  stdin_default as default
};
