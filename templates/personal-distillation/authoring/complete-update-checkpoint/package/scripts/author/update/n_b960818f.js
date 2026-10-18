var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  const { parent, reduction } = input ?? {};
  if (!parent?.ref || parent.data?.version !== 1 || typeof parent.title !== "string" || !Array.isArray(parent.evidence)) throw new Error("\u56FA\u5B9A\u7236\u7248\u672C\u7F3A\u5931\u6216\u7ED3\u6784\u4E0D\u652F\u6301\uFF0C\u539F\u7248\u672C\u4FDD\u6301\u3002");
  if (reduction?.version !== 1 || reduction.phase !== "complete" || reduction.checkpoint?.next !== null || !reduction.proof || reduction.proof.checkpointSha256 !== reduction.checkpoint.sha256) throw new Error("\u5B8C\u6574\u8865\u5145\u6765\u6E90\u5C1A\u672A\u5168\u90E8\u8986\u76D6\uFF0C\u8BF7\u6838\u5BF9\u539F\u6574\u7406\u8FDB\u5EA6\u540E\u7EE7\u7EED\u3002");
  const draft = reduction.checkpoint.accumulator;
  for (const field of ["markdown", "facts", "preferences", "expression", "boundaries", "unknowns", "continuation"]) {
    if (typeof draft?.[field] !== "string") throw new Error("\u5B8C\u6574\u5019\u9009\u5B57\u6BB5\u7F3A\u5931\uFF1A" + field);
    if (field !== "markdown" && field !== "continuation" && typeof parent.data[field] !== "string") throw new Error("\u7236Skill\u5206\u7C7B\u4E0D\u662F\u6587\u672C\uFF1A" + field);
  }
  if (!draft.markdown.trim() || draft.continuation.trim()) throw new Error("\u6B63\u6587\u4E3A\u7A7A\u6216\u4ECD\u6709\u672A\u63A5\u7EED\u5185\u5BB9\uFF0C\u4E0D\u80FD\u51C6\u5907\u66F4\u65B0\u5EFA\u8BAE\u3002");
  return {
    base: parent.ref,
    title: parent.title,
    markdown: draft.markdown,
    data: { ...parent.data, facts: draft.facts, preferences: draft.preferences, expression: draft.expression, boundaries: draft.boundaries, unknowns: draft.unknowns },
    evidence: [...parent.evidence, { kind: "source-reduction", label: "\u672C\u4EBA\u9009\u62E9\u7684\u56FA\u5B9A\u5B8C\u6574\u8865\u5145\u6765\u6E90", proof: reduction.proof }],
    usage: { reportedTotalTokens: reduction.reportedTotalTokens, unknownUsageRequests: reduction.unknownUsageRequests, attempts: reduction.attempts, note: "\u4EC5\u672C\u6B21\u8865\u5145\u6765\u6E90\u6574\u7406\uFF1B\u5931\u8D25\u8BA1\u5B9E\u9645\u8D39\u7528\uFF0C\u672A\u77E5\u7528\u91CF\u4E0D\u80FD\u586B\u96F6\uFF1B\u65E7\u8BBF\u8C08\u4E0E\u65E7\u6574\u7406\u53E6\u8BA1\u3002" }
  };
};
export {
  stdin_default as default
};
