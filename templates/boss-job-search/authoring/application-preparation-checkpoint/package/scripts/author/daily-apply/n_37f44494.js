import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v), hash = (v) => createHash("sha256").update(JSON.stringify(v)).digest("hex"), digest = (v) => typeof v === "string" && /^[a-f0-9]{64}$/.test(v), text = (v, n) => typeof v === "string" && v.length > 0 && v.length <= n && v.trim() === v && !/[\u0000-\u001f\u007f]/.test(v);
  if (!obj(input) || Object.keys(input).sort().join(",") !== "account,candidate,configuration,fixedConfiguration,state") throw Error("\u7F3A\u5C11\u56FA\u5B9A\u914D\u7F6E\u3001\u8D26\u53F7\u3001\u5019\u9009\u6216\u6700\u65B0\u8D26\u672C\u6765\u6E90");
  const f = input.configuration, raw = input.fixedConfiguration, c = input.candidate, a = input.account, s = input.state;
  if (!obj(raw) || raw.version !== 1 || raw.operation !== "configuration" || !text(raw.contextId, 200) || !Number.isSafeInteger(raw.revision) || raw.revision < 0 || !obj(raw.value) || !obj(s) || s.version !== 1 || s.operation !== "state.read" || s.contextId !== raw.contextId || !Number.isSafeInteger(s.revision) || s.revision < 0 || !obj(s.value)) throw Error("\u6700\u65B0\u72B6\u6001\u4E0E\u672C\u6B21\u56FA\u5B9A\u914D\u7F6E\u4E0D\u5C5E\u540C\u4E00\u4E0A\u4E0B\u6587");
  if (!obj(f) || f.version !== 1 || f.kind !== "daily-apply-configuration" || f.status !== "conditions-ready" || f.readyForLoop !== true || f.configurationRevision !== raw.revision || !Number.isSafeInteger(f.userDailyLimit) || f.userDailyLimit < 1 || f.userDailyLimit > 150 || !obj(f.conditions) || Object.keys(f.conditions).sort().join(",") !== "cities,excludedRoles,salaryMax,salaryMin,targetRoles" || f.timeZone !== raw.value.replyTimeZone) throw Error("\u672C\u6B21\u6BCF\u65E5\u914D\u7F6E\u5C1A\u672A\u5B8C\u6574\u6838\u5BF9");
  for (const k of ["cities", "excludedRoles", "salaryMax", "salaryMin", "targetRoles"]) if (JSON.stringify(f.conditions[k]) !== JSON.stringify(raw.value[k])) throw Error("\u6574\u7406\u540E\u6761\u4EF6\u4E0E\u56FA\u5B9A\u7528\u6237\u914D\u7F6E\u4E0D\u4E00\u81F4");
  const q = f.conditions, dayOf = (value) => new Intl.DateTimeFormat("sv-SE", { timeZone: f.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(value), now = /* @__PURE__ */ new Date(), day = dayOf(now);
  if (day !== f.configuredDay || !Array.isArray(q.cities) || !q.cities.length || !q.cities.every((v) => text(v, 100))) throw Error("\u5F53\u5929\u6216\u914D\u7F6E\u57CE\u5E02\u8303\u56F4\u65E0\u6548\uFF0C\u505C\u6B62\u672C\u6279");
  if (!obj(c) || c.version !== 1 || c.kind !== "daily-job-hard-conditions" || !["hard-condition-mismatch", "hard-conditions-needs-review", "hard-conditions-ready-for-skill"].includes(c.status) || c.configurationRevision !== raw.revision || c.configuredDay !== day || c.actualCity !== c.jobCity || !q.cities.includes(c.jobCity) || c.eligibleForActions !== false || c.applied !== false || c.dayTaskComplete !== false || c.siteDailyLimitConfirmed !== false || c.readyForSkillAssessment !== (c.status === "hard-conditions-ready-for-skill") || !text(c.jobTitle, 200) || !text(c.jobSource, 4096)) throw Error("\u5019\u9009\u5C97\u4F4D\u3001\u5B9E\u9645\u57CE\u5E02\u6216\u56FA\u5B9A\u914D\u7F6E\u6765\u6E90\u4E0D\u4E00\u81F4");
  const jobUrl = new URL(c.jobSource), jobMatch = /^\/job_detail\/([A-Za-z0-9_~-]+)\.html$/.exec(jobUrl.pathname);
  if (!text(jobMatch?.[1], 200) || jobUrl.protocol !== "https:" || jobUrl.hostname !== "www.zhipin.com" || jobUrl.port || jobUrl.username || jobUrl.password || jobUrl.search || jobUrl.hash || !jobMatch) throw Error("\u5B9E\u9645\u5C97\u4F4D\u6765\u6E90\u65E0\u6548");
  if (!obj(a) || a.version !== 1 || a.status !== "current-account-source-matched" || a.currentAccountVerified !== true || a.platformUniqueIdVerified !== false || a.eligibleForActions !== false || !text(a.accountName, 100) || !text(a.phoneMask, 100) || !text(a.sourceUrl, 4096) || !text(a.jobseekerResumeHref, 4096) || !text(a.checkedAt, 64) || !Number.isFinite(Date.parse(a.checkedAt)) || Date.parse(a.checkedAt) > now.getTime() || dayOf(new Date(a.checkedAt)) !== day) throw Error("\u7F3A\u5C11\u672C\u6B21\u91CD\u65B0\u91C7\u96C6\u4E00\u81F4\u7684\u8D26\u53F7\u53EF\u89C1\u6765\u6E90");
  const accountPage = new URL(a.sourceUrl), resume = new URL(a.jobseekerResumeHref, a.sourceUrl);
  if (accountPage.origin !== "https://www.zhipin.com" || accountPage.pathname !== "/web/geek/account" || accountPage.searchParams.get("type") !== "accountSet" || accountPage.username || accountPage.password || accountPage.hash || resume.origin !== "https://www.zhipin.com" || resume.pathname !== "/web/geek/resume" || resume.username || resume.password) throw Error("\u8D26\u53F7\u89D2\u8272\u6765\u6E90\u4E0D\u7B26");
  const accountSourceSha256 = hash(["boss-visible-account-source-v1", a.accountName, a.phoneMask, resume.origin + resume.pathname]), jobId = jobMatch[1], key = hash(["boss-application-v1", accountSourceSha256, jobId]), issues = [], rows = Object.hasOwn(s.value, "applicationIntents") ? s.value.applicationIntents : [];
  const fields = ["accountSourceSha256", "batchId", "configurationRevision", "createdAt", "day", "jobId", "jobSource", "jobSourceSha256", "key", "profileVersionId", "resumeSha256", "status", "timeZone"].sort().join(","), counts = { reserved: 0, confirmed: 0, failed: 0, unknown: 0 }, seen = /* @__PURE__ */ new Set();
  let invalid = false, otherAccount = false, otherZone = false, unresolved = false, duplicate = null;
  if (!Array.isArray(rows) || rows.length > 500) {
    invalid = true;
    issues.push("\u6295\u9012\u8BB0\u5F55\u683C\u5F0F\u9519\u8BEF\u6216\u8D85\u8FC7\u5BB9\u91CF\uFF0C\u4E0D\u80FD\u5F53\u4F5C\u7A7A\u8D26\u672C");
  } else for (const r of rows) {
    signal.throwIfAborted();
    let ok = obj(r) && Object.keys(r).sort().join(",") === fields && ["key", "accountSourceSha256", "jobSourceSha256", "resumeSha256"].every((k) => digest(r[k])) && text(r.jobId, 200) && text(r.jobSource, 4096) && text(r.profileVersionId, 200) && text(r.batchId, 64) && text(r.timeZone, 100) && text(r.createdAt, 64) && r.createdAt.length >= 20 && typeof r.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.day) && Number.isSafeInteger(r.configurationRevision) && r.configurationRevision >= 0 && text(r.status, 20) && Object.hasOwn(counts, r.status);
    if (ok) try {
      const u = new URL(r.jobSource), m = /^\/job_detail\/([A-Za-z0-9_~-]+)\.html$/.exec(u.pathname), at = new Date(r.createdAt);
      ok = u.protocol === "https:" && u.hostname === "www.zhipin.com" && !u.port && !u.username && !u.password && !u.search && !u.hash && m?.[1] === r.jobId && r.key === hash(["boss-application-v1", r.accountSourceSha256, r.jobId]) && Number.isFinite(at.getTime()) && at.toISOString() === r.createdAt && at.getTime() <= now.getTime() && new Intl.DateTimeFormat("sv-SE", { timeZone: r.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(at) === r.day && !seen.has(r.key);
    } catch {
      ok = false;
    }
    if (!ok) {
      invalid = true;
      continue;
    }
    seen.add(r.key);
    if (r.accountSourceSha256 !== accountSourceSha256) {
      otherAccount = true;
      continue;
    }
    if (r.timeZone !== f.timeZone) {
      otherZone = true;
      continue;
    }
    if (r.day > day) {
      invalid = true;
      continue;
    }
    if (r.day === day) counts[r.status]++;
    if (r.status === "reserved" || r.status === "unknown") unresolved = true;
    if (r.key === key) duplicate = { status: r.status, day: r.day, createdAt: r.createdAt };
  }
  if (invalid) issues.push("\u5B58\u5728\u635F\u574F\u3001\u91CD\u590D\u3001\u672A\u6765\u65E5\u671F\u6216\u6765\u6E90\u8EAB\u4EFD\u4E0D\u4E00\u81F4\u7684\u6295\u9012\u8BB0\u5F55\uFF0C\u4EA4\u672C\u4EBA\u6838\u5BF9");
  if (otherAccount) issues.push("\u8BB0\u5F55\u4E2D\u5B58\u5728\u4E0D\u540C\u8D26\u53F7\u53EF\u89C1\u6765\u6E90\uFF0C\u4E0D\u80FD\u6309\u522B\u540D\u5EFA\u7ACB\u65B0\u989D\u5EA6");
  if (otherZone) issues.push("\u989D\u5EA6\u65F6\u533A\u4E0E\u65E2\u6709\u8BB0\u5F55\u4E0D\u540C\uFF0C\u4E0D\u80FD\u81EA\u52A8\u8FC1\u79FB\u6216\u91CD\u7F6E");
  if (Array.isArray(rows) && rows.length === 500) issues.push("\u6295\u9012\u8BB0\u5F55\u5DF2\u6EE1500\u9879\uFF0C\u4E0D\u81EA\u52A8\u6E05\u7406");
  if (unresolved) issues.push("\u5B58\u5728\u5C1A\u5F85\u6838\u5BF9\u7684\u9884\u7559\u6216\u672A\u77E5\u7ED3\u679C\uFF0C\u91CD\u5F00\u4E0D\u4F1A\u91CD\u653E");
  const usage = invalid || otherAccount || otherZone ? null : Object.values(counts).reduce((n, v) => n + v, 0), remaining = usage === null ? null : Math.max(0, f.userDailyLimit - usage);
  if (remaining === 0) issues.push("\u672C\u5730\u6BCF\u65E5\u989D\u5EA6\u5DF2\u7528\u5B8C\uFF1B\u8FD9\u91CC\u53EA\u6682\u505C\uFF0C\u4E0D\u80FD\u5224\u7F51\u7AD9\u5F53\u5929\u5B8C\u6210");
  const review = issues.length > 0, skipDuplicate = !!duplicate && !review, ready = !review && !skipDuplicate && c.readyForSkillAssessment;
  const result = { version: 1, kind: "daily-application-ledger-check", status: review ? "ledger-needs-review" : skipDuplicate ? "application-already-recorded" : ready ? "ledger-ready-for-skill" : "candidate-not-ready", decision: review ? "\u6682\u505C\u5E76\u4EA4\u672C\u4EBA\u6838\u5BF9" : skipDuplicate ? "\u8DF3\u8FC7\u5DF2\u5904\u7406\u5C97\u4F4D" : ready ? "\u7EE7\u7EED\u56FA\u5B9ASkill\u8BC4\u4F30" : c.decision, issues, jobTitle: c.jobTitle, jobSource: c.jobSource, actualCity: c.actualCity, jobCity: c.jobCity, key, accountSourceSha256, platformUniqueIdVerified: false, configurationRevision: raw.revision, stateRevision: s.revision, contextId: s.contextId, day, timeZone: f.timeZone, quota: { limit: f.userDailyLimit, used: usage, remaining, confirmed: usage === null ? null : counts.confirmed, reserved: usage === null ? null : counts.reserved, unknown: usage === null ? null : counts.unknown, failed: usage === null ? null : counts.failed }, existingIntent: duplicate, readyForSkillAssessment: ready, needsUserReview: review || c.needsUserReview === true, skipped: !ready, eligibleForActions: false, reservedNow: false, applied: false, dayTaskComplete: false, siteDailyLimitConfirmed: false, note: "\u53EA\u8BFB\u6700\u65B0\u72B6\u6001\uFF1B\u8D26\u53F7\u53EF\u89C1\u6765\u6E90\u4E0D\u662F\u5E73\u53F0\u552F\u4E00ID\uFF0C\u4E5F\u4E0D\u8BC1\u660E\u8DE8\u5B9E\u4F8B/\u5916\u90E8\u624B\u5DE5\u6295\u9012\u989D\u5EA6\u3002\u7EE7\u7EED\u8BC4\u4F30\u4ECD\u987B\u56FA\u5B9ASkill\u3001\u5B8C\u6574\u4E8B\u5B9E\u548C\u5F53\u524D\u6765\u6E90/\u6750\u6599\u590D\u9A8C\uFF0C\u5B9E\u9645\u9884\u7559\u53CA\u63D0\u4EA4\u53E6\u884C\u7F16\u6392\u3002" };
  signal.throwIfAborted();
  await template.result(result);
  if (review) await template.attention({ key: "daily-application-ledger:" + hash([raw.contextId, key, s.revision, day, issues]), title: "\u6295\u9012\u8BB0\u5F55\u4E0E\u989D\u5EA6\u5F85\u6838\u5BF9\uFF1A" + c.jobTitle, detail: { jobTitle: c.jobTitle, jobSource: c.jobSource, day, timeZone: f.timeZone, quota: result.quota, issues, eligibleForActions: false } });
  signal.throwIfAborted();
  return result;
};
export {
  stdin_default as default
};
