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
  const observation = async (ref) => {
    if (!object(ref) || !controlled(ref.name) || !ref.name.startsWith("observation-v1-") || !digest(ref.sha256) || ref.name !== "observation-v1-" + ref.sha256 + ".json") throw Error("\u7F13\u5B58\u89C2\u5BDF\u5F15\u7528\u65E0\u6548");
    const content = await read(ref.name);
    if (content === null || sha(content) !== ref.sha256) throw Error("\u7F13\u5B58\u89C2\u5BDF\u7F3A\u5931\u6216\u6458\u8981\u4E0D\u4E00\u81F4");
    const value = parse(content);
    if (value.kind !== "boss-communication-observation") throw Error("\u7F13\u5B58\u5F15\u7528\u4E0D\u662F\u5B9E\u9645\u89C2\u5BDF");
    return value;
  };
  const positiveName = (jobSource) => "positive-v1-" + sha(encode([contextId, accountSourceSha256, jobSource])) + ".json";
  const validatePositive = async (record, jobSource, jobId) => {
    identity(record, jobSource, jobId);
    const evidence = record.evidence, commit = record.stateCommit;
    if (record.kind !== "boss-communication-positive" || record.proofType !== "current-run-delivery-state" || typeof record.operationId !== "string" || !record.operationId || typeof record.operationKey !== "string" || !record.operationKey || !object(commit) || commit.contextId !== contextId || typeof commit.operationId !== "string" || !commit.operationId || !Number.isSafeInteger(commit.revision) || commit.revision < 1 || !timestamp(commit.committedAt) || !object(evidence) || evidence.kind !== "first-communication-chat-delivery-verified" || evidence.jobSource !== jobSource || evidence.websiteGreetingVerified !== true || evidence.customFirstMessageVerified !== true || evidence.linkedJobVerified !== true || !["\u9001\u8FBE", "\u5DF2\u8BFB"].includes(evidence.receipt) || !digest(evidence.messageSha256) || !digest(evidence.approvedMessageSha256) || !digest(evidence.chatFieldsSha256) || !timestamp(evidence.observedAt)) throw Error("\u7F13\u5B58\u4E0D\u5177\u5907\u5DF2\u6838\u5BF9\u9001\u8FBE\u53CA\u72B6\u6001\u56DE\u8BFB\u7684\u6B63\u8BC1\u636E");
    const observed = await observation(record.observation);
    identity(observed, jobSource, jobId);
    if (observed.observationType !== "chat-receipt" || observed.operationId !== record.operationId || observed.operationKey !== record.operationKey || typeof observed.runId !== "string" || !observed.runId || observed.jobTitle !== evidence.jobTitle || observed.actualCity !== evidence.actualCity || observed.approvedMessageSha256 !== evidence.approvedMessageSha256 || observed.sourcePage !== "https://www.zhipin.com/web/geek/chat" || observed.coverage?.linkedJobVerified !== true || observed.coverage?.uniqueFields !== true || !object(observed.fields) || !["\u9001\u8FBE", "\u5DF2\u8BFB"].includes(observed.fields.receipt) || typeof observed.fields.message !== "string" || !observed.fields.message || !timestamp(observed.observedAt)) throw Error("\u7F13\u5B58\u9001\u8FBE\u6B63\u8BC1\u636E\u4E0E\u539F\u804A\u5929\u89C2\u5BDF\u4E0D\u4E00\u81F4");
    const verified = await observation(record.verification);
    identity(verified, jobSource, jobId);
    if (verified.observationType !== "chat-verification" || verified.operationId !== record.operationId || verified.operationKey !== record.operationKey || verified.runId !== observed.runId || encode(verified.evidence) !== encode(evidence) || verified.coverage?.sameCollectionVerified !== true || !object(verified.fields) || verified.fields.complete !== true || !timestamp(verified.observedAt)) throw Error("\u7F13\u5B58\u7F3A\u5C11\u672C\u6B21\u540C\u6B21\u91C7\u96C6\u7684\u539F\u59CB\u6838\u5BF9\u8BC1\u636E");
    const fields = verified.fields, values = {}, norm = (value) => String(value).replace(/\s+/g, ""), clean = (value) => String(value).replace(/\r\n?/g, "\n").trim();
    const sourceURL = (value) => {
      const u = new URL(value);
      if (u.origin !== "https://www.zhipin.com" || u.username || u.password || u.port) throw Error("\u7F13\u5B58\u804A\u5929\u6765\u6E90\u7F51\u5740\u4E0D\u53D7\u652F\u6301");
      return u.origin + u.pathname;
    };
    if (fields.version !== 3 || fields.operation !== "collect" || fields.selector !== "body" || !Array.isArray(fields.framePath) || fields.framePath.length || !Array.isArray(fields.fields) || fields.fields.length !== 4 || sourceURL(fields.url) !== observed.sourcePage || sourceURL(fields.documentUrl) !== observed.sourcePage) throw Error("\u7F13\u5B58\u540C\u6B21\u804A\u5929\u91C7\u96C6\u7ED3\u6784\u6216\u6765\u6E90\u4E0D\u4E00\u81F4");
    for (const key of ["jobTitle", "messageTime", "receipt", "message"]) {
      const rows = fields.fields.filter((row2) => row2?.key === key), row = rows[0];
      const fieldValue = (value) => key === "jobTitle" && observed.selectors?.jobTitle === "div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > div > div > div:nth-of-type(1) > span:nth-of-type(1)" && typeof value === "string" && value.trim() === observed.jobTitle + "\uFF08\u730E\u5934\u804C\u4F4D\uFF09" ? observed.jobTitle : value;
      if (rows.length !== 1 || row.selector !== observed.selectors?.[key] || row.operation !== "text" || row.attribute !== null || row.required !== true || row.count !== 1 || row.status !== "ok" || !Array.isArray(row.issues) || row.issues.length || typeof row.value !== "string" || !row.value.trim() || norm(fieldValue(row.value)) !== norm(observed.fields[key] ?? "")) throw Error("\u7F13\u5B58\u804A\u5929\u5B57\u6BB5\u4E0D\u552F\u4E00\u6216\u4E0E\u539F\u5B9E\u9645\u5C55\u793A\u4E0D\u4E00\u81F4\uFF1A" + key);
      values[key] = fieldValue(row.value).trim();
    }
    if (sha(encode(fields)) !== evidence.chatFieldsSha256 || sha(values.message) !== evidence.messageSha256 || typeof observed.approvedMessage !== "string" || sha(observed.approvedMessage) !== evidence.approvedMessageSha256 || clean(observed.fields.message) !== clean(observed.approvedMessage) || clean(values.message).replace(/\n/g, "") !== clean(observed.approvedMessage).replace(/\n/g, "") || values.receipt !== evidence.receipt || values.messageTime !== evidence.messageTime || values.jobTitle.replace(/\s+/gu, " ").trim() !== String(evidence.jobTitle).replace(/\s+/gu, " ").trim()) throw Error("\u7F13\u5B58\u6B63\u6587\u3001\u6458\u8981\u3001\u56DE\u6267\u3001\u65F6\u95F4\u6216\u5C97\u4F4D\u4E0E\u539F92\u6838\u5BF9\u53E3\u5F84\u4E0D\u4E00\u81F4");
    if (!timestamp(observed.checkedAt) || typeof observed.day !== "string" || typeof observed.timeZone !== "string" || !/^\d{1,2}:\d{2}$/.test(values.messageTime)) throw Error("\u7F13\u5B58\u7F3A\u5C11\u539F\u540C\u65E5\u6D88\u606F\u65F6\u95F4\u8303\u56F4");
    const parts = (value) => Object.fromEntries(new Intl.DateTimeFormat("sv-SE", { timeZone: observed.timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value)).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
    const at = parts(observed.observedAt), checked = parts(observed.checkedAt), verifiedAt = parts(evidence.observedAt), [hh, mm] = values.messageTime.split(":").map(Number), minute = hh * 60 + mm, dayOf = (value) => [value.year, value.month, value.day].join("-");
    if (hh > 23 || mm > 59 || dayOf(at) !== observed.day || dayOf(checked) !== observed.day || dayOf(verifiedAt) !== observed.day || minute < Number(checked.hour) * 60 + Number(checked.minute) - 1 || minute > Number(at.hour) * 60 + Number(at.minute) + 1 || Date.parse(evidence.observedAt) < Date.parse(observed.observedAt) || Date.parse(commit.committedAt) < Date.parse(evidence.observedAt)) throw Error("\u7F13\u5B58\u6D88\u606F\u65F6\u95F4\u4E0D\u80FD\u5F52\u5C5E\u4E8E\u539F\u540C\u6B21\u540C\u65E5\u64CD\u4F5C");
    return record;
  };
  const positive = async (jobSource, jobId) => {
    const content = await read(positiveName(jobSource));
    return content === null ? null : validatePositive(parse(content), jobSource, jobId);
  };
  const recordDelivery = async (value) => {
    const record = { ...value, version: 1, kind: "boss-communication-positive", proofType: "current-run-delivery-state", contextId, accountSourceSha256 };
    await validatePositive(record, value.jobSource, value.jobId);
    const previous = await positive(value.jobSource, value.jobId);
    if (previous) return { name: positiveName(value.jobSource), sha256: sha(encode(previous)) };
    const ref = await put(positiveName(value.jobSource), record);
    await positive(value.jobSource, value.jobId);
    return ref;
  };
  return { init: guarded(init), recordDelivery: guarded(recordDelivery) };
}
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
  let cachedDelivery;
  try {
    const cache = communicationCache(template, signal, p.contextId, p.intent.accountSourceSha256);
    await cache.init();
    cachedDelivery = await cache.recordDelivery({ jobId: p.intent.jobId, jobSource: p.jobSource, operationId: p.operationId, operationKey: p.operationKey, observation: p.cachedObservation, verification: p.cachedVerification, evidence: p.evidence, stateCommit: { contextId: p.contextId, operationId: r.operationId, revision: s.revision, committedAt: r.committedAt } });
  } catch (error) {
    if (signal.aborted) throw error;
    throw Error("\u672C\u9879\u9001\u8FBE\u53CA\u72B6\u6001\u5DF2\u4FDD\u5B58\uFF0C\u7F13\u5B58\u5C1A\u672A\u5B8C\u6210\uFF1B\u4FDD\u7559\u8BB0\u5F55\uFF0C\u4E0D\u91CD\u590D\u53D1\u9001\uFF1A" + String(error?.message || error).slice(0, 400));
  }
  const todayRows = s.value.applicationIntents.filter((v) => v.accountSourceSha256 === p.intent.accountSourceSha256 && v.timeZone === p.intent.timeZone && v.day === p.intent.day), result = { version: 1, kind: "daily-first-communication-confirmed", status: "\u6D88\u606F\u9001\u8FBE\uFF0C\u72B6\u6001\u5DF2\u4FDD\u5B58\u5E76\u91CD\u8BFB\u4E00\u81F4", jobTitle: p.jobTitle, jobSource: p.jobSource, actualCity: p.actualCity, messageTime: p.evidence.messageTime, messageReceipt: p.evidence.receipt, websiteGreetingVerified: true, stateRevision: s.revision, stateSavedAndRereadVerified: true, otherRecordsPreserved: true, quotaRowsBefore: todayRows.length, quotaRowsAfter: todayRows.length, confirmedGreetingsToday: todayRows.filter((v) => v.status === "confirmed").length, attachmentSent: false, applied: false, dayTaskComplete: false, siteDailyLimitConfirmed: false, returnedToList: false, evidence: p.evidence, cacheReceipt: cachedDelivery };
  await Promise.resolve(result);
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
    await Promise.resolve(done);
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
