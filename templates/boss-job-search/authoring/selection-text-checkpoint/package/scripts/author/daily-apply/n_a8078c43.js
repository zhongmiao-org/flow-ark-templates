import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const object = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  const fail = async (message) => {
    const key = "daily-detail-readback:" + createHash("sha256").update(JSON.stringify({ revision: input?.selection?.configurationRevision, day: input?.selection?.configuredDay, position: input?.selection?.position, message })).digest("hex");
    await template.attention({ key, title: "\u5019\u9009\u8BE6\u60C5\u8EAB\u4EFD\u6216\u57CE\u5E02\u672A\u901A\u8FC7\u6838\u5BF9\uFF0C\u5FAA\u73AF\u5DF2\u505C\u6B62", detail: { message, eligibleForActions: false, dayTaskComplete: false } });
    signal.throwIfAborted();
    throw Error(message);
  };
  if (!object(input) || Object.keys(input).sort().join(",") !== "receipt,selection,source,waited") return fail("\u7F3A\u5C11\u672C\u6B21\u9009\u62E9\u3001\u70B9\u51FB\u56DE\u6267\u3001\u7B49\u5F85\u7ED3\u679C\u6216\u540C\u6B21\u8BE6\u60C5\u6765\u6E90");
  const { selection: c, receipt, waited, source: s } = input;
  if (!object(c) || c.version !== 1 || c.kind !== "daily-detail-selection-precheck" || c.readyToSelect !== true || c.currentDetailSelected !== false || c.descriptionComplete !== false || c.accountVerified !== false || c.eligibleForActions !== false || c.dayTaskComplete !== false || !Number.isSafeInteger(c.configurationRevision) || c.configurationRevision < 0 || !Number.isSafeInteger(c.position) || c.position < 1 || c.position > 150 || !Array.isArray(c.configuredCities) || c.configuredCities.length < 1 || c.configuredCities.length > 20 || !c.configuredCities.includes(c.expectedCity)) return fail("\u672C\u6B21\u5019\u9009\u9009\u62E9\u6765\u6E90\u6216\u57CE\u5E02\u8303\u56F4\u65E0\u6548");
  if (!object(receipt) || Object.keys(receipt).sort().join(",") !== "clicked,verified" || receipt.clicked !== true || receipt.verified !== false || waited !== true) return fail("\u70B9\u51FB\u6216\u8BE6\u60C5\u7B49\u5F85\u7ED3\u679C\u7F3A\u5931\uFF0C\u4E0D\u91CD\u653E\u9009\u62E9");
  const expected = [
    { key: "selectedCity", selector: "div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1)", operation: "text", attribute: null },
    { key: "jobTitle", selector: "div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1)", operation: "text", attribute: null },
    { key: "jobCity", selector: "div:nth-of-type(1) > div:nth-of-type(1) > ul:nth-of-type(1) > li:nth-of-type(1) > a:nth-of-type(1)", operation: "text", attribute: null },
    { key: "jobLink", selector: "div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > a:nth-of-type(1)", operation: "attribute", attribute: "href" }
  ];
  if (!object(s) || s.version !== 3 || s.operation !== "collect" || s.renderPolicy !== "bounded-rendered-text-v2" || s.selector !== "body" || s.complete !== true || !Array.isArray(s.framePath) || s.framePath.length || !Array.isArray(s.fields) || s.fields.length !== expected.length) return fail("\u9009\u62E9\u540E\u7684\u8BE6\u60C5\u540C\u6B21\u6765\u6E90\u4E0D\u5B8C\u6574");
  const values = {};
  for (const e of expected) {
    const found = s.fields.filter((f2) => object(f2) && f2.key === e.key), f = found[0];
    if (found.length !== 1 || f.selector !== e.selector || f.operation !== e.operation || f.attribute !== e.attribute || f.required !== true || f.count !== 1 || f.status !== "ok" || f.ignoredAncestorSpaces !== 0 || !Array.isArray(f.issues) || f.issues.length || typeof f.value !== "string" || !f.value.trim()) return fail("\u9009\u62E9\u540E\u5B57\u6BB5\u7F3A\u5931\u3001\u975E\u552F\u4E00\u6216\u8303\u56F4\u4E0D\u4E00\u81F4\uFF1A" + e.key);
    values[e.key] = f.value.trim();
  }
  if (values.selectedCity !== c.expectedCity || values.jobCity !== c.expectedCity || !c.configuredCities.includes(values.selectedCity) || !c.configuredCities.includes(values.jobCity)) return fail("\u8BE6\u60C5\u5C97\u4F4D\u57CE\u5E02\u6216\u5B9E\u9645\u7F51\u9875\u57CE\u5E02\u4E0E\u672C\u6B21\u914D\u7F6E\u4E0D\u4E00\u81F4");
  if (values.jobTitle !== c.jobTitle) return fail("\u8BE6\u60C5\u6807\u9898\u5C1A\u672A\u5BF9\u5E94\u672C\u9879\u5019\u9009\uFF0C\u4E0D\u80FD\u6CBF\u7528\u65E7\u8BE6\u60C5");
  let jobSource;
  try {
    const page = new URL(s.url), doc = new URL(s.documentUrl), expectedJob = new URL(c.jobSource);
    const safe = (u) => u.protocol === "https:" && u.hostname === "www.zhipin.com" && !u.port && !u.username && !u.password;
    if (!safe(page) || !safe(doc) || page.pathname !== "/web/geek/jobs" || page.href !== doc.href || !safe(expectedJob) || expectedJob.search || expectedJob.hash || !/^\/job_detail\/[A-Za-z0-9_~-]+\.html$/.test(expectedJob.pathname) || values.jobLink.length > 4096) throw Error();
    const current = new URL(values.jobLink, page);
    jobSource = current.origin + current.pathname;
    if (!safe(current) || jobSource !== c.jobSource) throw Error();
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: c.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(/* @__PURE__ */ new Date());
    const part = (k) => parts.find((p) => p.type === k)?.value;
    if (part("year") + "-" + part("month") + "-" + part("day") !== c.configuredDay) throw Error();
  } catch {
    return fail("\u8BE6\u60C5\u8EAB\u4EFD\u3001\u7F51\u9875\u6765\u6E90\u6216\u5F53\u5929\u8303\u56F4\u4E0E\u672C\u6B21\u5019\u9009\u4E0D\u4E00\u81F4");
  }
  signal.throwIfAborted();
  return { version: 1, kind: "daily-candidate-detail", status: "detail-identity-and-city-matched", position: c.position, configurationRevision: c.configurationRevision, configuredDay: c.configuredDay, timeZone: c.timeZone, configuredCities: [...c.configuredCities], actualCity: values.selectedCity, jobCity: values.jobCity, jobTitle: values.jobTitle, jobSource, currentDetailSelected: true, candidateJobCityVerified: true, descriptionComplete: false, accountVerified: false, eligibleForActions: false, dayTaskComplete: false, siteDailyLimitConfirmed: false, note: "\u4EC5\u8BC1\u660E\u672C\u9879\u5019\u9009\u7684\u8BE6\u60C5\u8DEF\u5F84\u3001\u6807\u9898\u3001\u5C97\u4F4D\u57CE\u5E02\u4E0E\u7F51\u9875\u57CE\u5E02\u7ECF\u70B9\u51FB\u540E\u56DE\u8BFB\u5BF9\u5E94\u3002\u5B8C\u6574JD\u3001\u8D26\u53F7\u3001\u7528\u6237\u6761\u4EF6\u9002\u914D\u3001\u6295\u9012\u4E0E\u56DE\u6267\u5C1A\u672A\u6838\u9A8C\uFF1B\u672A\u9884\u7559\u6216\u6267\u884C\u62DB\u8058\u52A8\u4F5C\u3002" };
};
export {
  stdin_default as default
};
