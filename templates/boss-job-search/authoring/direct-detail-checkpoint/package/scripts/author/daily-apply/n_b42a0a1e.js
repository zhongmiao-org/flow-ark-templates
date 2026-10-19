import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const object = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  const fail = async (message) => {
    const key = "daily-return-list:" + createHash("sha256").update(JSON.stringify({ revision: input?.candidate?.configurationRevision, day: input?.candidate?.configuredDay, position: input?.candidate?.position, message })).digest("hex");
    await template.result({ version: 1, kind: "daily-list-return-check", status: "stopped-needs-review", message, jobTitle: input?.candidate?.jobTitle ?? null, jobSource: input?.candidate?.jobSource ?? null, expectedCity: input?.candidate?.actualCity ?? null, actualCity: typeof input?.city === "string" ? input.city.trim() : null, expectedCardCount: input?.candidate?.expectedCardCount ?? null, actualCardCount: input?.count ?? null, listWaited: input?.waited === true, eligibleForActions: false, dayTaskComplete: false, siteDailyLimitConfirmed: false });
    await template.attention({ key, title: "\u8FD4\u56DE\u5217\u8868\u540E\u57CE\u5E02\u6216\u5C97\u4F4D\u6765\u6E90\u53D8\u5316\uFF0C\u5FAA\u73AF\u5DF2\u505C\u6B62", detail: { message, eligibleForActions: false, dayTaskComplete: false } });
    signal.throwIfAborted();
    throw Error(message);
  };
  if (!object(input) || Object.keys(input).sort().join(",") !== "candidate,city,count,returned,source,waited") return fail("\u7F3A\u5C11\u672C\u9879\u5019\u9009\u3001\u8FD4\u56DE\u56DE\u6267\u3001\u7B49\u5F85\u3001\u5B9E\u9645\u57CE\u5E02\u3001\u6570\u91CF\u6216\u540C\u6B21\u6765\u6E90");
  const { candidate: c, returned, waited, city, count, source: s } = input;
  const review = c?.status === "source-incomplete-needs-review";
  if (!object(c) || c.version !== 1 || c.kind !== "daily-fullpage-jd-candidate" || !["same-candidate-jd-source", "source-incomplete-needs-review"].includes(c.status) || c.sourceCollected !== !review || c.externalAppearanceVerified !== false || c.accountVerified !== false || c.eligibleForActions !== false || c.dayTaskComplete !== false || !Number.isSafeInteger(c.position) || c.position < 1 || c.position > 150 || !Number.isSafeInteger(c.expectedCardCount) || c.expectedCardCount < c.position || c.expectedCardCount > 500 || !Array.isArray(c.configuredCities) || !c.configuredCities.includes(c.actualCity) || c.jobCity !== c.actualCity || (review ? c.description !== null || c.descriptionHash !== null || !Array.isArray(c.reviewReasons) || !c.reviewReasons.length : typeof c.description !== "string" || !c.description.trim() || createHash("sha256").update(c.description).digest("hex") !== c.descriptionHash)) return fail("\u672C\u9879JD\u6765\u6E90\u6216\u56FA\u5B9A\u8303\u56F4\u65E0\u6548");
  if (waited !== true) return fail("\u8FD4\u56DE\u540E\u7684\u5019\u9009\u5217\u8868\u5C1A\u672A\u5C31\u7EEA");
  if (typeof city !== "string" || city.trim() !== c.actualCity) return fail("\u8FD4\u56DE\u540E\u7684\u5B9E\u9645\u57CE\u5E02\u4E0E\u672C\u6B21\u914D\u7F6E\u4E0D\u4E00\u81F4");
  if (count !== c.expectedCardCount) return fail("\u8FD4\u56DE\u540E\u7684\u5019\u9009\u6570\u91CF\u4E0E\u672C\u6B21\u56FA\u5B9A\u8303\u56F4\u4E0D\u4E00\u81F4");
  if (!object(returned) || Object.keys(returned).sort().join(",") !== "title,url") return fail("\u8FD4\u56DE\u5BFC\u822A\u7F3A\u5C11\u51C6\u786E\u56DE\u6267");
  if (!object(s) || s.version !== 3 || s.operation !== "collect" || s.renderPolicy !== "bounded-rendered-text-v2" || s.selector !== "html" || s.complete !== true || !Array.isArray(s.framePath) || s.framePath.length || !Array.isArray(s.fields) || s.fields.length !== 2) return fail("\u8FD4\u56DE\u5217\u8868\u7684\u540C\u6B21\u5019\u9009\u590D\u8BFB\u4E0D\u5B8C\u6574");
  const selector = "div:nth-of-type(" + c.position + ") > div:nth-of-type(1) > li:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > a:nth-of-type(1)", values = {};
  for (const [key, operation, attribute] of [["jobTitle", "text", null], ["jobLink", "attribute", "href"]]) {
    const found = s.fields.filter((f2) => object(f2) && f2.key === key), f = found[0];
    if (found.length !== 1 || f.selector !== selector || f.operation !== operation || f.attribute !== attribute || f.required !== true || f.count !== 1 || f.status !== "ok" || f.ignoredAncestorSpaces !== 0 || !Array.isArray(f.issues) || f.issues.length || typeof f.value !== "string" || !f.value.trim()) return fail("\u8FD4\u56DE\u540E\u7684\u5B57\u6BB5\u8303\u56F4\u3001\u552F\u4E00\u6027\u6216\u6765\u6E90\u4E0D\u7B26\uFF1A" + key);
    values[key] = f.value.trim();
  }
  try {
    const safe = (u) => u.protocol === "https:" && u.hostname === "www.zhipin.com" && !u.port && !u.username && !u.password;
    const expected = new URL(c.returnUrl), page = new URL(s.url), doc = new URL(s.documentUrl), navigation = new URL(returned.url), job = new URL(values.jobLink, page);
    if (![expected, page, doc, navigation, job].every(safe) || expected.pathname !== "/web/geek/jobs" || expected.hash || page.href !== expected.href || doc.href !== expected.href || navigation.href !== expected.href || job.origin + job.pathname !== c.jobSource || values.jobTitle !== c.jobTitle) throw Error("\u8FD4\u56DE\u5730\u5740\u3001\u7B5B\u9009\u6765\u6E90\u6216\u672C\u9879\u5C97\u4F4D\u8EAB\u4EFD\u5DF2\u53D8\u5316");
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: c.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(/* @__PURE__ */ new Date()), part = (k) => parts.find((p) => p.type === k)?.value;
    if (part("year") + "-" + part("month") + "-" + part("day") !== c.configuredDay) throw Error("\u8DE8\u5929\u540E\u5FC5\u987B\u91CD\u65B0\u51C6\u5907\u672C\u6B21\u6279\u6B21");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "\u8FD4\u56DE\u6765\u6E90\u65E0\u6CD5\u6838\u5BF9");
  }
  signal.throwIfAborted();
  const result = { ...c, kind: "daily-verified-jd-candidate", status: review ? "source-incomplete-skipped-after-return" : "candidate-source-and-return-verified", skipped: review, listReturned: true, returnCityVerified: true, returnCandidateIdentityVerified: true, accountVerified: false, eligibleForActions: false, dayTaskComplete: false, siteDailyLimitConfirmed: false, note: "\u5DF2\u590D\u9A8C\u8FD4\u56DE\u5730\u5740\u3001\u5B9E\u57CE\u3001\u5019\u9009\u6570\u91CF\u53CA\u672C\u9879\u6807\u9898\u548C\u8BE6\u60C5\u8DEF\u5F84\uFF1B\u5C1A\u672A\u6267\u884C\u7528\u6237\u6761\u4EF6\u8BC4\u4F30\u3001\u53BB\u91CD\u3001\u6295\u9012\u6216\u56DE\u6267\u6838\u5BF9\u3002\u672C\u9879\u7ED3\u679C\u4E0D\u4EE3\u8868\u6574\u6279\u6216\u5F53\u5929\u5B8C\u6210\u3002" };
  await template.result(result);
  signal.throwIfAborted();
  return result;
};
export {
  stdin_default as default
};
