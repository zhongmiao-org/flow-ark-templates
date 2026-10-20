import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  const fixed = input?.configuration;
  if (fixed?.version !== 1 || fixed.operation !== "configuration" || !Number.isSafeInteger(fixed.revision) || fixed.revision < 0) throw Error("\u7F3A\u5C11\u672C\u6B21\u56FA\u5B9A\u6C42\u804C\u914D\u7F6E\u4E0E\u4FEE\u8BA2");
  const c = fixed.value;
  if (!c || Object.keys(c).sort().join(",") !== "cities,excludedRoles,replyDailyLimit,replyTimeZone,salaryMax,salaryMin,targetRoles") throw Error("\u6C42\u804C\u6761\u4EF6\u7ED3\u6784\u65E0\u6548");
  if (!Number.isSafeInteger(c.replyDailyLimit) || c.replyDailyLimit < 0 || c.replyDailyLimit > 100 || typeof c.replyTimeZone !== "string" || !c.replyTimeZone.trim() || c.replyTimeZone.length > 100) throw Error("\u56DE\u590D\u989D\u5EA6\u914D\u7F6E\u7ED3\u6784\u65E0\u6548");
  const norm = (s) => s.normalize("NFKC").trim().toLocaleLowerCase("en-US");
  const issues = [];
  for (const k of ["targetRoles", "excludedRoles", "cities"]) {
    if (!Array.isArray(c[k]) || c[k].length > 20 || c[k].some((v) => typeof v !== "string" || v.length > 100)) throw Error("\u6761\u4EF6\u5217\u8868\u7ED3\u6784\u65E0\u6548");
    const values = c[k].map(norm);
    if (values.some((v) => !v) || new Set(values).size !== values.length) issues.push("\u6761\u4EF6\u5B58\u5728\u7A7A\u767D\u6216\u91CD\u590D\u9879\uFF1A" + k);
  }
  if (!c.targetRoles.length) issues.push("\u5C1A\u672A\u660E\u786E\u76EE\u6807\u804C\u4F4D");
  if (c.targetRoles.some((v) => c.excludedRoles.map(norm).includes(norm(v)))) issues.push("\u76EE\u6807\u4E0E\u6392\u9664\u65B9\u5411\u51B2\u7A81");
  for (const k of ["salaryMin", "salaryMax"]) if (!Number.isSafeInteger(c[k]) || c[k] < 0 || c[k] > 1e6) throw Error("\u85AA\u8D44\u6761\u4EF6\u7ED3\u6784\u65E0\u6548");
  if (c.salaryMax > 0 && c.salaryMin > c.salaryMax) issues.push("\u6708\u85AA\u4E0A\u9650\u4F4E\u4E8E\u4E0B\u9650");
  const title = input.jobTitle, description = input.jobDescription, label = input.sourceLabel ?? "";
  if (typeof title !== "string" || title.length > 200 || typeof description !== "string" || description.length > 2e4 || typeof label !== "string" || label.length > 500 || typeof input.descriptionComplete !== "boolean") throw Error("JD\u8F93\u5165\u7ED3\u6784\u65E0\u6548");
  if (!title.trim() || !description.trim()) issues.push("\u5C97\u4F4D\u540D\u79F0\u6216JD\u6B63\u6587\u7F3A\u5931");
  if (!input.descriptionComplete) issues.push("\u5C1A\u672A\u58F0\u660EJD\u6B63\u6587\u5B8C\u6574");
  const sha = (v) => createHash("sha256").update(JSON.stringify(v)).digest("hex");
  const source = { kind: "explicit-input", title, descriptionSha256: sha(description), sourceLabel: label, completeDeclared: input.descriptionComplete, configurationRevision: fixed.revision };
  const result = { version: 1, kind: "job-assessment-advice", decision: "review", nextAction: "ask-user", reason: issues.join("\uFF1B"), issues, source, accountVerified: false, eligibleForActions: false, checkedAt: (/* @__PURE__ */ new Date()).toISOString() };
  signal.throwIfAborted();
  return { ready: issues.length === 0, job: { title, description, completeDeclared: input.descriptionComplete, sourceLabel: label }, configuration: c, source, reviewRecord: { reviewKey: "jd-input:" + sha({ source, issues }), result } };
};
export {
  stdin_default as default
};
