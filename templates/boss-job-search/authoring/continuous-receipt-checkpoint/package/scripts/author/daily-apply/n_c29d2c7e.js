import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v), hash = (v) => createHash("sha256").update(JSON.stringify(v)).digest("hex");
  if (!obj(input) || Object.keys(input).sort().join(",") !== "conditions,started,state") throw Error("\u7F3A\u5C11\u672C\u9879\u786C\u6761\u4EF6\u3001\u5904\u7406\u4E2D\u56DE\u6267\u6216\u6700\u65B0\u5B8C\u6574\u72B6\u6001");
  const { conditions: c, started: d, state: s } = input;
  if (d?.version !== 1 || d.kind !== "daily-direct-detail-precheck" || d.sourceMode !== "persisted-full-job-link" || d.processingPersisted !== true || !/^[a-f0-9]{64}$/.test(d.queueKey) || !/^[a-f0-9]{64}$/.test(d.accountSourceSha256) || d.eligibleForActions !== false || s?.version !== 1 || s.operation !== "state.read" || s.contextId !== d.processingContextId || !Number.isSafeInteger(s.revision) || s.revision < d.processingStateRevision || !obj(s.value) || Object.keys(s.value).sort().join(",") !== "applicationIntents,conversationControls,queueEntries,replyIntents" || !Array.isArray(s.value.queueEntries) || !Array.isArray(s.value.applicationIntents)) throw Error("\u672C\u9879\u6301\u4E45\u6765\u6E90\u4E0E\u6700\u65B0\u5B8C\u6574\u72B6\u6001\u4E0D\u4E00\u81F4");
  if (c?.version !== 1 || c.kind !== "daily-job-hard-conditions" || !["hard-condition-mismatch", "hard-conditions-needs-review", "hard-conditions-ready-for-skill"].includes(c.status) || c.jobSource !== d.jobSource || c.jobTitle !== d.jobTitle || c.configurationRevision !== d.configurationRevision || c.configuredDay !== d.configuredDay || c.actualCity !== d.actualCity || c.eligibleForActions !== false || c.applied !== false) throw Error("\u672C\u9879\u5B9E\u9645\u786C\u6761\u4EF6\u4E0E\u961F\u5217\u8EAB\u4EFD\u4E0D\u4E00\u81F4");
  const day = new Intl.DateTimeFormat("sv-SE", { timeZone: d.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(/* @__PURE__ */ new Date());
  if (day !== d.configuredDay) throw Error("\u672C\u9879\u5904\u7406\u671F\u95F4\u8DE8\u5929\uFF0C\u4FDD\u7559\u539F\u72B6\u6001\u5E76\u505C\u6B62");
  const entries = s.value.queueEntries.filter((r) => r.key === d.queueKey), intents = s.value.applicationIntents.filter((r) => r.key === d.queueKey);
  if (entries.length !== 1 || entries[0].status !== "processing" || entries[0].jobSource !== d.jobSource || entries[0].accountSourceSha256 !== d.accountSourceSha256 || entries[0].configurationRevision !== d.configurationRevision || entries[0].day !== day || entries[0].timeZone !== d.timeZone || intents.length > 1) throw Error("\u672C\u9879\u5DF2\u7ECF\u53D1\u751F\u5E76\u53D1\u53D8\u5316\u6216\u91CD\u590D\u8BB0\u5F55\uFF0C\u505C\u6B62\u5206\u7C7B");
  let status, reason;
  const intent = intents[0];
  if (intent) {
    if (intent.accountSourceSha256 !== d.accountSourceSha256 || intent.jobSource !== d.jobSource || intent.day !== day || intent.timeZone !== d.timeZone || !["reserved", "confirmed", "failed", "unknown"].includes(intent.status)) throw Error("\u672C\u9879\u62DB\u547C\u610F\u56FE\u6765\u6E90\u6216\u72B6\u6001\u65E0\u6548");
    status = intent.status === "reserved" ? "unknown" : intent.status;
    reason = status === "confirmed" ? "\u672C\u9879\u5B9E\u9645\u62DB\u547C\u9001\u8FBE\u5DF2\u7531\u4E13\u95E8\u56DE\u6267\u6B65\u9AA4\u786E\u8BA4\uFF1B\u672A\u53D1\u9001\u9644\u4EF6" : status === "failed" ? "\u62DB\u547C\u610F\u56FE\u5DF2\u8BB0\u5F55\u4E3A\u660E\u786E\u5931\u8D25\uFF1B\u4E0D\u81EA\u52A8\u91CD\u53D1" : "\u62DB\u547C\u5B58\u5728\u9884\u7559\u6216\u672A\u77E5\u7ED3\u679C\uFF0C\u505C\u6B62\u4E0B\u4E00\u9879\u5E76\u4FDD\u7559\u539F\u64CD\u4F5C";
  } else if (c.status === "hard-condition-mismatch") {
    status = "skipped";
    reason = "\u672C\u9879\u72EC\u7ACBJD\u7684\u786C\u6761\u4EF6\u660E\u786E\u4E0D\u7B26\uFF1B\u6CA1\u6709\u62DB\u547C\u610F\u56FE\u6216\u7F51\u9875\u63D0\u4EA4";
  } else if (c.status === "hard-conditions-needs-review") {
    status = "review";
    reason = "\u672C\u9879\u5C97\u4F4D\u8D44\u6599\u6216\u786C\u6761\u4EF6\u9700\u672C\u4EBA\u5224\u65AD\uFF1B\u6CA1\u6709\u62DB\u547C\u610F\u56FE";
  } else {
    status = "review";
    reason = "\u5185\u90E8\u8BC4\u4F30\u7ED3\u675F\u4F46\u672A\u5EFA\u7ACB\u53EF\u91C7\u7528\u7684\u62DB\u547C\u610F\u56FE\uFF1B\u8BF7\u6838\u5BF9\u672C\u9879\u5EFA\u8BAE\u3001\u5F85\u529E\u6216\u65E2\u6709\u6C9F\u901A\u6392\u9664\u539F\u56E0\uFF0C\u4E0D\u81EA\u52A8\u91CD\u65B0\u8BC4\u4F30\u6216\u53D1\u9001";
  }
  const entry = { ...entries[0], status, reason };
  if (status === "review" || status === "unknown") await template.attention({ key: "daily-queue-outcome:" + hash([s.contextId, d.queueKey, status, day]), title: status === "unknown" ? "\u672C\u9879\u62DB\u547C\u7ED3\u679C\u672A\u77E5\uFF0C\u5DF2\u505C\u6B62\u7EED\u53D1" : "\u672C\u9879\u5019\u9009\u9700\u8981\u6838\u5BF9", detail: { jobTitle: d.jobTitle, jobSource: d.jobSource, status, reason, dayTaskComplete: false } });
  signal.throwIfAborted();
  return { version: 1, kind: "daily-queue-finish-plan", contextId: s.contextId, expectedRevision: s.revision, value: { ...s.value, queueEntries: s.value.queueEntries.map((r) => r.key === entry.key ? entry : r) }, entry, continueBatch: status !== "unknown", eligibleForActions: false, dayTaskComplete: false, siteDailyLimitConfirmed: false };
};
export {
  stdin_default as default
};
