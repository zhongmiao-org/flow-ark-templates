var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const fixed = input?.configuration;
  if (!fixed || fixed.version !== 1 || fixed.operation !== "configuration" || typeof fixed.contextId !== "string" || !fixed.contextId || !Number.isSafeInteger(fixed.revision) || fixed.revision < 0 || !fixed.value || typeof fixed.value !== "object" || Array.isArray(fixed.value)) {
    throw new Error("\u7F3A\u5C11\u672C\u6B21\u8FD0\u884C\u56FA\u5B9A\u7684\u6C42\u804C\u914D\u7F6E\uFF0C\u8BF7\u5148\u8BFB\u53D6\u914D\u7F6E\u540E\u91CD\u8BD5\u3002");
  }
  const cities = fixed.value.cities;
  if (!Array.isArray(cities) || cities.length < 1 || cities.length > 20 || cities.some((city) => typeof city !== "string" || !city.trim() || city.length > 100)) {
    throw new Error("\u8BF7\u5148\u5728\u6C42\u804C\u6761\u4EF6\u4E2D\u586B\u5199\u81F3\u5C11\u4E00\u4E2A\u6709\u6548\u57CE\u5E02\uFF1B\u4E0D\u4F1A\u4F7F\u7528\u7F51\u7AD9\u9ED8\u8BA4\u57CE\u5E02\u3002");
  }
  const normalized = cities.map((city) => city.trim());
  if (new Set(normalized).size !== normalized.length) throw new Error("\u671F\u671B\u57CE\u5E02\u5B58\u5728\u91CD\u590D\u9879\uFF0C\u8BF7\u5148\u6838\u5BF9\u6C42\u804C\u6761\u4EF6\u3002");
  const position = input.cityPosition;
  if (!Number.isSafeInteger(position) || position < 1 || position > cities.length) throw new Error("\u914D\u7F6E\u57CE\u5E02\u5E8F\u53F7\u8D85\u51FA\u5DF2\u914D\u7F6E\u5217\u8868\uFF0C\u8BF7\u9009\u62E91\u81F3" + cities.length + "\u3002");
  const roles = fixed.value.targetRoles;
  if (!Array.isArray(roles) || roles.length !== 1 || typeof roles[0] !== "string" || !roles[0].trim() || roles[0].length > 100 || /[\u0000-\u001f\u007f]/.test(roles[0])) {
    throw new Error("\u672C\u68C0\u7D22\u5165\u53E3\u5F53\u524D\u9700\u660E\u786E\u914D\u7F6E\u4E00\u4E2A\u76EE\u6807\u804C\u4F4D\uFF1B\u591A\u76EE\u6807\u8F6E\u6362\u5C1A\u672A\u63A5\u901A\uFF0C\u4E0D\u4F1A\u9759\u9ED8\u53EA\u68C0\u7D22\u7B2C\u4E00\u9879\u3002");
  }
  const searchRole = roles[0].trim();
  let searchURL = "https://www.zhipin.com/web/geek/jobs?query=" + encodeURIComponent(searchRole);
  let initializedCityReused = false;
  const currentSource = await template.browser("browser", { operation: "url", timeoutMs: 3e3 });
  signal.throwIfAborted();
  const current = new URL(currentSource);
  if (current.origin === "https://www.zhipin.com" && !current.username && !current.password && !current.hash && current.pathname === "/web/geek/jobs" && current.searchParams.get("query") === searchRole && /^\d{9}$/.test(current.searchParams.get("city") || "")) {
    const selector = "body > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > div > div:nth-of-type(1) > span";
    const count = await template.browser("browser", { operation: "count", selector, timeoutMs: 3e3 });
    if (count === 1) {
      const actual = await template.browser("browser", { operation: "read", selector, timeoutMs: 3e3 });
      const after = await template.browser("browser", { operation: "url", timeoutMs: 3e3 });
      signal.throwIfAborted();
      if (after === currentSource && typeof actual === "string" && actual.trim() === normalized[position - 1]) {
        searchURL = current.href;
        initializedCityReused = true;
      }
    }
  }
  if (!initializedCityReused) {
    const saved = await template.state.get();
    signal.throwIfAborted();
    if (saved && Array.isArray(saved.queueEntries)) {
      const prior = saved.queueEntries.filter((row) => row && row.configurationRevision === fixed.revision && typeof row.searchUrl === "string" && Number.isFinite(Date.parse(row.discoveredAt)) && Date.parse(row.discoveredAt) <= Date.now()).sort((a, b) => Date.parse(b.discoveredAt) - Date.parse(a.discoveredAt));
      for (const row of prior) {
        signal.throwIfAborted();
        let candidate;
        try {
          candidate = new URL(row.searchUrl);
        } catch {
          continue;
        }
        if (candidate.origin === "https://www.zhipin.com" && candidate.pathname === "/web/geek/jobs" && !candidate.username && !candidate.password && !candidate.hash && candidate.searchParams.get("query") === searchRole && /^\d{9}$/.test(candidate.searchParams.get("city") || "")) {
          searchURL = candidate.href;
          break;
        }
      }
    }
  }
  signal.throwIfAborted();
  return {
    version: 1,
    kind: "configured-city",
    ready: true,
    configurationContext: fixed.contextId,
    configurationRevision: fixed.revision,
    cities: normalized,
    cityPosition: position,
    expectedCity: normalized[position - 1],
    searchRole,
    searchURL,
    initializedCityReused,
    searchRoleCount: 1,
    accountVerified: false,
    cityVerified: false,
    eligibleForApplications: false
  };
};
export {
  stdin_default as default
};
