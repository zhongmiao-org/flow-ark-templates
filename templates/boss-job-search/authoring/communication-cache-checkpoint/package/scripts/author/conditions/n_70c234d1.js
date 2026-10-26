var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  if (!input || input.version !== 1 || input.operation !== "configuration" || !Number.isSafeInteger(input.revision) || input.revision < 0 || !input.value || typeof input.value !== "object" || Array.isArray(input.value))
    throw new Error("\u7F3A\u5C11\u672C\u6B21\u56FA\u5B9A\u914D\u7F6E\u53CA\u4FEE\u8BA2\uFF0C\u8BF7\u5148\u4F7F\u7528\u8BFB\u53D6\u672C\u6B21\u914D\u7F6E\u6B65\u9AA4");
  const c = input.value;
  if (!["cities", "excludedRoles", "replyDailyLimit", "replyTimeZone", "salaryMax", "salaryMin", "targetRoles"].every((k) => Object.hasOwn(c, k)) || Object.keys(c).some((k) => !["cities", "excludedRoles", "replyDailyLimit", "replyTimeZone", "salaryMax", "salaryMin", "targetRoles", "knownContactedJobs", "knownContactAccountAlias", "knownContactPhoneMask", "knownGreetingDate", "knownGreetingsUsed"].includes(k))) throw new Error("\u6C42\u804C\u6761\u4EF6\u5B57\u6BB5\u7ED3\u6784\u4E0D\u5339\u914D");
  if (!Number.isSafeInteger(c.replyDailyLimit) || c.replyDailyLimit < 0 || c.replyDailyLimit > 100 || typeof c.replyTimeZone !== "string" || !c.replyTimeZone.trim() || c.replyTimeZone.length > 100) throw Error("\u56DE\u590D\u989D\u5EA6\u914D\u7F6E\u7ED3\u6784\u65E0\u6548");
  const issues = [];
  const normalize = (v) => v.normalize("NFKC").trim().toLocaleLowerCase("en-US");
  for (const key of ["targetRoles", "cities", "excludedRoles"]) {
    if (!Array.isArray(c[key]) || c[key].length > 20 || c[key].some((v) => typeof v !== "string" || v.length < 1 || v.length > 100))
      throw new Error("\u6C42\u804C\u6761\u4EF6\u6587\u672C\u5217\u8868\u7ED3\u6784\u65E0\u6548\uFF1A" + key);
    const normalized = c[key].map(normalize);
    if (normalized.some((v) => !v)) issues.push({ field: key, reason: "\u6761\u76EE\u4E0D\u80FD\u4EC5\u542B\u7A7A\u767D" });
    if (new Set(normalized).size !== normalized.length) issues.push({ field: key, reason: "\u540C\u4E00\u5217\u8868\u5B58\u5728\u91CD\u590D\u6761\u76EE\uFF0C\u8BF7\u672C\u4EBA\u6838\u5BF9" });
  }
  if (!c.targetRoles.length) issues.push({ field: "targetRoles", reason: "\u8BF7\u81F3\u5C11\u586B\u5199\u4E00\u4E2A\u76EE\u6807\u804C\u4F4D" });
  const excluded = new Set(c.excludedRoles.map(normalize));
  if (c.targetRoles.some((v) => normalize(v) && excluded.has(normalize(v)))) issues.push({ field: "excludedRoles", reason: "\u76EE\u6807\u804C\u4F4D\u4E0E\u6392\u9664\u65B9\u5411\u5B58\u5728\u5B8C\u5168\u76F8\u540C\u6761\u76EE\uFF0C\u8BF7\u672C\u4EBA\u6838\u5BF9" });
  for (const key of ["salaryMin", "salaryMax"]) if (!Number.isSafeInteger(c[key]) || c[key] < 0 || c[key] > 1e6) throw new Error("\u6708\u85AA\u8303\u56F4\u987B\u4E3A0\u81F31000000\u6574\u6570");
  if (c.salaryMax > 0 && c.salaryMin > c.salaryMax) issues.push({ field: "salaryMax", reason: "\u5DF2\u8BBE\u7F6E\u7684\u6708\u85AA\u4E0A\u9650\u5C0F\u4E8E\u4E0B\u9650" });
  signal.throwIfAborted();
  return { version: 1, ready: issues.length === 0, status: issues.length ? "needs-review" : "ready", configurationRevision: input.revision, issues, summary: { targetRoleCount: c.targetRoles.length, cityCount: c.cities.length, excludedRoleCount: c.excludedRoles.length, salaryMin: c.salaryMin, salaryMax: c.salaryMax, salaryUnit: "CNY/month;0=unset" }, accountVerified: false, eligibleForActions: false, checkedAt: (/* @__PURE__ */ new Date()).toISOString(), note: "\u4EC5\u6838\u5BF9\u672C\u6B21\u914D\u7F6E\u7684\u4E00\u81F4\u6027\uFF0C\u4E0D\u4EE3\u8868\u8D26\u53F7\u3001\u5B8C\u6574JD\u3001\u804C\u4F4D\u5339\u914D\u3001Skill\u6216\u4EFB\u4F55\u5916\u53D1\u6388\u6743\u901A\u8FC7\u3002" };
};
export {
  stdin_default as default
};
