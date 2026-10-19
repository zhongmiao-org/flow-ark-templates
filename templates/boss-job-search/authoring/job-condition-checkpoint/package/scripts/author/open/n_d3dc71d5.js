var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  if (!Number.isSafeInteger(input) || input < 1 || input > 20) {
    throw new Error("\u57CE\u5E02\u5206\u7EC4\u6570\u91CF\u7F3A\u5931\u6216\u8D85\u51FA\u5DF2\u652F\u6301\u8303\u56F4\uFF0C\u8BF7\u91CD\u65B0\u6838\u5BF9\u7F51\u7AD9\u5F39\u5C42\u3002");
  }
  const list = "div:nth-of-type(2) > div:nth-of-type(2) > div > ul:nth-of-type(1) > li";
  return Array.from({ length: input }, (_, index) => ({
    version: 1,
    kind: "city-group-position",
    groupPosition: index + 1,
    groupSelector: list + ":nth-of-type(" + (index + 1) + ")"
  }));
};
export {
  stdin_default as default
};
