import { createHash } from "node:crypto";
var stdin_default = async ({ template, signal }) => {
  signal.throwIfAborted();
  const configuration = await template.configuration();
  const state = await template.state.get();
  signal.throwIfAborted();
  if (!configuration || !state || !Array.isArray(state.queueEntries) || !Array.isArray(state.applicationIntents)) throw Error("\u8FDE\u7EED\u5904\u7406\u7684\u914D\u7F6E\u6216\u5B8C\u6574\u72B6\u6001\u6765\u6E90\u4E0D\u4E00\u81F4");
  const timeZone = configuration.replyTimeZone;
  const day = new Intl.DateTimeFormat("sv-SE", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(/* @__PURE__ */ new Date());
  const queue = state.queueEntries.filter((row) => row.day === day && row.timeZone === timeZone);
  const intents = state.applicationIntents.filter((row) => row.day === day && row.timeZone === timeZone);
  const processing = queue.filter((row) => row.status === "processing").length;
  const pending = queue.filter((row) => row.status === "queued").length;
  const confirmedToday = intents.filter((row) => row.status === "confirmed").length;
  const read = (command) => {
    signal.throwIfAborted();
    return template.browser("browser", { ...command, timeoutMs: 1e4 });
  };
  const citySelector = "body > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > div > div:nth-of-type(1) > span", cards = "div > div:nth-of-type(1) > li";
  const source = await read({ operation: "url" }), page = new URL(source);
  if (page.origin !== "https://www.zhipin.com" || page.pathname !== "/web/geek/jobs" || page.username || page.password || page.hash) throw Error("\u7EED\u6279\u8FDB\u5EA6\u7F3A\u5C11\u771F\u5B9E\u5C97\u4F4D\u5217\u8868\u6765\u6E90");
  const actualCity = await read({ operation: "read", selector: citySelector }), visibleCount = await read({ operation: "count", selector: cards });
  if (typeof actualCity !== "string" || !Array.isArray(configuration.cities) || !configuration.cities.includes(actualCity.trim()) || !Number.isSafeInteger(visibleCount) || visibleCount < 1 || visibleCount > 500) throw Error("\u7EED\u6279\u8FDB\u5EA6\u7684\u5B9E\u9645\u57CE\u5E02\u6216\u5217\u8868\u6570\u91CF\u4E0D\u7B26");
  const lastSelector = "div:nth-of-type(" + visibleCount + ") > div:nth-of-type(1) > li:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > a:nth-of-type(1)";
  const lastHref = await read({ operation: "attribute", selector: lastSelector, value: "href" });
  if (typeof lastHref !== "string" || !lastHref || lastHref.length > 4096 || lastHref.trim() !== lastHref) throw Error("\u7EED\u6279\u8FDB\u5EA6\u7F3A\u5C11\u5B8C\u6574\u5C97\u4F4D\u94FE\u63A5");
  const lastPage = new URL(lastHref, source), match = /^\/job_detail\/([A-Za-z0-9_~-]+)\.html$/.exec(lastPage.pathname);
  if (lastPage.origin !== "https://www.zhipin.com" || lastPage.username || lastPage.password || lastPage.hash || !match) throw Error("\u7EED\u6279\u8FDB\u5EA6\u7684\u5C97\u4F4D\u8EAB\u4EFD\u65E0\u6548");
  if (await read({ operation: "url" }) !== source || await read({ operation: "count", selector: cards }) !== visibleCount || await read({ operation: "attribute", selector: lastSelector, value: "href" }) !== lastHref || (await read({ operation: "read", selector: citySelector })).trim() !== actualCity.trim()) throw Error("\u7EED\u6279\u8FDB\u5EA6\u8BFB\u53D6\u671F\u95F4\u5217\u8868\u6765\u6E90\u53D8\u5316");
  const discovery = { city: actualCity.trim(), visibleCount, lastJobId: match[1], query: page.searchParams.get("query") || "" };
  const progress = createHash("sha256").update(JSON.stringify({ day, discovery, queue: queue.map((row) => [row.key, row.status]).sort(), intents: intents.map((row) => [row.key, row.status]).sort() })).digest("hex");
  const decision = processing || !queue.length ? "review" : "continue";
  const reason = processing ? "\u4ECD\u6709\u5904\u7406\u72B6\u6001\u672A\u6536\u5C3E\uFF0C\u505C\u6B62\u7EED\u53D1\u5E76\u6838\u5BF9\u539F\u8BB0\u5F55" : !queue.length ? "\u5C1A\u672A\u5F62\u6210\u53EF\u6838\u5BF9\u7684\u5019\u9009\u961F\u5217\uFF0C\u8BF7\u67E5\u770B\u6C42\u804C\u6761\u4EF6\u53CA\u6765\u6E90" : "\u672C\u6BB5\u5DF2\u4FDD\u5B58\u5B8C\u6574\u56DE\u6267\uFF0C\u7EE7\u7EED\u7B5B\u9009\u672A\u6253\u8FC7\u62DB\u547C\u7684\u5C97\u4F4D\uFF1B\u5F53\u5929\u5DF2\u786E\u8BA4\u4ECB\u7ECD\u9001\u8FBE " + confirmedToday + " \u6B21\u3002\u4EC5\u7F51\u7AD9\u5F53\u5929\u4E0A\u9650\u5F39\u6846\u8BC1\u660E\u5B8C\u6210";
  const result = { version: 1, kind: "daily-continuous-decision", decision, progress, reason, day, timeZone, confirmedToday, pending, processing, siteDailyLimitConfirmed: false, dayTaskComplete: false };
  await template.result(result);
  return result;
};
export {
  stdin_default as default
};
