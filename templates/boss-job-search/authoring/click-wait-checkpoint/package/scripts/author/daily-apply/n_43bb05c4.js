import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const reasons = [];
  const object = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  const label = (v, limit = 100) => typeof v === "string" && v.trim().length > 0 && v.length <= limit && !/[\u0000-\u001f\u007f]/.test(v) ? v.trim() : null;
  if (!object(input) || Object.keys(input).sort().join(",") !== "actualCity,configuration,source") throw Error("\u7F3A\u5C11\u672C\u6B21\u56FA\u5B9A\u914D\u7F6E\u3001\u5B9E\u9645\u57CE\u5E02\u6216\u540C\u6B21\u5C97\u4F4D\u6765\u6E90");
  const c = input.configuration;
  if (!object(c) || c.version !== 1 || c.kind !== "daily-apply-configuration" || c.readyForLoop !== true || !Number.isSafeInteger(c.configurationRevision) || c.configurationRevision < 0 || c.accountVerified !== false || c.eligibleForActions !== false || c.dayTaskComplete !== false) throw Error("\u672C\u6B21\u6C42\u804C\u6761\u4EF6\u5C1A\u672A\u6838\u5BF9\uFF0C\u505C\u6B62\u5FAA\u73AF");
  const cities = c.conditions?.cities;
  if (!Array.isArray(cities) || cities.length < 1 || cities.length > 20 || cities.some((v) => label(v) !== v) || new Set(cities).size !== cities.length) throw Error("\u56FA\u5B9A\u914D\u7F6E\u4E2D\u7684\u57CE\u5E02\u65E0\u6548\uFF0C\u505C\u6B62\u5FAA\u73AF");
  let currentDay = null;
  try {
    if (typeof c.timeZone !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(c.configuredDay)) throw Error();
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: c.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(/* @__PURE__ */ new Date());
    const part = (key) => parts.find((p) => p.type === key)?.value;
    currentDay = part("year") + "-" + part("month") + "-" + part("day");
    if (currentDay !== c.configuredDay) reasons.push("\u5DF2\u8DE8\u914D\u7F6E\u65E5\u671F\uFF0C\u9700\u8981\u91CD\u65B0\u6838\u5BF9\u5F53\u5929\u8303\u56F4");
  } catch {
    reasons.push("\u7F3A\u5C11\u6709\u6548\u7684\u6BCF\u65E5\u989D\u5EA6\u65F6\u533A\u6216\u65E5\u671F");
  }
  const expected = [
    { key: "selectedCity", operation: "text", attribute: null, selector: "div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1)" },
    { key: "jobTitle", operation: "text", attribute: null, selector: "div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1)" },
    { key: "jobCity", operation: "text", attribute: null, selector: "div:nth-of-type(1) > div:nth-of-type(1) > ul:nth-of-type(1) > li:nth-of-type(1) > a:nth-of-type(1)" },
    { key: "jobLink", operation: "attribute", attribute: "href", selector: "div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > a:nth-of-type(1)" }
  ];
  const source = input.source;
  const fields = object(source) && Array.isArray(source.fields) ? source.fields : [];
  if (!object(source) || source.version !== 3 || source.operation !== "collect" || source.complete !== true || source.selector !== "body" || source.renderPolicy !== "bounded-rendered-text-v2" || !Array.isArray(source.framePath) || source.framePath.length !== 0 || fields.length !== expected.length) reasons.push("\u540C\u6B21\u5C97\u4F4D\u6765\u6E90\u4E0D\u5B8C\u6574\u6216\u91C7\u96C6\u7B56\u7565\u4E0D\u5339\u914D");
  const values = {};
  for (const e of expected) {
    const found = fields.filter((f2) => object(f2) && f2.key === e.key);
    const f = found[0];
    if (found.length !== 1 || f.operation !== e.operation || f.attribute !== e.attribute || f.selector !== e.selector || f.required !== true || f.count !== 1 || f.status !== "ok" || f.ignoredAncestorSpaces !== 0 || !Array.isArray(f.issues) || f.issues.length !== 0 || typeof f.value !== "string") {
      reasons.push("\u5B57\u6BB5\u672A\u552F\u4E00\u5B8C\u6574\u91C7\u96C6\uFF1A" + e.key);
      values[e.key] = null;
    } else values[e.key] = e.key === "jobLink" ? f.value : label(f.value, e.key === "jobTitle" ? 300 : 100);
    if (!values[e.key]) reasons.push("\u5B57\u6BB5\u4E3A\u7A7A\u6216\u683C\u5F0F\u65E0\u6548\uFF1A" + e.key);
  }
  const actualCity = label(input.actualCity);
  const selectedCity = values.selectedCity;
  const jobCity = values.jobCity;
  const cityLabelsMatchConfiguration = !!actualCity && !!selectedCity && actualCity === selectedCity && cities.includes(actualCity);
  const jobCityMatchesConfiguration = cityLabelsMatchConfiguration && !!jobCity && jobCity === selectedCity && cities.includes(jobCity);
  if (!cityLabelsMatchConfiguration) reasons.push("\u7F51\u9875\u5B9E\u9645\u57CE\u5E02\u4E0E\u672C\u6B21\u914D\u7F6E\u4E0D\u4E00\u81F4");
  if (!jobCityMatchesConfiguration) reasons.push("\u5C97\u4F4D\u57CE\u5E02\u4E0E\u672C\u6B21\u914D\u7F6E\u6216\u7F51\u9875\u5B9E\u9645\u57CE\u5E02\u4E0D\u4E00\u81F4");
  let pageSource = null;
  let jobSource = null;
  try {
    const page = new URL(source.url);
    const doc = new URL(source.documentUrl);
    const safe = (u) => u.protocol === "https:" && u.hostname === "www.zhipin.com" && !u.port && !u.username && !u.password;
    if (!safe(page) || !safe(doc) || page.pathname !== "/web/geek/jobs" || page.href !== doc.href) throw Error();
    if (!Array.isArray(c.conditions?.targetRoles) || c.conditions.targetRoles.length !== 1 || page.searchParams.getAll("query").length !== 1 || page.searchParams.get("query") !== c.conditions.targetRoles[0] || page.hash) throw Error("\u7F51\u9875\u68C0\u7D22\u76EE\u6807\u4E0E\u672C\u6B21\u56FA\u5B9A\u914D\u7F6E\u4E0D\u4E00\u81F4");
    if (typeof values.jobLink !== "string" || values.jobLink.length > 4096) throw Error();
    const job = new URL(values.jobLink, page);
    if (!safe(job) || !/^\/job_detail\/[A-Za-z0-9_~-]+\.html$/.test(job.pathname)) throw Error();
    pageSource = page.origin + page.pathname;
    jobSource = job.origin + job.pathname;
  } catch {
    reasons.push("\u804C\u4F4D\u6765\u6E90\u94FE\u63A5\u65E0\u6548\u6216\u7F51\u9875\u6765\u6E90\u4E0D\u4E00\u81F4");
  }
  const result = {
    version: 1,
    kind: "daily-apply-city-source",
    status: reasons.length ? "stopped-needs-review" : "city-labels-and-source-matched",
    configurationRevision: c.configurationRevision,
    configuredDay: c.configuredDay,
    timeZone: c.timeZone,
    configuredCities: [...cities],
    actualCity,
    selectedCity,
    jobCity,
    jobTitle: values.jobTitle,
    pageSource,
    jobSource,
    sourceKind: "structured-dom-labels",
    cityLabelsMatchConfiguration,
    jobCityMatchesConfiguration,
    jobIdentityCandidateOnly: true,
    descriptionComplete: false,
    accountVerified: false,
    eligibleForActions: false,
    dayTaskComplete: false,
    siteDailyLimitConfirmed: false,
    reasons,
    checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
    note: "\u4EC5\u6838\u5BF9\u672C\u6B21\u914D\u7F6E\u3001\u7F51\u9875/\u5C97\u4F4D\u57CE\u5E02\u6807\u7B7E\u4E0E\u540C\u6B21\u8BE6\u60C5\u94FE\u63A5\uFF1B\u4E0D\u4EE3\u8868\u5B8C\u6574JD\u3001\u8D26\u53F7\u3001\u5C97\u4F4D\u9002\u914D\u6216\u6295\u9012\u8D44\u683C\u3002\u94FE\u63A5\u4E0D\u4FDD\u5B58\u67E5\u8BE2\u53C2\u6570\u3002"
  };
  signal.throwIfAborted();
  if (reasons.length) {
    const key = "daily-apply-city-source:" + createHash("sha256").update(JSON.stringify({ revision: c.configurationRevision, day: c.configuredDay, cities, actualCity, selectedCity, jobCity, jobSource, reasons })).digest("hex");
    await template.attention({ key, title: "\u6C42\u804C\u57CE\u5E02\u6216\u5C97\u4F4D\u6765\u6E90\u4E0D\u4E00\u81F4\uFF0C\u5FAA\u73AF\u5DF2\u505C\u6B62", detail: result });
    signal.throwIfAborted();
    await template.result(result);
    throw Error("\u6C42\u804C\u57CE\u5E02\u6216\u5C97\u4F4D\u6765\u6E90\u672A\u901A\u8FC7\u6838\u5BF9\uFF0C\u5DF2\u505C\u6B62\u5FAA\u73AF\u5E76\u4FDD\u5B58\u672C\u4EBA\u5F85\u529E");
  }
  return result;
};
export {
  stdin_default as default
};
