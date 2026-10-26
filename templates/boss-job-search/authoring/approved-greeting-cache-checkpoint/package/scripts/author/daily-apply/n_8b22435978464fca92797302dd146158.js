var stdin_default = async ({ input, template, signal }) => {
  signal.throwIfAborted();
  const source = input?.precheck, receipt = input?.clickReceipt;
  const object = (value) => !!value && typeof value === "object" && !Array.isArray(value);
  if (!object(input) || Object.keys(input).sort().join(",") !== "actualCity,clickReceipt,precheck" || !object(source) || source.version !== 1 || source.kind !== "city-selection-precheck" || source.ready !== true || source.candidateReadVerified !== true || source.cityVerified !== false || source.eligibleForApplications !== false) throw new Error("\u7F3A\u5C11\u672C\u6B21\u57CE\u5E02\u9009\u62E9\u524D\u7684\u5B8C\u6574\u6838\u5BF9\uFF0C\u4E0D\u80FD\u767B\u8BB0\u9009\u57CE\u6210\u529F\u3002");
  if (!object(receipt) || Object.keys(receipt).sort().join(",") !== "clicked,verified" || receipt.clicked !== true || receipt.verified !== false) throw new Error("\u57CE\u5E02\u70B9\u51FB\u56DE\u6267\u7F3A\u5931\u6216\u7ED3\u679C\u672A\u77E5\uFF0C\u8BF7\u672C\u4EBA\u6838\u5BF9\uFF1B\u4E0D\u4F1A\u518D\u6B21\u70B9\u51FB\u3002");
  if (typeof input.actualCity !== "string" || !input.actualCity.trim() || input.actualCity.length > 100 || /[\r\n\t]/.test(input.actualCity)) throw new Error("\u65E0\u6CD5\u5B8C\u6574\u8BFB\u53D6\u7F51\u9875\u5B9E\u9645\u57CE\u5E02\uFF0C\u4E0D\u80FD\u767B\u8BB0\u9009\u57CE\u6210\u529F\u3002");
  const actualCity = input.actualCity.trim();
  if (actualCity !== source.expectedCity || actualCity !== source.cityName) throw new Error("\u7F51\u9875\u5B9E\u9645\u57CE\u5E02\u4E0E\u672C\u6B21\u914D\u7F6E\u4E0D\u4E00\u81F4\uFF0C\u505C\u6B62\u540E\u7EED\u6D41\u7A0B\uFF1A\u671F\u671B " + source.expectedCity + "\uFF0C\u5B9E\u9645 " + actualCity);
  if (!Number.isSafeInteger(source.configurationRevision) || source.configurationRevision < 0 || !Number.isSafeInteger(source.cityPosition) || source.cityPosition < 1 || source.cityPosition > 20) throw new Error("\u672C\u6B21\u914D\u7F6E\u4FEE\u8BA2\u6216\u57CE\u5E02\u5E8F\u53F7\u65E0\u6548\uFF0C\u4E0D\u80FD\u767B\u8BB0\u9009\u57CE\u6210\u529F\u3002");
  const result = {
    version: 1,
    status: "city-selected-and-verified",
    expectedCity: source.expectedCity,
    actualCity,
    configurationRevision: source.configurationRevision,
    cityPosition: source.cityPosition,
    sourceGroup: source.groupName,
    groupCount: source.groupCount,
    cityOptionCount: source.cityOptionCount,
    matchingOccurrenceCount: source.matchingOccurrenceCount,
    candidateReadVerified: true,
    cityVerified: true,
    accountVerified: false,
    eligibleForApplications: false,
    dayTaskComplete: false,
    siteDailyLimitConfirmed: false,
    checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
    note: "\u5DF2\u6309\u672C\u6B21\u56FA\u5B9A\u914D\u7F6E\u9009\u57CE\u5E76\u56DE\u8BFB\u6838\u5BF9\uFF1B\u5C97\u4F4D\u3001\u8D26\u53F7\u3001\u7B80\u5386\u4E0E\u6295\u9012\u7ED3\u679C\u4ECD\u987B\u7EE7\u7EED\u68C0\u67E5\u3002"
  };
  await Promise.resolve(result);
  signal.throwIfAborted();
  return result;
};
export {
  stdin_default as default
};
