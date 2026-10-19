var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  if (!Number.isSafeInteger(input) || input < 1 || input > 40) {
    throw new Error("\u5F53\u524D\u57CE\u5E02\u5206\u7EC4\u7684\u5206\u6BB5\u6570\u91CF\u7F3A\u5931\u6216\u8D85\u51FA\u8303\u56F4\uFF0C\u8BF7\u91CD\u65B0\u6838\u5BF9\u7F51\u7AD9\u7ED3\u6784\u3002");
  }
  const rows = "div:nth-of-type(2) > div:nth-of-type(2) > div > ul:nth-of-type(2) > li";
  return Array.from({ length: input }, (_, index) => {
    const selector = rows + ":nth-of-type(" + (index + 1) + ")";
    return {
      version: 1,
      kind: "city-section-position",
      sectionPosition: index + 1,
      sectionSelector: selector,
      linkSelector: selector + " > div > a"
    };
  });
};
export {
  stdin_default as default
};
