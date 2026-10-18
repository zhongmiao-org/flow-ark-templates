var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  if (!input?.ref || typeof input.ref.key !== "string" || typeof input.ref.versionId !== "string" || !/^[a-f0-9]{64}$/.test(input.ref.sha256) || !input.confirmedAt) {
    throw new Error("\u8BF7\u5148\u9009\u62E9\u53EF\u6838\u9A8C\u7684\u56FA\u5B9A\u7236\u786E\u8BA4\u7248\u672C\uFF0C\u4E0D\u80FD\u4F7F\u7528\u8349\u7A3F\u6216\u731C\u6D4B\u7248\u672C\u3002");
  }
  if (!input.data || Array.isArray(input.data) || input.data.version !== 1 || typeof input.markdown !== "string" || !input.markdown.trim() || !Array.isArray(input.evidence)) {
    throw new Error("\u7236Skill\u4E0D\u662F\u5B8C\u6574\u6765\u6E90\u5206\u7C7B\u683C\u5F0F\uFF1B\u8BF7\u4FDD\u7559\u539F\u7248\u672C\u5E76\u6838\u5BF9\uFF0C\u4E0D\u80FD\u9759\u9ED8\u8F6C\u6362\u65E7\u7ED3\u6784\u3002");
  }
  for (const field of ["facts", "preferences", "expression", "boundaries", "unknowns"]) {
    if (typeof input.data[field] !== "string") throw new Error("\u7236Skill\u5206\u7C7B\u4E0D\u662F\u6587\u672C\uFF1A" + field + "\u3002\u8BF7\u6838\u5BF9\u51C6\u786E\u7248\u672C\u3002");
  }
  return { initialParent: { ref: input.ref, title: input.title, markdown: input.markdown, data: input.data, evidence: input.evidence } };
};
export {
  stdin_default as default
};
