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
  const prepared = input?.prepared, job = input?.jobAdvice, profile = input?.profile, outcome = input?.outcome;
  if (prepared?.ready !== true || job?.decision !== "match" || typeof prepared.incomingMessage !== "string" || typeof profile?.markdown !== "string" || !profile.ref || typeof profile.ref.key !== "string" || typeof profile.ref.versionId !== "string" || !/^[a-f0-9]{64}$/.test(profile.ref.sha256)) throw Error("\u7F3A\u5C11\u672C\u6B21\u5B8C\u6574\u6765\u4FE1\u3001\u660E\u786E\u5339\u914DJD\u6216\u56FA\u5B9ASkill");
  if (job.source?.profile?.sha256 !== profile.ref.sha256 || job.source.profile.versionId !== profile.ref.versionId || job.source.profile.key !== profile.ref.key) throw Error("JD\u5EFA\u8BAE\u4E0E\u672C\u6B21\u56FA\u5B9ASkill\u6765\u6E90\u4E0D\u4E00\u81F4");
  if (outcome?.status === "failed") {
    const failure = failureOf(outcome, "message-draft");
    const source2 = { ...job.source, profile: { key: profile.ref.key, versionId: profile.ref.versionId, sha256: profile.ref.sha256 } };
    if (source2.messageSha256 !== createHash("sha256").update(JSON.stringify(prepared.incomingMessage)).digest("hex") || source2.messageCompleteDeclared !== true || source2.manualTakeoverDeclared !== false) throw Error("\u672C\u6B21\u6765\u4FE1\u6458\u8981\u6216\u63A5\u7BA1\u58F0\u660E\u4E0EJD\u6765\u6E90\u4E0D\u4E00\u81F4");
    const result2 = { version: 1, kind: "message-draft-advice", intent: "review", nextAction: "ask-user", draft: "", reason: "\u6765\u4FE1\u5206\u7C7B\u4E0E\u8349\u7A3F\u8BF7\u6C42\u5931\u8D25\uFF0C\u4EA4\u672C\u4EBA\u6838\u5BF9\uFF1A" + failure.error.message, issues: ["AI\u8BF7\u6C42\u5931\u8D25\uFF0C\u6CA1\u6709\u53EF\u91C7\u7528\u8349\u7A3F"], factQuotes: [], recommendation: null, failure, source: source2, accountVerified: false, eligibleForActions: false, checkedAt: (/* @__PURE__ */ new Date()).toISOString(), note: "\u672A\u53D1\u9001\u6D88\u606F\u6216\u9644\u4EF6\uFF0C\u4E0D\u6267\u884C\u62DB\u8058\u52A8\u4F5C\uFF0C\u4E0D\u81EA\u52A8\u91CD\u8BD5\u6216\u66F4\u6362\u670D\u52A1\u3002" };
    signal.throwIfAborted();
    return { needsHuman: true, reviewKey: "message-ai-failure:" + createHash("sha256").update(JSON.stringify(source2)).digest("hex"), result: result2 };
  }
  if (outcome?.status !== "success" || !outcome.result || !Object.hasOwn(outcome.result, "output")) throw Error("\u7F3A\u5C11\u6210\u529FAI\u7ED3\u679C\uFF0C\u4E0D\u91C7\u7528\u8349\u7A3F");
  const raw = outcome.result.output;
  if (!raw || !["greeting", "introduction", "resume-fact", "technical", "resume-request", "interview", "identity", "commitment", "review"].includes(raw.intent) || typeof raw.draft !== "string" || raw.draft.length > 300 || typeof raw.reason !== "string" || !raw.reason.trim() || raw.reason.length > 800) throw Error("\u6A21\u578B\u6765\u4FE1\u5EFA\u8BAE\u7ED3\u6784\u65E0\u6548\uFF0C\u672A\u91C7\u7528");
  const issues = [];
  for (const k of ["facts", "unknowns", "conflicts"]) if (!Array.isArray(raw[k]) || raw[k].length > (k === "facts" ? 5 : 10) || raw[k].some((v) => typeof v !== "string" || v.trim().length < (k === "facts" ? 2 : 1) || v.length > 500)) throw Error("\u6A21\u578B\u5F15\u7528\u6216\u7F3A\u53E3\u7ED3\u6784\u65E0\u6548\uFF0C\u672A\u91C7\u7528");
  if (raw.facts.some((q) => !profile.markdown.includes(q))) issues.push("\u4E8B\u5B9E\u539F\u53E5\u4E0D\u5728\u672C\u6B21\u56FA\u5B9ASKILL.md\u6B63\u6587\u4E2D");
  if (["introduction", "resume-fact", "technical"].includes(raw.intent) && !raw.facts.length) issues.push("\u8349\u7A3F\u7F3A\u5C11\u56FA\u5B9ASkill\u4E8B\u5B9E\u539F\u53E5");
  if (raw.unknowns.length) issues.push("\u5B58\u5728\u5C1A\u672A\u89E3\u51B3\u7684\u672A\u77E5");
  if (raw.conflicts.length) issues.push("\u5B58\u5728\u5C1A\u672A\u89E3\u51B3\u7684\u51B2\u7A81");
  const reserved = ["resume-request", "interview", "identity", "commitment", "review"].includes(raw.intent);
  if (reserved) issues.push("\u8BE5\u7C7B\u6765\u4FE1\u987B\u672C\u4EBA\u5904\u7406\u6216\u72EC\u7ACB\u6838\u5BF9\u9644\u4EF6");
  if (/(面试题|笔试|测评|课后作业|是不是.{0,6}(?:AI|人工智能|机器人)|你是.{0,4}(?:AI|人工智能))/iu.test(prepared.incomingMessage)) issues.push("\u6765\u4FE1\u5305\u542B\u6B63\u5F0F\u8003\u6838\u6216\u8EAB\u4EFD\u8D28\u7591\u7EBF\u7D22\uFF0C\u4EA4\u672C\u4EBA\u6838\u5BF9");
  if (!raw.draft.trim() && !reserved) issues.push("\u666E\u901A\u56DE\u590D\u8349\u7A3F\u4E3A\u7A7A");
  const needsHuman = issues.length > 0;
  const source = { ...job.source, profile: { key: profile.ref.key, versionId: profile.ref.versionId, sha256: profile.ref.sha256 } };
  if (source.messageSha256 !== createHash("sha256").update(JSON.stringify(prepared.incomingMessage)).digest("hex") || source.messageCompleteDeclared !== true || source.manualTakeoverDeclared !== false) throw Error("\u672C\u6B21\u6765\u4FE1\u6458\u8981\u6216\u63A5\u7BA1\u58F0\u660E\u4E0EJD\u6765\u6E90\u4E0D\u4E00\u81F4");
  const result = { version: 1, kind: "message-draft-advice", intent: raw.intent, nextAction: needsHuman ? raw.intent === "resume-request" ? "resume-proposal" : "ask-user" : "review-draft", draft: needsHuman ? "" : raw.draft, reason: raw.reason, issues, factQuotes: raw.facts, recommendation: raw, source, accountVerified: false, eligibleForActions: false, checkedAt: (/* @__PURE__ */ new Date()).toISOString(), note: "\u4EC5\u5185\u90E8\u8349\u7A3F\u6216\u672C\u4EBA\u5EFA\u8BAE\uFF1B\u539F\u53E5\u5B58\u5728\u4E0D\u8BC1\u660E\u5168\u90E8\u8BED\u4E49\u6B63\u786E\uFF0C\u4E0D\u662F\u9644\u4EF6/\u6D88\u606F\u9001\u8FBE\u3001\u4F1A\u8BDD\u63A5\u7BA1\u6216\u53D1\u9001\u6388\u6743\u3002" };
  const reviewKey = "message-advice:" + createHash("sha256").update(JSON.stringify(source)).digest("hex");
  signal.throwIfAborted();
  return { needsHuman, reviewKey, result };
};
export {
  stdin_default as default
};
