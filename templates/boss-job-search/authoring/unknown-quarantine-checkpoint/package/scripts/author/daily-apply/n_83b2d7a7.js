import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v), hash = (v) => createHash("sha256").update(JSON.stringify(v)).digest("hex");
  if (!obj(input) || Object.keys(input).sort().join(",") !== "plan,receipt,state") throw Error("\u7F3A\u5C11\u672C\u9879\u6700\u7EC8\u5206\u7C7B\u8BA1\u5212\u3001\u5199\u56DE\u6267\u6216\u5199\u540E\u72B6\u6001");
  const { plan: p, receipt: w, state: s } = input;
  if (p?.version !== 1 || p.kind !== "daily-queue-finish-plan" || p.eligibleForActions !== false || p.dayTaskComplete !== false || !Number.isSafeInteger(p.expectedRevision) || !obj(p.value) || !obj(p.entry) || !["skipped", "review", "confirmed", "failed", "unknown"].includes(p.entry.status) || p.continueBatch !== (p.entry.status !== "unknown")) throw Error("\u672C\u9879\u6700\u7EC8\u5206\u7C7B\u8BA1\u5212\u65E0\u6548");
  if (w?.version !== 1 || w.operation !== "state.write" || w.contextId !== p.contextId || w.previousRevision !== p.expectedRevision || w.revision !== p.expectedRevision + 1 || typeof w.operationId !== "string" || !/^[a-f0-9]{64}$/.test(w.operationId) || typeof w.committedAt !== "string" || !Number.isFinite(Date.parse(w.committedAt)) || Date.parse(w.committedAt) > Date.now() || hash(w.value) !== hash(p.value)) throw Error("\u672C\u9879\u6700\u7EC8\u5206\u7C7B\u6CA1\u6709\u51C6\u786E\u5199\u5165\u56DE\u6267");
  if (s?.version !== 1 || s.operation !== "state.read" || s.contextId !== p.contextId || s.revision !== w.revision || hash(s.value) !== hash(w.value) || s.value.queueEntries.filter((r) => r.key === p.entry.key).length !== 1 || hash(s.value.queueEntries.find((r) => r.key === p.entry.key)) !== hash(p.entry)) throw Error("\u672C\u9879\u5206\u7C7B\u5199\u540E\u91CD\u8BFB\u4E0D\u4E00\u81F4\uFF0C\u505C\u6B62\u4E0B\u4E00\u9879");
  const day = new Intl.DateTimeFormat("sv-SE", { timeZone: p.entry.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(/* @__PURE__ */ new Date());
  if (day !== p.entry.day) throw Error("\u5206\u7C7B\u4FDD\u5B58\u671F\u95F4\u8DE8\u5929\uFF0C\u4FDD\u7559\u7ED3\u679C\u5E76\u505C\u6B62\u672C\u6279");
  const result = { version: 1, kind: "daily-queue-item-outcome", jobTitle: p.entry.jobTitle, jobSource: p.entry.jobSource, status: p.entry.status, reason: p.entry.reason, stateRevision: s.revision, pending: s.value.queueEntries.filter((r) => r.status === "queued").length, processing: s.value.queueEntries.filter((r) => r.status === "processing").length, continueBatch: p.continueBatch, eligibleForActions: false, dayTaskComplete: false, siteDailyLimitConfirmed: false };
  await template.result(result);
  signal.throwIfAborted();
  if (!p.continueBatch) throw Error("\u672C\u9879\u672A\u77E5\u7ED3\u679C\u5DF2\u6301\u4E45\u4FDD\u5B58\uFF0C\u505C\u6B62\u7EED\u53D1\uFF1B\u4E0D\u91CD\u653E\u539F\u62DB\u547C");
  return result;
};
export {
  stdin_default as default
};
