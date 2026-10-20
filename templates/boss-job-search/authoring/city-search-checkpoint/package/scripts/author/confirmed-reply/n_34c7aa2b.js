import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  const configuration = input?.configuration, state = input?.state;
  if (configuration?.version !== 1 || configuration.operation !== "configuration" || !Number.isSafeInteger(configuration.revision) || configuration.revision < 1 || !configuration.value || state?.version !== 1 || state.operation !== "state.read" || state.contextId !== configuration.contextId || !Number.isSafeInteger(state.revision) || state.revision < 0) throw Error("\u7F3A\u5C11\u5F53\u524D\u5B9E\u4F8B\u7684\u56FA\u5B9A\u914D\u7F6E\u6216\u6700\u65B0\u72B6\u6001\uFF0C\u4E0D\u8FDB\u5165\u56DE\u590D");
  const limit = configuration.value.replyDailyLimit, timeZone = configuration.value.replyTimeZone;
  if (!Number.isSafeInteger(limit) || limit < 0 || limit > 100 || typeof timeZone !== "string" || !timeZone.trim()) throw Error("\u6BCF\u65E5\u56DE\u590D\u4E0A\u9650\u6216\u65F6\u533A\u65E0\u6548\uFF0C\u8BF7\u5728\u5171\u4EAB\u914D\u7F6E\u4E2D\u6838\u5BF9");
  let day;
  try {
    day = new Intl.DateTimeFormat("sv-SE", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(/* @__PURE__ */ new Date());
  } catch {
    throw Error("\u6BCF\u65E5\u989D\u5EA6\u65F6\u533A\u65E0\u6CD5\u8BC6\u522B\uFF0C\u8BF7\u672C\u4EBA\u6838\u5BF9");
  }
  const intents = state.value?.replyIntents ?? [];
  if (!Array.isArray(intents) || intents.length > 500) throw Error("\u56DE\u590D\u610F\u56FE\u8BB0\u5F55\u65E0\u6CD5\u5B89\u5168\u8BFB\u53D6\uFF0C\u4E0D\u81EA\u52A8\u6E05\u7A7A\u6216\u6269\u5927\u5BB9\u91CF");
  if (typeof input.replyText !== "string" || !input.replyText.trim() || input.replyText.length > 300 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(input.replyText)) throw Error("\u8BF7\u901A\u8FC7\u6B63\u6587\u8F93\u5165\u6846\u6838\u5BF9\u672C\u6B21\u5B8C\u6574\u56DE\u590D\uFF0C\u4E0D\u80FD\u4F7F\u7528\u7A7A\u767D\u6216\u63A7\u5236\u5B57\u7B26");
  let url;
  try {
    url = new URL(input.url);
  } catch {
    throw Error("\u5F53\u524D\u6D4F\u89C8\u5668\u672A\u8FD4\u56DE\u6709\u6548\u7F51\u5740\uFF0C\u4E0D\u4EE5\u624B\u586B\u5730\u5740\u66FF\u4EE3");
  }
  const isBoss = url.protocol === "https:" && (url.hostname === "www.zhipin.com" || url.hostname === "zhipin.com");
  const loginPage = isBoss && (/(passport|login)/i.test(url.pathname) || url.pathname.includes("/web/user"));
  const issues = [];
  if (!isBoss) issues.push("\u5F53\u524D\u9875\u9762\u4E0D\u662F\u5DF2\u77E5 BOSS HTTPS \u9875\u9762");
  if (loginPage) issues.push("\u5F53\u524D\u4F4D\u4E8E\u767B\u5F55\u5165\u53E3\uFF0C\u8BF7\u672C\u4EBA\u767B\u5F55\u540E\u91CD\u65B0\u8BFB\u53D6");
  if (limit === 0) issues.push("\u6BCF\u65E5\u56DE\u590D\u4E0A\u9650\u4E3A 0\uFF0C\u7981\u6B62\u53D1\u9001");
  if (intents.length === 500) issues.push("\u56DE\u590D\u610F\u56FE\u8BB0\u5F55\u5DF2\u6EE1\uFF0C\u4EA4\u672C\u4EBA\u6838\u5BF9\uFF0C\u4E0D\u81EA\u52A8\u6E05\u7406");
  issues.push("\u5B9E\u9645\u8D26\u53F7\u3001\u4F1A\u8BDD\u3001\u5173\u8054\u804C\u4F4D\u3001\u539F\u6765\u4FE1\u4E0E\u53D1\u9001\u56DE\u6267\u5C1A\u672A\u6821\u51C6");
  issues.push("\u524D\u6B21\u5185\u90E8\u8349\u7A3F\u53CA\u5176\u56FA\u5B9A\u6765\u6E90\u5C1A\u672A\u901A\u8FC7\u5BA2\u6237\u7AEF\u9009\u62E9\u5E76\u7ED1\u5B9A\uFF0C\u4E0D\u80FD\u7C98\u8D34 JSON \u4EE3\u66FF");
  const result = { version: 1, kind: "reply-readiness", decision: "review", ready: false, eligibleForActions: false, accountVerified: false, reason: "\u56DE\u590D\u5236\u4F5C\u68C0\u67E5\u70B9\uFF0C\u5C1A\u4E0D\u80FD\u53D1\u9001", issues, observedPage: { origin: url.origin, pathname: url.pathname, loginPage }, configurationRevision: configuration.revision, stateRevision: state.revision, quota: { limit, timeZone, day, reservedRecords: intents.length, accountUsage: null }, note: "\u6CA1\u6709\u9884\u7559\u989D\u5EA6\u3001\u5199\u72B6\u6001\u3001\u586B\u5199\u8F93\u5165\u6846\u3001\u70B9\u51FB\u53D1\u9001\u6216\u8BF7\u6C42\u6A21\u578B\u3002\u7F51\u5740\u4E0E\u8F93\u5165\u6B63\u6587\u4E0D\u662F\u8D26\u53F7\u6216\u6765\u6E90\u8BC1\u660E\uFF1B\u7ED3\u679C\u672A\u77E5\u4ECD\u9700\u6309\u539F\u610F\u56FE\u6838\u5BF9\u3002" };
  return { ready: false, reviewKey: "reply-readiness:" + createHash("sha256").update(JSON.stringify([url.origin, url.pathname, configuration.revision, state.revision, issues])).digest("hex"), result };
};
export {
  stdin_default as default
};
