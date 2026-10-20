import { setTimeout as pause } from "node:timers/promises";
var stdin_default = async ({ signal, template }) => {
  const selector = "div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3)";
  const deadline = Date.now() + 1e4;
  let previous = null;
  const call = async (operation, target) => {
    signal.throwIfAborted();
    const remaining = deadline - Date.now();
    if (remaining < 100) throw new Error("\u8BE6\u60C5\u5C31\u7EEA\u8BFB\u53D6\u8D85\u65F6\uFF1B\u672A\u8FDB\u5165\u4E25\u683C\u91C7\u96C6\u6216\u6253\u62DB\u547C");
    return template.browser("browser", { operation, ...target ? { selector: target } : {}, timeoutMs: Math.min(2e3, remaining) });
  };
  for (let sample = 1; sample <= 5; sample++) {
    signal.throwIfAborted();
    const url = await call("url");
    const page = new URL(url);
    if (page.protocol !== "https:" || page.hostname !== "www.zhipin.com" || page.port || page.username || page.password || !/^\/job_detail\/[A-Za-z0-9_~-]+\.html$/.test(page.pathname)) throw new Error("\u8BE6\u60C5\u5C31\u7EEA\u8BFB\u53D6\u7684\u7F51\u9875\u6765\u6E90\u4E0D\u7B26");
    const count = await call("count", selector);
    if (count !== 1) throw new Error("\u8BE6\u60C5\u6B63\u6587\u76EE\u6807\u672A\u552F\u4E00\u5339\u914D\uFF1B\u672A\u8FDB\u5165\u6253\u62DB\u547C");
    const text = await call("read", selector);
    const after = await call("url");
    if (after !== url) throw new Error("\u8BE6\u60C5\u5C31\u7EEA\u8BFB\u53D6\u671F\u95F4\u7F51\u9875\u5DF2\u53D8\u5316");
    if (typeof text !== "string" || !text.trim() || Buffer.byteLength(text, "utf8") > 65536) throw new Error("\u8BE6\u60C5\u6B63\u6587\u4E3A\u7A7A\u6216\u8D85\u9650\uFF1B\u672A\u8FDB\u5165\u6253\u62DB\u547C");
    if (previous && previous.url === url && previous.text === text) {
      return { version: 1, kind: "detail-ready-for-strict-collection", samples: sample, pageSource: page.origin + page.pathname, observedAt: (/* @__PURE__ */ new Date()).toISOString(), textStable: true, descriptionComplete: false, eligibleForActions: false, note: "\u4EC5\u5C31\u7EEA\u89C2\u5BDF\uFF0C\u672A\u91C7\u7528\u6B63\u6587\uFF1B\u540E\u7EED\u4ECD\u987B\u539F\u540C\u6B21\u91C7\u96C6\u3001\u8EAB\u4EFD\u3001\u57CE\u5E02\u53CA\u5B8C\u6574\u6027\u6838\u5BF9\u3002" };
    }
    previous = { url, text };
    if (sample < 5) await pause(500, void 0, { signal });
  }
  throw new Error("\u6709\u9650\u89C2\u5BDF\u671F\u95F4\u8BE6\u60C5\u6587\u5B57\u6301\u7EED\u53D8\u5316\uFF1B\u672A\u8FDB\u5165\u4E25\u683C\u91C7\u96C6\u6216\u6253\u62DB\u547C");
};
export {
  stdin_default as default
};
