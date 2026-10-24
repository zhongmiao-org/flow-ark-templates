import { setTimeout as pause } from "node:timers/promises";
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  if (!input || Object.keys(input).sort().join(",") !== "check,scroll") throw Error("\u7F3A\u5C11\u672C\u6B21\u53D1\u73B0\u5224\u65AD\u6216\u5B9E\u9645\u6EDA\u52A8\u56DE\u6267");
  const { check: c, scroll: r } = input;
  if (c?.version !== 1 || c.kind !== "daily-discovery-scroll-check" || c.shouldScroll !== true || c.eligibleForActions !== false || c.dayTaskComplete !== false || !Number.isSafeInteger(c.visibleCount) || c.visibleCount < 1 || c.visibleCount > 500 || typeof c.actualCity !== "string" || !c.actualCity) throw Error("\u672C\u6B21\u4E0D\u8DB3\u5019\u9009\u7684\u6765\u6E90\u5C1A\u672A\u6838\u5BF9");
  if (r?.version !== 1 || r.operation !== "scroll" || r.url !== c.searchUrl || r.documentUrl !== r.url || r.selector !== "div:nth-of-type(1) > div:nth-of-type(1) > li:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > a:nth-of-type(1)" || !Array.isArray(r.framePath) || r.framePath.length || r.direction !== "down" || r.distance !== 2e3 || !["target", "ancestor", "document"].includes(r.region) || !Number.isSafeInteger(r.ancestorDepth) || r.ancestorDepth < 0 || r.ancestorDepth > 64 || typeof r.moved !== "boolean" || typeof r.atStart !== "boolean" || typeof r.atEnd !== "boolean") throw Error("\u5B9E\u9645\u6EDA\u52A8\u56DE\u6267\u4E0E\u672C\u6B21\u56FA\u5B9A\u7F51\u9875\u8303\u56F4\u4E0D\u4E00\u81F4");
  for (const k of ["offsetBefore", "offsetAfter", "heightBefore", "heightAfter", "viewportBefore", "viewportAfter"]) if (typeof r[k] !== "number" || !Number.isFinite(r[k]) || r[k] < 0 || r[k] > 1e9) throw Error("\u6EDA\u52A8\u5B9E\u9645\u4F4D\u7F6E\u56DE\u6267\u65E0\u6548");
  const delta = r.offsetAfter - r.offsetBefore;
  if (delta < 0 || delta > 2001 || r.moved !== (delta !== 0) || r.viewportBefore <= 0 || r.viewportAfter <= 0 || r.offsetBefore > Math.max(0, r.heightBefore - r.viewportBefore) + 1 || r.offsetAfter > Math.max(0, r.heightAfter - r.viewportAfter) + 1 || r.atStart !== r.offsetAfter <= 0.5 || r.atEnd !== r.offsetAfter >= Math.max(0, r.heightAfter - r.viewportAfter) - 0.5) throw Error("\u5B9E\u9645\u4F4D\u79FB\u4E0E\u6EDA\u52A8\u8FB9\u754C\u56DE\u6267\u4E0D\u4E00\u81F4");
  const dayOf = () => new Intl.DateTimeFormat("sv-SE", { timeZone: c.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(/* @__PURE__ */ new Date());
  const deadline = Date.now() + 3e4, read = async (command) => {
    signal.throwIfAborted();
    const remaining = deadline - Date.now();
    if (remaining < 100) throw Error("\u6EDA\u52A8\u540E\u7B49\u5F85\u8D85\u8FC7\u6709\u9650\u671F\u9650");
    return template.browser("browser", { ...command, timeoutMs: Math.min(3e3, remaining) });
  };
  const cards = "div > div:nth-of-type(1) > li", citySelector = "body > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > div > div:nth-of-type(1) > span";
  const source = (v) => {
    if (typeof v !== "string" || !v.trim() || v.length > 4096 || v.trim() !== v || /[\u0000-\u0020\u007f…]/.test(v)) throw Error("\u5217\u8868\u8FB9\u754C\u94FE\u63A5\u7F3A\u5931\u6216\u7F29\u7565");
    const u = new URL(v, c.searchUrl);
    if (u.origin !== "https://www.zhipin.com" || u.username || u.password || u.hash || !/^\/job_detail\/[A-Za-z0-9_~-]+\.html$/.test(u.pathname)) throw Error("\u5217\u8868\u8FB9\u754C\u94FE\u63A5\u6765\u6E90\u65E0\u6548");
    return u.origin + u.pathname;
  };
  let previous = null, stable = 0;
  for (let sample = 1; sample <= 8; sample++) {
    signal.throwIfAborted();
    if (dayOf() !== c.configuredDay || await read({ operation: "url" }) !== c.searchUrl) throw Error("\u6EDA\u52A8\u540E\u5B9E\u9645\u9875\u9762\u6216\u65E5\u671F\u5DF2\u53D8\u5316");
    const city = await read({ operation: "read", selector: citySelector }), count = await read({ operation: "count", selector: cards });
    if (typeof city !== "string" || city.trim() !== c.actualCity || !Number.isSafeInteger(count) || count < c.visibleCount || count > 500) throw Error("\u6EDA\u52A8\u540E\u5B9E\u9645\u57CE\u5E02\u6216\u5217\u8868\u8303\u56F4\u4E0D\u7B26");
    const links = [];
    for (const position of [.../* @__PURE__ */ new Set([1, count])]) {
      const selector = "div:nth-of-type(" + position + ") > div:nth-of-type(1) > li:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > a:nth-of-type(1)";
      links.push(source(await read({ operation: "attribute", selector, value: "href" })));
    }
    const after = await read({ operation: "count", selector: cards });
    if (await read({ operation: "url" }) !== c.searchUrl || (await read({ operation: "read", selector: citySelector })).trim() !== c.actualCity) throw Error("\u6EDA\u52A8\u7B49\u5F85\u91C7\u6837\u671F\u95F4\u9875\u9762\u6216\u5B9E\u9645\u57CE\u5E02\u53D8\u5316");
    const signature = JSON.stringify([count, ...links]);
    stable = after === count && previous === signature ? stable + 1 : 0;
    previous = after === count ? signature : null;
    if (stable >= 2) {
      signal.throwIfAborted();
      return { version: 1, kind: "daily-scroll-list-ready", pass: c.pass, searchUrl: c.searchUrl, actualCity: c.actualCity, configuredDay: c.configuredDay, countBefore: c.visibleCount, countAfter: count, samples: sample, observedCountGrowth: count > c.visibleCount, moved: r.moved, atEnd: r.atEnd, newLinksNotYetAdopted: true, eligibleForActions: false, dayTaskComplete: false, siteDailyLimitConfirmed: false };
    }
    if (sample < 8) await pause(500, void 0, { signal });
  }
  throw Error("\u6EDA\u52A8\u540E\u5217\u8868\u5728\u6709\u9650\u89C2\u5BDF\u5185\u4ECD\u672A\u7A33\u5B9A\uFF0C\u672A\u91C7\u7528\u5019\u9009\u6216\u7EE7\u7EED\u5916\u53D1");
};
export {
  stdin_default as default
};
