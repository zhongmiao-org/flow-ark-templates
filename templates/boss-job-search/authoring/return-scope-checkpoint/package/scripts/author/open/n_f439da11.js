var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  const source = input?.catalog, candidate = source?.candidate;
  const object = (value) => !!value && typeof value === "object" && !Array.isArray(value);
  const text = (value) => typeof value === "string" && value.trim().length > 0 && value.length <= 2e3;
  if (!object(input) || Object.keys(input).sort().join(",") !== "catalog,cityName,groupName" || !object(source) || source.version !== 1 || source.kind !== "city-catalog-match" || source.ready !== true || source.status !== "ready-to-select" || source.cityVerified !== false || source.eligibleForApplications !== false || !object(candidate)) {
    throw new Error("\u7F3A\u5C11\u672C\u6B21\u5B8C\u6574\u76EE\u5F55\u6838\u5BF9\u53CA\u5019\u9009\u57CE\u5E02\uFF0C\u505C\u6B62\u9009\u62E9\u3002");
  }
  if (!text(source.configurationContext) || !Number.isSafeInteger(source.configurationRevision) || source.configurationRevision < 0 || !Number.isSafeInteger(source.cityPosition) || source.cityPosition < 1 || source.cityPosition > 20 || !text(source.expectedCity)) throw new Error("\u672C\u6B21\u914D\u7F6E\u6765\u6E90\u6216\u57CE\u5E02\u5E8F\u53F7\u65E0\u6548\uFF0C\u505C\u6B62\u9009\u62E9\u3002");
  if (!text(candidate.groupName) || !text(candidate.city) || !text(candidate.groupSelector) || !text(candidate.citySelector) || candidate.city !== source.expectedCity || !Number.isSafeInteger(candidate.groupPosition) || candidate.groupPosition < 1 || candidate.groupPosition > source.groupCount) throw new Error("\u76EE\u5F55\u5019\u9009\u4E0E\u672C\u6B21\u76EE\u6807\u4E0D\u4E00\u81F4\uFF0C\u505C\u6B62\u9009\u62E9\u3002");
  if (typeof input.groupName !== "string" || typeof input.cityName !== "string" || /[\r\n\t]/.test(input.groupName) || /[\r\n\t]/.test(input.cityName)) throw new Error("\u5206\u7EC4\u6216\u57CE\u5E02\u56DE\u8BFB\u4E0D\u662F\u5B8C\u6574\u5355\u9879\u6587\u5B57\uFF0C\u505C\u6B62\u9009\u62E9\u3002");
  const groupName = input.groupName.trim(), cityName = input.cityName.trim();
  if (groupName !== candidate.groupName || cityName !== source.expectedCity || cityName !== candidate.city) throw new Error("\u7F51\u9875\u5206\u7EC4\u6216\u57CE\u5E02\u6761\u76EE\u5DF2\u53D8\u5316\uFF0C\u505C\u6B62\u9009\u62E9\u5E76\u8BF7\u672C\u4EBA\u6838\u5BF9\u3002");
  signal.throwIfAborted();
  return {
    version: 1,
    kind: "city-selection-precheck",
    ready: true,
    configurationContext: source.configurationContext,
    configurationRevision: source.configurationRevision,
    expectedCity: source.expectedCity,
    cityPosition: source.cityPosition,
    groupName,
    cityName,
    groupSelector: candidate.groupSelector,
    citySelector: candidate.citySelector,
    groupCount: source.groupCount,
    cityOptionCount: source.cityOptionCount,
    matchingOccurrenceCount: source.matchingOccurrenceCount,
    candidateReadVerified: true,
    cityVerified: false,
    eligibleForApplications: false,
    note: "\u672C\u6B21\u5019\u9009\u4E0E\u7F51\u9875\u56DE\u8BFB\u76F8\u7B26\uFF1B\u70B9\u51FB\u540E\u4ECD\u987B\u8BFB\u53D6\u5B9E\u9645\u9009\u4E2D\u57CE\u5E02\u3002"
  };
};
export {
  stdin_default as default
};
