var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  const d = input?.resume, s = input?.profile;
  if (!d || d.version !== 1 || !["ready", "partial", "empty"].includes(d.status) || !d.source || !Array.isArray(d.units) || !Array.isArray(d.warnings) || typeof d.text !== "string") throw new Error("\u7F3A\u5C11\u672C\u6B21\u771F\u5B9E\u8D44\u6599\u89E3\u6790\u7ED3\u679C");
  if (!s || s.version !== 1 || !s.ref || typeof s.ref.sha256 !== "string" || typeof s.ref.versionId !== "string" || typeof s.markdown !== "string" || !s.markdown.trim() || !Array.isArray(s.evidence) || typeof s.confirmedAt !== "string") throw new Error("\u7F3A\u5C11\u672C\u6B21\u56FA\u5B9A\u786E\u8BA4Skill\u7ED3\u679C");
  const ready = d.status === "ready" && !!d.text.trim();
  return { version: 1, ready, status: ready ? "sources-ready" : "needs-review", resume: { source: d.source, status: d.status, unitCount: d.units.length, warnings: d.warnings }, profile: { ref: s.ref, title: s.title, confirmedAt: s.confirmedAt, evidenceCount: s.evidence.length }, accountVerified: false, eligibleForActions: false, checkedAt: (/* @__PURE__ */ new Date()).toISOString(), note: "\u4EC5\u6838\u5BF9\u8D44\u6599\u53EF\u8BFB\u6027\u4E0E\u56FA\u5B9A\u6765\u6E90\uFF1B\u4E0D\u8BC1\u660E\u8EAB\u4EFD\u6216\u4E8B\u5B9E\u4E00\u81F4\u3001\u8D26\u53F7/JD\u6709\u6548\uFF0C\u4E0D\u6388\u6743\u6A21\u578B\u4F7F\u7528\u3001\u6295\u9012\u6216\u56DE\u590D\u3002" };
};
export {
  stdin_default as default
};
