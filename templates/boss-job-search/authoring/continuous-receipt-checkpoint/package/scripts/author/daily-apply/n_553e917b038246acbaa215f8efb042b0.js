import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v), hash = (v) => createHash("sha256").update(v).digest("hex"), canonicalValue = (v) => Array.isArray(v) ? v.map(canonicalValue) : obj(v) ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonicalValue(v[k])])) : v, same = (a, b) => JSON.stringify(canonicalValue(a)) === JSON.stringify(canonicalValue(b)), norm = (s2) => s2.replace(/\s+/g, "");
  if (!obj(input) || Object.keys(input).sort().join(",") !== "chat,check,clickResult,fields,pageText,pageUrl,receipt,source,state") throw Error("\u7F3A\u5C11\u672C\u6B21\u6D88\u606F\u3001\u64CD\u4F5C\u548C\u5B8C\u6574\u72B6\u6001\u6765\u6E90");
  const { chat: h, fields: f, state: st, check: c, receipt: r, source: s } = input, i = s?.intent;
  if (h?.kind !== "daily-existing-chat-opened" || !same(h.check, c) || !same(h.receipt, r) || !same(h.source, s) || !same(h.clickResult, input.clickResult) || r?.state !== "submitting" || r.execute !== true || r.operation !== "prepare" || r.id !== c?.operationId || r.runId !== c?.runId || r.key !== s?.key || s.key !== "application:" + i?.key || i.status !== "reserved") throw Error("\u804A\u5929\u89C2\u5BDF\u4E0D\u5C5E\u4E8E\u672CRun\u51C6\u786E\u70B9\u51FB\u4E0E\u539F\u9884\u7559");
  let stopping = false, resolved = false;
  const fail = async (reason) => {
    stopping = true;
    const evidence = { version: 1, kind: "first-communication-result-unresolved", jobSource: c.jobSource, observedAt: (/* @__PURE__ */ new Date()).toISOString(), reason };
    if (!resolved) await template.effect.resolve({ id: r.id, state: "unknown", evidence });
    await Promise.resolve({ version: 1, kind: "daily-first-communication-website-observation", status: "website-result-needs-verification", jobTitle: c.jobTitle, jobSource: c.jobSource, actualCity: c.actualCity, reason, clicked: true, websiteGreetingVerified: resolved, applied: false, attachmentSent: false, dayTaskComplete: false, siteDailyLimitConfirmed: false, doNotReplay: true });
    await template.attention({ key: "daily-confirmation:" + r.id, title: "\u672C\u9879\u62DB\u547C\u4FDD\u5B58\u524D\u9700\u8981\u6838\u5BF9\uFF1A" + c.jobTitle, detail: evidence });
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
    await template.effect.resolve({ id: r.id, state: "confirmed", evidence });
    resolved = true;
    signal.throwIfAborted();
    const value = structuredClone(st.value);
    value.applicationIntents = value.applicationIntents.map((v) => v.key === i.key ? { ...v, status: "confirmed" } : v);
    return { version: 1, kind: "daily-first-communication-confirmation-plan", contextId: st.contextId, expectedRevision: st.revision, originalValue: st.value, value, intent: i, evidence, operationId: r.id, operationKey: r.key, jobTitle: c.jobTitle, jobSource: c.jobSource, actualCity: c.actualCity, websiteGreetingVerified: true, attachmentSent: false, dayTaskComplete: false, siteDailyLimitConfirmed: false };
  } catch (e) {
    if (signal.aborted || stopping) throw e;
    return await fail("\u5B9E\u9645\u62DB\u547C\u56DE\u6267\u4FDD\u5B58\u524D\u6838\u5BF9\u672A\u5B8C\u6210\uFF1A" + String(e.message || e).slice(0, 400));
  }
};
export {
  stdin_default as default
};
