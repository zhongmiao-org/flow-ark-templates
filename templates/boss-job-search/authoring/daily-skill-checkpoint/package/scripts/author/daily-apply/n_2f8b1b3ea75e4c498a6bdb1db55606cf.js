import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v), text = (v, n) => typeof v === "string" && v.trim().length > 0 && v.length <= n;
  const hash = (v) => createHash("sha256").update(v).digest("hex");
  const p = input?.prepared, o = input?.outcome, r = input?.profileRef, s = p?.source;
  if (!obj(input) || Object.keys(input).sort().join(",") !== "outcome,prepared,profileRef" || p?.ready !== true || !obj(p.job) || !text(p.job.description, 2e4) || !obj(p.configuration) || !Array.isArray(p.configuration.targetRoles) || !obj(r) || !text(r.key, 200) || !text(r.versionId, 200) || !/^[a-f0-9]{64}$/.test(r.sha256)) throw Error("\u7F3A\u5C11\u672C\u6B21\u5019\u9009\u3001\u56FA\u5B9A\u6761\u4EF6\u6216\u56FA\u5B9ASkill\u5F15\u7528");
  if (!obj(s) || s.kind !== "daily-bounded-selection-candidate" || s.completeDeclared !== false || s.externalAppearanceVerified !== false || p.job.completeDeclared !== false || p.job.externalAppearanceVerified !== false || hash(p.job.description) !== s.descriptionSha256 || p.job.sourceLabel !== s.jobSource || p.job.title !== s.title || p.job.city !== s.actualCity || p.job.company !== s.company || !p.configuration.cities.includes(s.actualCity) || !Number.isSafeInteger(s.configurationRevision) || s.configurationRevision < 0 || !Number.isSafeInteger(s.ledgerStateRevision) || s.ledgerStateRevision < 0 || !text(s.contextId, 200) || !/^[a-f0-9]{64}$/.test(s.applicationKey) || !/^[a-f0-9]{64}$/.test(s.accountSourceSha256)) throw Error("\u6A21\u578B\u8FD4\u56DE\u65F6\u672C\u6B21\u5C97\u4F4D\u6765\u6E90\u6216\u56FA\u5B9A\u7ED1\u5B9A\u65E0\u6548");
  const day = new Intl.DateTimeFormat("sv-SE", { timeZone: s.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(/* @__PURE__ */ new Date());
  const issues = [];
  if (day !== s.day) issues.push("\u6A21\u578B\u8FD4\u56DE\u540E\u5DF2\u8DE8\u5929\uFF0C\u987B\u91CD\u65B0\u6838\u5BF9\u5F53\u5929\u914D\u7F6E\u3001\u57CE\u5E02\u4E0E\u8D26\u672C");
  const source = { ...s, profile: { key: r.key, versionId: r.versionId, sha256: r.sha256 } };
  let failure = null, raw = null;
  if (o?.status === "failed") {
    const codes = ["authentication", "rate-limit", "http", "network", "request-timeout", "refused", "incomplete", "invalid-response"];
    if (!obj(o) || Object.keys(o).sort().join(",") !== "error,model,provider,requestId,status,usage" || !obj(o.error) || Object.keys(o.error).sort().join(",") !== "code,httpStatus,message" || !codes.includes(o.error.code) || !text(o.error.message, 200) || !(o.error.httpStatus === null || Number.isSafeInteger(o.error.httpStatus) && o.error.httpStatus >= 100 && o.error.httpStatus <= 599) || !["deepseek", "openai-codex"].includes(o.provider) || !text(o.model, 512) || !(o.requestId === null || typeof o.requestId === "string" && o.requestId.length <= 512)) throw Error("AI\u6545\u969C\u72B6\u6001\u65E0\u6548\uFF0C\u672A\u91C7\u7EB3\u5EFA\u8BAE");
    const counts = ["prompt_tokens", "completion_tokens", "total_tokens", "input_tokens", "output_tokens", "prompt_cache_hit_tokens", "prompt_cache_miss_tokens"];
    const details = ["prompt_tokens_details", "completion_tokens_details", "input_tokens_details", "output_tokens_details"];
    const detailCounts = ["cached_tokens", "reasoning_tokens", "audio_tokens", "accepted_prediction_tokens", "rejected_prediction_tokens"];
    const count = (n) => Number.isSafeInteger(n) && n >= 0;
    if (o.usage !== null && (!obj(o.usage) || Object.entries(o.usage).some(([k, v]) => counts.includes(k) ? !count(v) : !details.includes(k) || !obj(v) || Object.entries(v).some(([dk, dv]) => !detailCounts.includes(dk) || !count(dv))))) throw Error("AI\u7528\u91CF\u5143\u6570\u636E\u65E0\u6548");
    failure = { stage: "daily-jd-assessment", status: "failed", provider: o.provider, model: o.model, requestId: o.requestId, usage: o.usage, error: { ...o.error } };
    issues.push("AI\u8BF7\u6C42\u5931\u8D25\uFF0C\u5C1A\u672A\u5F62\u6210\u804C\u4F4D\u5EFA\u8BAE\uFF0C\u4E0D\u81EA\u52A8\u91CD\u8BD5");
  } else {
    if (o?.status !== "success" || !obj(o.result) || !Object.hasOwn(o.result, "output")) throw Error("\u7F3A\u5C11\u6210\u529FAI\u7ED3\u679C\uFF0C\u4E0D\u91C7\u7EB3\u8BC4\u4F30");
    raw = o.result.output;
    if (!obj(raw) || Object.keys(raw).sort().join(",") !== "conflicts,decision,quotes,reason,targetRole,unknowns" || !["match", "mismatch", "review"].includes(raw.decision) || !text(raw.reason, 800) || typeof raw.targetRole !== "string" || raw.targetRole.length > 100 || !Array.isArray(raw.quotes) || !Array.isArray(raw.unknowns) || !Array.isArray(raw.conflicts)) throw Error("\u6A21\u578B\u8BC4\u4F30\u7ED3\u6784\u65E0\u6548");
    if (!p.configuration.targetRoles.includes(raw.targetRole)) issues.push("\u6A21\u578B\u76EE\u6807\u804C\u4F4D\u4E0D\u5728\u672C\u6B21\u660E\u786E\u914D\u7F6E\u4E2D");
    if (raw.quotes.length > 3 || raw.quotes.some((q) => !text(q, 500) || q.trim().length < 2 || !p.job.description.includes(q))) issues.push("\u6A21\u578B\u5F15\u7528\u4E0D\u5728\u672C\u6B21JD\u539F\u6587\u4E2D\u6216\u8D85\u51FA\u8303\u56F4");
    if (raw.decision !== "review" && !raw.quotes.length) issues.push("\u660E\u786E\u7ED3\u8BBA\u7F3A\u5C11\u672C\u6B21JD\u539F\u53E5\u4F9D\u636E");
    for (const k of ["unknowns", "conflicts"]) {
      if (raw[k].length > 10 || raw[k].some((v) => !text(v, 500))) throw Error("\u672A\u77E5\u6216\u51B2\u7A81\u5B57\u6BB5\u65E0\u6548");
      if (raw[k].length) issues.push(k === "unknowns" ? "\u5B58\u5728\u5C1A\u672A\u89E3\u51B3\u7684\u672A\u77E5\u6761\u4EF6" : "\u5B58\u5728\u5C1A\u672A\u89E3\u51B3\u7684\u51B2\u7A81");
    }
  }
  const decision = issues.length ? "review" : raw.decision;
  const result = { version: 1, kind: "job-assessment-advice", decision, nextAction: decision === "match" ? "prepare-application" : decision === "mismatch" ? "skip-candidate" : "ask-user", reason: failure ? "\u804C\u4F4D\u8BC4\u4F30\u8BF7\u6C42\u5931\u8D25\uFF0C\u4EA4\u672C\u4EBA\u6838\u5BF9\uFF1A" + failure.error.message : raw.reason, issues, recommendation: raw, failure, source, accountVerified: false, eligibleForActions: false, applied: false, dayTaskComplete: false, siteDailyLimitConfirmed: false, checkedAt: (/* @__PURE__ */ new Date()).toISOString(), note: "\u5F53\u524D\u4EC5\u5019\u9009\u804C\u8D23\u5EFA\u8BAE\uFF1B\u539F\u53E5\u5B58\u5728\u4E0D\u8BC1\u660E\u8BED\u4E49\u6B63\u786E\u3002\u672A\u4EBA\u5DE5\u6838\u9A8C\u5B8C\u6574\u5916\u89C2\uFF0C\u672A\u9884\u7559\u6216\u6295\u9012\u3002\u540E\u7EED\u987B\u590D\u9A8C\u6700\u65B0\u8D26\u53F7\u3001\u7F51\u9875\u57CE\u5E02\u4E0E\u5C97\u4F4D\u3001\u8D44\u6599\u3001Skill\u7248\u672C\u53CA\u8D26\u672C\uFF0C\u518D\u5355\u72EC\u5904\u7406\u52A8\u4F5C\u4E0E\u5B9E\u9645\u56DE\u6267\u3002" };
  signal.throwIfAborted();
  return { reviewKey: "daily-jd-advice:" + hash(JSON.stringify({ source, decision, issues })), result };
};
export {
  stdin_default as default
};
