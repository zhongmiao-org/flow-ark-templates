var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  if (input?.version !== 1 || input.phase !== "complete" || input.checkpoint?.next !== null || !input.proof || input.proof.checkpointSha256 !== input.checkpoint.sha256)
    throw new Error("\u5B8C\u6574\u6765\u6E90\u4ECD\u672A\u5168\u90E8\u8986\u76D6\uFF1B\u4FDD\u7559\u8FDB\u5EA6\u5E76\u6838\u5BF9\u540E\u7EE7\u7EED\u539F\u6574\u7406\u5165\u53E3\u3002");
  const draft = input.checkpoint.accumulator;
  for (const field of ["markdown", "facts", "preferences", "expression", "boundaries", "unknowns", "continuation"])
    if (typeof draft?.[field] !== "string") throw new Error("\u5B8C\u6574\u8349\u7A3F\u5B57\u6BB5\u7F3A\u5931\uFF0C\u8BF7\u6838\u5BF9\u6574\u7406\u7ED3\u679C\u3002");
  if (!draft.markdown.trim() || draft.continuation.trim())
    throw new Error("\u8349\u7A3F\u6B63\u6587\u4E3A\u7A7A\u6216\u4ECD\u6709\u672A\u63A5\u7EED\u5185\u5BB9\uFF0C\u4E0D\u80FD\u521B\u5EFASkill\u3002");
  return {
    markdown: draft.markdown,
    data: {
      version: 1,
      facts: draft.facts,
      preferences: draft.preferences,
      expression: draft.expression,
      boundaries: draft.boundaries,
      unknowns: draft.unknowns
    },
    evidence: [{ kind: "source-reduction", label: "\u672C\u4EBA\u9009\u62E9\u7684\u56FA\u5B9A\u5B8C\u6574\u6750\u6599\u4E0E\u8BBF\u8C08\u6765\u6E90", proof: input.proof }],
    usage: {
      reportedTotalTokens: input.reportedTotalTokens,
      unknownUsageRequests: input.unknownUsageRequests,
      attempts: input.attempts,
      note: "\u4EC5\u672C\u6B21\u6765\u6E90\u6574\u7406\uFF1B\u4E0D\u542B\u6B64\u524D\u8BBF\u8C08\uFF0C\u672A\u77E5\u7528\u91CF\u4E0D\u80FD\u586B\u96F6\u3002"
    }
  };
};
export {
  stdin_default as default
};
