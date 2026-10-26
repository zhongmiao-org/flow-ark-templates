var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  const c = input?.configuration, r = input?.catalog;
  const object = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  const integer = (v, min, max) => Number.isSafeInteger(v) && v >= min && v <= max;
  if (!object(input) || Object.keys(input).sort().join(",") !== "catalog,configuration" || !object(c) || c.version !== 1 || c.kind !== "configured-city" || c.ready !== true || c.cityVerified !== false || c.eligibleForApplications !== false || !object(r) || r.version !== 1 || r.kind !== "city-catalog-match" || r.lookupStrategy !== "first-exact-group-match" || r.completeCatalog !== false || r.cityVerified !== false || r.eligibleForApplications !== false) throw Error("\u57CE\u5E02\u67E5\u627E\u6765\u6E90\u4E0D\u5B8C\u6574\uFF0C\u505C\u6B62\u9009\u62E9\u3002");
  for (const key of ["configurationContext", "configurationRevision", "expectedCity", "cityPosition"]) if (r[key] !== c[key]) throw Error("\u57CE\u5E02\u67E5\u627E\u4E0E\u672C\u6B21\u56FA\u5B9A\u914D\u7F6E\u4E0D\u4E00\u81F4\u3002");
  if (!integer(r.groupCount, 1, 20) || !integer(r.scannedGroupCount, 1, r.groupCount) || !integer(r.sectionCount, 1, 800) || !integer(r.cityOptionCount, 1, 1e3) || !integer(r.distinctCityCount, 1, r.cityOptionCount)) throw Error("\u57CE\u5E02\u67E5\u627E\u8303\u56F4\u6216\u8BA1\u6570\u65E0\u6548\u3002");
  if (r.ready === false) {
    if (r.status !== "needs-review" || r.candidate !== null || r.matchingOccurrenceCount !== 0 || r.scannedGroupCount !== r.groupCount) throw Error("\u672A\u627E\u5230\u57CE\u5E02\u7684\u8303\u56F4\u4E0D\u5B8C\u6574\u3002");
    return r;
  }
  const a = r.candidate;
  if (r.ready !== true || r.status !== "ready-to-select" || r.matchingOccurrenceCount !== 1 || !object(a) || a.city !== c.expectedCity || typeof a.groupName !== "string" || !a.groupName.trim() || /[\r\n\t]/.test(a.groupName) || !integer(a.groupPosition, 1, r.groupCount) || a.groupPosition !== r.scannedGroupCount || !integer(a.sectionPosition, 1, 40) || !integer(a.optionPosition, 1, 200)) throw Error("\u57CE\u5E02\u67E5\u627E\u5019\u9009\u4E0D\u660E\u786E\u3002");
  const base = "div:nth-of-type(4) > div:nth-of-type(2) > div:nth-of-type(2) > div";
  const section = base + " > ul:nth-of-type(2) > li:nth-of-type(" + a.sectionPosition + ")";
  const selector = a.representation === "linked-city" ? section + " > div > a:nth-of-type(" + a.optionPosition + ")" : a.representation === "direct-city" && a.optionPosition === 1 ? section : null;
  if (!selector || a.citySelector !== selector || a.groupSelector !== base + " > ul:nth-of-type(1) > li:nth-of-type(" + a.groupPosition + ")") throw Error("\u57CE\u5E02\u5019\u9009\u4F4D\u7F6E\u6216\u5B9A\u4F4D\u5F02\u5E38\u3002");
  signal.throwIfAborted();
  return r;
};
export {
  stdin_default as default
};
