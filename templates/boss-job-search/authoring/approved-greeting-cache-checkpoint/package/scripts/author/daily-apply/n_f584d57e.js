import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v), hash = (v) => createHash("sha256").update(JSON.stringify(v)).digest("hex");
  if (!obj(input) || Object.keys(input).sort().join(",") !== "plan,receipt,state") throw Error("\u7F3A\u5C11\u961F\u5217\u8BA1\u5212\u3001\u5199\u5165\u56DE\u6267\u6216\u5199\u540E\u6700\u65B0\u72B6\u6001");
  const { plan: p, receipt: w, state: s } = input;
  if (!obj(p) || p.version !== 1 || p.kind !== "daily-candidate-queue-plan" || p.eligibleForActions !== false || p.dayTaskComplete !== false || p.siteDailyLimitConfirmed !== false || !Number.isSafeInteger(p.expectedRevision) || p.expectedRevision < 0 || !obj(p.value) || !Array.isArray(p.value.queueEntries) || !Array.isArray(p.items) || p.items.length > 150) throw Error("\u5B8C\u6574\u961F\u5217\u8BA1\u5212\u6765\u6E90\u65E0\u6548");
  if (!obj(w) || w.version !== 1 || w.operation !== "state.write" || w.contextId !== p.contextId || w.previousRevision !== p.expectedRevision || w.revision !== p.expectedRevision + 1 || typeof w.operationId !== "string" || !/^[a-f0-9]{64}$/.test(w.operationId) || typeof w.committedAt !== "string" || !Number.isFinite(Date.parse(w.committedAt)) || Date.parse(w.committedAt) > Date.now() || hash(w.value) !== hash(p.value)) throw Error("\u961F\u5217\u5199\u5165\u56DE\u6267\u672A\u8BC1\u660E\u51C6\u786E\u5B8C\u6574\u503C\u4E0E\u9884\u671F\u4FEE\u8BA2\u5DF2\u63D0\u4EA4");
  if (!obj(s) || s.version !== 1 || s.operation !== "state.read" || s.contextId !== p.contextId || s.revision !== w.revision || hash(s.value) !== hash(w.value)) throw Error("\u961F\u5217\u5199\u540E\u91CD\u8BFB\u4E0E\u5199\u5165\u56DE\u6267\u4E0D\u4E00\u81F4\uFF0C\u505C\u6B62\u6D88\u8D39");
  const day = new Intl.DateTimeFormat("sv-SE", { timeZone: p.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(/* @__PURE__ */ new Date());
  if (day !== p.configuredDay) throw Error("\u961F\u5217\u4FDD\u5B58\u671F\u95F4\u65E5\u671F\u5DF2\u7ECF\u53D8\u5316\uFF0C\u505C\u6B62\u672C\u6279");
  const seen = /* @__PURE__ */ new Set();
  for (const item of p.items) {
    const stored = s.value.queueEntries.find((r) => r.key === item.key);
    if (!stored || stored.status !== "queued" || stored.accountSourceSha256 !== p.accountSourceSha256 || stored.configurationRevision !== p.configurationRevision || stored.day !== day || stored.timeZone !== p.timeZone || hash(stored) !== hash(item) || seen.has(item.key)) throw Error("\u6240\u9009\u6709\u9650\u5019\u9009\u4E0E\u5B9E\u9645\u6301\u4E45\u961F\u5217\u4E0D\u4E00\u81F4");
    seen.add(item.key);
  }
  signal.throwIfAborted();
  if (typeof p.currentSearchUrl !== "string") throw Error("\u672C\u6279\u5B9E\u9645\u5217\u8868\u5730\u5740\u7F3A\u5931");
  const currentList = new URL(p.currentSearchUrl);
  if (currentList.origin !== "https://www.zhipin.com" || currentList.pathname !== "/web/geek/jobs" || currentList.username || currentList.password || currentList.hash) throw Error("\u672C\u6279\u5B9E\u9645\u5217\u8868\u5730\u5740\u65E0\u6548");
  return { version: 1, kind: "daily-candidate-queue-range", contextId: p.contextId, configurationRevision: p.configurationRevision, configuredDay: day, timeZone: p.timeZone, actualCity: p.actualCity, currentSearchUrl: p.currentSearchUrl, accountSourceSha256: p.accountSourceSha256, stateRevision: s.revision, operationId: w.operationId, items: p.items, newlyAdded: p.newlyAdded, scanned: p.scanned, pending: p.pending, knownGreetingsUsedToday: p.knownGreetingsUsedToday, identityVerified: false, descriptionVerified: false, accountVerified: false, eligibleForActions: false, dayTaskComplete: false, siteDailyLimitConfirmed: false };
};
export {
  stdin_default as default
};
