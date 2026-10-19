var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  if (!input || Object.keys(input).sort().join(",") !== "cardCount,configuration") throw Error("\u7F3A\u5C11\u672C\u6B21\u914D\u7F6E\u4E0E\u5019\u9009\u5361\u7247\u6570\u91CF");
  const c = input.configuration, count = input.cardCount;
  if (!c || c.version !== 1 || c.kind !== "daily-apply-configuration" || c.readyForLoop !== true || !Number.isSafeInteger(c.configurationRevision) || c.configurationRevision < 0 || c.eligibleForActions !== false || c.dayTaskComplete !== false) throw Error("\u672C\u6B21\u6C42\u804C\u914D\u7F6E\u5C1A\u672A\u6838\u5BF9");
  if (!Number.isSafeInteger(count) || count < 0 || count > 500 || !Number.isSafeInteger(c.batchSize) || c.batchSize < 1 || c.batchSize > 150) throw Error("\u5B9E\u9645\u5019\u9009\u6570\u6216\u6709\u9650\u6279\u6B21\u8303\u56F4\u65E0\u6548");
  if (!Array.isArray(c.conditions?.cities) || c.conditions.cities.length < 1 || c.conditions.cities.some((v) => typeof v !== "string" || !v.trim())) throw Error("\u671F\u671B\u57CE\u5E02\u7F3A\u5931\uFF0C\u505C\u6B62\u5019\u9009\u8BFB\u53D6");
  const size = Math.min(count, c.batchSize);
  const items = Array.from({ length: size }, (_, i) => {
    const position = i + 1;
    const cardSelector = "div:nth-of-type(" + position + ") > div:nth-of-type(1) > li:nth-of-type(1)";
    const linkSelector = cardSelector + " > div:nth-of-type(1) > div:nth-of-type(1) > a:nth-of-type(1)";
    return { version: 1, kind: "job-card-position", position, cardSelector, linkSelector };
  });
  return { version: 1, kind: "daily-candidate-range", configurationRevision: c.configurationRevision, configuredDay: c.configuredDay, timeZone: c.timeZone, configuredCities: [...c.conditions.cities], cardCount: count, batchSize: c.batchSize, items, status: size ? "candidate-range-only" : "no-candidates", candidateIdentityVerified: false, descriptionComplete: false, accountVerified: false, eligibleForActions: false, dayTaskComplete: false, siteDailyLimitConfirmed: false, note: "\u4EC5\u679A\u4E3E\u5F53\u524DDOM\u5185\u5B9E\u9645\u5361\u7247\uFF1B\u4F4D\u7F6E\u4E0D\u662F\u804C\u4F4D\u8EAB\u4EFD\u6216\u6301\u4E45\u53BB\u91CD\u952E\u3002\u6BCF\u9879\u4ECD\u987B\u8BFB\u53D6\u5B89\u5168\u8BE6\u60C5\u6765\u6E90\u5E76\u590D\u9A8C\uFF0C\u7F3A\u5931\u6216\u53D8\u5316\u505C\u6B62\uFF1B\u672A\u8BFB\u53D6\u5B8C\u6574JD\u3001\u672A\u6295\u9012\u3002" };
};
export {
  stdin_default as default
};
