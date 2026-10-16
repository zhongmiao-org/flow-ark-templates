import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  const prepared = input?.prepared, raw = input?.advice, ref = input?.profileRef;
  if (prepared?.ready !== true || typeof prepared.job?.description !== "string" || !Array.isArray(prepared.configuration?.targetRoles) || !ref || typeof ref.key !== "string" || typeof ref.versionId !== "string" || !/^[a-f0-9]{64}$/.test(ref.sha256)) throw Error("\u7F3A\u5C11\u672C\u6B21JD\u3001\u6C42\u804C\u914D\u7F6E\u6216\u56FA\u5B9ASkill\u6765\u6E90");
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
