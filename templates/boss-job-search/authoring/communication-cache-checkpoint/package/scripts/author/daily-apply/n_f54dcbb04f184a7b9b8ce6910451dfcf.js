var stdin_default = async ({ input, template, signal }) => {
  signal.throwIfAborted();
  if (!input || typeof input !== "object" || Array.isArray(input) || input.version !== 1 || input.kind !== "city-catalog-match" || input.ready !== false || input.status !== "needs-review" || input.candidate !== null || input.matchingOccurrenceCount !== 0 || input.cityVerified !== false || input.eligibleForApplications !== false) throw new Error("\u672A\u5339\u914D\u57CE\u5E02\u7684\u76EE\u5F55\u6838\u5BF9\u7ED3\u679C\u4E0D\u4E00\u81F4\uFF0C\u505C\u6B62\u5904\u7406\u3002");
  if (typeof input.expectedCity !== "string" || !input.expectedCity.trim() || input.expectedCity.length > 100 || !Number.isSafeInteger(input.configurationRevision) || input.configurationRevision < 0 || !Number.isSafeInteger(input.cityPosition) || input.cityPosition < 1 || input.cityPosition > 20) throw new Error("\u672A\u5339\u914D\u57CE\u5E02\u7684\u914D\u7F6E\u6765\u6E90\u65E0\u6548\uFF0C\u505C\u6B62\u5904\u7406\u3002");
  const result = {
    version: 1,
    status: "city-selection-needs-review",
    expectedCity: input.expectedCity,
    actualCity: null,
    configurationRevision: input.configurationRevision,
    cityPosition: input.cityPosition,
    groupCount: input.groupCount,
    cityOptionCount: input.cityOptionCount,
    matchingOccurrenceCount: 0,
    cityVerified: false,
    accountVerified: false,
    eligibleForApplications: false,
    dayTaskComplete: false,
    siteDailyLimitConfirmed: false,
    checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
    note: "\u7F51\u7AD9\u5B8C\u6574\u76EE\u5F55\u672A\u627E\u5230\u914D\u7F6E\u57CE\u5E02\uFF0C\u672C\u6B21\u6CA1\u6709\u6267\u884C\u57CE\u5E02\u9009\u62E9\uFF1B\u8BF7\u672C\u4EBA\u6838\u5BF9\uFF0C\u4E0D\u4F7F\u7528\u9ED8\u8BA4\u57CE\u5E02\u6216\u76F8\u4F3C\u540D\u79F0\u3002"
  };
  await template.attention({
    key: "city-not-found:" + input.configurationRevision + ":" + input.cityPosition,
    title: "\u6C42\u804C\u57CE\u5E02\u9700\u8981\u672C\u4EBA\u6838\u5BF9",
    detail: result
  });
  await Promise.resolve(result);
  signal.throwIfAborted();
  return result;
};
export {
  stdin_default as default
};
