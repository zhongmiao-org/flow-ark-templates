import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const object = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  if (!object(input) || Object.keys(input).sort().join(",") !== "candidate,configuration") throw Error("\u7F3A\u5C11\u672C\u9879\u5019\u9009\u6216\u672C\u6B21\u56FA\u5B9A\u6761\u4EF6");
  const c = input.candidate, f = input.configuration, q = f?.conditions;
  if (!object(f) || f.version !== 1 || f.kind !== "daily-apply-configuration" || f.status !== "conditions-ready" || f.readyForLoop !== true || !Number.isSafeInteger(f.configurationRevision) || f.configurationRevision < 0 || !object(q) || Object.keys(q).sort().join(",") !== "cities,excludedRoles,salaryMax,salaryMin,targetRoles") throw Error("\u672C\u6B21\u56FA\u5B9A\u6C42\u804C\u6761\u4EF6\u672A\u7ECF\u5B8C\u6574\u6838\u5BF9");
  for (const key of ["cities", "excludedRoles", "targetRoles"]) if (!Array.isArray(q[key]) || q[key].length > 20 || !q[key].every((v) => typeof v === "string" && v.length > 0 && v.length <= 100 && v.trim() === v) || new Set(q[key]).size !== q[key].length) throw Error("\u56FA\u5B9A\u6761\u4EF6\u6761\u76EE\u65E0\u6548\uFF1A" + key);
  if (!q.cities.length || !q.targetRoles.length || q.targetRoles.some((v) => q.excludedRoles.includes(v)) || !Number.isSafeInteger(q.salaryMin) || q.salaryMin < 0 || q.salaryMin > 1e6 || !Number.isSafeInteger(q.salaryMax) || q.salaryMax < 0 || q.salaryMax > 1e6 || q.salaryMin && q.salaryMax && q.salaryMin > q.salaryMax) throw Error("\u56FA\u5B9A\u57CE\u5E02\u3001\u804C\u4F4D\u6216\u85AA\u8D44\u8303\u56F4\u65E0\u6548");
  if (!object(c) || c.version !== 1 || c.kind !== "daily-verified-jd-candidate" || !["candidate-source-verified-in-detail", "source-incomplete-skipped-in-detail"].includes(c.status) || c.actualDetailPageVerified !== true || c.independentCandidateIdentityVerified !== true || c.currentDetailSelected !== true || c.candidateJobCityVerified !== true || c.eligibleForActions !== false || c.dayTaskComplete !== false || c.siteDailyLimitConfirmed !== false || c.configurationRevision !== f.configurationRevision || c.configuredDay !== f.configuredDay || c.timeZone !== f.timeZone || JSON.stringify(c.configuredCities) !== JSON.stringify(q.cities) || c.actualCity !== c.jobCity || !q.cities.includes(c.jobCity) || typeof c.jobTitle !== "string" || !c.jobTitle.trim() || typeof c.jobSource !== "string") throw Error("\u672C\u9879\u8EAB\u4EFD\u3001\u5B9E\u9645\u57CE\u5E02\u3001\u914D\u7F6E\u7248\u672C\u6216\u8FD4\u56DE\u6765\u6E90\u4E0D\u4E00\u81F4\uFF0C\u505C\u6B62");
  const page = new URL(c.jobSource);
  if (page.protocol !== "https:" || page.hostname !== "www.zhipin.com" || page.port || page.username || page.password || page.search || page.hash || !/^\/job_detail\/[A-Za-z0-9_~-]+\.html$/.test(page.pathname)) throw Error("\u672C\u9879\u804C\u4F4D\u6765\u6E90\u5730\u5740\u65E0\u6548");
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: f.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(/* @__PURE__ */ new Date()), part = (k) => parts.find((p) => p.type === k)?.value;
  if (part("year") + "-" + part("month") + "-" + part("day") !== f.configuredDay) throw Error("\u5F53\u5929\u8303\u56F4\u5DF2\u53D8\u5316\uFF0C\u4E0D\u80FD\u7EE7\u7EED\u672C\u6279\u6761\u4EF6\u5224\u65AD");
  if (typeof c.sourceCollected !== "boolean" || c.sourceCollected !== (c.status === "candidate-source-verified-in-detail") || c.needsUserReview !== !c.sourceCollected || c.externalAppearanceVerified !== false || c.sourceCollected && (typeof c.description !== "string" || !c.description.trim() || createHash("sha256").update(c.description).digest("hex") !== c.descriptionHash)) throw Error("\u672C\u9879\u6B63\u6587\u6765\u6E90\u6216\u6458\u8981\u4E0D\u4E00\u81F4");
  const raw = typeof c.salaryRaw === "string" && c.salaryRaw.length <= 256 ? c.salaryRaw : null;
  const parse = (value) => {
    if (!value) return null;
    const text = value.trim().replace(/[–—~至]/g, "-");
    const m = /^(?:人民币|[￥¥])?\s*(?:(\d+(?:\.\d{1,3})?)\s*(K|k|千|万|元)?\s*-\s*)?(\d+(?:\.\d{1,3})?)\s*(K|k|千|万|元)(?:\s*\/\s*月)?(?:\s*[·•]\s*(\d{1,2})薪)?$/.exec(text);
    if (!m || m[4].toLowerCase() !== "k" && !/\/\s*月/.test(text)) return null;
    const factors = { K: 1e3, k: 1e3, \u5343: 1e3, \u4E07: 1e4, \u5143: 1 };
    const factor = factors[m[4]];
    if (m[2] && factors[m[2]] !== factor) return null;
    const min = Number(m[1] ?? m[3]) * factor, max = Number(m[3]) * factor, months = m[5] ? Number(m[5]) : null;
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || min <= 0 || min > max || max > 1e6 || months !== null && (months < 1 || months > 36)) return null;
    return { minimumYuan: min, maximumYuan: max, period: "month", annualSalaryMonths: months, basis: "\u72EC\u7ACB\u8BE6\u60C5\u5E38\u89C4\u6708\u85AA\u539F\u6587\uFF1B\u5E74\u53D1\u85AA\u6708\u6570\u4E0D\u644A\u5165\u6708\u85AA\uFF0C\u7A0E\u524D\u7A0E\u540E\u53CA\u63D0\u6210\u672A\u63A8\u65AD" };
  };
  const explicitShortTermTitle = /短期\s*[2-6二三四五六两](?:\s*[-–—~～至到]\s*[2-6二三四五六两])?\s*个?月/.exec(c.jobTitle);
  const salary = parse(raw), excluded = q.excludedRoles.includes(c.jobTitle) || !!explicitShortTermTitle, titleExact = q.targetRoles.includes(c.jobTitle);
  const salaryState = !salary ? "review" : q.salaryMin && salary.maximumYuan < q.salaryMin || q.salaryMax && salary.minimumYuan > q.salaryMax ? "mismatch" : "pass";
  const checks = [{ field: "\u5C97\u4F4D\u6807\u9898", state: excluded ? "mismatch" : "pass", reason: explicitShortTermTitle ? "\u672C\u4EBA\u5DF2\u660E\u786E\u6392\u96642\u20136\u4E2A\u6708\u77ED\u671F\u5DE5\u4F5C\uFF1B\u5C97\u4F4D\u6807\u9898\u539F\u6587\uFF1A" + explicitShortTermTitle[0] + "\uFF0C\u76F4\u63A5\u8DF3\u8FC7\uFF0C\u4E0D\u8FDB\u5165\u6A21\u578B\u8BC4\u4F30\u6216\u5916\u53D1" : excluded ? "\u5C97\u4F4D\u6807\u9898\u4E0E\u7528\u6237\u6392\u9664\u9879\u7CBE\u786E\u76F8\u540C" : titleExact ? "\u5C97\u4F4D\u6807\u9898\u4E0E\u76EE\u6807\u804C\u4F4D\u7CBE\u786E\u76F8\u540C" : "\u6807\u9898\u672A\u7CBE\u786E\u5339\u914D\u76EE\u6807\uFF1B\u522B\u540D\u3001\u76F8\u4F3C\u804C\u4F4D\u548C\u804C\u8D23\u987B\u540E\u7EEDSkill\u8BC4\u4F30\uFF0C\u4E0D\u76F4\u63A5\u5224\u4E0D\u7B26\u5408" }, { field: "\u6708\u85AA\u533A\u95F4", state: salaryState, reason: salaryState === "mismatch" ? "\u5C97\u4F4D\u6708\u85AA\u533A\u95F4\u4E0E\u7528\u6237\u8BBE\u7F6E\u5B8C\u5168\u5206\u79BB" : salaryState === "review" ? "\u85AA\u8D44\u539F\u6587\u7F3A\u5931\u3001\u4E71\u7801\u6216\u8868\u8FBE\u4E0D\u660E\uFF0C\u4E0D\u80FD\u731C\u91D1\u989D/\u6708\u85AA" : "\u5C97\u4F4D\u6708\u85AA\u4E0E\u7528\u6237\u8BBE\u7F6E\u6709\u4EA4\u96C6\u5373\u53EF\u7EE7\u7EED\uFF1B0\u4FA7\u672A\u8BBE\u7F6E\uFF0C\u989D\u5916\u51E0\u85AA\u5355\u72EC\u4FDD\u7559\uFF0C\u8C08\u85AA\u7531\u672C\u4EBA\u5904\u7406" }, { field: "\u516C\u53F8\u4E0EJD\u6765\u6E90", state: c.sourceCollected ? "pass" : "review", reason: c.sourceCollected ? "\u672C\u9879\u540C\u6B21\u6587\u5B57\u5019\u9009\u53CA\u8FD4\u56DE\u8EAB\u4EFD\u5DF2\u6838\u5BF9\uFF1B\u5916\u90E8\u8986\u76D6\u548C\u4E8B\u5B9E\u4ECD\u672A\u6838\u9A8C" : "\u539F\u6765\u6E90\u4E0D\u5B8C\u6574\uFF0C\u672C\u9879\u4E0D\u8FDB\u5165Skill\u8BC4\u4F30" }];
  if (c.jobTitle.includes("\uFF08base\u5730\uFF1A")) {
    const m = [...c.jobTitle.matchAll(/\uFF08base\u5730\uFF1A([^()\uFF08\uFF09]*)\uFF09/gu)];
    const cities = m.length === 1 ? m[0][1].split("/").map((v) => v.trim()) : [];
    if (!cities.length || cities.length > 20 || cities.some((v) => !/^[\u3400-\u9FFF]{1,20}$/u.test(v)) || new Set(cities).size !== cities.length || !cities.includes(c.jobCity)) checks.push({ field: "base\u5730", state: "review", reason: "\u6807\u9898base\u5730\u4E0E\u57CE\u5E02\u51B2\u7A81\u6216\u672A\u660E\uFF1A" + c.jobTitle + " / " + c.jobCity });
  }
  const mismatch = checks.some((v) => v.state === "mismatch"), review = !mismatch && checks.some((v) => v.state === "review");
  const result = { version: 1, kind: "daily-job-hard-conditions", status: mismatch ? "hard-condition-mismatch" : review ? "hard-conditions-needs-review" : "hard-conditions-ready-for-skill", jobTitle: c.jobTitle, jobSource: c.jobSource, actualCity: c.actualCity, jobCity: c.jobCity, configurationRevision: f.configurationRevision, configuredDay: f.configuredDay, position: c.position, salaryRaw: raw, salary, checks, decision: mismatch ? "\u8DF3\u8FC7\u672C\u9879" : review ? "\u901A\u77E5\u672C\u4EBA\uFF0C\u6682\u4E0D\u6295\u9012" : "\u7EE7\u7EED\u56FA\u5B9ASkill\u8BC4\u4F30", readyForSkillAssessment: !mismatch && !review, skipped: mismatch || review, needsUserReview: review, descriptionHash: c.descriptionHash ?? null, accountVerified: false, eligibleForActions: false, applied: false, dayTaskComplete: false, siteDailyLimitConfirmed: false, note: "\u4EC5\u5C97\u4F4D\u786C\u6761\u4EF6\u5206\u6D41\uFF1B\u6CA1\u6709\u4E0D\u611F\u5174\u8DA3\u3001\u6295\u9012\u3001\u6D88\u606F\u6216\u9644\u4EF6\u52A8\u4F5C\u3002\u901A\u8FC7\u4ECD\u987B\u56FA\u5B9ASkill\u3001\u5F53\u524D\u8D26\u53F7\u4E0E\u5C97\u4F4D\u590D\u9A8C\u3001\u6301\u4E45\u53BB\u91CD/\u989D\u5EA6\u3001\u64CD\u4F5C\u51C6\u5907\u53CA\u5B9E\u9645\u56DE\u6267\u3002\u672C\u9879\u7ED3\u679C\u4E0D\u662F\u6574\u6279\u6216\u5168\u5929\u7EDF\u8BA1\u3002" };
  signal.throwIfAborted();
  await Promise.resolve(result);
  if (review) {
    const key = "daily-hard-conditions:" + createHash("sha256").update(JSON.stringify({ source: c.jobSource, revision: f.configurationRevision, day: f.configuredDay, checks, raw })).digest("hex");
    await template.attention({ key, title: "\u5C97\u4F4D\u6761\u4EF6\u5F85\u6838\u5BF9\uFF1A" + c.jobTitle, detail: { jobTitle: c.jobTitle, jobSource: c.jobSource, actualCity: c.actualCity, salaryRaw: raw, checks, decision: result.decision, eligibleForActions: false } });
  }
  signal.throwIfAborted();
  return result;
};
export {
  stdin_default as default
};
