var stdin_default = async ({ input, template, signal }) => {
  signal.throwIfAborted();
  if (!input || input.site !== "boss" || !["site-mismatch", "account-unverified"].includes(input.status) || input.accountVerified !== false || input.eligibleForActions !== false)
    throw new Error("\u5F85\u6838\u5BF9\u72B6\u6001\u4E0E\u672C\u6B21\u7F51\u9875\u89C2\u5BDF\u4E0D\u4E00\u81F4");
  await template.attention({ key: "preflight:" + input.status, title: input.status === "site-mismatch" ? "BOSS \u5F53\u524D\u7F51\u9875\u4E0D\u5339\u914D\uFF0C\u8BF7\u6838\u5BF9\u6240\u9009\u6D4F\u89C8\u5668" : "BOSS \u6C42\u804C\u8005\u8D26\u53F7\u5C1A\u672A\u6838\u9A8C\uFF0C\u8BF7\u672C\u4EBA\u6838\u5BF9\u540E\u7EE7\u7EED", detail: input });
  return template.result(input);
};
export {
  stdin_default as default
};
