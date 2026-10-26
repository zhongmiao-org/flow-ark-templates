import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v), hash = (v) => createHash("sha256").update(JSON.stringify(v)).digest("hex");
  const fail = async (message) => {
    await template.attention({ key: "daily-queue-item:" + hash([input?.range?.contextId, input?.entry?.key, message]), title: "\u672C\u9879\u961F\u5217\u6765\u6E90\u672A\u901A\u8FC7\u6838\u5BF9\uFF0C\u5DF2\u505C\u6B62", detail: { message, jobSource: input?.entry?.jobSource ?? null, dayTaskComplete: false } });
    throw Error(message);
  };
  if (!obj(input) || Object.keys(input).sort().join(",") !== "city,configuration,entry,index,range,state") return fail("\u7F3A\u5C11\u672C\u9879\u961F\u5217\u3001\u56FA\u5B9A\u6279\u6B21\u3001\u5B9E\u9645\u57CE\u5E02\u6216\u6700\u65B0\u72B6\u6001");
  const { city, configuration: c, entry: e, index, range: r, state: s } = input;
  if (r?.version !== 1 || r.kind !== "daily-candidate-queue-range" || r.eligibleForActions !== false || r.dayTaskComplete !== false || !Array.isArray(r.items) || !Number.isSafeInteger(index) || index < 0 || index >= r.items.length || hash(r.items[index]) !== hash(e) || c?.kind !== "daily-apply-configuration" || c.readyForLoop !== true || c.configurationRevision !== r.configurationRevision || c.configuredDay !== r.configuredDay || c.timeZone !== r.timeZone || !Array.isArray(c.conditions?.cities) || !c.conditions.cities.includes(r.actualCity) || typeof city !== "string" || city.trim() !== r.actualCity) return fail("\u5F53\u524D\u961F\u5217\u9879\u3001\u6709\u9650\u6279\u6B21\u6216\u5B9E\u9645\u7F51\u9875\u57CE\u5E02\u4E0D\u4E00\u81F4");
  if (s?.version !== 1 || s.operation !== "state.read" || s.contextId !== r.contextId || !Number.isSafeInteger(s.revision) || s.revision < r.stateRevision || !obj(s.value) || Object.keys(s.value).sort().join(",") !== "applicationIntents,conversationControls,queueEntries,replyIntents" || !Array.isArray(s.value.queueEntries) || !Array.isArray(s.value.applicationIntents)) return fail("\u7F3A\u5C11\u672C\u9879\u5F00\u59CB\u524D\u7684\u6700\u65B0\u5B8C\u6574\u72B6\u6001");
  const day = new Intl.DateTimeFormat("sv-SE", { timeZone: r.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(/* @__PURE__ */ new Date());
  if (day !== r.configuredDay || e?.status !== "queued" || e.configurationRevision !== r.configurationRevision || e.day !== day || e.timeZone !== r.timeZone || e.accountSourceSha256 !== r.accountSourceSha256) return fail("\u672C\u9879\u5019\u9009\u7684\u914D\u7F6E\u3001\u8D26\u53F7\u6216\u65E5\u671F\u8303\u56F4\u5DF2\u7ECF\u53D8\u5316");
  const job = new URL(e.jobSource), match = /^\/job_detail\/([A-Za-z0-9_~-]+)\.html$/.exec(job.pathname), search = new URL(e.searchUrl);
  if (job.origin !== "https://www.zhipin.com" || job.username || job.password || job.search || job.hash || !match || match[1] !== e.jobId || e.key !== hash(["boss-application-v1", r.accountSourceSha256, e.jobId]) || search.origin !== job.origin || search.pathname !== "/web/geek/jobs" || search.username || search.password || search.hash) return fail("\u6301\u4E45\u961F\u5217\u5B8C\u6574\u5C97\u4F4D\u8EAB\u4EFD\u6216\u68C0\u7D22\u6765\u6E90\u4E0D\u7B26");
  const found = s.value.queueEntries.filter((v) => v.key === e.key);
  if (found.length !== 1 || hash(found[0]) !== hash(e) || s.value.applicationIntents.some((v) => v.key === e.key)) return fail("\u672C\u9879\u4E0D\u518D\u662F\u5F85\u5904\u7406\u5019\u9009\uFF0C\u6216\u540C\u5C97\u4F4D\u5DF2\u6709\u62DB\u547C\u610F\u56FE\uFF1B\u7981\u6B62\u91CD\u53D1");
  signal.throwIfAborted();
  const url = await template.browser("browser", { operation: "url", timeoutMs: 1e4 });
  if (typeof r.currentSearchUrl !== "string" || url !== r.currentSearchUrl) return fail("\u6253\u5F00\u672C\u9879\u524D\u7684\u5F53\u524D\u68C0\u7D22\u5730\u5740\u5DF2\u7ECF\u53D8\u5316");
  const processing = { ...e, status: "processing", reason: "\u672C\u9879\u5F00\u59CB\u53EA\u8BFB\u6838\u5BF9\u548C\u5185\u90E8\u8BC4\u4F30\uFF1B\u5C1A\u65E0\u62DB\u547C\u610F\u56FE\u6216\u7F51\u9875\u63D0\u4EA4" };
  const detail = { version: 1, kind: "daily-direct-detail-precheck", status: "candidate-link-and-city-ready", readyToNavigate: true, position: index + 1, queueKey: e.key, accountSourceSha256: e.accountSourceSha256, configurationRevision: r.configurationRevision, configuredDay: day, timeZone: r.timeZone, configuredCities: [...c.conditions.cities], expectedCity: r.actualCity, actualCity: r.actualCity, jobTitle: e.jobTitle, jobSource: e.jobSource, detailUrl: e.jobSource, returnUrl: r.currentSearchUrl, expectedCardCount: 0, sourceMode: "persisted-full-job-link", currentDetailSelected: false, candidateJobCityVerified: false, descriptionComplete: false, accountVerified: false, eligibleForActions: false, dayTaskComplete: false, siteDailyLimitConfirmed: false };
  return { version: 1, kind: "daily-queue-start-plan", contextId: r.contextId, expectedRevision: s.revision, value: { ...s.value, queueEntries: s.value.queueEntries.map((v) => v.key === e.key ? processing : v) }, entry: processing, detail, eligibleForActions: false, dayTaskComplete: false, siteDailyLimitConfirmed: false };
};
export {
  stdin_default as default
};
