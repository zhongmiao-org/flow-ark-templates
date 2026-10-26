import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const object = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  const fail = async (message) => {
    const key = "daily-return-list:" + createHash("sha256").update(JSON.stringify({ revision: input?.candidate?.configurationRevision, day: input?.candidate?.configuredDay, position: input?.candidate?.position, message })).digest("hex");
    await Promise.resolve({ version: 1, kind: "daily-list-return-check", status: "stopped-needs-review", message, jobTitle: input?.candidate?.jobTitle ?? null, jobSource: input?.candidate?.jobSource ?? null, expectedCity: input?.candidate?.actualCity ?? null, actualCity: typeof input?.city === "string" ? input.city.trim() : null, expectedCardCount: input?.candidate?.expectedCardCount ?? null, actualCardCount: input?.count ?? null, listWaited: input?.waited === true, eligibleForActions: false, dayTaskComplete: false, siteDailyLimitConfirmed: false });
    await template.attention({ key, title: "\u8FD4\u56DE\u5217\u8868\u8303\u56F4\u53D8\u5316\uFF0C\u5FAA\u73AF\u5DF2\u505C\u6B62", detail: { message, eligibleForActions: false, dayTaskComplete: false } });
    signal.throwIfAborted();
    throw Error(message);
  };
  if (!object(input) || Object.keys(input).join(",") !== "candidate") return fail("\u7F3A\u5C11\u672C\u6B21\u72EC\u7ACB\u5C97\u4F4D\u6765\u6E90");
  const c = input.candidate;
  const review = c?.status === "source-incomplete-needs-review";
  if (!object(c) || c.version !== 1 || c.kind !== "daily-fullpage-jd-candidate" || !["same-candidate-jd-source", "source-incomplete-needs-review"].includes(c.status) || c.sourceCollected !== !review || c.currentDetailSelected !== true || c.candidateJobCityVerified !== true || c.externalAppearanceVerified !== false || c.accountVerified !== false || c.eligibleForActions !== false || c.dayTaskComplete !== false || !Number.isSafeInteger(c.position) || c.position < 1 || c.position > 150 || c.sourceMode !== "persisted-full-job-link" || c.processingPersisted !== true || !/^[a-f0-9]{64}$/.test(c.queueKey) || !/^[a-f0-9]{64}$/.test(c.accountSourceSha256) || typeof c.processingContextId !== "string" || !Number.isSafeInteger(c.processingStateRevision) || c.processingStateRevision < 1 || !Array.isArray(c.configuredCities) || !c.configuredCities.includes(c.actualCity) || c.jobCity !== c.actualCity || typeof c.jobTitle !== "string" || !c.jobTitle.trim() || (review ? c.description !== null || c.descriptionHash !== null || !Array.isArray(c.reviewReasons) || !c.reviewReasons.length : typeof c.description !== "string" || !c.description.trim() || createHash("sha256").update(c.description).digest("hex") !== c.descriptionHash)) return fail("\u672C\u9879\u72EC\u7ACBJD\u8EAB\u4EFD\u3001\u57CE\u5E02\u6216\u56FA\u5B9A\u6765\u6E90\u65E0\u6548");
  const call = async (operation, selector) => {
    signal.throwIfAborted();
    const r = await template.browser("browser", { operation, ...selector ? { selector } : {}, timeoutMs: 3e3 });
    signal.throwIfAborted();
    return r;
  };
  const citySelector = "div:nth-of-type(1) > p:nth-of-type(1) > a:nth-of-type(1)";
  if (await call("url") !== c.jobSource || await call("count", "h1") !== 1 || await call("count", citySelector) !== 1) return fail("\u5F53\u524D\u8BE6\u60C5\u5730\u5740\u3001\u6807\u9898\u6216\u57CE\u5E02\u5165\u53E3\u5DF2\u53D8\u5316");
  const title = await call("read", "h1"), city = await call("read", citySelector);
  if (typeof title !== "string" || title.replace(/\s+/gu, " ").trim() !== c.jobTitle || typeof city !== "string" || city.trim() !== c.actualCity || await call("url") !== c.jobSource) return fail("\u5F53\u524D\u8BE6\u60C5\u8EAB\u4EFD\u3001\u5B9E\u9645\u57CE\u5E02\u6216\u9875\u9762\u8FDE\u7EED\u6027\u4E0D\u4E00\u81F4");
  const day = new Intl.DateTimeFormat("sv-SE", { timeZone: c.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(/* @__PURE__ */ new Date());
  if (day !== c.configuredDay) return fail("\u5C97\u4F4D\u6838\u5BF9\u671F\u95F4\u8DE8\u5929\uFF0C\u505C\u6B62\u672C\u6279");
  const result = { ...c, kind: "daily-verified-jd-candidate", status: review ? "source-incomplete-skipped-in-detail" : "candidate-source-verified-in-detail", skipped: review, listReturned: false, returnCityVerified: false, returnListScopeVerified: false, independentCandidateIdentityVerified: true, currentDetailSelected: true, actualDetailPageVerified: true, detailPageRetained: true, accountVerified: false, eligibleForActions: false, dayTaskComplete: false, siteDailyLimitConfirmed: false, note: "\u7EE7\u7EED\u4FDD\u7559\u540C\u4E00\u72EC\u7ACB\u8BE6\u60C5\u9875\uFF1B\u5DF2\u6838\u5BF9\u5B8C\u6574\u5C97\u4F4D\u94FE\u63A5\u3001\u6807\u9898\u3001\u5B9E\u9645\u57CE\u5E02\u548C\u65E5\u671F\uFF0C\u4E0D\u5C06\u672A\u53D1\u751F\u7684\u5217\u8868\u8FD4\u56DE\u6807\u8BB0\u4E3A\u6210\u529F\u3002\u53D1\u9001\u524D\u4ECD\u91CD\u65B0\u91C7\u96C6\u672C\u9879\u8BE6\u60C5\u3002" };
  await Promise.resolve(result);
  signal.throwIfAborted();
  return result;
};
export {
  stdin_default as default
};
