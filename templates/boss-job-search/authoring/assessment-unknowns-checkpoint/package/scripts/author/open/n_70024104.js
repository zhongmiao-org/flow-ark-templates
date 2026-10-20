var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  const count = input?.count, section = input?.section;
  if (!Number.isSafeInteger(count) || count < 0 || count > 200 || !section || section.version !== 1 || section.kind !== "city-section-position" || !Number.isSafeInteger(section.sectionPosition) || section.sectionPosition < 1 || section.sectionPosition > 40) {
    throw new Error("\u57CE\u5E02\u6BB5\u6216\u94FE\u63A5\u6570\u91CF\u65E0\u6548\uFF0C\u8BF7\u91CD\u65B0\u6838\u5BF9\u7F51\u7AD9\u5217\u8868\u3002");
  }
  const expected = "div:nth-of-type(2) > div:nth-of-type(2) > div > ul:nth-of-type(2) > li:nth-of-type(" + section.sectionPosition + ")";
  if (section.sectionSelector !== expected || section.linkSelector !== expected + " > div > a") {
    throw new Error("\u57CE\u5E02\u6BB5\u5B9A\u4F4D\u4E0E\u672C\u6B21\u679A\u4E3E\u4F4D\u7F6E\u4E0D\u4E00\u81F4\uFF0C\u672A\u6784\u9020\u65B0\u76EE\u6807\u3002");
  }
  return Array.from({ length: count || 1 }, (_, index) => ({
    version: 1,
    kind: "city-option-position",
    sectionPosition: section.sectionPosition,
    optionPosition: index + 1,
    representation: count ? "linked-city" : "direct-city",
    citySelector: count ? section.linkSelector + ":nth-of-type(" + (index + 1) + ")" : section.sectionSelector
  }));
};
export {
  stdin_default as default
};
