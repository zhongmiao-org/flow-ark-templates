import { createHash } from "node:crypto";
const failureOf = (outcome, stage) => {
  const codes = ["authentication", "rate-limit", "http", "network", "request-timeout", "refused", "incomplete", "invalid-response"];
  if (!outcome || outcome.status !== "failed" || Object.keys(outcome).sort().join(",") !== "error,model,provider,requestId,status,usage" || !codes.includes(outcome.error?.code) || typeof outcome.error.message !== "string" || !outcome.error.message || outcome.error.message.length > 200 || !["deepseek", "openai-codex"].includes(outcome.provider) || typeof outcome.model !== "string" || !outcome.model || outcome.model.length > 512 || !(outcome.requestId === null || typeof outcome.requestId === "string" && outcome.requestId.length <= 512)) throw Error("\u7F3A\u5C11\u6709\u6548\u7684\u4E0A\u4E00\u6B65AI\u8BF7\u6C42\u6545\u969C\uFF0C\u4E0D\u91C7\u7528\u5EFA\u8BAE");
  const error = outcome.error;
  if (Object.keys(error).sort().join(",") !== "code,httpStatus,message" || !(error.httpStatus === null || Number.isSafeInteger(error.httpStatus) && error.httpStatus >= 100 && error.httpStatus <= 599)) throw Error("AI\u8BF7\u6C42\u6545\u969C\u72B6\u6001\u65E0\u6548");
  const usage = outcome.usage;
  const counts = ["prompt_tokens", "completion_tokens", "total_tokens", "input_tokens", "output_tokens", "prompt_cache_hit_tokens", "prompt_cache_miss_tokens"];
  const details = ["prompt_tokens_details", "completion_tokens_details", "input_tokens_details", "output_tokens_details"];
  const detailCounts = ["cached_tokens", "reasoning_tokens", "audio_tokens", "accepted_prediction_tokens", "rejected_prediction_tokens"];
  const count = (n) => Number.isSafeInteger(n) && n >= 0;
  if (usage !== null && (!usage || Array.isArray(usage) || typeof usage !== "object" || Object.entries(usage).some(([k, v]) => counts.includes(k) ? !count(v) : !details.includes(k) || !v || Array.isArray(v) || typeof v !== "object" || Object.entries(v).some(([dk, dv]) => !detailCounts.includes(dk) || !count(dv))))) throw Error("AI\u7528\u91CF\u5143\u6570\u636E\u65E0\u6548");
  return { stage, status: "failed", provider: outcome.provider, model: outcome.model, requestId: outcome.requestId, usage, error: { code: error.code, message: error.message, httpStatus: error.httpStatus } };
};
var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  const prepared = input?.prepared, outcome = input?.outcome, ref = input?.profileRef;
  if (prepared?.ready !== true || typeof prepared.job?.description !== "string" || !Array.isArray(prepared.configuration?.targetRoles) || !ref || typeof ref.key !== "string" || typeof ref.versionId !== "string" || !/^[a-f0-9]{64}$/.test(ref.sha256)) throw Error("\u7F3A\u5C11\u672C\u6B21JD\u3001\u6C42\u804C\u914D\u7F6E\u6216\u56FA\u5B9ASkill\u6765\u6E90");
  if (outcome?.status === "failed") {
    const failure = failureOf(outcome, "jd-assessment");
    const source2 = { ...prepared.source, profile: { key: ref.key, versionId: ref.versionId, sha256: ref.sha256 } };
    const result2 = { version: 1, kind: "job-assessment-advice", decision: "review", nextAction: "ask-user", draft: "", reason: "JD\u65B9\u5411\u8BC4\u4F30\u8BF7\u6C42\u5931\u8D25\uFF0C\u4EA4\u672C\u4EBA\u6838\u5BF9\uFF1A" + failure.error.message, issues: ["AI\u8BF7\u6C42\u5931\u8D25\uFF0C\u5C1A\u672A\u5F62\u6210\u5C97\u4F4D\u5EFA\u8BAE"], recommendation: null, failure, source: source2, accountVerified: false, eligibleForActions: false, checkedAt: (/* @__PURE__ */ new Date()).toISOString(), note: "\u672A\u5F62\u6210\u7B26\u5408\u6216\u4E0D\u7B26\u5408\u7ED3\u8BBA\uFF1B\u4E0D\u7EE7\u7EED\u6765\u4FE1\u6A21\u578B\u6216\u6267\u884C\u62DB\u8058\u52A8\u4F5C\uFF0C\u4E0D\u81EA\u52A8\u91CD\u8BD5\u3002" };
    signal.throwIfAborted();
    return { reviewKey: "jd-ai-failure:" + createHash("sha256").update(JSON.stringify(source2)).digest("hex"), result: result2 };
  }
  if (outcome?.status !== "success" || !outcome.result || !Object.hasOwn(outcome.result, "output")) throw Error("\u7F3A\u5C11\u6210\u529FAI\u7ED3\u679C\uFF0C\u4E0D\u91C7\u7528\u8BC4\u4F30");
  const raw = outcome.result.output;
  if (!raw || !["match", "mismatch", "review"].includes(raw.decision) || typeof raw.reason !== "string" || !raw.reason.trim() || raw.reason.length > 800 || typeof raw.targetRole !== "string" || !Array.isArray(raw.quotes) || !Array.isArray(raw.unknowns) || !Array.isArray(raw.conflicts)) throw Error("\u6A21\u578B\u8BC4\u4F30\u7ED3\u6784\u65E0\u6548\uFF0C\u672A\u91C7\u7528\u7ED3\u679C");
  const issues = [];
  const norm = (s) => s.normalize("NFKC").trim().toLocaleLowerCase("en-US");
  if (!prepared.configuration.targetRoles.some((v) => norm(v) === norm(raw.targetRole))) issues.push("\u6A21\u578B\u5F15\u7528\u7684\u76EE\u6807\u804C\u4F4D\u4E0D\u5728\u672C\u6B21\u660E\u786E\u914D\u7F6E\u4E2D");
  if (raw.quotes.length > 3 || raw.quotes.some((q) => typeof q !== "string" || q.trim().length < 2 || q.length > 500 || !prepared.job.description.includes(q))) issues.push("\u6A21\u578B\u539F\u53E5\u4E0D\u5728\u672C\u6B21JD\u6B63\u6587\u4E2D\u6216\u8D85\u8FC7\u8303\u56F4");
  if (raw.decision !== "review" && raw.quotes.length === 0) issues.push("\u660E\u786E\u7ED3\u8BBA\u7F3A\u5C11JD\u539F\u53E5\u4F9D\u636E");
  for (const k of ["unknowns", "conflicts"]) {
    if (raw[k].length > 10 || raw[k].some((v) => typeof v !== "string" || !v.trim() || v.length > 500)) throw Error("\u6A21\u578B\u672A\u77E5\u6216\u51B2\u7A81\u7ED3\u6784\u65E0\u6548\uFF0C\u672A\u91C7\u7528\u7ED3\u679C");
    if (raw[k].length) issues.push(k === "unknowns" ? "\u5B58\u5728\u5C1A\u672A\u89E3\u51B3\u7684\u672A\u77E5\u6761\u4EF6" : "\u5B58\u5728\u5C1A\u672A\u89E3\u51B3\u7684\u51B2\u7A81");
  }
  const decision = issues.length ? "review" : raw.decision;
  const source = { ...prepared.source, profile: { key: ref.key, versionId: ref.versionId, sha256: ref.sha256 } };
  const result = { version: 1, kind: "job-assessment-advice", decision, nextAction: decision === "match" ? "draft-only" : decision === "mismatch" ? "not-interested-proposal" : "ask-user", reason: raw.reason, issues, recommendation: raw, source, accountVerified: false, eligibleForActions: false, checkedAt: (/* @__PURE__ */ new Date()).toISOString(), note: "\u539F\u53E5\u548C\u89C4\u5219\u5F15\u7528\u6709\u6548\u4E0D\u8BC1\u660E\u8BED\u4E49\u5224\u65AD\u6B63\u786E\uFF1B\u672A\u6838\u9A8C\u771F\u5B9E\u8D26\u53F7/\u4F1A\u8BDD\uFF0C\u4E0D\u6388\u6743\u4EFB\u4F55\u5916\u53D1\u3002" };
  const reviewKey = "jd-advice:" + createHash("sha256").update(JSON.stringify(source)).digest("hex");
  signal.throwIfAborted();
  return { reviewKey, result };
};
export {
  stdin_default as default
};
