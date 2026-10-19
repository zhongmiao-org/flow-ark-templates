var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  const config = input?.configuration, groups = input?.catalog;
  const object = (value) => !!value && typeof value === "object" && !Array.isArray(value);
  const one = (values, predicate, message) => {
    const found = values.filter(predicate);
    if (found.length !== 1) throw new Error(message);
    return found[0];
  };
  const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
  if (!object(config) || config.version !== 1 || config.kind !== "configured-city" || config.ready !== true || config.cityVerified !== false || config.eligibleForApplications !== false || !integer(config.configurationRevision, 0, Number.MAX_SAFE_INTEGER) || typeof config.expectedCity !== "string" || !config.expectedCity.trim()) throw new Error("\u7F3A\u5C11\u672C\u6B21\u56FA\u5B9A\u57CE\u5E02\u914D\u7F6E\u6821\u9A8C\u7ED3\u679C\u3002");
  if (!Array.isArray(groups) || !integer(groups.length, 1, 20)) throw new Error("\u57CE\u5E02\u5206\u7EC4\u679A\u4E3E\u7ED3\u679C\u4E0D\u5B8C\u6574\u3002");
  const base = "div:nth-of-type(2) > div:nth-of-type(2) > div";
  const catalog = [], groupNames = /* @__PURE__ */ new Set();
  let totalSections = 0;
  for (let g = 0; g < groups.length; g++) {
    signal.throwIfAborted();
    if (!object(groups[g])) throw new Error("\u57CE\u5E02\u5206\u7EC4\u7ED3\u679C\u7ED3\u6784\u65E0\u6548\u3002");
    const values = Object.values(groups[g]);
    if (values.length !== 5) throw new Error("\u57CE\u5E02\u5206\u7EC4\u6B65\u9AA4\u8F93\u51FA\u4E0D\u5B8C\u6574\uFF0C\u8BF7\u6838\u5BF9\u5F53\u524D\u7F16\u6392\u3002");
    const label = one(values, (v) => typeof v === "string", "\u57CE\u5E02\u5206\u7EC4\u540D\u79F0\u7F3A\u5931\u6216\u4E0D\u552F\u4E00\u3002").trim();
    if (!label || label.length > 30 || /[\r\n\t]/.test(label) || groupNames.has(label)) throw new Error("\u57CE\u5E02\u5206\u7EC4\u540D\u79F0\u4E3A\u7A7A\u3001\u91CD\u590D\u6216\u5F02\u5E38\u3002");
    groupNames.add(label);
    one(values, (v) => object(v) && v.clicked === true && v.verified === false, "\u57CE\u5E02\u5206\u7EC4\u70B9\u51FB\u56DE\u6267\u7F3A\u5931\u3002");
    const size = one(values, (v) => integer(v, 1, 40), "\u57CE\u5E02\u5206\u6BB5\u6570\u91CF\u65E0\u6548\u3002");
    const positions = one(values, (v) => Array.isArray(v) && v.length === size && v.every((x) => object(x) && x.kind === "city-section-position"), "\u57CE\u5E02\u5206\u6BB5\u7D22\u5F15\u4E0D\u5B8C\u6574\u3002");
    const sections = one(values, (v) => Array.isArray(v) && v.length === size && v.every((x) => object(x) && !("kind" in x)), "\u57CE\u5E02\u5206\u6BB5\u8BFB\u53D6\u7ED3\u679C\u4E0D\u5B8C\u6574\u3002");
    totalSections += size;
    const seenCities = /* @__PURE__ */ new Set();
    for (let s = 0; s < size; s++) {
      const expectedSection = base + " > ul:nth-of-type(2) > li:nth-of-type(" + (s + 1) + ")";
      const source = positions[s];
      if (source.version !== 1 || source.sectionPosition !== s + 1 || source.sectionSelector !== expectedSection || source.linkSelector !== expectedSection + " > div > a") throw new Error("\u57CE\u5E02\u5206\u6BB5\u4F4D\u7F6E\u6216\u5B9A\u4F4D\u4E0D\u4E00\u81F4\u3002");
      const parts = Object.values(sections[s]);
      if (parts.length !== 3) throw new Error("\u57CE\u5E02\u6BB5\u6B65\u9AA4\u8F93\u51FA\u7F3A\u5931\u3002");
      const links = one(parts, (v) => integer(v, 0, 200), "\u57CE\u5E02\u94FE\u63A5\u6570\u91CF\u65E0\u6548\u3002");
      const count = links || 1;
      const options = one(parts, (v) => Array.isArray(v) && v.length === count && v.every((x) => object(x) && x.kind === "city-option-position"), "\u57CE\u5E02\u6761\u76EE\u7D22\u5F15\u4E0D\u5B8C\u6574\u3002");
      const readings = one(parts, (v) => Array.isArray(v) && v.length === count && v.every((x) => object(x) && !("kind" in x)), "\u57CE\u5E02\u6761\u76EE\u8BFB\u53D6\u4E0D\u5B8C\u6574\u3002");
      for (let c = 0; c < count; c++) {
        const option = options[c], cells = Object.values(readings[c]);
        if (cells.length !== 2) throw new Error("\u57CE\u5E02\u6765\u6E90\u4E0E\u540D\u79F0\u672A\u5B8C\u6574\u914D\u5BF9\u3002");
        const recorded = one(cells, (v) => object(v) && v.kind === "city-option-position", "\u57CE\u5E02\u6761\u76EE\u6765\u6E90\u7F3A\u5931\u3002");
        const raw = one(cells, (v) => typeof v === "string", "\u57CE\u5E02\u540D\u79F0\u7F3A\u5931\u3002");
        const city = raw.trim(), representation = links ? "linked-city" : "direct-city";
        const selector = links ? source.linkSelector + ":nth-of-type(" + (c + 1) + ")" : source.sectionSelector;
        for (const v of [option, recorded]) {
          if (Object.keys(v).length !== 6 || v.version !== 1 || v.kind !== "city-option-position" || v.sectionPosition !== s + 1 || v.optionPosition !== c + 1 || v.representation !== representation || v.citySelector !== selector) throw new Error("\u57CE\u5E02\u6761\u76EE\u4F4D\u7F6E\u6216\u5B9A\u4F4D\u4E0D\u4E00\u81F4\u3002");
        }
        if (!city || city.length > 100 || /[\r\n\t]/.test(city) || !new RegExp("\\p{Script=Han}", "u").test(city)) throw new Error("\u57CE\u5E02\u540D\u79F0\u542B\u6807\u9898\u3001\u7A7A\u503C\u6216\u4E0D\u652F\u6301\u7684\u5185\u5BB9\uFF0C\u8BF7\u6838\u5BF9\u9875\u9762\u3002");
        if (seenCities.has(city)) throw new Error("\u540C\u4E00\u5206\u7EC4\u51FA\u73B0\u91CD\u590D\u57CE\u5E02\uFF0C\u9700\u8981\u672C\u4EBA\u6838\u5BF9\uFF1A" + city);
        seenCities.add(city);
        catalog.push({
          city,
          groupName: label,
          groupPosition: g + 1,
          groupSelector: base + " > ul:nth-of-type(1) > li:nth-of-type(" + (g + 1) + ")",
          sectionPosition: s + 1,
          optionPosition: c + 1,
          representation,
          citySelector: selector
        });
        if (catalog.length > 1e3) throw new Error("\u5B8C\u6574\u57CE\u5E02\u76EE\u5F55\u8D85\u51FA\u652F\u6301\u8303\u56F4\uFF0C\u672A\u91C7\u7528\u90E8\u5206\u7ED3\u679C\u3002");
      }
    }
  }
  const matches = catalog.filter((row) => row.city === config.expectedCity);
  const preferred = matches.find((row) => row.groupName === "\u70ED\u95E8\u57CE\u5E02") || matches[0] || null;
  signal.throwIfAborted();
  return {
    version: 1,
    kind: "city-catalog-match",
    ready: !!preferred,
    status: preferred ? "ready-to-select" : "needs-review",
    configurationContext: config.configurationContext,
    configurationRevision: config.configurationRevision,
    expectedCity: config.expectedCity,
    cityPosition: config.cityPosition,
    groupCount: groups.length,
    sectionCount: totalSections,
    cityOptionCount: catalog.length,
    distinctCityCount: new Set(catalog.map((row) => row.city)).size,
    matchingOccurrenceCount: matches.length,
    candidate: preferred,
    cityVerified: false,
    eligibleForApplications: false,
    note: preferred ? "\u5DF2\u6838\u5BF9\u76EE\u5F55\uFF1B\u9009\u62E9\u524D\u4ECD\u987B\u91CD\u65B0\u6253\u5F00\u5206\u7EC4\u5E76\u56DE\u8BFB\u76EE\u6807\uFF0C\u9009\u62E9\u540E\u590D\u9A8C\u5B9E\u9645\u57CE\u5E02\u3002" : "\u7F51\u7AD9\u76EE\u5F55\u672A\u627E\u5230\u914D\u7F6E\u57CE\u5E02\uFF0C\u8BF7\u672C\u4EBA\u6838\u5BF9\uFF1B\u4E0D\u4F1A\u91C7\u7528\u9ED8\u8BA4\u57CE\u5E02\u6216\u76F8\u4F3C\u540D\u79F0\u3002"
  };
};
export {
  stdin_default as default
};
