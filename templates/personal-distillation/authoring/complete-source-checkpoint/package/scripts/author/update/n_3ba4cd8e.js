async function stdin_default(ctx) {
  const { prepared, conversation, suggestion } = ctx.input;
  if (conversation.status !== "confirmed" || conversation.evidence?.kind !== "conversation")
    throw new Error("\u8BF7\u5148\u660E\u786E\u786E\u8BA4\u672C\u6B21\u8865\u5145\u8BBF\u8C08");
  if (suggestion.decision !== "ready") throw new Error("\u5C40\u90E8\u63D0\u6848\u5C1A\u4E0D\u660E\u786E\uFF0C\u8BF7\u8865\u5145\u8BBF\u8C08");
  const { parent, scope, kind, path, currentValue, fragment } = prepared;
  const value = JSON.parse(suggestion.valueJson);
  const data = structuredClone(parent.data);
  if (kind === "field") {
    if (typeof currentValue === "string" ? typeof value !== "string" : !Array.isArray(value) || !value.every((v) => typeof v === "string"))
      throw new Error("\u65B0\u503C\u7C7B\u578B\u4E0E\u6240\u9009\u5B57\u6BB5\u4E0D\u7B26\uFF0C\u672A\u521B\u5EFA\u8349\u7A3F");
    if (scope === "\u4E8B\u5B9E\u72B6\u6001" && !["reported", "unknown", "conflict"].includes(value))
      throw new Error("\u4E8B\u5B9E\u72B6\u6001\u65E0\u6548\uFF0C\u672A\u521B\u5EFA\u8349\u7A3F");
    let container = data;
    for (const key of path.slice(0, -1)) container = container[key];
    Object.defineProperty(container, path.at(-1), { value, enumerable: true, configurable: true, writable: true });
  } else if (kind === "append") {
    if (!value || Array.isArray(value) || typeof value !== "object" || Object.keys(value).sort().join(",") !== "source,statement,status" || !["statement", "source", "status"].every((key) => typeof value[key] === "string") || !value.statement.trim() || !["reported", "unknown", "conflict"].includes(value.status))
      throw new Error("\u65B0\u589E\u4E8B\u5B9E\u683C\u5F0F\u65E0\u6548\uFF0C\u672A\u521B\u5EFA\u8349\u7A3F");
    data.facts.push(value);
  } else if (kind === "remove") {
    if (value !== null) throw new Error("\u5220\u9664\u4E8B\u5B9E\u63D0\u6848\u683C\u5F0F\u65E0\u6548\uFF0C\u672A\u521B\u5EFA\u8349\u7A3F");
    data.facts.splice(path[1], 1);
  } else if (kind !== "markdown" || value !== null) {
    throw new Error("\u5C40\u90E8\u66F4\u65B0\u7C7B\u578B\u65E0\u6548\uFF0C\u672A\u521B\u5EFA\u8349\u7A3F");
  }
  let markdown = parent.markdown;
  if (fragment) {
    const at = markdown.indexOf(fragment);
    if (at < 0 || markdown.indexOf(fragment, at + 1) >= 0)
      throw new Error("\u539F\u7247\u6BB5\u4E0D\u5B58\u5728\u6216\u4E0D\u552F\u4E00\uFF0C\u672A\u521B\u5EFA\u8349\u7A3F");
    markdown = markdown.slice(0, at) + suggestion.replacement + markdown.slice(at + fragment.length);
  } else if (suggestion.replacement !== "") {
    throw new Error("\u672A\u9009\u62E9\u6B63\u6587\u7247\u6BB5\uFF0C\u4E0D\u80FD\u989D\u5916\u6539\u5199\u6B63\u6587");
  }
  return {
    key: parent.ref.key,
    base: parent.ref,
    title: parent.title,
    markdown,
    data,
    evidence: [...parent.evidence, conversation.evidence],
    changes: [{ scope, path, before: kind === "markdown" ? fragment : currentValue, after: kind === "markdown" ? suggestion.replacement : value, reason: suggestion.reason }]
  };
}
export {
  stdin_default as default
};
