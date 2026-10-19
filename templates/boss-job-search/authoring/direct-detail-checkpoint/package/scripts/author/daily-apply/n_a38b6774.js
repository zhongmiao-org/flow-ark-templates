import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const object = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  const fail = async (message) => {
    const key = "daily-fullpage-jd:" + createHash("sha256").update(JSON.stringify({ revision: input?.detail?.configurationRevision, day: input?.detail?.configuredDay, position: input?.detail?.position, message })).digest("hex");
    const result = { version: 1, kind: "daily-jd-source-check", status: "stopped-needs-review", message, position: input?.detail?.position ?? null, actualCity: input?.detail?.actualCity ?? null, sourceVersion: input?.source?.version ?? null, sourceComplete: input?.source?.complete ?? null, fields: Array.isArray(input?.source?.fields) ? input.source.fields.map((f) => ({ field: { title: "\u9875\u9762\u6807\u9898", jobTitle: "\u5C97\u4F4D\u540D\u79F0", jobCity: "\u5C97\u4F4D\u57CE\u5E02", companyLabel: "\u516C\u53F8\u540D\u79F0", description: "\u804C\u4F4D\u63CF\u8FF0" }[f.key] ?? "\u672A\u77E5\u5B57\u6BB5", count: f.count ?? null, status: f.status ?? null, issues: Array.isArray(f.issues) ? f.issues.map((i) => typeof i === "string" ? i : i?.code ?? "unknown") : [] })) : [], eligibleForActions: false, dayTaskComplete: false, siteDailyLimitConfirmed: false };
    await template.result(result);
    await template.attention({ key, title: "\u72EC\u7ACB\u8BE6\u60C5\u6765\u6E90\u6216\u5C97\u4F4D\u57CE\u5E02\u4E0D\u4E00\u81F4\uFF0C\u5FAA\u73AF\u5DF2\u505C\u6B62", detail: { message, eligibleForActions: false, dayTaskComplete: false } });
    signal.throwIfAborted();
    throw Error(message);
  };
  if (!object(input) || Object.keys(input).sort().join(",") !== "count,detail,list,source") return fail("\u7F3A\u5C11\u672C\u9879\u8BE6\u60C5\u3001\u540C\u6B21\u5217\u8868\u6765\u6E90\u3001\u5B9E\u9645\u6570\u91CF\u6216\u72EC\u7ACB\u8BE6\u60C5\u91C7\u96C6");
  const { detail: c, list, source: s, count } = input;
  if (!object(c) || c.version !== 1 || c.kind !== "daily-direct-detail-precheck" || c.status !== "candidate-link-and-city-ready" || c.readyToNavigate !== true || c.currentDetailSelected !== false || c.candidateJobCityVerified !== false || c.descriptionComplete !== false || c.accountVerified !== false || c.eligibleForActions !== false || c.dayTaskComplete !== false || !Number.isSafeInteger(c.configurationRevision) || c.configurationRevision < 0 || !Number.isSafeInteger(c.position) || c.position < 1 || c.position > 150 || !Array.isArray(c.configuredCities) || c.configuredCities.length < 1 || c.configuredCities.length > 20 || !c.configuredCities.every((v) => typeof v === "string" && v.trim() === v && v.length > 0) || !c.configuredCities.includes(c.actualCity) || c.expectedCity !== c.actualCity || c.expectedCardCount !== count || !Number.isSafeInteger(count) || count < c.position || count > 500) return fail("\u672C\u9879\u8EAB\u4EFD\u3001\u5B9E\u9645\u57CE\u5E02\u3001\u914D\u7F6E\u8303\u56F4\u6216\u5217\u8868\u6570\u91CF\u65E0\u6548");
  const linkSelector = "div:nth-of-type(" + c.position + ") > div:nth-of-type(1) > li:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > a:nth-of-type(1)";
  const listFields = [["jobTitle", linkSelector, "text", null], ["jobLink", linkSelector, "attribute", "href"]];
  const fields = [
    ["title", "head > title", "text", null],
    ["jobTitle", "h1", "text", null],
    ["jobCity", "div:nth-of-type(1) > p:nth-of-type(1) > a:nth-of-type(1)", "text", null],
    ["companyLabel", "div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > a:nth-of-type(2)", "text", null],
    ["description", ".job-sec-text", "selection-text", null]
  ];
  const gaps = [];
  const read = (collection, expected, version, policy, root, allowContentGap = false) => {
    if (!object(collection) || collection.version !== version || collection.operation !== "collect" || collection.renderPolicy !== policy || collection.selector !== root || (allowContentGap ? typeof collection.complete !== "boolean" : collection.complete !== true) || !Array.isArray(collection.framePath) || collection.framePath.length || !Array.isArray(collection.fields) || collection.fields.length !== expected.length || version === 4 && collection.externalAppearanceVerified !== false) throw Error("\u540C\u6B21\u91C7\u96C6\u6765\u6E90\u7248\u672C\u3001\u8303\u56F4\u6216\u5B8C\u6574\u72B6\u6001\u4E0D\u7B26");
    const values2 = {};
    for (const [key, selector, operation, attribute] of expected) {
      const matches = collection.fields.filter((f2) => object(f2) && f2.key === key), f = matches[0];
      if (matches.length !== 1 || f.selector !== selector || f.operation !== operation || f.attribute !== attribute || f.required !== true || !Array.isArray(f.issues) || !Number.isSafeInteger(f.count) || f.count < 0 || !Number.isSafeInteger(f.ignoredAncestorSpaces) || f.ignoredAncestorSpaces < 0 || version === 4 && (!Number.isSafeInteger(f.excludedAncestorDecorations) || f.excludedAncestorDecorations < 0)) throw Error("\u5B57\u6BB5\u914D\u7F6E\u6216\u8303\u56F4\u4E0D\u7B26\uFF1A" + key);
      if (f.count !== 1 || f.status !== "ok" || f.issues.length || typeof f.value !== "string" || !f.value.trim()) {
        if (allowContentGap && ["companyLabel", "description"].includes(key)) {
          gaps.push({ field: key === "companyLabel" ? "\u516C\u53F8\u540D\u79F0" : "\u804C\u4F4D\u63CF\u8FF0", count: f.count, status: f.status, issues: f.issues.map((i) => typeof i === "string" ? i : i?.code ?? "unknown") });
          continue;
        }
        throw Error("\u5C97\u4F4D\u8EAB\u4EFD\u5B57\u6BB5\u7F3A\u5931\u3001\u6B67\u4E49\u6216\u62D2\u7EDD\uFF1A" + key);
      }
      values2[key] = f.value.trim();
    }
    if (allowContentGap && collection.complete !== (gaps.length === 0)) throw Error("\u5B8C\u6574\u72B6\u6001\u4E0E\u5B57\u6BB5\u6765\u6E90\u4E0D\u4E00\u81F4");
    return values2;
  };
  let values, returnUrl;
  try {
    const original = read(list, listFields, 3, "bounded-rendered-text-v2", "html");
    values = read(s, fields, 4, "bounded-selection-text-v1", "html", true);
    const safe = (u) => u.protocol === "https:" && u.hostname === "www.zhipin.com" && !u.port && !u.username && !u.password;
    const page = new URL(s.url), doc = new URL(s.documentUrl), prior = new URL(list.url), priorDoc = new URL(list.documentUrl), expected = new URL(c.jobSource);
    const picked = new URL(original.jobLink, prior);
    if (![page, doc, prior, priorDoc, expected, picked].every(safe) || page.href !== doc.href || prior.href !== priorDoc.href || prior.pathname !== "/web/geek/jobs" || prior.href !== c.returnUrl || prior.hash || prior.href.length > 4096 || !/^\/job_detail\/[A-Za-z0-9_~-]+\.html$/.test(expected.pathname) || expected.search || expected.hash || page.origin + page.pathname !== c.jobSource || picked.origin + picked.pathname !== c.jobSource) throw Error("\u72EC\u7ACB\u8BE6\u60C5\u6216\u8FD4\u56DE\u6765\u6E90\u4E0E\u672C\u9879\u5019\u9009\u4E0D\u7B26");
    if (original.jobTitle !== c.jobTitle || values.jobCity !== c.expectedCity || !c.configuredCities.includes(values.jobCity) || values.jobTitle !== c.jobTitle || !values.title.includes(values.jobTitle) || values.companyLabel && (!values.title.includes(values.companyLabel) || values.companyLabel.length > 256)) throw Error("\u804C\u4F4D\u3001\u516C\u53F8\u3001\u5C97\u4F4D\u57CE\u5E02\u6216\u914D\u7F6E\u57CE\u5E02\u4E0D\u7B26");
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: c.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(/* @__PURE__ */ new Date()), part = (k) => parts.find((p) => p.type === k)?.value;
    if (part("year") + "-" + part("month") + "-" + part("day") !== c.configuredDay) throw Error("\u5F53\u5929\u8303\u56F4\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u542F\u52A8\u672C\u6B21\u6279\u6B21");
    returnUrl = prior.href;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "\u72EC\u7ACB\u8BE6\u60C5\u6765\u6E90\u65E0\u6CD5\u6838\u5BF9");
  }
  signal.throwIfAborted();
  const needsReview = gaps.length > 0;
  const candidate = { version: 1, kind: "daily-fullpage-jd-candidate", status: needsReview ? "source-incomplete-needs-review" : "same-candidate-jd-source", position: c.position, configurationRevision: c.configurationRevision, configuredDay: c.configuredDay, timeZone: c.timeZone, configuredCities: [...c.configuredCities], actualCity: c.actualCity, jobCity: values.jobCity, jobTitle: values.jobTitle, companyLabel: values.companyLabel ?? null, jobSource: c.jobSource, description: needsReview ? null : values.description, descriptionHash: needsReview ? null : createHash("sha256").update(values.description).digest("hex"), reviewReasons: gaps, renderPolicy: s.renderPolicy, externalAppearanceVerified: false, returnUrl, expectedCardCount: count, descriptionComplete: false, sourceCollected: !needsReview, needsUserReview: needsReview, currentDetailSelected: true, candidateJobCityVerified: true, accountVerified: false, eligibleForActions: false, dayTaskComplete: false, siteDailyLimitConfirmed: false, note: needsReview ? "\u8EAB\u4EFD\u548C\u57CE\u5E02\u5DF2\u6838\u5BF9\uFF1B\u516C\u53F8\u6216JD\u6765\u6E90\u4E0D\u786E\u5B9A\uFF0C\u6B63\u6587\u5DF2\u4E22\u5F03\u3002\u672C\u9879\u4E0D\u6295\u9012\uFF0C\u5148\u8FD4\u56DE\u5E76\u590D\u9A8C\u539F\u5217\u8868\u3002" : "\u672C\u9879\u540C\u6B21\u72EC\u7ACB\u8BE6\u60C5\u6587\u5B57\u5019\u9009\uFF1B\u672A\u6838\u9A8C\u5916\u90E8\u8986\u76D6\u3001\u8D26\u53F7\u6216\u7528\u6237\u6761\u4EF6\uFF0C\u672A\u6267\u884C\u62DB\u8058\u52A8\u4F5C\u3002\u5148\u8FD4\u56DE\u5E76\u590D\u9A8C\u539F\u5217\u8868\u3002" };
  if (needsReview) {
    const key = "daily-content-review:" + createHash("sha256").update(JSON.stringify({ revision: c.configurationRevision, day: c.configuredDay, source: c.jobSource, gaps })).digest("hex");
    await template.result(candidate);
    await template.attention({ key, title: "\u5C97\u4F4D\u8D44\u6599\u5F85\u6838\u5BF9\uFF1A" + c.jobTitle, detail: { jobTitle: c.jobTitle, jobSource: c.jobSource, actualCity: c.actualCity, reasons: gaps, decision: "\u8DF3\u8FC7\u672C\u9879\uFF0C\u4E0D\u6295\u9012", eligibleForActions: false, dayTaskComplete: false } });
  }
  signal.throwIfAborted();
  return candidate;
};
export {
  stdin_default as default
};
