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
  const controlled = (name) => typeof name === "string" && /^(?:scope|observation|positive|conversation|unlinked)-v1-[a-f0-9]{64}\.json$/.test(name);
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
  const unlinkedObservation = async (ref) => {
    if (!object(ref) || Object.keys(ref).sort().join(",") !== "name,sha256" || !digest(ref.sha256) || ref.name !== "unlinked-v1-" + ref.sha256 + ".json") throw Error("\u5373\u65F6\u539F\u6587\u7F13\u5B58\u5F15\u7528\u65E0\u6548");
    const content = await read(ref.name);
    if (content === null || sha(content) !== ref.sha256) throw Error("\u5373\u65F6\u539F\u6587\u7F13\u5B58\u7F3A\u5931\u6216\u6458\u8981\u4E0D\u4E00\u81F4");
    const value = parse(content);
    if (value.version !== 1 || value.kind !== "boss-unlinked-observation" || value.contextId !== contextId || value.accountSourceSha256 !== accountSourceSha256 || !object(value.scopeSource) || value.scopeSource.contextId !== contextId || value.scopeSource.accountSourceSha256 !== accountSourceSha256 || !timestamp(value.startedAt) || !timestamp(value.readAt) || Date.parse(value.startedAt) > Date.parse(value.readAt) || !["account", "chat"].includes(value.phase) || !object(value.observed) || value.onlyObservation !== true || value.positiveEvidence !== false || value.usableForDeduplication !== false || value.accountIdentityCheckedByWriter !== false || value.newGreetingSent !== false || value.newMessageSent !== false || value.attachmentSent !== false || value.stateChanged !== false || value.contributesToDailyQuota !== false || value.doNotReplay !== true || Object.hasOwn(value, "jobSource") || Object.hasOwn(value, "jobId") || Object.hasOwn(value, "stateCommit") || Object.hasOwn(value, "operationId")) throw Error("\u5373\u65F6\u539F\u6587\u7F13\u5B58\u8303\u56F4\u3001\u65F6\u95F4\u6216\u4EC5\u89C2\u5BDF\u8FB9\u754C\u4E0D\u4E00\u81F4");
    return value;
  };
  const conversationName = (jobSource) => "conversation-v1-" + sha(encode([contextId, accountSourceSha256, jobSource])) + ".json";
  const validateConversation = async (record, jobSource, jobId) => {
    identity(record, jobSource, jobId);
    const unlinkedMode = record.readSourceMode === "unlinked-before-job-link-v1";
    if (Object.hasOwn(record, "readSourceMode") && !unlinkedMode) throw Error("\u5386\u53F2\u4F1A\u8BDD\u8BFB\u53D6\u6765\u6E90\u6A21\u5F0F\u4E0D\u53D7\u652F\u6301");
    if (record.kind !== "boss-communication-positive" || record.proofType !== "existing-conversation-linked-job" || record.onlyExclude !== true || record.websiteGreetingVerified !== false || record.attachmentSent !== false || record.contributesToDailyQuota !== false || record.phoneMaskRechecked !== false || record.platformUniqueIdVerified !== false || record.doNotReplay !== true || Object.hasOwn(record, "stateCommit") || Object.hasOwn(record, "operationId")) throw Error("\u5386\u53F2\u4F1A\u8BDD\u7F13\u5B58\u4E0D\u7B26\u5408\u4EC5\u907F\u91CD\u8FB9\u754C");
    const observed = await observation(record.observation);
    identity(observed, jobSource, jobId);
    if (observed.observationType !== "existing-conversation-inspection" || !timestamp(observed.observedAt) || !object(observed.evidence)) throw Error("\u5386\u53F2\u4F1A\u8BDD\u7F3A\u5C11\u539F\u59CB\u540C\u6B21\u6838\u5BF9\u89C2\u5BDF");
    if (unlinkedMode ? observed.readSourceMode !== record.readSourceMode : Object.hasOwn(observed, "readSourceMode")) throw Error("\u5386\u53F2\u4F1A\u8BDD\u4E0E\u539F\u89C2\u5BDF\u7684\u8BFB\u53D6\u6765\u6E90\u6A21\u5F0F\u4E0D\u4E00\u81F4");
    const e = observed.evidence, sel = e.selectors;
    if (!object(sel) || !timestamp(e.startedAt) || Date.parse(e.startedAt) > Date.parse(observed.observedAt) || !object(e.viewJobClick) || Object.keys(e.viewJobClick).sort().join(",") !== "clicked,verified" || e.viewJobClick.clicked !== true || e.viewJobClick.verified !== false) throw Error("\u5386\u53F2\u4F1A\u8BDD\u53EA\u8BFB\u67E5\u770B\u804C\u4F4D\u6B65\u9AA4\u672A\u5B8C\u6574\u8FD4\u56DE");
    const page = (value) => {
      const u = new URL(value);
      if (u.origin !== "https://www.zhipin.com" || u.username || u.password || u.port) throw Error("\u5386\u53F2\u4F1A\u8BDD\u9875\u9762\u6765\u6E90\u4E0D\u53D7\u652F\u6301");
      return u;
    };
    const originPath = (value) => {
      const u = page(value);
      return u.origin + u.pathname;
    };
    const text = (value) => typeof value === "string" && value.trim().length > 0;
    const collection = (data, definitions, expectedSource, root = "body") => {
      if (!object(data) || data.version !== 3 || data.operation !== "collect" || data.selector !== root || data.complete !== true || !Array.isArray(data.framePath) || data.framePath.length || !Array.isArray(data.fields) || data.fields.length !== definitions.length || originPath(data.url) !== expectedSource || originPath(data.documentUrl) !== expectedSource) throw Error("\u5386\u53F2\u4F1A\u8BDD\u540C\u6B21\u91C7\u96C6\u4E0D\u5B8C\u6574\u6216\u6765\u6E90\u4E0D\u7B26");
      const values = {};
      for (const [key, selector, operation, attribute] of definitions) {
        const rows = data.fields.filter((row2) => row2?.key === key), row = rows[0];
        if (!text(selector) || rows.length !== 1 || row.selector !== selector || row.operation !== operation || row.attribute !== attribute || row.required !== true || row.count !== 1 || row.status !== "ok" || !Array.isArray(row.issues) || row.issues.length || !text(row.value)) throw Error("\u5386\u53F2\u4F1A\u8BDD\u5B57\u6BB5\u4E0D\u552F\u4E00\u6216\u4E0D\u53EF\u91C7\u7528\uFF1A" + key);
        values[key] = row.value.trim();
      }
      return values;
    };
    const nameSelector = "div:nth-of-type(3) > ul:nth-of-type(1) > li:nth-of-type(2) > a:nth-of-type(1) > span:nth-of-type(1), :root:not(:has(div:nth-of-type(3) > ul:nth-of-type(1) > li:nth-of-type(2) > a:nth-of-type(1) > span:nth-of-type(1))) div:nth-of-type(4) > ul:nth-of-type(1) > li:nth-of-type(2) > a:nth-of-type(1) > span:nth-of-type(1)";
    if (sel.chatTitle !== "div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > div > div > div:nth-of-type(1) > span:nth-of-type(1)" || sel.viewJob !== "div:nth-of-type(1) > div:nth-of-type(2) > div > div > div:nth-of-type(2) > span" || sel.canonical !== 'link[rel="canonical"]' || sel.title !== "h1" || sel.city !== "div:nth-of-type(1) > p:nth-of-type(1) > a:nth-of-type(1)" || sel.accountName !== nameSelector || sel.resumeLink !== "span:nth-of-type(1) > li:nth-of-type(1) > a:nth-of-type(1)" || sel.message !== "li:has(> div > div > i) > div > div > p > span" || sel.receipt !== "li:has(> div > div > p > span) > div > div > i" || sel.messageTime !== "li:nth-of-type(1) > div:nth-of-type(1) > span" || ![sel.contact, sel.detailContact].every(text)) throw Error("\u5386\u53F2\u4F1A\u8BDD\u56FA\u5B9A\u9009\u62E9\u5668\u6765\u6E90\u7F3A\u5931\u6216\u53D8\u5316");
    const a = collection(e.account, [["accountName", sel.accountName, "text", null], ["resumeLink", sel.resumeLink, "attribute", "href"]], "https://www.zhipin.com/web/geek/chat"), source = e.accountSource;
    if (!object(source) || source.kind !== "boss-account-source" || source.status !== "account-source-confirmed" || source.userConfirmed !== true || source.platformUniqueIdVerified !== false || source.recruitingEligible !== false || ![source.accountName, source.phoneMask, source.jobseekerResumeHref, source.sourceUrl].every(text)) throw Error("\u5386\u53F2\u4F1A\u8BDD\u7F3A\u5C11\u5DF2\u786E\u8BA4\u7684\u8D26\u53F7\u6765\u6E90");
    const resume = page(new URL(source.jobseekerResumeHref, source.sourceUrl).href);
    if (resume.pathname !== "/web/geek/resume" || a.accountName.normalize("NFKC") !== source.accountName.normalize("NFKC").trim() || new URL(a.resumeLink, e.account.url).href !== resume.href || sha(JSON.stringify(["boss-visible-account-source-v1", source.accountName, source.phoneMask, resume.origin + resume.pathname])) !== accountSourceSha256) throw Error("\u5386\u53F2\u4F1A\u8BDD\u5F53\u524D\u8D26\u53F7\u5934\u90E8\u4E0E\u539F\u786E\u8BA4\u8D26\u53F7\u6765\u6E90\u4E0D\u4E00\u81F4");
    const c = collection(e.chat, [["jobTitle", sel.chatTitle, "text", null], ["contact", sel.contact, "text", null], ["viewJob", sel.viewJob, "text", null], ["message", sel.message, "text", null], ["receipt", sel.receipt, "text", null], ["messageTime", sel.messageTime, "text", null]], "https://www.zhipin.com/web/geek/chat");
    const d = collection(e.detail, [["canonical", sel.canonical, "attribute", "href"], ["jobTitle", sel.title, "text", null], ["city", sel.city, "text", null], ["contact", sel.detailContact, "text", null]], jobSource, "html");
    const displayName = (value) => value.replace(/\s+/gu, " ").trim();
    const sameContact = c.contact === d.contact || sel.detailContact === "h2:nth-of-type(1)" && displayName(d.contact) === displayName(c.contact) + " \u521A\u521A\u6D3B\u8DC3";
    if (originPath(e.detailUrl) !== jobSource || d.canonical !== jobSource || !c.viewJob.startsWith("\u67E5\u770B\u804C\u4F4D") || ![d.jobTitle, d.jobTitle + "\uFF08\u730E\u5934\u804C\u4F4D\uFF09"].includes(c.jobTitle) || !sameContact) throw Error("\u5386\u53F2\u804A\u5929\u4E0E\u67E5\u770B\u804C\u4F4D\u540E\u7684\u5B8C\u6574\u5C97\u4F4D\u6765\u6E90\u3001\u6807\u9898\u6216\u8054\u7CFB\u4EBA\u4E0D\u4E00\u81F4");
    if (unlinkedMode) {
      const exactKeys = (value, keys) => object(value) && Object.keys(value).sort().join(",") === [...keys].sort().join(",");
      for (const data of [e.account, e.chat, e.detail]) {
        if (!exactKeys(data, ["version", "operation", "url", "documentUrl", "selector", "framePath", "complete", "fields", "renderPolicy"]) || data.renderPolicy !== "bounded-rendered-text-v2" || data.url !== data.documentUrl || page(data.url).href !== data.url || data.fields.some((row) => !exactKeys(row, ["key", "selector", "operation", "attribute", "required", "count", "status", "value", "issues", "ignoredAncestorSpaces"]) || row.ignoredAncestorSpaces !== 0)) throw Error("\u52A8\u6001\u5173\u8054\u7F3A\u5C11\u540C\u6B21\u5B8C\u6574\u539F\u59CB\u91C7\u96C6\u8FB9\u754C");
      }
      const rawCanonical = e.detail.fields.find((row) => row.key === "canonical").value;
      const canonicalUrl = page(rawCanonical), detailUrl = page(e.detail.url);
      if (rawCanonical !== jobSource || canonicalUrl.href !== rawCanonical || canonicalUrl.search || canonicalUrl.hash || canonicalUrl.origin + canonicalUrl.pathname !== jobSource || detailUrl.origin + detailUrl.pathname !== jobSource || e.detailUrl !== e.detail.url || e.account.url !== e.chat.url || !object(observed.scopeSource) || observed.scopeSource.contextId !== contextId || observed.scopeSource.accountSourceSha256 !== accountSourceSha256 || !object(observed.readObservations) || Object.keys(observed.readObservations).sort().join(",") !== "account,chat") throw Error("\u52A8\u6001\u5173\u8054\u7684\u5B8C\u6574 canonical\u3001\u5B9E\u9645\u7F51\u5740\u6216\u539F\u59CB\u8BFB\u53D6\u5F15\u7528\u4E0D\u4E00\u81F4");
    }
    let previousTime = Date.parse(e.startedAt);
    if (unlinkedMode) {
      for (const phase of ["account", "chat"]) {
        const earlier = await unlinkedObservation(observed.readObservations[phase]);
        if (earlier.phase !== phase || earlier.startedAt !== e.startedAt || encode(earlier.observed) !== encode(e[phase]) || encode(earlier.scopeSource) !== encode(observed.scopeSource) || Date.parse(earlier.readAt) < previousTime || Date.parse(earlier.readAt) > Date.parse(observed.observedAt)) throw Error("\u52A8\u6001\u5173\u8054\u7F3A\u5C11\u540C\u6B21\u5373\u65F6\u7F13\u5B58\u539F\u6587\uFF1A" + phase);
        previousTime = Date.parse(earlier.readAt);
      }
    } else {
      for (const phase of ["account", "chat"]) {
        const earlier = await observation(observed.readObservations?.[phase]);
        identity(earlier, jobSource, jobId);
        if (earlier.observationType !== "existing-conversation-" + phase + "-read" || earlier.startedAt !== e.startedAt || encode(earlier.fields) !== encode(e[phase]) || !timestamp(earlier.observedAt) || Date.parse(earlier.observedAt) < previousTime || Date.parse(earlier.observedAt) > Date.parse(observed.observedAt)) throw Error("\u5386\u53F2\u4F1A\u8BDD\u7F3A\u5C11\u5DF2\u5373\u65F6\u7F13\u5B58\u7684\u540C\u6B21\u539F\u59CB\u8BFB\u53D6\uFF1A" + phase);
        previousTime = Date.parse(earlier.observedAt);
      }
    }
    if (record.jobTitle !== d.jobTitle || record.actualCity !== d.city || record.contact !== c.contact || record.accountName !== a.accountName || record.observationSha256 !== record.observation.sha256 || record.evidenceSha256 !== sha(encode(e))) throw Error("\u5386\u53F2\u4F1A\u8BDD\u6458\u8981\u6216\u53EF\u89C1\u8EAB\u4EFD\u4E0E\u539F\u89C2\u5BDF\u4E0D\u4E00\u81F4");
    return record;
  };
  const positive = async (jobSource, jobId) => {
    const content = await read(positiveName(jobSource));
    if (content !== null) return validatePositive(parse(content), jobSource, jobId);
    const conversation = await read(conversationName(jobSource));
    return conversation === null ? null : validateConversation(parse(conversation), jobSource, jobId);
  };
  return { init: guarded(init), positive: guarded(positive) };
}
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v), hash = (v) => createHash("sha256").update(JSON.stringify(v)).digest("hex"), digest = (v) => typeof v === "string" && /^[a-f0-9]{64}$/.test(v), text = (v, n) => typeof v === "string" && v.length > 0 && v.length <= n && v.trim() === v && !/[ -]/.test(v);
  if (!obj(input) || Object.keys(input).sort().join(",") !== "account,candidate,configuration,fixedConfiguration,state") throw Error("\u7F3A\u5C11\u56FA\u5B9A\u914D\u7F6E\u3001\u8D26\u53F7\u3001\u5019\u9009\u6216\u6700\u65B0\u8D26\u672C\u6765\u6E90");
  const f = input.configuration, raw = input.fixedConfiguration, c = input.candidate, a = input.account, s = input.state;
  if (!obj(raw) || raw.version !== 1 || raw.operation !== "configuration" || !text(raw.contextId, 200) || !Number.isSafeInteger(raw.revision) || raw.revision < 0 || !obj(raw.value) || !obj(s) || s.version !== 1 || s.operation !== "state.read" || s.contextId !== raw.contextId || !Number.isSafeInteger(s.revision) || s.revision < 0 || !obj(s.value) || Object.keys(s.value).sort().join(",") !== "applicationIntents,conversationControls,queueEntries,replyIntents" || !["applicationIntents", "conversationControls", "replyIntents", "queueEntries"].every((k) => Array.isArray(s.value[k])) || s.value.queueEntries.length > 1e3) throw Error("\u6700\u65B0\u5B8C\u6574\u72B6\u6001\u4E0E\u672C\u6B21\u56FA\u5B9A\u914D\u7F6E\u4E0D\u5C5E\u540C\u4E00\u6709\u6548\u4E0A\u4E0B\u6587");
  if (!obj(f) || f.version !== 1 || f.kind !== "daily-apply-configuration" || f.status !== "conditions-ready" || f.readyForLoop !== true || f.configurationRevision !== raw.revision || !Number.isSafeInteger(f.userDailyLimit) || f.userDailyLimit < 1 || f.userDailyLimit > 150 || !obj(f.conditions) || Object.keys(f.conditions).sort().join(",") !== "cities,excludedRoles,salaryMax,salaryMin,targetRoles" || f.timeZone !== raw.value.replyTimeZone) throw Error("\u672C\u6B21\u6BCF\u65E5\u914D\u7F6E\u5C1A\u672A\u5B8C\u6574\u6838\u5BF9");
  for (const k of ["cities", "excludedRoles", "salaryMax", "salaryMin", "targetRoles"]) if (JSON.stringify(f.conditions[k]) !== JSON.stringify(raw.value[k])) throw Error("\u6574\u7406\u540E\u6761\u4EF6\u4E0E\u56FA\u5B9A\u7528\u6237\u914D\u7F6E\u4E0D\u4E00\u81F4");
  const q = f.conditions, dayOf = (value) => new Intl.DateTimeFormat("sv-SE", { timeZone: f.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(value), now = /* @__PURE__ */ new Date(), day = dayOf(now);
  if (day !== f.configuredDay || !Array.isArray(q.cities) || !q.cities.length || !q.cities.every((v) => text(v, 100))) throw Error("\u5F53\u5929\u6216\u914D\u7F6E\u57CE\u5E02\u8303\u56F4\u65E0\u6548\uFF0C\u505C\u6B62\u672C\u6279");
  if (!obj(c) || c.version !== 1 || c.kind !== "daily-job-hard-conditions" || !["hard-condition-mismatch", "hard-conditions-needs-review", "hard-conditions-ready-for-skill"].includes(c.status) || c.configurationRevision !== raw.revision || c.configuredDay !== day || c.actualCity !== c.jobCity || !q.cities.includes(c.jobCity) || c.eligibleForActions !== false || c.applied !== false || c.dayTaskComplete !== false || c.siteDailyLimitConfirmed !== false || c.readyForSkillAssessment !== (c.status === "hard-conditions-ready-for-skill") || !text(c.jobTitle, 200) || !text(c.jobSource, 4096)) throw Error("\u5019\u9009\u5C97\u4F4D\u3001\u5B9E\u9645\u57CE\u5E02\u6216\u56FA\u5B9A\u914D\u7F6E\u6765\u6E90\u4E0D\u4E00\u81F4");
  const jobUrl = new URL(c.jobSource), jobMatch = /^\/job_detail\/([A-Za-z0-9_~-]+)\.html$/.exec(jobUrl.pathname);
  if (!text(jobMatch?.[1], 200) || jobUrl.protocol !== "https:" || jobUrl.hostname !== "www.zhipin.com" || jobUrl.port || jobUrl.username || jobUrl.password || jobUrl.search || jobUrl.hash || !jobMatch) throw Error("\u5B9E\u9645\u5C97\u4F4D\u6765\u6E90\u65E0\u6548");
  if (!obj(a) || a.version !== 1 || a.status !== "current-account-source-matched" || a.currentAccountVerified !== true || a.platformUniqueIdVerified !== false || a.eligibleForActions !== false || !text(a.accountName, 100) || !text(a.phoneMask, 100) || !text(a.sourceUrl, 4096) || !text(a.jobseekerResumeHref, 4096) || !text(a.checkedAt, 64) || !Number.isFinite(Date.parse(a.checkedAt)) || Date.parse(a.checkedAt) > now.getTime() || dayOf(new Date(a.checkedAt)) !== day) throw Error("\u7F3A\u5C11\u672C\u6B21\u91CD\u65B0\u91C7\u96C6\u4E00\u81F4\u7684\u8D26\u53F7\u53EF\u89C1\u6765\u6E90");
  const accountPage = new URL(a.sourceUrl), resume = new URL(a.jobseekerResumeHref, a.sourceUrl);
  if (accountPage.origin !== "https://www.zhipin.com" || accountPage.pathname !== "/web/geek/account" || accountPage.searchParams.get("type") !== "accountSet" || accountPage.username || accountPage.password || accountPage.hash || resume.origin !== "https://www.zhipin.com" || resume.pathname !== "/web/geek/resume" || resume.username || resume.password) throw Error("\u8D26\u53F7\u89D2\u8272\u6765\u6E90\u4E0D\u7B26");
  const accountSourceSha256 = hash(["boss-visible-account-source-v1", a.accountName, a.phoneMask, resume.origin + resume.pathname]), jobId = jobMatch[1], key = hash(["boss-application-v1", accountSourceSha256, jobId]), issues = [], rows = Object.hasOwn(s.value, "applicationIntents") ? s.value.applicationIntents : [];
  const known = raw.value.knownContactedJobs ?? [], knownAlias = raw.value.knownContactAccountAlias ?? "", knownMask = raw.value.knownContactPhoneMask ?? "", knownDate = raw.value.knownGreetingDate ?? "", knownUsed = raw.value.knownGreetingsUsed ?? 0;
  if (!Array.isArray(known) || known.length > 500 || !Number.isSafeInteger(knownUsed) || knownUsed < 0 || knownUsed > 150 || typeof knownDate !== "string" || knownDate.length > 10) throw Error("\u65E2\u6709\u6C9F\u901A\u6392\u9664\u6216\u4FDD\u5B88\u5360\u989D\u683C\u5F0F\u65E0\u6548");
  if ((known.length || knownUsed > 0) && (knownAlias !== a.accountAlias || knownMask !== a.phoneMask)) throw Error("\u65E2\u6709\u6C9F\u901A\u6240\u5C5E\u8D26\u53F7\u4E0E\u672C\u6B21\u5B9E\u9645\u8D26\u53F7\u4E0D\u4E00\u81F4");
  if (knownUsed > 0 && (!/^\d{4}-\d{2}-\d{2}$/.test(knownDate) || !Number.isFinite(Date.parse(knownDate + "T00:00:00Z")) || (/* @__PURE__ */ new Date(knownDate + "T00:00:00Z")).toISOString().slice(0, 10) !== knownDate || knownDate > day)) throw Error("\u4FDD\u5B88\u5360\u989D\u65E5\u671F\u7F3A\u5931\u3001\u65E0\u6548\u6216\u5904\u4E8E\u672A\u6765");
  const knownKeys = /* @__PURE__ */ new Set();
  for (const value of known) {
    if (typeof value !== "string" || value.length > 4096 || !value.trim()) throw Error("\u5DF2\u6709\u6C9F\u901A\u987B\u586B\u5199\u5B8C\u6574\u5C97\u4F4D\u7F51\u5740");
    const u = new URL(value), m = /^\/job_detail\/([A-Za-z0-9_~-]+)\.html$/.exec(u.pathname);
    if (u.origin !== "https://www.zhipin.com" || u.username || u.password || u.search || u.hash || !m || u.href !== value) throw Error("\u5DF2\u6709\u6C9F\u901A\u4E0D\u662F\u89C4\u8303\u5B8C\u6574\u5C97\u4F4D\u7F51\u5740");
    const k = hash(["boss-application-v1", accountSourceSha256, m[1]]);
    if (knownKeys.has(k)) throw Error("\u5DF2\u6709\u6C9F\u901A\u6392\u9664\u9879\u91CD\u590D");
    knownKeys.add(k);
  }
  const duplicateKnown = knownKeys.has(key), knownBaselineToday = knownDate === day ? knownUsed : 0;
  const fields = ["accountSourceSha256", "batchId", "configurationRevision", "createdAt", "day", "jobId", "jobSource", "jobSourceSha256", "key", "profileVersionId", "resumeSha256", "status", "timeZone"].sort().join(","), counts = { reserved: 0, confirmed: 0, failed: 0, unknown: 0 }, seen = /* @__PURE__ */ new Set();
  let invalid = false, otherAccount = false, otherZone = false, duplicate = null;
  if (!Array.isArray(rows) || rows.length > 500) {
    invalid = true;
    issues.push("\u6295\u9012\u8BB0\u5F55\u683C\u5F0F\u9519\u8BEF\u6216\u8D85\u8FC7\u5BB9\u91CF\uFF0C\u4E0D\u80FD\u5F53\u4F5C\u7A7A\u8D26\u672C");
  } else for (const r of rows) {
    signal.throwIfAborted();
    let ok = obj(r) && Object.keys(r).sort().join(",") === fields && ["key", "accountSourceSha256", "jobSourceSha256", "resumeSha256"].every((k) => digest(r[k])) && text(r.jobId, 200) && text(r.jobSource, 4096) && text(r.profileVersionId, 200) && text(r.batchId, 64) && text(r.timeZone, 100) && text(r.createdAt, 64) && r.createdAt.length >= 20 && typeof r.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.day) && Number.isSafeInteger(r.configurationRevision) && r.configurationRevision >= 0 && text(r.status, 20) && Object.hasOwn(counts, r.status);
    if (ok) try {
      const u = new URL(r.jobSource), m = /^\/job_detail\/([A-Za-z0-9_~-]+)\.html$/.exec(u.pathname), at = new Date(r.createdAt);
      ok = u.protocol === "https:" && u.hostname === "www.zhipin.com" && !u.port && !u.username && !u.password && !u.search && !u.hash && m?.[1] === r.jobId && r.key === hash(["boss-application-v1", r.accountSourceSha256, r.jobId]) && Number.isFinite(at.getTime()) && at.toISOString() === r.createdAt && at.getTime() <= now.getTime() && new Intl.DateTimeFormat("sv-SE", { timeZone: r.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(at) === r.day && !seen.has(r.key);
    } catch {
      ok = false;
    }
    if (!ok) {
      invalid = true;
      continue;
    }
    seen.add(r.key);
    if (r.accountSourceSha256 !== accountSourceSha256) {
      otherAccount = true;
      continue;
    }
    if (r.timeZone !== f.timeZone) {
      otherZone = true;
      continue;
    }
    if (r.day > day) {
      invalid = true;
      continue;
    }
    if (r.day === day) counts[r.status]++;
    if (r.key === key) duplicate = { status: r.status, day: r.day, createdAt: r.createdAt };
  }
  if (invalid) issues.push("\u5B58\u5728\u635F\u574F\u3001\u91CD\u590D\u3001\u672A\u6765\u65E5\u671F\u6216\u6765\u6E90\u8EAB\u4EFD\u4E0D\u4E00\u81F4\u7684\u6295\u9012\u8BB0\u5F55\uFF0C\u4EA4\u672C\u4EBA\u6838\u5BF9");
  if (otherAccount) issues.push("\u8BB0\u5F55\u4E2D\u5B58\u5728\u4E0D\u540C\u8D26\u53F7\u53EF\u89C1\u6765\u6E90\uFF0C\u4E0D\u80FD\u6309\u522B\u540D\u5EFA\u7ACB\u65B0\u989D\u5EA6");
  if (otherZone) issues.push("\u989D\u5EA6\u65F6\u533A\u4E0E\u65E2\u6709\u8BB0\u5F55\u4E0D\u540C\uFF0C\u4E0D\u80FD\u81EA\u52A8\u8FC1\u79FB\u6216\u91CD\u7F6E");
  if (Array.isArray(rows) && rows.length === 500) issues.push("\u6295\u9012\u8BB0\u5F55\u5DF2\u6EE1500\u9879\uFF0C\u4E0D\u81EA\u52A8\u6E05\u7406");
  const usage = invalid || otherAccount || otherZone ? null : knownBaselineToday + Object.values(counts).reduce((n, v) => n + v, 0), remaining = usage === null ? null : Math.max(0, f.userDailyLimit - usage);
  if (remaining === 0 && f.userDailyLimit < 150) issues.push("\u672C\u5730\u6BCF\u65E5\u989D\u5EA6\u5DF2\u7528\u5B8C\uFF1B\u8FD9\u91CC\u53EA\u6682\u505C\uFF0C\u4E0D\u80FD\u5224\u7F51\u7AD9\u5F53\u5929\u5B8C\u6210");
  let duplicateCached = false;
  if (!issues.length && !duplicate && !duplicateKnown) {
    const cache = communicationCache(template, signal, s.contextId, accountSourceSha256);
    await cache.init();
    duplicateCached = !!await cache.positive(c.jobSource, jobId);
  }
  const review = issues.length > 0, skipDuplicate = (!!duplicate || duplicateKnown || duplicateCached) && !review, ready = !review && !skipDuplicate && c.readyForSkillAssessment;
  const result = { version: 1, kind: "daily-application-ledger-check", status: review ? "ledger-needs-review" : skipDuplicate ? "application-already-recorded" : ready ? "ledger-ready-for-skill" : "candidate-not-ready", decision: review ? "\u6682\u505C\u5E76\u4EA4\u672C\u4EBA\u6838\u5BF9" : skipDuplicate ? "\u8DF3\u8FC7\u5DF2\u5904\u7406\u5C97\u4F4D" : ready ? "\u7EE7\u7EED\u56FA\u5B9ASkill\u8BC4\u4F30" : c.decision, issues, jobTitle: c.jobTitle, jobSource: c.jobSource, actualCity: c.actualCity, jobCity: c.jobCity, key, accountSourceSha256, platformUniqueIdVerified: false, configurationRevision: raw.revision, stateRevision: s.revision, contextId: s.contextId, day, timeZone: f.timeZone, quota: { limit: f.userDailyLimit, used: usage, remaining, knownBaselineToday, siteRemainingVerified: false, confirmed: usage === null ? null : counts.confirmed, reserved: usage === null ? null : counts.reserved, unknown: usage === null ? null : counts.unknown, failed: usage === null ? null : counts.failed }, existingIntent: duplicate, excludedByKnownContact: duplicateKnown, readyForSkillAssessment: ready, needsUserReview: review || c.needsUserReview === true, skipped: !ready, eligibleForActions: false, reservedNow: false, applied: false, dayTaskComplete: false, siteDailyLimitConfirmed: false, note: "\u53EA\u8BFB\u6700\u65B0\u5B8C\u6574\u72B6\u6001\uFF1B\u672A\u77E5\u548C\u9884\u7559\u4FDD\u7559\u5360\u989D\u5E76\u9694\u79BB\u540C\u5C97\u4F4D\uFF0C\u5176\u4ED6\u5C97\u4F4D\u72EC\u7ACB\u6838\u5BF9\uFF1B\u5DF2\u6709\u6C9F\u901A\u4EC5\u6392\u9664\uFF0C\u65E2\u6709\u5360\u989D\u4EC5\u5728\u6240\u5C5E\u65E5\u671F\u4E0E\u672C\u8D26\u53F7\u4E0B\u4FDD\u5B88\u7D2F\u8BA1\uFF0C\u4E0D\u751F\u6210\u65B0confirmed\u56DE\u6267\uFF0C\u4E0D\u4EE3\u8868\u7F51\u7AD9\u5269\u4F59\u989D\u5EA6\uFF1B\u8D26\u53F7\u53EF\u89C1\u6765\u6E90\u4E0D\u662F\u5E73\u53F0\u552F\u4E00ID\u3002\u7EE7\u7EED\u8BC4\u4F30\u4ECD\u987B\u56FA\u5B9ASkill\u3001\u5B8C\u6574\u4E8B\u5B9E\u548C\u5F53\u524D\u6765\u6E90/\u6750\u6599\u590D\u9A8C\uFF0C\u5B9E\u9645\u9884\u7559\u53CA\u63D0\u4EA4\u53E6\u884C\u7F16\u6392\u3002" };
  signal.throwIfAborted();
  await Promise.resolve(result);
  if (review) await template.attention({ key: "daily-application-ledger:" + hash([raw.contextId, key, s.revision, day, issues]), title: "\u6295\u9012\u8BB0\u5F55\u4E0E\u989D\u5EA6\u5F85\u6838\u5BF9\uFF1A" + c.jobTitle, detail: { jobTitle: c.jobTitle, jobSource: c.jobSource, day, timeZone: f.timeZone, quota: result.quota, issues, eligibleForActions: false } });
  signal.throwIfAborted();
  return result;
};
export {
  stdin_default as default
};
