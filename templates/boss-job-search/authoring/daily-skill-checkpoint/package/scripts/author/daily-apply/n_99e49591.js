import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const object = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  const fail = async (message) => {
    const key = "daily-candidate-source:" + createHash("sha256").update(JSON.stringify({ revision: input?.range?.configurationRevision, day: input?.range?.configuredDay, position: input?.position?.position, message })).digest("hex");
    await template.attention({ key, title: "\u5019\u9009\u804C\u4F4D\u6765\u6E90\u672A\u901A\u8FC7\u6838\u5BF9\uFF0C\u5FAA\u73AF\u5DF2\u505C\u6B62", detail: { message, eligibleForActions: false, dayTaskComplete: false } });
    signal.throwIfAborted();
    throw Error(message);
  };
  if (!object(input) || Object.keys(input).sort().join(",") !== "citySource,position,range,source") return fail("\u7F3A\u5C11\u672C\u6B21\u5019\u9009\u8303\u56F4\u3001\u5FAA\u73AF\u9879\u3001\u5B9E\u9645\u57CE\u5E02\u6216\u540C\u6B21\u5B57\u6BB5\u6765\u6E90");
  const { citySource: city, position: p, range: r, source: s } = input;
  if (!object(r) || r.version !== 1 || r.kind !== "daily-candidate-range" || !Array.isArray(r.items) || !Number.isSafeInteger(r.cardCount) || r.cardCount < 1 || r.cardCount > 500 || !Number.isSafeInteger(r.batchSize) || r.batchSize < 1 || r.batchSize > 150 || r.items.length !== Math.min(r.cardCount, r.batchSize) || r.eligibleForActions !== false || r.dayTaskComplete !== false) return fail("\u672C\u6B21\u5B9E\u9645\u5019\u9009\u8303\u56F4\u65E0\u6548");
  if (!object(p) || p.version !== 1 || p.kind !== "job-card-position" || !Number.isSafeInteger(p.position) || p.position < 1 || p.position > r.items.length) return fail("\u5F53\u524D\u5FAA\u73AF\u9879\u4E0D\u662F\u672C\u6B21\u6709\u9650\u5019\u9009");
  const card = "div:nth-of-type(" + p.position + ") > div:nth-of-type(1) > li:nth-of-type(1)";
  const selector = card + " > div:nth-of-type(1) > div:nth-of-type(1) > a:nth-of-type(1)";
  if (p.cardSelector !== card || p.linkSelector !== selector || JSON.stringify(r.items[p.position - 1]) !== JSON.stringify(p)) return fail("\u5019\u9009\u4F4D\u7F6E\u6216\u5B9A\u4F4D\u4E0E\u672C\u6B21\u8303\u56F4\u4E0D\u4E00\u81F4");
  if (!object(city) || city.version !== 1 || city.kind !== "daily-apply-city-source" || city.status !== "city-labels-and-source-matched" || city.configurationRevision !== r.configurationRevision || city.configuredDay !== r.configuredDay || city.timeZone !== r.timeZone || JSON.stringify(city.configuredCities) !== JSON.stringify(r.configuredCities) || city.cityLabelsMatchConfiguration !== true || city.jobCityMatchesConfiguration !== true || city.eligibleForActions !== false || !r.configuredCities.includes(city.actualCity)) return fail("\u672C\u6B21\u914D\u7F6E\u4E0E\u7F51\u9875\u5B9E\u9645\u57CE\u5E02\u672A\u901A\u8FC7\u6838\u5BF9");
  if (!object(s) || s.version !== 3 || s.operation !== "collect" || s.renderPolicy !== "bounded-rendered-text-v2" || s.selector !== "html" || s.complete !== true || !Array.isArray(s.framePath) || s.framePath.length || !Array.isArray(s.fields) || s.fields.length !== 2) return fail("\u5019\u9009\u6807\u9898\u6216\u94FE\u63A5\u672A\u5B8C\u6574\u91C7\u96C6");
  const values = {};
  for (const [key, operation, attribute] of [["jobTitle", "text", null], ["jobLink", "attribute", "href"]]) {
    const found = s.fields.filter((f2) => object(f2) && f2.key === key), f = found[0];
    if (found.length !== 1 || f.selector !== selector || f.operation !== operation || f.attribute !== attribute || f.required !== true || f.count !== 1 || f.status !== "ok" || f.ignoredAncestorSpaces !== 0 || !Array.isArray(f.issues) || f.issues.length || typeof f.value !== "string" || !f.value.trim()) return fail("\u5019\u9009\u5B57\u6BB5\u7F3A\u5931\u3001\u975E\u552F\u4E00\u6216\u4E0E\u5FAA\u73AF\u9879\u4E0D\u4E00\u81F4\uFF1A" + key);
    values[key] = f.value.trim();
  }
  if (values.jobTitle.length > 300 || /[\u0000-\u001f\u007f]/.test(values.jobTitle)) return fail("\u5019\u9009\u804C\u4F4D\u6807\u9898\u683C\u5F0F\u65E0\u6548");
  let jobSource;
  try {
    const page = new URL(s.url), doc = new URL(s.documentUrl);
    const safe = (u) => u.protocol === "https:" && u.hostname === "www.zhipin.com" && !u.port && !u.username && !u.password;
    if (!safe(page) || !safe(doc) || page.pathname !== "/web/geek/jobs" || page.href !== doc.href || values.jobLink.length > 4096) throw Error();
    const job = new URL(values.jobLink, page);
    if (!safe(job) || !/^\/job_detail\/[A-Za-z0-9_~-]+\.html$/.test(job.pathname)) throw Error();
    jobSource = job.origin + job.pathname;
  } catch {
    return fail("\u5019\u9009\u8BE6\u60C5\u94FE\u63A5\u6216\u540C\u6B21\u7F51\u9875\u6765\u6E90\u65E0\u6548");
  }
  signal.throwIfAborted();
  return { version: 1, kind: "daily-candidate-source", status: "candidate-source-only", position: p.position, configurationRevision: r.configurationRevision, configuredDay: r.configuredDay, timeZone: r.timeZone, actualCity: city.actualCity, jobTitle: values.jobTitle, jobSource, currentDetailSelected: false, candidateJobCityVerified: false, descriptionComplete: false, accountVerified: false, eligibleForActions: false, dayTaskComplete: false, siteDailyLimitConfirmed: false, note: "\u4EC5\u53D6\u5F97\u672C\u9879\u5019\u9009\u6807\u9898\u53CA\u5B89\u5168\u8BE6\u60C5\u6765\u6E90\uFF1B\u5C1A\u672A\u9009\u62E9\u8BE5\u5C97\u4F4D\u8BE6\u60C5\uFF0C\u4E0D\u628A\u5F53\u524D\u8BE6\u60C5\u57CE\u5E02\u5F53\u4F5C\u672C\u9879\u5C97\u4F4D\u57CE\u5E02\u3002\u4E0B\u4E00\u6B65\u5FC5\u987B\u9009\u62E9\u5E76\u56DE\u8BFB\u540C\u4E00\u8EAB\u4EFD\u3001\u57CE\u5E02\u4E0E\u5B8C\u6574JD\uFF0C\u518D\u6838\u5BF9\u7528\u6237\u6761\u4EF6\u3002" };
};
export {
  stdin_default as default
};
