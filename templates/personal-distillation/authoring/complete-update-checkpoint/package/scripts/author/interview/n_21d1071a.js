var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  const { files, results } = input;
  if (!Array.isArray(files) || !files.length || files.length > 10 || !Array.isArray(results) || results.length !== files.length)
    throw Error("\u8D44\u6599\u6E05\u5355\u4E0E\u5B9E\u9645\u89E3\u6790\u7ED3\u679C\u6570\u91CF\u4E0D\u4E00\u81F4");
  const documents = results.map((row, index) => {
    const values = row && typeof row === "object" && !Array.isArray(row) ? Object.values(row) : [];
    if (values.length !== 1) throw Error("\u6BCF\u4EFD\u8D44\u6599\u5FC5\u987B\u5BF9\u5E94\u4E00\u6B21\u660E\u786E\u89E3\u6790");
    const d = values[0];
    if (!d?.source || d.source.name !== files[index] || !["ready", "partial", "empty"].includes(d.status) || !Array.isArray(d.units) || !Array.isArray(d.warnings) || d.text !== d.units.map((u) => u.text).join("\n"))
      throw Error("\u8D44\u6599\u6765\u6E90\u3001\u987A\u5E8F\u6216\u6B63\u6587\u5B9A\u4F4D\u4E0D\u4E00\u81F4");
    return { status: d.status, source: d.source, units: d.units, warnings: d.warnings };
  });
  const context = { version: 1, documents };
  const characters = documents.reduce((n, d) => n + d.units.map((u) => u.text).join("\n").length, 0);
  const contextBytes = Buffer.byteLength(JSON.stringify(context), "utf8");
  const overBudget = characters > 5e4 || contextBytes > 196608;
  const issues = documents.flatMap((d) => d.status === "ready" ? [] : [`${d.source.name}\uFF1A${d.status === "empty" ? "\u6B63\u6587\u4E3A\u7A7A" : "\u5B58\u5728\u5185\u5BB9\u7F3A\u53E3"}\uFF0C\u8BF7\u672C\u4EBA\u6838\u5BF9`]);
  if (overBudget) issues.push("\u8D44\u6599\u5408\u8BA1\u8D85\u8FC750,000\u5B57\u7B26\u6216192KiB\u4E0A\u4E0B\u6587\uFF1B\u672A\u622A\u65AD\u3001\u672A\u5EFA\u7ACB\u8BBF\u8C08");
  const evidence = documents.filter((d) => d.units.length).map((d) => ({ kind: "document", label: d.source.name, source: d.source, units: d.units.map((u) => u.index) }));
  const metadata = documents.map((d) => ({ status: d.status, source: d.source, unitCount: d.units.length, warnings: d.warnings }));
  signal.throwIfAborted();
  return { version: 1, ready: issues.length === 0, status: issues.length ? "materials-review" : "materials-ready", documents: metadata, totals: { files: files.length, characters, contextBytes }, context: overBudget ? null : context, evidence, issues, modelRequested: false };
};
export {
  stdin_default as default
};
