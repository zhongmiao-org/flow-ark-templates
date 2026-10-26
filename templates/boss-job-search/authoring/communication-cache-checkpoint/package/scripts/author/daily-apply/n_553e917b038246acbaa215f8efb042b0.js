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
  const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v), hash = (v) => createHash("sha256").update(v).digest("hex"), canonicalValue = (v) => Array.isArray(v) ? v.map(canonicalValue) : obj(v) ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonicalValue(v[k])])) : v, same = (a, b) => JSON.stringify(canonicalValue(a)) === JSON.stringify(canonicalValue(b)), norm = (s2) => s2.replace(/\s+/g, "");
  if (!obj(input) || Object.keys(input).sort().join(",") !== "chat,check,clickResult,fields,pageText,pageUrl,receipt,source,state") throw Error("\u7F3A\u5C11\u672C\u6B21\u6D88\u606F\u3001\u64CD\u4F5C\u548C\u5B8C\u6574\u72B6\u6001\u6765\u6E90");
  const { chat: h, fields: f, state: st, check: c, receipt: r, source: s } = input, i = s?.intent;
  if (h?.kind !== "daily-existing-chat-opened" || !same(h.check, c) || !same(h.receipt, r) || !same(h.source, s) || !same(h.clickResult, input.clickResult) || r?.state !== "submitting" || r.execute !== true || r.operation !== "prepare" || r.id !== c?.operationId || r.runId !== c?.runId || r.key !== s?.key || s.key !== "application:" + i?.key || i.status !== "reserved") throw Error("\u804A\u5929\u89C2\u5BDF\u4E0D\u5C5E\u4E8E\u672CRun\u51C6\u786E\u70B9\u51FB\u4E0E\u539F\u9884\u7559");
  const cache = communicationCache(template, signal, s.contextId, i.accountSourceSha256);
  await cache.init();
  const cachedReads = [], cachedReadKeys = /* @__PURE__ */ new Set();
  let lastReadPage = input.pageUrl;
  const rememberRead = async (observationType, data) => {
    const readKey = JSON.stringify([observationType, lastReadPage, data]);
    if (cachedReadKeys.has(readKey)) return;
    const ref = await cache.observe({ observationType, jobId: i.jobId, jobSource: c.jobSource, operationId: r.id, operationKey: r.key, runId: r.runId, sourcePage: lastReadPage, observedAt: (/* @__PURE__ */ new Date()).toISOString(), data, doNotReplay: true });
    cachedReads.push(ref);
    cachedReadKeys.add(readKey);
  };
  await rememberRead("collected-chat-input", { fields: f, pageUrl: input.pageUrl, pageText: input.pageText });
  let stopping = false, resolved = false;
  const fail = async (reason) => {
    stopping = true;
    const evidence = { version: 1, kind: "first-communication-result-unresolved", jobSource: c.jobSource, observedAt: (/* @__PURE__ */ new Date()).toISOString(), reason };
    if (!resolved) await template.effect.resolve({ id: r.id, state: "unknown", evidence });
    await Promise.resolve({ version: 1, kind: "daily-first-communication-website-observation", status: "website-result-needs-verification", jobTitle: c.jobTitle, jobSource: c.jobSource, actualCity: c.actualCity, reason, clicked: true, websiteGreetingVerified: resolved, applied: false, attachmentSent: false, dayTaskComplete: false, siteDailyLimitConfirmed: false, doNotReplay: true });
    await template.attention({ key: "daily-confirmation:" + r.id, title: "\u672C\u9879\u62DB\u547C\u4FDD\u5B58\u524D\u9700\u8981\u6838\u5BF9\uFF1A" + c.jobTitle, detail: evidence });
    await cache.observe({ observationType: "incomplete-verification", jobId: i.jobId, jobSource: c.jobSource, operationId: r.id, operationKey: r.key, runId: r.runId, sourcePage: lastReadPage, observedAt: (/* @__PURE__ */ new Date()).toISOString(), evidence, cachedReads, coverage: { deliveryComplete: false }, doNotReplay: true });
    throw Error(reason + "\uFF1B\u4E0D\u91CD\u65B0\u53D1\u9001");
  };
  const canonical = (u) => {
    const p = new URL(u);
    if (p.protocol !== "https:" || p.hostname !== "www.zhipin.com" || p.port || p.username || p.password) throw Error("\u4E0D\u652F\u6301\u7684\u7F51\u9875\u6765\u6E90");
    return p.origin + p.pathname;
  };
  const read = async (operation, selector) => {
    signal.throwIfAborted();
    const v = await template.browser("browser", { operation, ...selector ? { selector } : {}, timeoutMs: 2e3 });
    signal.throwIfAborted();
    if (["url", "read", "count", "attribute", "inputValue"].includes(operation)) {
      if (operation === "url") lastReadPage = v;
      await rememberRead("browser-read", { operation, selector: selector ?? null, value: v });
    }
    return v;
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
  try {
    if (!obj(f) || f.version !== 3 || f.operation !== "collect" || f.selector !== "body" || f.complete !== true || !Array.isArray(f.framePath) || f.framePath.length || !Array.isArray(f.fields) || f.fields.length !== 4 || canonical(f.url) !== h.chatUrl || canonical(f.documentUrl) !== h.chatUrl) return await fail("\u804A\u5929\u540C\u6B21\u5173\u8054\u91C7\u96C6\u7F3A\u5931\u6216\u6765\u6E90\u53D8\u5316");
    if (!Number.isFinite(Date.parse(h.observedAt)) || Date.now() - Date.parse(h.observedAt) > 3e4 || Date.parse(h.observedAt) > Date.now()) return await fail("\u672C\u6B21\u804A\u5929\u56DE\u6267\u5DF2\u7ECF\u8FC7\u671F");
    const fieldValue = (key, value2) => key === "jobTitle" && h.selectors?.jobTitle === "div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > div > div > div:nth-of-type(1) > span:nth-of-type(1)" && typeof value2 === "string" && value2.trim() === c.jobTitle + "\uFF08\u730E\u5934\u804C\u4F4D\uFF09" ? c.jobTitle : value2;
    const values = {};
    for (const key of ["jobTitle", "messageTime", "receipt", "message"]) {
      const rows = f.fields.filter((v2) => v2?.key === key), v = rows[0];
      if (rows.length !== 1 || v.selector !== h.selectors?.[key] || v.operation !== "text" || v.attribute !== null || v.required !== true || v.count !== 1 || v.status !== "ok" || !Array.isArray(v.issues) || v.issues.length || typeof v.value !== "string" || !v.value.trim() || norm(fieldValue(key, v.value)) !== norm(h.rendered?.[key] ?? "")) return await fail("\u804A\u5929\u5B57\u6BB5\u4E0D\u552F\u4E00\u3001\u4E0D\u53EF\u91C7\u7528\u6216\u4E0E\u5B9E\u9645\u5C55\u793A\u4E0D\u540C\uFF1A" + key);
      values[key] = fieldValue(key, v.value).trim();
    }
    const clean = (value2) => String(value2).replace(/\r\n?/g, "\n").trim();
    if (h.customFirstMessageSent !== true || h.approvedMessageSha256 !== c.greetingSha256 || s.greetingText !== c.greetingText || s.greetingSha256 !== hash(s.greetingText) || clean(h.rendered?.message) !== clean(s.greetingText) || clean(values.message).replace(/\n/g, "") !== clean(s.greetingText).replace(/\n/g, "")) return await fail("\u5B9E\u9645\u6D88\u606F\u4E0E\u672C\u4EBA\u6307\u5B9A\u7684\u5B8C\u6574\u81EA\u6211\u4ECB\u7ECD\u4E0D\u4E00\u81F4\uFF0C\u4E0D\u767B\u8BB0\u786E\u8BA4");
    const displayLabel = (value2) => String(value2).replace(/\s+/gu, " ").trim();
    if (displayLabel(values.jobTitle) !== displayLabel(c.jobTitle) || !["\u9001\u8FBE", "\u5DF2\u8BFB"].includes(values.receipt) || canonical(await read("url")) !== h.chatUrl) return await fail("\u5F53\u524D\u804A\u5929\u4E0D\u5C5E\u4E8E\u672C\u6B21\u5C97\u4F4D\u6216\u7F3A\u5C11\u660E\u786E\u9001\u8FBE");
    const jobSelector = "div:nth-of-type(1) > div:nth-of-type(2) > div > div > div:nth-of-type(2) > span";
    if (await read("count", jobSelector) !== 1 || !String(await read("read", jobSelector)).trim().startsWith("\u67E5\u770B\u804C\u4F4D")) return await fail("\u65E0\u6CD5\u552F\u4E00\u6838\u5BF9\u5F53\u524D\u804A\u5929\u5173\u8054\u804C\u4F4D\u5165\u53E3");
    await read("click", jobSelector);
    const end = Date.now() + 1e4;
    const citySelector = "div:nth-of-type(1) > p:nth-of-type(1) > a:nth-of-type(1)";
    let linked = false;
    while (Date.now() < end) {
      if (canonical(await read("url")) === c.jobSource && await read("count", "h1") === 1 && String(await read("read", "h1")).trim() === c.jobTitle && await read("count", citySelector) === 1 && String(await read("read", citySelector)).trim() === c.actualCity && canonical(await read("url")) === c.jobSource) {
        linked = true;
        break;
      }
      await delay(250);
    }
    if (!linked || await read("count", "h1") !== 1 || String(await read("read", "h1")).trim() !== c.jobTitle || await read("count", citySelector) !== 1 || String(await read("read", citySelector)).trim() !== c.actualCity || canonical(await read("url")) !== c.jobSource) return await fail("\u804A\u5929\u5173\u8054\u804C\u4F4D\u7684\u51C6\u786E\u94FE\u63A5\u3001\u6807\u9898\u6216\u57CE\u5E02\u4E0D\u4E00\u81F4");
    const day = new Intl.DateTimeFormat("sv-SE", { timeZone: i.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(/* @__PURE__ */ new Date());
    if (day !== i.day || !obj(st) || st.version !== 1 || st.operation !== "state.read" || st.contextId !== s.contextId || !Number.isSafeInteger(st.revision) || st.revision < s.stateRevision || !obj(st.value) || !["applicationIntents", "conversationControls", "replyIntents", "queueEntries"].every((k) => Array.isArray(st.value[k])) || st.value.applicationIntents.length > 500) return await fail("\u5F53\u524D\u65E5\u671F\u6216\u6700\u65B0\u5B8C\u6574\u72B6\u6001\u6765\u6E90\u4E0D\u9002\u7528");
    const queueRows = st.value.queueEntries.filter((v) => v?.key === i.key);
    if (queueRows.length !== 1 || queueRows[0].status !== "processing" || queueRows[0].accountSourceSha256 !== i.accountSourceSha256 || queueRows[0].jobSource !== i.jobSource || queueRows[0].day !== i.day || queueRows[0].timeZone !== i.timeZone || queueRows[0].configurationRevision !== i.configurationRevision) return await fail("\u5B9E\u9645\u6D88\u606F\u5BF9\u5E94\u7684\u961F\u5217 processing \u6765\u6E90\u5DF2\u53D8\u5316\uFF0C\u505C\u6B62\u4FDD\u5B58");
    const matches = st.value.applicationIntents.filter((v) => v?.key === i.key);
    if (matches.length !== 1 || !same(matches[0], i)) return await fail("\u539F\u9884\u7559\u8BB0\u5F55\u5DF2\u7ECF\u53D8\u5316\uFF0C\u505C\u6B62\u800C\u4E0D\u8986\u76D6");
    const evidence = { version: 1, kind: "first-communication-chat-delivery-verified", jobSource: c.jobSource, jobTitle: c.jobTitle, actualCity: c.actualCity, chatUrl: h.chatUrl, messageTime: values.messageTime, receipt: values.receipt, messageSha256: hash(values.message), approvedMessageSha256: s.greetingSha256, customFirstMessageVerified: true, chatFieldsSha256: hash(JSON.stringify(canonicalValue(f))), linkedJobVerified: true, observedAt: (/* @__PURE__ */ new Date()).toISOString(), clicked: true, websiteGreetingVerified: true, attachmentSent: false };
    const cachedVerification = await cache.observe({ observationType: "chat-verification", jobId: i.jobId, jobSource: c.jobSource, operationId: r.id, operationKey: r.key, runId: r.runId, sourcePage: f.url, observedAt: (/* @__PURE__ */ new Date()).toISOString(), fields: f, evidence, cachedReads, coverage: { sameCollectionVerified: true }, websiteGreetingVerified: false, doNotReplay: true });
    await template.effect.resolve({ id: r.id, state: "confirmed", evidence });
    resolved = true;
    signal.throwIfAborted();
    const value = structuredClone(st.value);
    value.applicationIntents = value.applicationIntents.map((v) => v.key === i.key ? { ...v, status: "confirmed" } : v);
    return { version: 1, kind: "daily-first-communication-confirmation-plan", contextId: st.contextId, expectedRevision: st.revision, originalValue: st.value, value, intent: i, evidence, cachedObservation: h.cachedObservation, cachedVerification, operationId: r.id, operationKey: r.key, jobTitle: c.jobTitle, jobSource: c.jobSource, actualCity: c.actualCity, websiteGreetingVerified: true, attachmentSent: false, dayTaskComplete: false, siteDailyLimitConfirmed: false };
  } catch (e) {
    if (signal.aborted || stopping || e?.communicationCacheFailure === true) throw e;
    return await fail("\u5B9E\u9645\u62DB\u547C\u56DE\u6267\u4FDD\u5B58\u524D\u6838\u5BF9\u672A\u5B8C\u6210\uFF1A" + String(e.message || e).slice(0, 400));
  }
};
export {
  stdin_default as default
};
