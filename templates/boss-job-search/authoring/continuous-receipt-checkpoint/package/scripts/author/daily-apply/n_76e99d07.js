var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  const canonical = (v) => JSON.stringify(v, (_, x) => obj(x) ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]])) : x);
  if (!obj(input) || Object.keys(input).sort().join(",") !== "plan,receipt,reread") throw Error("\u7F3A\u5C11\u9884\u7559\u8BA1\u5212\u3001\u539FCAS\u56DE\u6267\u6216\u5199\u540E\u91CD\u8BFB");
  const { plan: p, receipt: w, reread: r } = input;
  if (!obj(p) || p.readyForReservation !== true || !Number.isSafeInteger(p.expectedRevision) || !obj(p.value) || p.intent?.status !== "reserved" || !obj(w) || w.version !== 1 || w.operation !== "state.write" || w.previousRevision !== p.expectedRevision || w.revision !== p.expectedRevision + 1 || typeof w.operationId !== "string" || !w.operationId || !Number.isFinite(Date.parse(w.committedAt)) || Date.parse(w.committedAt) < Date.parse(p.intent.createdAt) || Date.parse(w.committedAt) > Date.now() || !obj(r) || r.version !== 1 || r.operation !== "state.read" || r.contextId !== w.contextId || r.revision !== w.revision || canonical(w.value) !== canonical(p.value) || canonical(r.value) !== canonical(p.value)) throw Error("\u9884\u7559\u5199\u51FA\u56DE\u6267\u6216\u6301\u4E45\u72B6\u6001\u4E0E\u539F\u8BA1\u5212\u4E0D\u4E00\u81F4\uFF0C\u505C\u6B62\u5E76\u4FDD\u7559\u539F\u8BB0\u5F55");
  const rows = r.value.applicationIntents;
  if (!Array.isArray(rows) || rows.filter((v) => v.key === p.intent.key).length !== 1 || canonical(rows.find((v) => v.key === p.intent.key)) !== canonical(p.intent)) throw Error("\u5199\u540E\u72B6\u6001\u7F3A\u5C11\u552F\u4E00\u51C6\u786E\u6295\u9012\u9884\u7559");
  const day = new Intl.DateTimeFormat("sv-SE", { timeZone: p.intent.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(/* @__PURE__ */ new Date());
  if (day !== p.intent.day) throw Error("\u9884\u7559\u540E\u5DF2\u8DE8\u5929\uFF0C\u4E0D\u5F97\u7EE7\u7EED\u63D0\u4EA4\uFF1B\u5DF2\u5199\u8BB0\u5F55\u4FDD\u7559\u5360\u989D");
  const result = { version: 1, kind: "daily-application-reservation", status: "application-reserved-awaiting-submit", jobTitle: p.result.jobTitle, jobSource: p.intent.jobSource, actualCity: p.result.actualCity, day: p.intent.day, timeZone: p.intent.timeZone, configurationRevision: p.intent.configurationRevision, stateRevision: r.revision, reservedNow: true, reservationPersisted: true, readyForOperationPreparation: true, resumeSha256: p.intent.resumeSha256, profileVersionId: p.intent.profileVersionId, accountVerified: false, eligibleForActions: false, applied: false, dayTaskComplete: false, siteDailyLimitConfirmed: false, nextAction: "\u51C6\u5907\u72EC\u7ACB\u7F51\u9875\u6295\u9012\u64CD\u4F5C\u5E76\u6838\u5BF9\u5B9E\u9645\u56DE\u6267", note: "\u4EC5\u8BC1\u5B9E\u672C\u9879\u9884\u7559\u6309\u9884\u671F\u4FEE\u8BA2\u6301\u4E45\u5199\u51FA\u5E76\u91CD\u8BFB\u4E00\u81F4\uFF1B\u6CA1\u6709\u6267\u884C\u7F51\u9875\u63D0\u4EA4\u3002\u53D6\u6D88\u6216\u91CD\u5F00\u4E0D\u64A4\u9500\u9884\u7559\uFF0C\u4E0D\u81EA\u52A8\u518D\u6B21\u6295\u9012\uFF0C\u672C\u5730\u989D\u5EA6\u4E0D\u662F\u7F51\u7AD9\u6BCF\u65E5\u5B8C\u6210\u4F9D\u636E\u3002" };
  signal.throwIfAborted();
  await Promise.resolve(result);
  return { intent: p.intent, receipt: w, result };
};
export {
  stdin_default as default
};
