import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const object = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  const fail = async (message) => {
    const key = "daily-direct-detail:" + createHash("sha256").update(JSON.stringify({ revision: input?.range?.configurationRevision, day: input?.range?.configuredDay, position: input?.candidate?.position, message })).digest("hex");
    await template.attention({ key, title: "\u5019\u9009\u6765\u6E90\u5DF2\u53D8\u5316\uFF0C\u505C\u6B62\u6253\u5F00\u72EC\u7ACB\u8BE6\u60C5", detail: { message, eligibleForActions: false, dayTaskComplete: false } });
    signal.throwIfAborted();
    throw Error(message);
  };
  if (!object(input) || Object.keys(input).sort().join(",") !== "candidate,countAfter,range,sourceAgain") return fail("\u7F3A\u5C11\u672C\u9879\u5019\u9009\u3001\u590D\u8BFB\u6765\u6E90\u3001\u5B9E\u9645\u6570\u91CF\u6216\u56FA\u5B9A\u8303\u56F4");
  const { candidate: c, countAfter: count, range: r, sourceAgain: s } = input;
  if (!object(r) || r.version !== 1 || r.kind !== "daily-candidate-range" || !Number.isSafeInteger(r.cardCount) || r.cardCount < 1 || r.cardCount > 500 || !Number.isSafeInteger(r.batchSize) || r.batchSize < 1 || r.batchSize > 150 || !Array.isArray(r.configuredCities) || r.configuredCities.length < 1 || r.configuredCities.length > 20 || !Array.isArray(r.items) || r.items.length !== Math.min(r.cardCount, r.batchSize) || r.eligibleForActions !== false || r.dayTaskComplete !== false || count !== r.cardCount) return fail("\u5019\u9009\u6570\u91CF\u6216\u672C\u6B21\u56FA\u5B9A\u8303\u56F4\u5DF2\u53D8\u5316");
  if (!object(c) || c.version !== 1 || c.kind !== "daily-candidate-source" || c.status !== "candidate-source-only" || c.currentDetailSelected !== false || c.candidateJobCityVerified !== false || c.descriptionComplete !== false || c.accountVerified !== false || c.eligibleForActions !== false || c.dayTaskComplete !== false || c.configurationRevision !== r.configurationRevision || c.configuredDay !== r.configuredDay || c.timeZone !== r.timeZone || !Number.isSafeInteger(c.position) || c.position < 1 || c.position > r.items.length || !r.configuredCities.includes(c.actualCity)) return fail("\u5019\u9009\u8EAB\u4EFD\u3001\u914D\u7F6E\u6216\u7F51\u9875\u5B9E\u9645\u57CE\u5E02\u5C1A\u672A\u6838\u5BF9");
  const cardSelector = "div:nth-of-type(" + c.position + ") > div:nth-of-type(1) > li:nth-of-type(1)", linkSelector = cardSelector + " > div:nth-of-type(1) > div:nth-of-type(1) > a:nth-of-type(1)", item = r.items[c.position - 1];
  if (!object(item) || item.position !== c.position || item.cardSelector !== cardSelector || item.linkSelector !== linkSelector) return fail("\u672C\u9879\u5019\u9009\u4F4D\u7F6E\u4E0E\u56FA\u5B9A\u8303\u56F4\u4E0D\u7B26");
  if (!object(s) || s.version !== 3 || s.operation !== "collect" || s.renderPolicy !== "bounded-rendered-text-v2" || s.selector !== "html" || s.complete !== true || !Array.isArray(s.framePath) || s.framePath.length || !Array.isArray(s.fields) || s.fields.length !== 2) return fail("\u672C\u9879\u5019\u9009\u7684\u540C\u6B21\u590D\u8BFB\u4E0D\u5B8C\u6574");
  const values = {};
  for (const [key, operation, attribute] of [["jobTitle", "text", null], ["jobLink", "attribute", "href"]]) {
    const found = s.fields.filter((f2) => object(f2) && f2.key === key), f = found[0];
    if (found.length !== 1 || f.selector !== linkSelector || f.operation !== operation || f.attribute !== attribute || f.required !== true || f.count !== 1 || f.status !== "ok" || f.ignoredAncestorSpaces !== 0 || !Array.isArray(f.issues) || f.issues.length || typeof f.value !== "string" || !f.value.trim()) return fail("\u5019\u9009\u590D\u8BFB\u5B57\u6BB5\u7F3A\u5931\u3001\u6B67\u4E49\u6216\u8303\u56F4\u4E0D\u7B26\uFF1A" + key);
    values[key] = f.value.trim();
  }
  let detailUrl, returnUrl;
  try {
    const safe = (u) => u.protocol === "https:" && u.hostname === "www.zhipin.com" && !u.port && !u.username && !u.password;
    const page = new URL(s.url), doc = new URL(s.documentUrl), expected = new URL(c.jobSource), actual = new URL(values.jobLink, page);
    if (![page, doc, expected, actual].every(safe) || page.pathname !== "/web/geek/jobs" || page.href !== doc.href || page.hash || expected.search || expected.hash || !/^\/job_detail\/[A-Za-z0-9_~-]+\.html$/.test(expected.pathname) || values.jobLink.length > 4096 || actual.origin + actual.pathname !== c.jobSource || values.jobTitle !== c.jobTitle) throw Error("\u5019\u9009\u6807\u9898\u3001\u72EC\u7ACB\u8BE6\u60C5\u94FE\u63A5\u6216\u8FD4\u56DE\u6765\u6E90\u4E0D\u7B26");
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: r.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(/* @__PURE__ */ new Date()), part = (k) => parts.find((p) => p.type === k)?.value;
    if (part("year") + "-" + part("month") + "-" + part("day") !== r.configuredDay) throw Error("\u5F53\u5929\u8303\u56F4\u5DF2\u53D8\u5316");
    detailUrl = actual.href;
    returnUrl = page.href;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "\u5019\u9009\u6765\u6E90\u65E0\u6CD5\u6838\u5BF9");
  }
  signal.throwIfAborted();
  return { version: 1, kind: "daily-direct-detail-precheck", status: "candidate-link-and-city-ready", readyToNavigate: true, position: c.position, configurationRevision: c.configurationRevision, configuredDay: c.configuredDay, timeZone: c.timeZone, configuredCities: [...r.configuredCities], expectedCity: c.actualCity, actualCity: c.actualCity, jobTitle: c.jobTitle, jobSource: c.jobSource, detailUrl, returnUrl, expectedCardCount: r.cardCount, currentDetailSelected: false, candidateJobCityVerified: false, descriptionComplete: false, accountVerified: false, eligibleForActions: false, dayTaskComplete: false, siteDailyLimitConfirmed: false, note: "\u4EC5\u51C6\u5907\u6309\u672C\u9879\u5B9E\u9645\u94FE\u63A5\u6253\u5F00\u72EC\u7ACB\u8BE6\u60C5\uFF1B\u5B9E\u9645href\u4EC5\u4F9B\u672C\u673A\u672C\u6B21\u5BFC\u822A\uFF0C\u8BB0\u5F55\u6765\u6E90\u53BB\u67E5\u8BE2\u4E32\u3002\u8BE6\u60C5\u4E2D\u7684\u5C97\u4F4D\u57CE\u5E02\u4E0EJD\u4ECD\u987B\u6838\u5BF9\uFF0C\u4E0D\u6388\u4E88\u6295\u9012\u8D44\u683C\u3002" };
};
export {
  stdin_default as default
};
