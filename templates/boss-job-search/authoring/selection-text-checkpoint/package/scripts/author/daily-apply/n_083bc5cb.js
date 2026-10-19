import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const object = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  const fail = async (message) => {
    const key = "daily-detail-selection:" + createHash("sha256").update(JSON.stringify({ revision: input?.range?.configurationRevision, day: input?.range?.configuredDay, position: input?.candidate?.position, message })).digest("hex");
    await template.attention({ key, title: "\u5019\u9009\u6765\u6E90\u5DF2\u53D8\u5316\u6216\u65E0\u6CD5\u6838\u5BF9\uFF0C\u505C\u6B62\u9009\u62E9\u8BE6\u60C5", detail: { message, eligibleForActions: false, dayTaskComplete: false } });
    signal.throwIfAborted();
    throw Error(message);
  };
  if (!object(input) || Object.keys(input).sort().join(",") !== "candidate,countAfter,range,sourceAgain") return fail("\u7F3A\u5C11\u5019\u9009\u3001\u590D\u8BFB\u6765\u6E90\u3001\u5B9E\u9645\u6570\u91CF\u6216\u56FA\u5B9A\u8303\u56F4");
  const { candidate: c, countAfter: count, range: r, sourceAgain: s } = input;
  if (!object(r) || r.version !== 1 || r.kind !== "daily-candidate-range" || !Number.isSafeInteger(r.cardCount) || r.cardCount < 1 || r.cardCount > 500 || !Array.isArray(r.configuredCities) || r.configuredCities.length < 1 || r.configuredCities.length > 20 || !Array.isArray(r.items) || r.items.length !== Math.min(r.cardCount, r.batchSize) || r.eligibleForActions !== false || r.dayTaskComplete !== false || count !== r.cardCount) return fail("\u5019\u9009\u5217\u8868\u6570\u91CF\u6216\u672C\u6B21\u56FA\u5B9A\u8303\u56F4\u5DF2\u53D8\u5316");
  if (!object(c) || c.version !== 1 || c.kind !== "daily-candidate-source" || c.status !== "candidate-source-only" || c.currentDetailSelected !== false || c.candidateJobCityVerified !== false || c.descriptionComplete !== false || c.accountVerified !== false || c.eligibleForActions !== false || c.dayTaskComplete !== false || c.configurationRevision !== r.configurationRevision || c.configuredDay !== r.configuredDay || c.timeZone !== r.timeZone || !Number.isSafeInteger(c.position) || c.position < 1 || c.position > r.items.length || !r.configuredCities.includes(c.actualCity)) return fail("\u5019\u9009\u8EAB\u4EFD\u3001\u914D\u7F6E\u6216\u57CE\u5E02\u6765\u6E90\u5C1A\u672A\u6838\u5BF9");
  const cardSelector = "div:nth-of-type(" + c.position + ") > div:nth-of-type(1) > li:nth-of-type(1)";
  const linkSelector = cardSelector + " > div:nth-of-type(1) > div:nth-of-type(1) > a:nth-of-type(1)";
  const item = r.items[c.position - 1];
  if (!object(item) || item.position !== c.position || item.cardSelector !== cardSelector || item.linkSelector !== linkSelector) return fail("\u5019\u9009\u4F4D\u7F6E\u4E0E\u672C\u6B21\u8303\u56F4\u4E0D\u4E00\u81F4");
  if (!object(s) || s.version !== 3 || s.operation !== "collect" || s.renderPolicy !== "bounded-rendered-text-v2" || s.selector !== "html" || s.complete !== true || !Array.isArray(s.framePath) || s.framePath.length || !Array.isArray(s.fields) || s.fields.length !== 2) return fail("\u672C\u9879\u5019\u9009\u590D\u8BFB\u4E0D\u5B8C\u6574");
  const values = {};
  for (const [key, operation, attribute] of [["jobTitle", "text", null], ["jobLink", "attribute", "href"]]) {
    const found = s.fields.filter((f2) => object(f2) && f2.key === key), f = found[0];
    if (found.length !== 1 || f.selector !== linkSelector || f.operation !== operation || f.attribute !== attribute || f.required !== true || f.count !== 1 || f.status !== "ok" || f.ignoredAncestorSpaces !== 0 || !Array.isArray(f.issues) || f.issues.length || typeof f.value !== "string" || !f.value.trim()) return fail("\u590D\u8BFB\u5B57\u6BB5\u7F3A\u5931\u3001\u975E\u552F\u4E00\u6216\u8303\u56F4\u4E0D\u4E00\u81F4\uFF1A" + key);
    values[key] = f.value.trim();
  }
  let jobPath;
  try {
    const page = new URL(s.url), doc = new URL(s.documentUrl), expected = new URL(c.jobSource);
    const safe = (u) => u.protocol === "https:" && u.hostname === "www.zhipin.com" && !u.port && !u.username && !u.password;
    if (!safe(page) || !safe(doc) || page.pathname !== "/web/geek/jobs" || page.href !== doc.href || !safe(expected) || expected.search || expected.hash || !/^\/job_detail\/[A-Za-z0-9_~-]+\.html$/.test(expected.pathname) || values.jobLink.length > 4096) throw Error();
    const reread = new URL(values.jobLink, page);
    if (!safe(reread) || reread.origin + reread.pathname !== c.jobSource || values.jobTitle !== c.jobTitle) throw Error();
    jobPath = expected.pathname;
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: r.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(/* @__PURE__ */ new Date());
    const part = (k) => parts.find((p) => p.type === k)?.value;
    if (part("year") + "-" + part("month") + "-" + part("day") !== r.configuredDay) throw Error();
  } catch {
    return fail("\u5019\u9009\u6807\u9898\u3001\u8BE6\u60C5\u8DEF\u5F84\u3001\u9875\u9762\u6765\u6E90\u6216\u5F53\u5929\u8303\u56F4\u5DF2\u53D8\u5316");
  }
  const detailLink = "body div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > a:nth-of-type(1)";
  const detailWaitSelector = detailLink + ":is([href^=" + JSON.stringify(jobPath) + "],[href^=" + JSON.stringify("https://www.zhipin.com" + jobPath) + "])";
  signal.throwIfAborted();
  return { version: 1, kind: "daily-detail-selection-precheck", readyToSelect: true, position: c.position, configurationRevision: c.configurationRevision, configuredDay: c.configuredDay, timeZone: c.timeZone, configuredCities: [...r.configuredCities], expectedCity: c.actualCity, jobTitle: c.jobTitle, jobSource: c.jobSource, cardSelector, detailWaitSelector, currentDetailSelected: false, descriptionComplete: false, accountVerified: false, eligibleForActions: false, dayTaskComplete: false, siteDailyLimitConfirmed: false, note: "\u5019\u9009\u6570\u91CF\u4E0E\u672C\u9879\u6807\u9898/\u8DEF\u5F84\u5DF2\u590D\u8BFB\uFF1B\u53EA\u51C6\u5907\u6D4F\u89C8\u5361\u7247\u3002\u9009\u62E9\u540E\u8FD8\u987B\u7B49\u5F85\u5E76\u56DE\u8BFB\u540C\u4E00\u8BE6\u60C5\u8EAB\u4EFD\u4E0E\u57CE\u5E02\uFF0C\u4E0D\u6388\u4E88\u6295\u9012\u8D44\u683C\u3002" };
};
export {
  stdin_default as default
};
