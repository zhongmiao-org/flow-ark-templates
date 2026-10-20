import { createHash } from "node:crypto";
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
  const read = async (operation, selector, value) => {
    signal.throwIfAborted();
    const v = await template.browser("browser", { operation, ...selector ? { selector } : {}, ...value === void 0 ? {} : { value }, timeoutMs: operation === "navigate" ? 1e4 : 2e3 });
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
    await template.result({ version: 1, kind: "daily-first-communication-website-observation", status: "website-result-needs-verification", jobTitle: c.jobTitle, jobSource: c.jobSource, actualCity: c.actualCity, reason, clicked: true, websiteGreetingVerified: false, applied: false, attachmentSent: false, dayTaskComplete: false, siteDailyLimitConfirmed: false, doNotReplay: true, failurePageSource, websitePageText: failurePageText, evidence });
    await template.attention({ key: "daily-chat-receipt:" + r.id, title: "\u672C\u9879\u62DB\u547C\u7ED3\u679C\u5F85\u6838\u5BF9\uFF1A" + c.jobTitle, detail: evidence });
    throw Error(reason + "\uFF1B\u4FDD\u7559\u672A\u77E5\uFF0C\u4E0D\u91CD\u590D\u53D1\u9001");
  };
  try {
    if (canonical(url) !== c.jobSource || canonical(await read("url")) !== c.jobSource) return await fail("\u70B9\u51FB\u540E\u4E0D\u662F\u672C\u6B21\u51C6\u786E\u804C\u4F4D\u9875\u9762");
    if (Date.now() - Date.parse(c.checkedAt) > 12e4 || Date.parse(c.checkedAt) > Date.now()) return await fail("\u672C\u6B21\u70B9\u51FB\u6765\u6E90\u5DF2\u8D85\u8FC7\u6838\u5BF9\u671F\u9650");
    if (await read("count", c.selector) !== 1 || String(await read("read", c.selector)).trim() !== "\u7EE7\u7EED\u6C9F\u901A") return await fail("\u672C\u9879\u5165\u53E3\u6CA1\u6709\u660E\u786E\u53D8\u6210\u7EE7\u7EED\u6C9F\u901A");
    if (canonical(await read("url")) !== c.jobSource) return await fail("\u6253\u5F00\u804A\u5929\u524D\u5C97\u4F4D\u6765\u6E90\u53D8\u5316");
    await read("navigate", null, c.jobSource);
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
    const selectors = { jobTitle: "div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > div > div > div:nth-of-type(1) > span:nth-of-type(1)", messageTime: "li:nth-of-type(1) > div:nth-of-type(1) > span", receipt: "li:nth-of-type(1) > div:nth-of-type(2) > div > i", message: "li:nth-of-type(1) > div:nth-of-type(2) > div > p > span" };
    const end = Date.now() + 12e3;
    let rendered = null;
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
      if (ready && v.jobTitle === c.jobTitle && /^(送达|已读)$/.test(v.receipt) && /^\d{1,2}:\d{2}$/.test(v.messageTime) && v.message.length >= 2 && v.message.length <= 4e3) {
        rendered = v;
        break;
      }
      await delay(300);
    }
    if (!rendered || canonical(await read("url")) !== "https://www.zhipin.com/web/geek/chat") return await fail("\u672A\u53D6\u5F97\u552F\u4E00\u7684\u672C\u6B21\u804A\u5929\u5C97\u4F4D\u3001\u65F6\u95F4\u3001\u51FA\u7AD9\u6D88\u606F\u548C\u9001\u8FBE\u56DE\u6267");
    const observedAt = (/* @__PURE__ */ new Date()).toISOString();
    const parts = (d) => Object.fromEntries(new Intl.DateTimeFormat("sv-SE", { timeZone: s.intent.timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(d)).filter((x) => x.type !== "literal").map((x) => [x.type, x.value]));
    const now = parts(observedAt), checked = parts(c.checkedAt), [hh, mm] = rendered.messageTime.split(":").map(Number), msgMinute = hh * 60 + mm;
    if (hh > 23 || mm > 59 || [now.year, now.month, now.day].join("-") !== s.intent.day || [checked.year, checked.month, checked.day].join("-") !== s.intent.day || msgMinute < Number(checked.hour) * 60 + Number(checked.minute) - 1 || msgMinute > Number(now.hour) * 60 + Number(now.minute) + 1) return await fail("\u6D88\u606F\u65F6\u95F4\u4E0D\u80FD\u5F52\u5C5E\u4E8E\u672C\u6B21\u540C\u65E5\u70B9\u51FB");
    return { version: 1, kind: "daily-existing-chat-opened", check: c, clickResult: k, receipt: r, source: s, rendered, selectors, observedAt, chatUrl: "https://www.zhipin.com/web/geek/chat", websiteGreetingVerified: false, attachmentSent: false, dayTaskComplete: false };
  } catch (e) {
    if (signal.aborted || stopping) throw e;
    return await fail("\u5B9E\u9645\u804A\u5929\u56DE\u6267\u6838\u5BF9\u672A\u5B8C\u6210\uFF1A" + String(e.message || e).slice(0, 400));
  }
};
export {
  stdin_default as default
};
