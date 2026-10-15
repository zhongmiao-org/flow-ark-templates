var stdin_default = async ({ input, template, signal }) => {
  signal.throwIfAborted();
  if (!input || input.site !== "boss" || input.status !== "login-required" || input.accountVerified !== false || input.eligibleForActions !== false)
    throw new Error("\u767B\u5F55\u5F85\u529E\u4E0E\u672C\u6B21\u53EA\u8BFB\u89C2\u5BDF\u4E0D\u4E00\u81F4");
  await template.attention({ key: "preflight:login-required", title: "BOSS \u9700\u8981\u672C\u4EBA\u767B\u5F55\uFF0C\u5B8C\u6210\u540E\u91CD\u65B0\u8FD0\u884C\u53EA\u8BFB\u9884\u68C0", detail: input });
  return template.result(input);
};
export {
  stdin_default as default
};
