import { createHash } from "node:crypto";
function communicationCache(template, signal, contextId, accountSourceSha256) {
  const object = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  const canonical = (v) => Array.isArray(v) ? v.map(canonical) : object(v) ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonical(v[k])])) : v;
  const encode = (v) => JSON.stringify(canonical(v));
  const sha = (v) => createHash("sha256").update(v).digest("hex");
  const digest = (v) => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
  const timestamp = (v) => typeof v === "string" && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v && Date.parse(v) <= Date.now();
  if (typeof contextId !== "string" || !contextId || contextId.length > 200 || !digest(accountSourceSha256)) throw Error("\u7F13\u5B58\u6240\u5C5E\u4E0A\u4E0B\u6587\u6216\u8D26\u53F7\u6765\u6E90\u65E0\u6548");
  const scope = { version: 1, kind: "boss-communication-cache-scope", contextId, accountSourceSha256 };
  const scopeText = encode(scope), scopeName = "scope-v1-" + sha(scopeText) + ".json";
  let initialized = false;
  const guarded = (fn) => async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (signal.aborted || error?.communicationCacheFailure === true) throw error;
      const failure = Error("\u6C9F\u901A\u7F13\u5B58\u6545\u969C\uFF1A" + String(error?.message || error));
      failure.communicationCacheFailure = true;
      throw failure;
    }
  };
  const controlled = (name) => typeof name === "string" && /^(?:scope|observation|positive)-v1-[a-f0-9]{64}\.json$/.test(name);
  const missingTarget = (error, name) => {
    const match = /^ENOENT: no such file or directory, realpath '([^'\r\n]+)'$/.exec(String(error?.message || ""));
    return !!match && controlled(name) && match[1].endsWith("/" + name);
  };
  const rawRead = async (name) => {
    if (!controlled(name)) throw Error("\u7F13\u5B58\u6587\u4EF6\u540D\u4E0D\u53D7\u652F\u6301");
    signal.throwIfAborted();
    const content = await template.file("communication-cache", { operation: "read", name });
    signal.throwIfAborted();
    if (typeof content !== "string" || Buffer.byteLength(content) > 10 * 1024 * 1024) throw Error("\u7F13\u5B58\u5185\u5BB9\u8D85\u51FA\u65E2\u6709\u6587\u4EF6\u8BFB\u53D6\u8303\u56F4");
    return content;
  };
  const checkScope = async () => {
    if (await rawRead(scopeName) !== scopeText) throw Error("\u7F13\u5B58\u8303\u56F4\u6807\u8BB0\u4E0E\u672C\u5B9E\u4F8B\u8D26\u53F7\u4E0D\u4E00\u81F4\uFF0C\u4FDD\u7559\u539F\u6587\u4EF6");
  };
  const init = async () => {
    try {
      if (await rawRead(scopeName) !== scopeText) throw Error("\u7F13\u5B58\u8303\u56F4\u6807\u8BB0\u635F\u574F\u6216\u4E0D\u4E00\u81F4\uFF0C\u4FDD\u7559\u539F\u6587\u4EF6");
    } catch (error) {
      if (!missingTarget(error, scopeName)) throw error;
      signal.throwIfAborted();
      await template.file("communication-cache", { operation: "write", name: scopeName, content: scopeText });
      await checkScope();
    }
    initialized = true;
  };
  const read = async (name) => {
    if (!initialized) throw Error("\u7F13\u5B58\u8303\u56F4\u5C1A\u672A\u6838\u5BF9");
    try {
      return await rawRead(name);
    } catch (error) {
      if (!missingTarget(error, name)) throw error;
      await checkScope();
      return null;
    }
  };
  const put = async (name, value) => {
    const content = encode(value);
    if (typeof content !== "string" || Buffer.byteLength(content) > 10 * 1024 * 1024) throw Error("\u7F13\u5B58\u8F93\u51FA\u8D85\u8FC7\u65E2\u6709SDK\u4E0A\u9650\uFF0C\u672A\u622A\u65AD\u5199\u5165");
    const previous = await read(name);
    if (previous !== null && previous !== content) throw Error("\u7F13\u5B58\u6587\u4EF6\u5DF2\u6709\u4E0D\u540C\u5185\u5BB9\uFF0C\u4FDD\u7559\u539F\u6587\u4EF6");
    if (previous === null) {
      signal.throwIfAborted();
      await template.file("communication-cache", { operation: "write", name, content });
    }
    if (await rawRead(name) !== content) throw Error("\u7F13\u5B58\u5199\u51FA\u4E0E\u56DE\u8BFB\u4E0D\u4E00\u81F4");
    return { name, sha256: sha(content) };
  };
  const parse = (content) => {
    let value;
    try {
      value = JSON.parse(content);
    } catch {
      throw Error("\u7F13\u5B58JSON\u635F\u574F\uFF0C\u4E0D\u80FD\u6309\u7A7A\u7F13\u5B58\u5904\u7406");
    }
    if (!object(value) || encode(value) !== content) throw Error("\u7F13\u5B58\u4E0D\u662F\u5B8C\u6574\u89C4\u8303\u5BF9\u8C61\uFF0C\u4E0D\u80FD\u6309\u7A7A\u7F13\u5B58\u5904\u7406");
    return value;
  };
  const identity = (value, jobSource, jobId) => {
    let source;
    try {
      source = new URL(jobSource);
    } catch {
      throw Error("\u7F13\u5B58\u5C97\u4F4D\u6765\u6E90\u65E0\u6548");
    }
    const match = /^\/job_detail\/([A-Za-z0-9_~-]+)\.html$/.exec(source.pathname);
    if (source.origin !== "https://www.zhipin.com" || source.username || source.password || source.port || source.search || source.hash || source.href !== jobSource || match?.[1] !== jobId || value.version !== 1 || value.contextId !== contextId || value.accountSourceSha256 !== accountSourceSha256 || value.jobSource !== jobSource || value.jobId !== jobId) throw Error("\u7F13\u5B58\u4E0A\u4E0B\u6587\u3001\u8D26\u53F7\u6216\u5B8C\u6574\u5C97\u4F4D\u6765\u6E90\u4E0D\u4E00\u81F4");
  };
  const observe = async (value) => {
    const record = { ...value, version: 1, kind: "boss-communication-observation", contextId, accountSourceSha256 };
    identity(record, value.jobSource, value.jobId);
    if (!timestamp(record.observedAt) || record.doNotReplay !== true) throw Error("\u7F13\u5B58\u89C2\u5BDF\u65F6\u95F4\u6216\u672A\u77E5\u91CD\u653E\u8FB9\u754C\u65E0\u6548");
    const content = encode(record), name = "observation-v1-" + sha(content) + ".json";
    return put(name, record);
  };
  return { init: guarded(init), observe: guarded(observe) };
}
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v), hash = (v) => createHash("sha256").update(v).digest("hex");
  if (!obj(input) || Object.keys(input).sort().join(",") !== "check,clickResult,pageText,pageUrl,receipt,source") throw Error("\u7F3A\u5C11\u672C\u6B21\u70B9\u51FB\u540E\u7684\u5B8C\u6574\u6765\u6E90");
  const { check: c, clickResult: k, pageText: text, pageUrl: url, receipt: r, source: s } = input;
  if (c?.kind !== "daily-first-communication-submit-check" || c.readyForWebsiteSubmission !== true || k?.kind !== "daily-first-communication-click-returned" || k.clicked !== true || k.businessResultVerified !== false || k.operationId !== c.operationId || k.operationKey !== c.operationKey || k.jobSource !== c.jobSource || r?.version !== 1 || r.operation !== "prepare" || r.execute !== true || r.state !== "submitting" || r.id !== c.operationId || r.key !== c.operationKey || r.runId !== c.runId || r.action !== "apply" || s?.key !== r.key || s.jobSource !== c.jobSource || s.intent?.status !== "reserved" || typeof url !== "string" || typeof text !== "string" || Buffer.byteLength(text) > 65536) throw Error("\u672C\u6B21\u70B9\u51FB\u3001\u5C97\u4F4D\u3001\u9884\u7559\u6216\u552F\u4E00\u64CD\u4F5C\u6765\u6E90\u4E0D\u4E00\u81F4");
  const canonical = (u) => {
    const p = new URL(u);
    if (p.protocol !== "https:" || p.hostname !== "www.zhipin.com" || p.port || p.username || p.password) throw Error("\u7ED3\u679C\u7F51\u5740\u6765\u6E90\u4E0D\u53D7\u652F\u6301");
    return p.origin + p.pathname;
  };
  const cache = communicationCache(template, signal, s.contextId, s.intent.accountSourceSha256);
  await cache.init();
  const cachedReads = [], cachedReadKeys = /* @__PURE__ */ new Set();
  let lastReadPage = url;
  const rememberRead = async (observationType, data) => {
    const readKey = JSON.stringify([observationType, lastReadPage, data]);
    if (cachedReadKeys.has(readKey)) return;
    const ref = await cache.observe({ observationType, jobId: s.intent.jobId, jobSource: c.jobSource, operationId: r.id, operationKey: r.key, runId: r.runId, sourcePage: lastReadPage, observedAt: (/* @__PURE__ */ new Date()).toISOString(), data, doNotReplay: true });
    cachedReads.push(ref);
    cachedReadKeys.add(readKey);
  };
  await rememberRead("initial-page", { url, text });
  const read = async (operation, selector, value) => {
    signal.throwIfAborted();
    const v = await template.browser("browser", { operation, ...selector ? { selector } : {}, ...value === void 0 ? {} : { value }, timeoutMs: operation === "navigate" || operation === "click" ? 1e4 : 2e3 }).catch((error) => {
      throw Error("\u7F51\u9875\u64CD\u4F5C[" + operation + "] " + (selector || "\u5F53\u524D\u9875") + "\uFF1A" + String(error?.message || error));
    });
    signal.throwIfAborted();
    if (["url", "read", "count", "attribute", "inputValue"].includes(operation)) {
      if (operation === "url") lastReadPage = v;
      await rememberRead("browser-read", { operation, selector: selector ?? null, value: v });
    }
    return operation === "read" && selector === "div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > div > div > div:nth-of-type(1) > span:nth-of-type(1)" && typeof v === "string" && v.trim() === c.jobTitle + "\uFF08\u730E\u5934\u804C\u4F4D\uFF09" ? c.jobTitle : v;
  };
  const delay = (ms) => new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const stop = () => {
      clearTimeout(t);
      reject(signal.reason || Error("\u5DF2\u53D6\u6D88"));
    };
    const t = setTimeout(() => {
      signal.removeEventListener("abort", stop);
      resolve();
    }, ms);
    signal.addEventListener("abort", stop, { once: true });
  });
  let stopping = false;
  const fail = async (reason) => {
    stopping = true;
    let failurePageSource = null, failurePageText = null;
    try {
      failurePageSource = canonical(await read("url"));
      const raw = String(await read("read", "body"));
      if (Buffer.byteLength(raw) <= 65536) failurePageText = raw;
    } catch {
    }
    const evidence = { version: 1, kind: "first-communication-chat-check-incomplete", jobSource: c.jobSource, detailTextSha256: hash(text), reason, observedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await template.effect.resolve({ id: r.id, state: "unknown", evidence });
    await Promise.resolve({ version: 1, kind: "daily-first-communication-website-observation", status: "website-result-needs-verification", jobTitle: c.jobTitle, jobSource: c.jobSource, actualCity: c.actualCity, reason, clicked: true, websiteGreetingVerified: false, applied: false, attachmentSent: false, dayTaskComplete: false, siteDailyLimitConfirmed: false, doNotReplay: true, failurePageSource, websitePageText: failurePageText, evidence });
    await template.attention({ key: "daily-chat-receipt:" + r.id, title: "\u672C\u9879\u62DB\u547C\u7ED3\u679C\u5F85\u6838\u5BF9\uFF1A" + c.jobTitle, detail: evidence });
    await cache.observe({ observationType: "incomplete-chat-check", jobId: s.intent.jobId, jobSource: c.jobSource, operationId: r.id, operationKey: r.key, runId: r.runId, sourcePage: failurePageSource, observedAt: (/* @__PURE__ */ new Date()).toISOString(), evidence, cachedReads, coverage: { deliveryComplete: false }, doNotReplay: true });
    throw Error(reason + "\uFF1B\u4FDD\u7559\u672A\u77E5\uFF0C\u4E0D\u91CD\u590D\u53D1\u9001");
  };
  try {
    const chatSource = "https://www.zhipin.com/web/geek/chat";
    if (typeof c.greetingText !== "string" || !c.greetingText.trim() || c.greetingText.length > 4e3 || c.greetingSha256 !== hash(c.greetingText) || s.greetingText !== c.greetingText || s.greetingSha256 !== c.greetingSha256 || s.submissionMode !== "first-communication-with-approved-message") return await fail("\u9996\u6761\u81EA\u6211\u4ECB\u7ECD\u4E0E\u672C\u6B21\u6301\u4E45\u64CD\u4F5C\u4E0D\u4E00\u81F4");
    const linkedJobSelector = "div:nth-of-type(1) > div:nth-of-type(2) > div > div > div:nth-of-type(2) > span";
    const citySelector = "div:nth-of-type(1) > p:nth-of-type(1) > a:nth-of-type(1)";
    const currentSource = canonical(await read("url"));
    if (![c.jobSource, chatSource].includes(canonical(url)) || ![c.jobSource, chatSource].includes(currentSource)) return await fail("\u9996\u6B21\u6C9F\u901A\u540E\u51FA\u73B0\u4E0D\u652F\u6301\u7684\u9875\u9762\uFF0C\u505C\u6B62\u53D1\u9001");
    if (currentSource === chatSource) {
      if (await read("count", linkedJobSelector) !== 1 || !String(await read("read", linkedJobSelector)).trim().startsWith("\u67E5\u770B\u804C\u4F4D")) return await fail("\u9996\u6B21\u6253\u5F00\u804A\u5929\u540E\u7F3A\u5C11\u5173\u8054\u804C\u4F4D\u5165\u53E3");
      await read("click", linkedJobSelector);
      const linkEnd = Date.now() + 8e3;
      while (Date.now() < linkEnd && canonical(await read("url")) !== c.jobSource) await delay(250);
    }
    if (canonical(await read("url")) !== c.jobSource) return await fail("\u804A\u5929\u5173\u8054\u804C\u4F4D\u4E0D\u662F\u672C\u9879\u51C6\u786E\u6765\u6E90");
    if (Date.now() - Date.parse(c.checkedAt) > 12e4 || Date.parse(c.checkedAt) > Date.now()) return await fail("\u672C\u6B21\u70B9\u51FB\u6765\u6E90\u5DF2\u8D85\u8FC7\u6838\u5BF9\u671F\u9650");
    const firstEntryUntil = Date.now() + 1e4;
    while (Date.now() < firstEntryUntil && canonical(await read("url")) === c.jobSource) {
      if (await read("count", c.selector) === 1 && String(await read("read", c.selector)).trim() === "\u7EE7\u7EED\u6C9F\u901A") break;
      await delay(250);
    }
    if (await read("count", c.selector) !== 1 || String(await read("read", c.selector)).trim() !== "\u7EE7\u7EED\u6C9F\u901A") return await fail("\u672C\u9879\u5165\u53E3\u6CA1\u6709\u660E\u786E\u53D8\u6210\u7EE7\u7EED\u6C9F\u901A");
    if (canonical(await read("url")) !== c.jobSource) return await fail("\u6253\u5F00\u804A\u5929\u524D\u5C97\u4F4D\u6765\u6E90\u53D8\u5316");
    const detailEnd = Date.now() + 1e4;
    let detailReady = false;
    while (Date.now() < detailEnd) {
      if (canonical(await read("url")) === c.jobSource && await read("count", c.selector) === 1 && String(await read("read", c.selector)).trim() === "\u7EE7\u7EED\u6C9F\u901A" && await read("count", "h1") === 1 && String(await read("read", "h1")).trim() === c.jobTitle) {
        detailReady = true;
        break;
      }
      await delay(300);
    }
    if (!detailReady || canonical(await read("url")) !== c.jobSource) return await fail("\u91CD\u65B0\u6253\u5F00\u51C6\u786E\u5C97\u4F4D\u540E\u672A\u53D6\u5F97\u53EF\u7528\u7684\u65E2\u6709\u804A\u5929\u5165\u53E3");
    await delay(1200);
    if (String(await read("read", c.selector)).trim() !== "\u7EE7\u7EED\u6C9F\u901A" || canonical(await read("url")) !== c.jobSource) return await fail("\u6253\u5F00\u65E2\u6709\u804A\u5929\u524D\u5165\u53E3\u6216\u5C97\u4F4D\u6765\u6E90\u53D8\u5316");
    await read("click", c.selector);
    const selectors = { jobTitle: "div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > div > div > div:nth-of-type(1) > span:nth-of-type(1)", messageTime: "li:nth-of-type(1) > div:nth-of-type(1) > span", receipt: "li:has(> div > div > p > span) > div > div > i", message: "li:has(> div > div > i) > div > div > p > span" };
    const clean = (value) => String(value).replace(/\r\n?/g, "\n").trim();
    const waitChat = async () => {
      const until = Date.now() + 1e4;
      while (Date.now() < until) {
        if (canonical(await read("url")) === chatSource && await read("count", selectors.jobTitle) === 1 && String(await read("read", selectors.jobTitle)).trim() === c.jobTitle) return;
        await delay(250);
      }
      throw Error("\u672C\u9879\u804A\u5929\u672A\u5C31\u7EEA");
    };
    await waitChat();
    if (await read("count", linkedJobSelector) !== 1 || !String(await read("read", linkedJobSelector)).trim().startsWith("\u67E5\u770B\u804C\u4F4D")) return await fail("\u53D1\u9001\u524D\u7F3A\u5C11\u51C6\u786E\u5173\u8054\u804C\u4F4D\u5165\u53E3");
    await read("click", linkedJobSelector);
    const verifyEnd = Date.now() + 8e3;
    while (Date.now() < verifyEnd && canonical(await read("url")) !== c.jobSource) await delay(250);
    if (canonical(await read("url")) !== c.jobSource || await read("count", "h1") !== 1 || String(await read("read", "h1")).trim() !== c.jobTitle || await read("count", citySelector) !== 1 || String(await read("read", citySelector)).trim() !== c.actualCity) return await fail("\u53D1\u9001\u524D\u5173\u8054\u804C\u4F4D\u94FE\u63A5\u3001\u6807\u9898\u6216\u57CE\u5E02\u4E0D\u4E00\u81F4");
    if (await read("count", c.selector) !== 1 || String(await read("read", c.selector)).trim() !== "\u7EE7\u7EED\u6C9F\u901A") return await fail("\u53D1\u9001\u524D\u4E0D\u662F\u672C\u9879\u65E2\u6709\u804A\u5929\u5165\u53E3");
    await read("click", c.selector);
    await waitChat();
    if (await read("count", selectors.message) !== 0 || await read("count", selectors.receipt) !== 0) return await fail("\u672C\u9879\u5DF2\u6709\u6D88\u606F\u6216\u7F51\u7AD9\u9884\u8BBE\u8BED\uFF0C\u505C\u6B62\u4EE5\u907F\u514D\u91CD\u590D\u53D1\u9001");
    if (await read("count", "#chat-input") !== 1 || clean(await read("read", "#chat-input")) !== "") return await fail("\u804A\u5929\u8F93\u5165\u6846\u4E0D\u552F\u4E00\u6216\u5DF2\u6709\u8349\u7A3F\uFF0C\u4E0D\u8986\u76D6");
    if (await read("count", "button") !== 1 || String(await read("read", "button")).trim() !== "\u53D1\u9001") return await fail("\u672C\u9879\u53D1\u9001\u6309\u94AE\u4E0D\u552F\u4E00\u6216\u5165\u53E3\u53D8\u5316");
    await read("fill", "#chat-input", c.greetingText);
    const draftUntil = Date.now() + 2500;
    let draftReady = false, lastDraftCheck = null;
    while (Date.now() < draftUntil) {
      const draft = String(await read("read", "#chat-input"));
      const sameURL = canonical(await read("url")) === chatSource;
      const sameJob = String(await read("read", selectors.jobTitle)).trim() === c.jobTitle;
      const outboundCount = await read("count", selectors.message);
      lastDraftCheck = { draftMatches: clean(draft) === clean(c.greetingText), draftLength: draft.length, expectedLength: c.greetingText.length, sameURL, sameJob, outboundCount };
      if (!sameURL || !sameJob || outboundCount !== 0) return await fail("\u53D1\u9001\u524D\u804A\u5929\u5BF9\u8C61\u6216\u65E2\u6709\u6D88\u606F\u53D8\u5316\uFF1B\u4FDD\u7559\u672A\u77E5\uFF0C\u4E0D\u91CD\u590D\u53D1\u9001\uFF1A" + JSON.stringify(lastDraftCheck));
      if (lastDraftCheck.draftMatches) {
        draftReady = true;
        break;
      }
      await delay(100);
    }
    if (!draftReady) return await fail("\u53D1\u9001\u524D\u6B63\u6587\u672A\u5C31\u7EEA\u6216\u88AB\u4FEE\u6539\uFF1B\u4FDD\u7559\u672A\u77E5\uFF0C\u4E0D\u91CD\u590D\u53D1\u9001\uFF1A" + JSON.stringify(lastDraftCheck));
    if (Date.now() - Date.parse(c.checkedAt) > 12e4) return await fail("\u5B8C\u6574\u6B63\u6587\u53D1\u9001\u524D\u6765\u6E90\u5DF2\u8D85\u671F\uFF0C\u4E0D\u70B9\u51FB\u53D1\u9001");
    const sendReadyUntil = Date.now() + 4e3;
    let sendStable = 0, lastSendButtonClass = null;
    while (Date.now() < sendReadyUntil) {
      lastSendButtonClass = await read("attribute", "button", "class");
      const usable = await read("count", "button:enabled:not([aria-disabled='true']):not(.disabled):not(.btn-disabled)") === 1;
      sendStable = usable ? sendStable + 1 : 0;
      if (sendStable >= 2) break;
      await delay(250);
    }
    if (sendStable < 2) return await fail("\u53D1\u9001\u6309\u94AE\u672A\u7A33\u5B9A\u53EF\u7528\uFF1B\u4FDD\u7559\u672A\u77E5\uFF0C\u4E0D\u91CD\u53D1\uFF1A" + String(lastSendButtonClass));
    if (canonical(await read("url")) !== chatSource || String(await read("read", selectors.jobTitle)).trim() !== c.jobTitle || clean(await read("read", "#chat-input")) !== clean(c.greetingText) || await read("count", selectors.message) !== 0) return await fail("\u53D1\u9001\u6309\u94AE\u5C31\u7EEA\u540E\u804A\u5929\u5BF9\u8C61\u3001\u6B63\u6587\u6216\u65E2\u6709\u6D88\u606F\u53D8\u5316\uFF1B\u4FDD\u7559\u672A\u77E5\uFF0C\u4E0D\u91CD\u53D1");
    if (Date.now() - Date.parse(c.checkedAt) > 12e4) return await fail("\u53D1\u9001\u6309\u94AE\u5C31\u7EEA\u540E\u6765\u6E90\u5DF2\u8FC7\u671F\uFF1B\u4E0D\u53D1\u9001");
    await read("click", "button");
    const hydrateEnd = Date.now() + 3e3;
    let sentBodyReady = false;
    while (Date.now() < hydrateEnd) {
      if (canonical(await read("url")) !== chatSource) break;
      if (await read("count", selectors.message) === 1 && await read("count", selectors.receipt) === 1 && clean(await read("read", selectors.message)) === clean(c.greetingText) && /^(送达|已读)$/.test(String(await read("read", selectors.receipt)).trim())) {
        sentBodyReady = true;
        break;
      }
      await delay(250);
    }
    if (sentBodyReady && await read("count", selectors.messageTime) !== 1) {
      await read("navigate", null, c.jobSource);
      const reopenEnd = Date.now() + 1e4;
      let sameDetail = false;
      while (Date.now() < reopenEnd) {
        if (canonical(await read("url")) === c.jobSource && await read("count", "h1") === 1 && String(await read("read", "h1")).trim() === c.jobTitle && await read("count", citySelector) === 1 && String(await read("read", citySelector)).trim() === c.actualCity && await read("count", c.selector) === 1 && String(await read("read", c.selector)).trim() === "\u7EE7\u7EED\u6C9F\u901A") {
          sameDetail = true;
          break;
        }
        await delay(250);
      }
      if (!sameDetail) return await fail("\u8865\u8BFB\u6D88\u606F\u65F6\u95F4\u524D\uFF0C\u540C\u4E00\u5C97\u4F4D\u6216\u57CE\u5E02\u65E0\u6CD5\u590D\u9A8C");
      await read("click", c.selector);
      await waitChat();
    }
    const end = Date.now() + 12e3;
    let rendered = null;
    let lastReceiptCheck = "\u5C1A\u672A\u8BFB\u53D6\u5230\u804A\u5929\u56DE\u6267";
    while (Date.now() < end) {
      if (canonical(await read("url")) !== "https://www.zhipin.com/web/geek/chat") {
        await delay(300);
        continue;
      }
      const v = {};
      let ready = true;
      for (const [key, selector] of Object.entries(selectors)) {
        if (await read("count", selector) !== 1) {
          ready = false;
          break;
        }
        v[key] = String(await read("read", selector)).trim();
      }
      lastReceiptCheck = JSON.stringify({ unique: ready, jobMatches: v.jobTitle === c.jobTitle, receipt: v.receipt ?? null, time: v.messageTime ?? null, messageMatches: typeof v.message === "string" && clean(v.message) === clean(c.greetingText), messageLength: typeof v.message === "string" ? v.message.length : null });
      if (ready && v.jobTitle === c.jobTitle && /^(送达|已读)$/.test(v.receipt) && /^\d{1,2}:\d{2}$/.test(v.messageTime) && v.message.length >= 2 && v.message.length <= 4e3 && clean(v.message) === clean(c.greetingText)) {
        rendered = v;
        break;
      }
      await delay(300);
    }
    if (!rendered || canonical(await read("url")) !== "https://www.zhipin.com/web/geek/chat") return await fail("\u672C\u6B21\u804A\u5929\u56DE\u6267\u6838\u5BF9\u672A\u5B8C\u6210\uFF1A" + lastReceiptCheck);
    const observedAt = (/* @__PURE__ */ new Date()).toISOString();
    const parts = (d) => Object.fromEntries(new Intl.DateTimeFormat("sv-SE", { timeZone: s.intent.timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(d)).filter((x) => x.type !== "literal").map((x) => [x.type, x.value]));
    const now = parts(observedAt), checked = parts(c.checkedAt), [hh, mm] = rendered.messageTime.split(":").map(Number), msgMinute = hh * 60 + mm;
    if (hh > 23 || mm > 59 || [now.year, now.month, now.day].join("-") !== s.intent.day || [checked.year, checked.month, checked.day].join("-") !== s.intent.day || msgMinute < Number(checked.hour) * 60 + Number(checked.minute) - 1 || msgMinute > Number(now.hour) * 60 + Number(now.minute) + 1) return await fail("\u6D88\u606F\u65F6\u95F4\u4E0D\u80FD\u5F52\u5C5E\u4E8E\u672C\u6B21\u540C\u65E5\u70B9\u51FB");
    const cachedObservation = await cache.observe({ observationType: "chat-receipt", jobId: s.intent.jobId, jobSource: c.jobSource, operationId: r.id, operationKey: r.key, runId: r.runId, jobTitle: c.jobTitle, actualCity: c.actualCity, approvedMessageSha256: c.greetingSha256, approvedMessage: c.greetingText, checkedAt: c.checkedAt, day: s.intent.day, timeZone: s.intent.timeZone, fields: rendered, selectors, cachedReads, observedAt, sourcePage: "https://www.zhipin.com/web/geek/chat", coverage: { linkedJobVerified: true, uniqueFields: true }, websiteGreetingVerified: false, attachmentSent: false, doNotReplay: true });
    return { version: 1, kind: "daily-existing-chat-opened", check: c, clickResult: k, receipt: r, source: s, approvedMessageSha256: c.greetingSha256, customFirstMessageSent: true, rendered, selectors, cachedObservation, observedAt, chatUrl: "https://www.zhipin.com/web/geek/chat", websiteGreetingVerified: false, attachmentSent: false, dayTaskComplete: false };
  } catch (e) {
    if (signal.aborted || stopping || e?.communicationCacheFailure === true) throw e;
    return await fail("\u5B9E\u9645\u804A\u5929\u56DE\u6267\u6838\u5BF9\u672A\u5B8C\u6210\uFF1A" + String(e.message || e).slice(0, 400));
  }
};
export {
  stdin_default as default
};
