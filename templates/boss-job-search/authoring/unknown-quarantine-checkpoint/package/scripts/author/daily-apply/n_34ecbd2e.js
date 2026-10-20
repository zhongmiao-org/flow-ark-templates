var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v), canonical = (v) => Array.isArray(v) ? v.map(canonical) : obj(v) ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonical(v[k])])) : v, same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
  if (!obj(input) || Object.keys(input).sort().join(",") !== "list,plan,receipt,reread") throw Error("\u7F3A\u5C11\u5355\u9879\u4FDD\u5B58\u7684\u8BA1\u5212\u3001\u63D0\u4EA4\u56DE\u6267\u3001\u91CD\u8BFB\u72B6\u6001\u6216\u539F\u5217\u8868");
  const { plan: p, receipt: r, reread: s, list: l } = input;
  if (p?.kind !== "daily-first-communication-confirmation-plan" || p.websiteGreetingVerified !== true || p.attachmentSent !== false || p.evidence?.kind !== "first-communication-chat-delivery-verified" || p.evidence.linkedJobVerified !== true || p.evidence.jobSource !== p.jobSource || !obj(p.originalValue) || !obj(p.value) || !Array.isArray(p.originalValue.applicationIntents) || !Array.isArray(p.value.applicationIntents) || !Array.isArray(p.originalValue.queueEntries) || !Array.isArray(p.value.queueEntries) || p.intent?.status !== "reserved") throw Error("\u672C\u9879\u786E\u8BA4\u8BA1\u5212\u6216\u539F\u72B6\u6001\u6765\u6E90\u65E0\u6548");
  const queueRows = p.originalValue.queueEntries.filter((v) => v?.key === p.intent.key);
  if (queueRows.length !== 1 || queueRows[0].status !== "processing" || queueRows[0].jobSource !== p.intent.jobSource || queueRows[0].accountSourceSha256 !== p.intent.accountSourceSha256 || queueRows[0].day !== p.intent.day || queueRows[0].timeZone !== p.intent.timeZone) throw Error("\u9001\u8FBE\u5199\u56DE\u7684\u5B8C\u6574\u961F\u5217\u6765\u6E90\u4E0D\u4E00\u81F4");
  const expected = structuredClone(p.originalValue), matches = expected.applicationIntents.filter((v) => v?.key === p.intent.key);
  if (matches.length !== 1 || !same(matches[0], p.intent)) throw Error("\u5355\u9879\u8BA1\u5212\u4E0D\u5BF9\u5E94\u51C6\u786E\u539F\u9884\u7559");
  expected.applicationIntents = expected.applicationIntents.map((v) => v.key === p.intent.key ? { ...v, status: "confirmed" } : v);
  if (!same(expected, p.value) || r?.version !== 1 || r.operation !== "state.write" || r.contextId !== p.contextId || r.previousRevision !== p.expectedRevision || r.revision !== p.expectedRevision + 1 || typeof r.operationId !== "string" || !Number.isFinite(Date.parse(r.committedAt)) || !same(r.value, p.value) || s?.version !== 1 || s.operation !== "state.read" || s.contextId !== p.contextId || s.revision !== r.revision || !same(s.value, r.value)) throw Error("\u9001\u8FBE\u72B6\u6001\u63D0\u4EA4\u6216\u5199\u540E\u91CD\u8BFB\u4E0D\u4E00\u81F4\uFF1B\u4FDD\u7559\u8BB0\u5F55\u5E76\u505C\u6B62\uFF0C\u4E0D\u91CD\u590D\u53D1\u9001");
  const todayRows = s.value.applicationIntents.filter((v) => v.accountSourceSha256 === p.intent.accountSourceSha256 && v.timeZone === p.intent.timeZone && v.day === p.intent.day), result = { version: 1, kind: "daily-first-communication-confirmed", status: "\u6D88\u606F\u9001\u8FBE\uFF0C\u72B6\u6001\u5DF2\u4FDD\u5B58\u5E76\u91CD\u8BFB\u4E00\u81F4", jobTitle: p.jobTitle, jobSource: p.jobSource, actualCity: p.actualCity, messageTime: p.evidence.messageTime, messageReceipt: p.evidence.receipt, websiteGreetingVerified: true, stateRevision: s.revision, stateSavedAndRereadVerified: true, otherRecordsPreserved: true, quotaRowsBefore: todayRows.length, quotaRowsAfter: todayRows.length, confirmedGreetingsToday: todayRows.filter((v) => v.status === "confirmed").length, attachmentSent: false, applied: false, dayTaskComplete: false, siteDailyLimitConfirmed: false, returnedToList: false, evidence: p.evidence };
  await template.result(result);
  signal.throwIfAborted();
  try {
    if (l?.kind !== "daily-fullpage-jd-candidate" || l.jobSource !== p.jobSource || l.jobTitle !== p.jobTitle || l.jobCity !== p.actualCity || l.configuredDay !== p.intent.day || l.timeZone !== p.intent.timeZone || typeof l.returnUrl !== "string") throw Error("\u539F\u5217\u8868\u6765\u6E90\u4E0D\u5C5E\u4E8E\u672C\u6B21\u51C6\u786E\u5C97\u4F4D");
    const u = new URL(l.returnUrl);
    if (u.protocol !== "https:" || u.hostname !== "www.zhipin.com" || u.port || u.username || u.password || u.pathname !== "/web/geek/jobs" || u.hash || u.href.length > 4096) throw Error("\u539F\u5217\u8868\u5730\u5740\u4E0D\u9002\u7528");
    const read = async (operation, selector, value) => {
      signal.throwIfAborted();
      const v = await template.browser("browser", { operation, ...selector ? { selector } : {}, ...value === void 0 ? {} : { value }, timeoutMs: 2e3 });
      signal.throwIfAborted();
      return v;
    };
    await read("navigate", null, l.returnUrl);
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
    const end = Date.now() + 12e3;
    let ready = false;
    while (Date.now() < end) {
      if (String(await read("url")) === l.returnUrl && await read("count", "div > div:nth-of-type(1) > li") > 0) {
        ready = true;
        break;
      }
      await delay(300);
    }
    const citySelector = "body > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > div > div:nth-of-type(1) > span";
    const day = new Intl.DateTimeFormat("sv-SE", { timeZone: p.intent.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(/* @__PURE__ */ new Date());
    if (!ready || day !== p.intent.day || String(await read("url")) !== l.returnUrl || await read("count", citySelector) !== 1 || String(await read("read", citySelector)).trim() !== p.actualCity) throw Error("\u8FD4\u56DE\u540E\u5217\u8868\u3001\u65E5\u671F\u6216\u7F51\u9875\u5B9E\u9645\u57CE\u5E02\u6838\u5BF9\u672A\u901A\u8FC7");
    const done = { ...result, returnedToList: true, status: "\u672C\u9879\u6D88\u606F\u9001\u8FBE\u5E76\u4FDD\u5B58\uFF0C\u5DF2\u8FD4\u56DE\u5217\u8868\u7EE7\u7EED\u7B5B\u9009" };
    await template.result(done);
    signal.throwIfAborted();
    return done;
  } catch (e) {
    if (signal.aborted) throw e;
    await template.attention({ key: "daily-return-after-confirmed:" + p.operationId, title: "\u672C\u9879\u5DF2\u9001\u8FBE\uFF0C\u8FD4\u56DE\u5217\u8868\u9700\u8981\u5904\u7406", detail: { jobTitle: p.jobTitle, jobSource: p.jobSource, message: String(e.message || e).slice(0, 400), websiteGreetingVerified: true, stateSavedAndRereadVerified: true, doNotReplay: true, dayTaskComplete: false } });
    throw e;
  }
};
export {
  stdin_default as default
};
