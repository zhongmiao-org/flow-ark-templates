async function stdin_default(ctx) {
  const { document, conversation } = ctx.input;
  if (document.status !== "ready" || conversation.status !== "confirmed")
    throw new Error("\u8BF7\u5148\u6838\u5BF9\u8D44\u6599\u5E76\u660E\u786E\u786E\u8BA4\u8BBF\u8C08");
  const units = document.units.map((unit) => unit.index);
  if (!units.length || units.some((n) => !Number.isInteger(n) || n < 1))
    throw new Error("\u8D44\u6599\u5B9A\u4F4D\u4E0D\u5B8C\u6574\uFF0C\u8BF7\u56DE\u5230\u8D44\u6599\u6838\u5BF9");
  if (!conversation.evidence || conversation.evidence.kind !== "conversation")
    throw new Error("\u5DF2\u786E\u8BA4\u8BBF\u8C08\u7F3A\u5C11\u771F\u5B9E\u6765\u6E90\uFF0C\u8BF7\u91CD\u65B0\u6838\u5BF9");
  return {
    evidence: [
      { kind: "document", label: "\u672C\u4EBA\u9009\u5B9A\u8D44\u6599", source: document.source, units },
      conversation.evidence
    ]
  };
}
export {
  stdin_default as default
};
