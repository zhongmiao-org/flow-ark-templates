var stdin_default = async ({ input, template, signal, progress }) => {
  signal.throwIfAborted();
  const c = input?.configuration, count = input?.count;
  const integer = (v, min, max) => Number.isSafeInteger(v) && v >= min && v <= max;
  const object = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  if (!object(input) || Object.keys(input).sort().join(",") !== "configuration,count" || !object(c) || c.version !== 1 || c.kind !== "configured-city" || c.ready !== true || c.cityVerified !== false || c.eligibleForApplications !== false || !integer(c.configurationRevision, 0, Number.MAX_SAFE_INTEGER) || !integer(c.cityPosition, 1, 20) || typeof c.expectedCity !== "string" || !c.expectedCity.trim() || !integer(count, 1, 20)) throw Error("\u672C\u6B21\u57CE\u5E02\u914D\u7F6E\u6216\u771F\u5B9E\u5206\u7EC4\u6570\u91CF\u65E0\u6548\uFF0C\u505C\u6B62\u67E5\u627E\u3002");
  const base = "div:nth-of-type(2) > div:nth-of-type(2) > div";
  const groupList = base + " > ul:nth-of-type(1) > li";
  const sectionList = base + " > ul:nth-of-type(2) > li";
  const call = async (operation, selector) => {
    signal.throwIfAborted();
    const v = await template.browser("browser", { operation, selector, value: null });
    signal.throwIfAborted();
    return v;
  };
  const name = (v, max) => {
    if (typeof v !== "string" || !v.trim() || v.length > max || /[\r\n\t]/.test(v)) throw Error("\u7F51\u7AD9\u540D\u79F0\u7F3A\u5931\u6216\u4E0D\u662F\u5B8C\u6574\u5355\u9879\u6587\u5B57\uFF0C\u505C\u6B62\u67E5\u627E\u3002");
    return v.trim();
  };
  if (await call("count", groupList) !== count) throw Error("\u7F51\u7AD9\u57CE\u5E02\u5206\u7EC4\u6570\u91CF\u5DF2\u53D8\u5316\uFF0C\u505C\u6B62\u67E5\u627E\u3002");
  const seenGroups = /* @__PURE__ */ new Set(), allCities = /* @__PURE__ */ new Set();
  let sectionCount = 0, cityOptionCount = 0;
  const result = (candidate, scannedGroupCount) => ({ version: 1, kind: "city-catalog-match", ready: !!candidate, status: candidate ? "ready-to-select" : "needs-review", configurationContext: c.configurationContext, configurationRevision: c.configurationRevision, expectedCity: c.expectedCity, cityPosition: c.cityPosition, groupCount: count, scannedGroupCount, sectionCount, cityOptionCount, distinctCityCount: allCities.size, matchingOccurrenceCount: candidate ? 1 : 0, candidate, cityVerified: false, eligibleForApplications: false, completeCatalog: false, lookupStrategy: "first-exact-group-match", note: candidate ? "\u5DF2\u5728\u771F\u5B9E\u5206\u7EC4\u5185\u552F\u4E00\u627E\u5230\u914D\u7F6E\u57CE\u5E02\uFF0C\u505C\u6B62\u7EE7\u7EED\u67E5\u627E\uFF1B\u4E0B\u6E38\u4ECD\u987B\u91CD\u65B0\u6253\u5F00\u5206\u7EC4\u3001\u56DE\u8BFB\u57CE\u5E02\u5E76\u6838\u5BF9\u5B9E\u9645\u9009\u57CE\u3002" : "\u6240\u6709\u5B9E\u9645\u5206\u7EC4\u5747\u672A\u627E\u5230\u914D\u7F6E\u57CE\u5E02\uFF0C\u4E0D\u91C7\u7528\u9ED8\u8BA4\u57CE\u5E02\u6216\u76F8\u4F3C\u540D\u79F0\u3002" });
  for (let g = 1; g <= count; g++) {
    const groupSelector = groupList + ":nth-of-type(" + g + ")";
    const groupName = name(await call("read", groupSelector), 30);
    if (seenGroups.has(groupName)) throw Error("\u7F51\u7AD9\u57CE\u5E02\u5206\u7EC4\u540D\u79F0\u91CD\u590D\uFF0C\u505C\u6B62\u67E5\u627E\u3002");
    seenGroups.add(groupName);
    const clicked = await call("click", groupSelector);
    if (!object(clicked) || clicked.clicked !== true || clicked.verified !== false) throw Error("\u57CE\u5E02\u5206\u7EC4\u70B9\u51FB\u7ED3\u679C\u672A\u77E5\uFF0C\u4E0D\u91CD\u8BD5\u3002");
    const size = await call("count", sectionList);
    if (!integer(size, 1, 40)) throw Error("\u7F51\u7AD9\u57CE\u5E02\u5206\u6BB5\u6570\u91CF\u65E0\u6548\u3002");
    sectionCount += size;
    const seenCities = /* @__PURE__ */ new Set(), matches = [];
    for (let s = 1; s <= size; s++) {
      const sectionSelector = sectionList + ":nth-of-type(" + s + ")", linkSelector = sectionSelector + " > div > a";
      const links = await call("count", linkSelector);
      if (!integer(links, 0, 200)) throw Error("\u57CE\u5E02\u94FE\u63A5\u6570\u91CF\u65E0\u6548\u3002");
      for (let p = 1; p <= (links || 1); p++) {
        const citySelector = links ? linkSelector + ":nth-of-type(" + p + ")" : sectionSelector;
        const city = name(await call("read", citySelector), 100);
        if (!new RegExp("\\p{Script=Han}", "u").test(city) || seenCities.has(city)) throw Error("\u5F53\u524D\u5206\u7EC4\u57CE\u5E02\u540D\u79F0\u5F02\u5E38\u6216\u91CD\u590D\uFF0C\u505C\u6B62\u67E5\u627E\u3002");
        seenCities.add(city);
        allCities.add(city);
        cityOptionCount++;
        if (cityOptionCount > 1e3) throw Error("\u57CE\u5E02\u76EE\u5F55\u8D85\u51FA\u652F\u6301\u8303\u56F4\uFF0C\u672A\u91C7\u7528\u90E8\u5206\u7ED3\u679C\u3002");
        if (city === c.expectedCity) matches.push({ city, groupName, groupPosition: g, groupSelector, sectionPosition: s, optionPosition: p, representation: links ? "linked-city" : "direct-city", citySelector });
      }
      if (await call("count", linkSelector) !== links) throw Error("\u5F53\u524D\u57CE\u5E02\u6BB5\u5DF2\u53D8\u5316\uFF0C\u505C\u6B62\u67E5\u627E\u3002");
    }
    if (await call("count", sectionList) !== size || name(await call("read", groupSelector), 30) !== groupName || await call("count", groupList) !== count) throw Error("\u57CE\u5E02\u76EE\u5F55\u8BFB\u53D6\u671F\u95F4\u5DF2\u53D8\u5316\uFF0C\u505C\u6B62\u91C7\u7528\u3002");
    if (matches.length > 1) throw Error("\u5F53\u524D\u5206\u7EC4\u5B58\u5728\u591A\u4E2A\u51C6\u786E\u5339\u914D\uFF0C\u505C\u6B62\u9009\u62E9\u3002");
    if (matches.length === 1) {
      const candidate = matches[0];
      if (name(await call("read", candidate.citySelector), 100) !== c.expectedCity) throw Error("\u914D\u7F6E\u57CE\u5E02\u5728\u56DE\u8BFB\u65F6\u5DF2\u53D8\u5316\u3002");
      return result(candidate, g);
    }
  }
  return result(null, count);
};
export {
  stdin_default as default
};
