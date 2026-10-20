var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  if (!input || Object.keys(input).sort().join(",") !== "batchSize,configuration,dailyApplyLimit") throw Error("\u6BCF\u65E5\u6295\u9012\u8F93\u5165\u6765\u6E90\u4E0D\u5B8C\u6574");
  const fixed = input.configuration;
  if (!fixed || fixed.version !== 1 || fixed.operation !== "configuration" || !Number.isSafeInteger(fixed.revision) || fixed.revision < 0 || !fixed.value || typeof fixed.value !== "object" || Array.isArray(fixed.value)) throw Error("\u7F3A\u5C11\u672C\u6B21\u56FA\u5B9A\u7528\u6237\u914D\u7F6E\u4E0E\u4FEE\u8BA2");
  const limit = input.dailyApplyLimit, batchSize = input.batchSize;
  if (!Number.isSafeInteger(limit) || limit < 0 || limit > 150 || !Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 150) throw Error("\u672C\u5165\u53E3\u6BCF\u65E5\u989D\u5EA6\u987B\u4E3A0\u81F3150\u3001\u5355\u6279\u6B21\u6570\u987B\u4E3A1\u81F3150\u7684\u6574\u6570");
  const c = fixed.value, issues = [], conditions = {};
  const norm = (v) => v.normalize("NFKC").trim().toLocaleLowerCase("en-US");
  for (const key of ["targetRoles", "cities", "excludedRoles"]) {
    const a = c[key];
    if (!Array.isArray(a) || a.length > 20 || a.some((v) => typeof v !== "string" || !v.trim() || v.length > 100)) throw Error("\u6C42\u804C\u6761\u4EF6\u5217\u8868\u7ED3\u6784\u65E0\u6548\uFF1A" + key);
    conditions[key] = [...a];
    if (new Set(a.map(norm)).size !== a.length) issues.push({ field: key, reason: "\u5B58\u5728\u91CD\u590D\u6761\u4EF6\uFF0C\u8BF7\u672C\u4EBA\u6838\u5BF9" });
  }
  if (!conditions.targetRoles.length) issues.push({ field: "targetRoles", reason: "\u8BF7\u914D\u7F6E\u76EE\u6807\u804C\u4F4D" });
  if (!conditions.cities.length) issues.push({ field: "cities", reason: "\u8BF7\u914D\u7F6E\u671F\u671B\u57CE\u5E02\uFF0C\u4E0D\u6CBF\u7528\u7F51\u5740\u3001\u5B9A\u4F4D\u6216\u5386\u53F2\u57CE\u5E02" });
  const excluded = new Set(conditions.excludedRoles.map(norm));
  if (conditions.targetRoles.some((v) => excluded.has(norm(v)))) issues.push({ field: "excludedRoles", reason: "\u76EE\u6807\u4E0E\u6392\u9664\u65B9\u5411\u51B2\u7A81" });
  for (const key of ["salaryMin", "salaryMax"]) {
    if (!Number.isSafeInteger(c[key]) || c[key] < 0 || c[key] > 1e6) throw Error("\u6708\u85AA\u6761\u4EF6\u65E0\u6548\uFF1A" + key);
    conditions[key] = c[key];
  }
  if (c.salaryMax > 0 && c.salaryMin > c.salaryMax) issues.push({ field: "salaryMax", reason: "\u85AA\u8D44\u4E0A\u4E0B\u9650\u51B2\u7A81" });
  const timeZone = c.replyTimeZone;
  let configuredDay = null;
  try {
    if (typeof timeZone !== "string" || !timeZone.trim() || timeZone.length > 100) throw Error("\u65F6\u533A\u672A\u914D\u7F6E");
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(/* @__PURE__ */ new Date());
    const part = (name) => parts.find((v) => v.type === name).value;
    configuredDay = part("year") + "-" + part("month") + "-" + part("day");
  } catch {
    issues.push({ field: "replyTimeZone", reason: "\u8BF7\u914D\u7F6E\u6709\u6548\u7684\u6BCF\u65E5\u989D\u5EA6\u65F6\u533A" });
  }
  if (limit === 0) issues.push({ field: "dailyApplyLimit", reason: "\u7528\u6237\u672A\u5F00\u653E\u6BCF\u65E5\u6295\u9012\u989D\u5EA6" });
  signal.throwIfAborted();
  return {
    version: 1,
    kind: "daily-apply-configuration",
    configurationRevision: fixed.revision,
    conditions,
    dailyTarget: 150,
    userDailyLimit: limit,
    batchSize,
    timeZone: typeof timeZone === "string" ? timeZone : null,
    configuredDay,
    readyForLoop: issues.length === 0,
    loopItems: issues.length ? [] : Array.from({ length: batchSize }, (_, index) => index),
    issues,
    status: issues.length ? "needs-configuration" : "conditions-ready",
    completionEvidenceRequired: "boss-site-daily-limit-dialog",
    dayTaskComplete: false,
    accountVerified: false,
    eligibleForActions: false,
    note: "\u4EC5\u56FA\u5B9A\u7528\u6237\u6761\u4EF6\u548C\u672C\u5165\u53E3\u6709\u9650\u6279\u6B21\u8303\u56F4\uFF1B\u9010\u6B21\u6309\u914D\u7F6E\u5207\u57CE\uFF0C\u8BFB\u53D6\u5E76\u590D\u6838\u7F51\u9875\u5B9E\u9645\u57CE\u5E02\u4E0E\u5C97\u4F4D\u5730\u70B9\u540E\u624D\u53EF\u7EE7\u7EED\u3002\u4ECD\u987B\u8D26\u53F7\u3001\u7F51\u7AD9\u5F53\u5929\u8303\u56F4\u3001\u6301\u4E45\u8FDB\u5EA6\u3001\u7AD9\u70B9\u5B9A\u4F4D\u53CA\u9010\u6B21\u52A8\u4F5C\u6838\u5BF9\u3002\u6210\u529F\u6570\u3001\u8DF3\u8FC7\u548C\u672A\u77E5\u5206\u5F00\uFF1B\u672C\u5730\u989D\u5EA6\u548C\u6279\u6B21\u7ED3\u675F\u4E0D\u4EE3\u8868\u7F51\u7AD9\u5F53\u65E5\u5B8C\u6210\u3002"
  };
};
export {
  stdin_default as default
};
