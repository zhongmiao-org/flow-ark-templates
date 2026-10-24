import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v), hash = (v) => createHash("sha256").update(JSON.stringify(v)).digest("hex");
  if (!obj(input) || Object.keys(input).sort().join(",") !== "plan,receipt,state") throw Error("\u7F3A\u5C11\u672C\u9879\u5904\u7406\u8BA1\u5212\u3001\u5199\u56DE\u6267\u6216\u5199\u540E\u72B6\u6001");
  const { plan: p, receipt: w, state: s } = input;
  if (p?.version !== 1 || p.kind !== "daily-queue-start-plan" || p.eligibleForActions !== false || p.dayTaskComplete !== false || !obj(p.value) || !obj(p.entry) || p.entry.status !== "processing" || !obj(p.detail) || p.detail.queueKey !== p.entry.key || p.detail.jobSource !== p.entry.jobSource || !Number.isSafeInteger(p.expectedRevision)) throw Error("\u672C\u9879\u5F00\u59CB\u8BA1\u5212\u6765\u6E90\u4E0D\u4E00\u81F4");
  if (w?.version !== 1 || w.operation !== "state.write" || w.contextId !== p.contextId || w.previousRevision !== p.expectedRevision || w.revision !== p.expectedRevision + 1 || typeof w.operationId !== "string" || !/^[a-f0-9]{64}$/.test(w.operationId) || typeof w.committedAt !== "string" || !Number.isFinite(Date.parse(w.committedAt)) || Date.parse(w.committedAt) > Date.now() || hash(w.value) !== hash(p.value)) throw Error("\u672C\u9879\u5904\u7406\u4E2D\u72B6\u6001\u6CA1\u6709\u51C6\u786E\u5199\u5165\u56DE\u6267\uFF0C\u4E0D\u80FD\u6253\u5F00\u540E\u7EED\u8BE6\u60C5");
  if (s?.version !== 1 || s.operation !== "state.read" || s.contextId !== p.contextId || s.revision !== w.revision || hash(s.value) !== hash(w.value) || s.value.queueEntries.filter((v) => v.key === p.entry.key).length !== 1 || hash(s.value.queueEntries.find((v) => v.key === p.entry.key)) !== hash(p.entry)) throw Error("\u5904\u7406\u72B6\u6001\u5199\u540E\u91CD\u8BFB\u4E0D\u4E00\u81F4");
  const day = new Intl.DateTimeFormat("sv-SE", { timeZone: p.entry.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(/* @__PURE__ */ new Date());
  if (day !== p.entry.day) throw Error("\u4FDD\u5B58\u671F\u95F4\u5DF2\u8DE8\u5929\uFF0C\u505C\u6B62\u672C\u9879");
  signal.throwIfAborted();
  return { ...p.detail, processingContextId: p.contextId, processingStateRevision: s.revision, processingOperationId: w.operationId, processingPersisted: true };
};
export {
  stdin_default as default
};
