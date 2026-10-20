import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v), hash = (v) => createHash("sha256").update(v).digest("hex"), jhash = (v) => hash(JSON.stringify(v));
  if (!obj(input) || Object.keys(input).sort().join(",") !== "account,buttonText,currentJD,prepared,receipt,source") throw Error("\u7F3A\u5C11\u63D0\u4EA4\u524D\u7684\u5B8C\u6574\u5C97\u4F4D\u4E0E\u64CD\u4F5C\u6765\u6E90");
  const { account: a, buttonText: label, currentJD: jd, prepared: p, receipt: r, source: s } = input, i = s?.intent;
  const fail = async (message) => {
    await template.attention({ key: "daily-submit-check:" + jhash([s?.key, message]), title: "\u9996\u6B21\u6C9F\u901A\u5DF2\u505C\u6B62\uFF0C\u8BF7\u6838\u5BF9", detail: { jobTitle: s?.jobTitle ?? null, jobSource: s?.jobSource ?? null, message, applied: false } });
    signal.throwIfAborted();
    throw Error(message);
  };
  if (!obj(s) || s.version !== 1 || s.kind !== "daily-application-operation-input" || s.submissionMode !== "first-communication-with-site-greeting" || s.action !== "apply" || s.applied !== false || !obj(i) || i.status !== "reserved" || s.key !== "application:" + i.key || s.jobSource !== i.jobSource || !obj(r) || r.version !== 1 || r.operation !== "prepare" || r.action !== "apply" || r.key !== s.key || r.execute !== true || r.state !== "submitting" || typeof r.id !== "string" || typeof r.runId !== "string") return fail("\u4E0D\u662F\u672C\u5B9E\u4F8B\u672C\u6B21\u65B0\u5EFA\u7684\u72EC\u7ACB\u9996\u6B21\u6C9F\u901A\u64CD\u4F5C\uFF0C\u4E0D\u5F97\u70B9\u51FB");
  const now = Date.now(), checked = Date.parse(a?.checkedAt), day = new Intl.DateTimeFormat("sv-SE", { timeZone: i.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now));
  if (day !== i.day || !Number.isFinite(checked) || checked > now || now - checked > 12e4 || a?.status !== "current-account-source-matched" || a.currentAccountVerified !== true || a.platformUniqueIdVerified !== false || a.eligibleForActions !== false || jhash(["boss-visible-account-source-v1", a.accountName, a.phoneMask, new URL(a.jobseekerResumeHref, a.sourceUrl).origin + new URL(a.jobseekerResumeHref, a.sourceUrl).pathname]) !== i.accountSourceSha256) return fail("\u65E5\u671F\u6216\u8D26\u53F7\u590D\u9A8C\u6765\u6E90\u5DF2\u53D8\u5316/\u8D85\u8FC7\u4E24\u5206\u949F\u6709\u6548\u671F\uFF0C\u4FDD\u7559\u539F\u64CD\u4F5C\u5E76\u505C\u6B62");
  if (p?.ready !== true || !obj(p.job) || !obj(p.resume) || p.resume.status !== "ready" || p.source?.day !== day || p.source.configurationRevision !== i.configurationRevision || p.job.sourceLabel !== i.jobSource || p.job.title !== s.jobTitle || p.job.city !== s.actualCity || !p.configuration.cities.includes(p.job.city) || p.resume.source?.sha256 !== i.resumeSha256) return fail("\u6240\u9009\u6750\u6599\u3001\u914D\u7F6E\u3001\u5C97\u4F4D\u6216\u57CE\u5E02\u4E0E\u672C\u6B21\u64CD\u4F5C\u4E0D\u4E00\u81F4");
  if (!obj(jd) || jd.version !== 4 || jd.operation !== "collect" || jd.renderPolicy !== "bounded-selection-text-v1" || jd.selector !== "html" || jd.complete !== true || jd.externalAppearanceVerified !== false || !Array.isArray(jd.framePath) || jd.framePath.length || !Array.isArray(jd.fields) || jd.fields.length !== 6) return fail("\u64CD\u4F5C\u786E\u8BA4\u540E\u91CD\u65B0\u91C7\u96C6\u7684\u5C97\u4F4D\u6765\u6E90\u4E0D\u5B8C\u6574");
  const page = new URL(jd.url), doc = new URL(jd.documentUrl);
  if ([page, doc].some((u) => u.protocol !== "https:" || u.hostname !== "www.zhipin.com" || u.port || u.username || u.password) || page.href !== doc.href || page.origin + page.pathname !== i.jobSource) return fail("\u64CD\u4F5C\u786E\u8BA4\u540E\u7F51\u9875\u5DF2\u5207\u6362\uFF0C\u4E0D\u662F\u672C\u9879\u804C\u4F4D");
  const specs = [["title", "head > title", "text"], ["jobTitle", "h1", "text"], ["jobCity", "div:nth-of-type(1) > p:nth-of-type(1) > a:nth-of-type(1)", "text"], ["companyLabel", "div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > a:nth-of-type(2)", "text"], ["description", "div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3)", "selection-text"], ["salary", "div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1)", "text"]], values = {};
  for (const [key, selector, operation] of specs) {
    const rows2 = jd.fields.filter((v2) => v2?.key === key), v = rows2[0];
    if (rows2.length !== 1 || v.selector !== selector || v.operation !== operation || v.attribute !== null || v.required !== true || v.count !== 1 || v.status !== "ok" || !Array.isArray(v.issues) || v.issues.length || typeof v.value !== "string" || !v.value.trim() || !Number.isSafeInteger(v.ignoredAncestorSpaces) || v.ignoredAncestorSpaces < 0 || !Number.isSafeInteger(v.excludedAncestorDecorations) || v.excludedAncestorDecorations < 0) return fail("\u63D0\u4EA4\u524D\u7F51\u9875\u5B57\u6BB5\u7F3A\u5931\u3001\u6765\u6E90\u53D8\u5316\u6216\u4E0D\u552F\u4E00\uFF1A" + key);
    values[key] = v.value.trim();
  }
  if (values.jobTitle !== p.job.title || values.jobCity !== p.job.city || values.companyLabel !== p.job.company || values.salary !== p.job.salaryRaw || !values.title.includes(values.jobTitle) || !values.title.includes(values.companyLabel) || hash(values.description) !== hash(p.job.description) || jhash({ jobSource: i.jobSource, jobTitle: values.jobTitle, jobCity: values.jobCity, company: values.companyLabel, descriptionSha256: hash(values.description), salaryRaw: values.salary }) !== i.jobSourceSha256) return fail("\u786E\u8BA4\u671F\u95F4\u804C\u4F4D\u3001\u516C\u53F8\u3001\u57CE\u5E02\u3001\u85AA\u8D44\u6216JD\u5DF2\u53D8\u5316");
  if (typeof label !== "string" || label.trim() !== "\u7ACB\u5373\u6C9F\u901A") return fail("\u5F53\u524D\u5165\u53E3\u4E0D\u662F\u7ACB\u5373\u6C9F\u901A\uFF0C\u53EF\u80FD\u5DF2\u6C9F\u901A\u8FC7\u6216\u9875\u9762\u53D8\u5316\uFF0C\u4E0D\u91CD\u590D\u70B9\u51FB");
  const state = await template.state.get();
  signal.throwIfAborted();
  const rows = state?.applicationIntents;
  if (!Array.isArray(rows) || rows.filter((v) => v?.key === i.key).length !== 1 || JSON.stringify(rows.find((v) => v?.key === i.key)) !== JSON.stringify(i)) return fail("\u6301\u4E45\u9884\u7559\u5DF2\u53D8\u5316\uFF0C\u4E0D\u6267\u884C\u7F51\u9875\u52A8\u4F5C");
  return { version: 1, kind: "daily-first-communication-submit-check", readyForWebsiteSubmission: true, operationId: r.id, operationKey: r.key, runId: r.runId, jobTitle: p.job.title, jobSource: i.jobSource, actualCity: p.job.city, checkedAt: (/* @__PURE__ */ new Date()).toISOString(), selector: "div:nth-of-type(2) > div:nth-of-type(1) > div > div > div:nth-of-type(1) > div:nth-of-type(3) > div:nth-of-type(1) > div > a", websiteGreetingVerified: false, applied: false, attachmentSent: false };
};
export {
  stdin_default as default
};
