import { createHash as _ } from "node:crypto";
const me = /* @__PURE__ */ (() => {
  const R = _;
  function L(E) {
    return E.status === "review" && !E.operationKey && !E.modelRequestId && E.sourceReviewVersion !== "chat-list-direct-v5" && /关联职位没有可核对的继续沟通入口|固定成员缺少可核对的定向搜索姓名，未猜测|固定成员缺少唯一可见身份|关联职位返回后的完整消息或对象变化/u.test(String(E.reason || ""));
  }
  async function ne(E, C, x) {
    const { accountKey: t, contextId: e, day: l, timeZone: a, revision: u, configuration: r } = x, c = r.acceptanceNewGreetings ?? 0;
    if (c !== 0 && c !== 2) throw Error("\u9A8C\u6536\u65B0\u62DB\u547C\u6570\u53EA\u80FD\u4E3A0\uFF08\u6B63\u5F0F\u6A21\u5F0F\uFF09\u62162");
    if (!c) return null;
    C.throwIfAborted();
    const i = (n) => Array.isArray(n) ? n.map(i) : n && typeof n == "object" ? Object.fromEntries(Object.keys(n).sort().map((m) => [m, i(n[m])])) : n, d = (n) => R("sha256").update(JSON.stringify(i(n))).digest("hex"), p = (n) => {
      const { sha256: m, ...K } = n;
      if (m !== d(K)) throw Error("\u9A8C\u6536\u6765\u6E90\u6458\u8981\u4E0D\u7B26\uFF0C\u4FDD\u7559\u539F\u8BB0\u5F55");
      return n;
    }, f = p(JSON.parse(await E.file("communication-cache", { operation: "read", name: "account-outbound-safety-v1-" + t + ".json" })));
    if (f.kind !== "boss-account-outbound-safety" || f.accountKey !== t || !Array.isArray(f.records)) throw Error("\u9A8C\u6536\u8D26\u53F7\u5B89\u5168\u7D22\u5F15\u4E0D\u7B26");
    const h = new Intl.DateTimeFormat("sv-SE", { timeZone: a, year: "numeric", month: "2-digit", day: "2-digit" }).format(/* @__PURE__ */ new Date());
    if (l !== h) throw Error("\u9A8C\u6536\u8DE8\u65E5\uFF0C\u505C\u6B62\u65B0\u589E");
    const s = f.records.filter((n) => n.type === "first-contact" && n.sightings.some((m) => m.day === l && m.timeZone === a)), B = s.map((n) => n.businessKey);
    if (new Set(B).size !== B.length) throw Error("\u9A8C\u6536\u5360\u989D\u952E\u91CD\u590D");
    const A = { accountKey: t, contextId: e, day: l, timeZone: a, revision: u, target: c }, S = "test-greeting-baseline-v1-" + t + "-" + d(A).slice(0, 24) + ".json";
    let w = null;
    try {
      w = await E.file("communication-cache", { operation: "read", name: S });
    } catch (n) {
      if (!String(n.message || n).includes("ENOENT")) throw n;
    }
    let b;
    if (w === null) {
      if (r.firstContactDailyBudget !== B.length + c) throw Error("\u6D4B\u8BD5\u9884\u7B97\u5FC5\u987B\u7B49\u4E8E\u672C\u65E5\u5DF2\u6709\u5360\u989D\u52A02\uFF0C\u7981\u6B62\u6269\u5927\u6216\u91CD\u7F6E\u672C\u8F6E");
      if (b = { version: 1, kind: "boss-test-greeting-baseline", identity: A, keys: B.slice().sort(), budget: r.firstContactDailyBudget, indexSha256: f.sha256, createdAt: (/* @__PURE__ */ new Date()).toISOString() }, b.sha256 = d(b), await E.file("communication-cache", { operation: "write", name: S, content: JSON.stringify(b) }), w = await E.file("communication-cache", { operation: "read", name: S }), JSON.stringify(p(JSON.parse(w))) !== JSON.stringify(b)) throw Error("\u6D4B\u8BD5\u57FA\u7EBF\u672A\u51C6\u786E\u8BFB\u56DE");
    } else b = p(JSON.parse(w));
    if (d(b.identity) !== d(A) || b.budget !== r.firstContactDailyBudget || !Array.isArray(b.keys) || b.keys.some((n) => !B.includes(n))) throw Error("\u6D4B\u8BD5\u57FA\u7EBF\u6216\u9884\u7B97\u53D8\u5316\uFF0C\u505C\u6B62\u4E14\u4FDD\u7559\u5386\u53F2");
    const y = s.filter((n) => !b.keys.includes(n.businessKey));
    if (y.length > c) throw Error("\u6D4B\u8BD5\u5360\u989D\u8D85\u51FA\u4E24\u6B21\uFF0C\u505C\u6B62");
    for (const n of y) if (n.sightings.some((m) => m.day === l && m.timeZone === a && (m.contextId !== e || m.status === "unknown" || m.status === "failed"))) throw Error("\u6D4B\u8BD5\u65B0\u589E\u6765\u6E90\u51B2\u7A81\u6216\u7ED3\u679C\u672A\u77E5\uFF0C\u7981\u6B62\u8865\u53D1");
    const D = y.filter((n) => n.sightings.some((m) => m.day === l && m.timeZone === a && m.contextId === e && m.status === "confirmed"));
    return { version: 1, kind: "boss-test-new-greeting-completion", ...A, baselineName: S, baselineSha256: b.sha256, newOccupied: y.length, newConfirmed: D.length, confirmedKeys: D.map((n) => n.businessKey).sort(), confirmed: D.length === c, siteDailyLimitConfirmed: false, checkedAt: (/* @__PURE__ */ new Date()).toISOString() };
  }
  const W = /* @__PURE__ */ (() => {
    var E = async ({ input: C, signal: x }) => {
      x.throwIfAborted();
      const t = C, e = t?.value;
      if (!t || t.version !== 1 || t.operation !== "read" || t.binding !== "account-source-result" || t.schemaValidation !== "passed" || t.dataChanged !== false || t.ref?.version !== 1 || t.ref.policy !== "credential-redacted-v1" || t.ref.source?.entryId !== "account-source") throw new Error("\u7F3A\u5C11\u672C\u5B9E\u4F8B\u5DF2\u9009\u62E9\u4E14\u5B8C\u6574\u53EF\u590D\u7528\u7684\u8D26\u53F7\u6765\u6E90\uFF0C\u8BF7\u5230\u8D44\u6E90\u9875\u91CD\u65B0\u6838\u5BF9\u5E76\u4FDD\u5B58");
      if (!e || e.version !== 1 || e.kind !== "boss-account-source" || e.status !== "account-source-confirmed" || e.accountVerified !== true || e.platformUniqueIdVerified !== false || e.eligibleForActions !== false || e.role !== "jobseeker") throw new Error("\u6240\u9009\u8BB0\u5F55\u5C1A\u672A\u5B8C\u6210\u672C\u4EBA\u786E\u8BA4\u548C\u6765\u6E90\u590D\u9A8C\uFF1B\u8BF7\u5728\u5F53\u524D\u5B9E\u4F8B\u5B8C\u6210\u8D26\u53F7\u6838\u5BF9\uFF0C\u518D\u9009\u62E9\u8BE5\u6B21\u5DF2\u4FDD\u5B58\u7ED3\u679C");
      const l = ["version", "kind", "status", "accountAlias", "accountName", "phoneMask", "jobseekerResumeHref", "role", "sourceUrl", "accountVerified", "platformUniqueIdVerified", "eligibleForActions", "confirmedAt", "checkedAt", "reason"];
      if (Object.keys(e).length !== l.length || l.some((i) => !Object.prototype.hasOwnProperty.call(e, i))) throw new Error("\u6240\u9009\u8D26\u53F7\u7ED3\u679C\u7ED3\u6784\u4E0D\u7B26\uFF0C\u505C\u6B62\u91C7\u7528");
      for (const i of ["accountAlias", "accountName", "phoneMask"]) if (typeof e[i] != "string" || !e[i].trim() || e[i] !== e[i].trim() || e[i].length > 100 || /[\r\n]/.test(e[i])) throw new Error("\u8D26\u53F7\u5FC5\u8981\u5B57\u6BB5\u7F3A\u5931\u6216\u683C\u5F0F\u65E0\u6548\uFF0C\u505C\u6B62\u91C7\u7528");
      if (!/^[+\d ()-]*\*{2,}[\d ()-]+$/.test(e.phoneMask) || /登录|注册|验证码/.test(e.accountName)) throw new Error("\u8D26\u53F7\u6765\u6E90\u7F3A\u5C11\u6709\u6548\u7684\u53EF\u89C1\u59D3\u540D\u6216\u624B\u673A\u53F7\u63A9\u7801");
      if (typeof e.reason != "string" || !e.reason.trim()) throw new Error("\u8D26\u53F7\u7ED3\u679C\u7F3A\u5C11\u660E\u786E\u6838\u5BF9\u8BF4\u660E");
      const a = Date.parse(e.confirmedAt), u = Date.parse(e.checkedAt);
      if (typeof e.confirmedAt != "string" || typeof e.checkedAt != "string" || !Number.isFinite(a) || !Number.isFinite(u) || a <= 0 || u < a || u > Date.now() + 6e4) throw new Error("\u8D26\u53F7\u786E\u8BA4\u6216\u590D\u9A8C\u65F6\u95F4\u65E0\u6CD5\u6838\u5BF9\uFF0C\u8BF7\u91CD\u65B0\u786E\u8BA4");
      if (typeof e.sourceUrl != "string" || typeof e.jobseekerResumeHref != "string" || !e.sourceUrl.trim() || !e.jobseekerResumeHref.trim() || e.sourceUrl.length > 16384 || e.jobseekerResumeHref.length > 16384) throw new Error("\u8D26\u53F7\u9875\u9762\u6216\u7B80\u5386\u5165\u53E3\u5730\u5740\u65E0\u6548");
      const r = new URL(e.sourceUrl), c = new URL(e.jobseekerResumeHref, e.sourceUrl);
      if (r.origin !== "https://www.zhipin.com" || r.pathname !== "/web/geek/account" || r.searchParams.get("type") !== "accountSet" || r.username || r.password || r.hash || c.origin !== r.origin || c.pathname !== "/web/geek/resume" || c.username || c.password) throw new Error("\u8D26\u53F7\u8BB0\u5F55\u7684\u9875\u9762\u6216\u6C42\u804C\u8005\u5165\u53E3\u6765\u6E90\u4E0D\u7B26");
      return x.throwIfAborted(), { version: 1, accountSourceValid: true, currentAccountVerified: false, account: e };
    };
    return E;
  })(), Z = /* @__PURE__ */ (() => {
    async function E({ input: C, signal: x, template: t }) {
      x.throwIfAborted();
      const e = C?.expected?.account;
      if (C?.expected?.accountSourceValid !== true || e?.kind !== "boss-account-source" || e.status !== "account-source-confirmed" || e.accountVerified !== true) throw Error("\u7F3A\u5C11\u5DF2\u786E\u8BA4\u7684\u521D\u59CB\u5316\u8D26\u53F7\u6765\u6E90");
      const l = async (h, s, B) => {
        x.throwIfAborted();
        const A = await t.browser("browser", { operation: h, ...s ? { selector: s } : {}, ...B === void 0 ? {} : { value: B }, timeoutMs: 3e3 });
        return x.throwIfAborted(), A;
      };
      let a = await l("url");
      if (a === "about:blank") {
        await l("navigate", void 0, e.sourceUrl);
        for (let h = 0; h < 40; h++) {
          const s = await l("url");
          if (new URL(s).origin === "https://www.zhipin.com" && await l("count", "span:nth-of-type(1) > li:nth-of-type(1) > a:nth-of-type(1)") === 1) break;
          await new Promise((B) => setTimeout(B, 150));
        }
        a = await l("url");
      }
      const u = new URL(a);
      if (u.origin !== "https://www.zhipin.com" || u.username || u.password || !u.pathname.startsWith("/web/") && !/^\/job_detail\/[A-Za-z0-9_~-]+\.html$/.test(u.pathname)) throw Error("\u5F53\u524D\u9875\u9762\u4E0D\u662FBOSS\u6C42\u804C\u9875\u9762\uFF0C\u8BF7\u5148\u767B\u5F55");
      const r = "div:nth-of-type(3) > ul:nth-of-type(1) > li:nth-of-type(2) > a:nth-of-type(1) > span:nth-of-type(1), :root:not(:has(div:nth-of-type(3) > ul:nth-of-type(1) > li:nth-of-type(2) > a:nth-of-type(1) > span:nth-of-type(1))) div:nth-of-type(4) > ul:nth-of-type(1) > li:nth-of-type(2) > a:nth-of-type(1) > span:nth-of-type(1)", c = "span:nth-of-type(1) > li:nth-of-type(1) > a:nth-of-type(1)", i = await l("count", r), d = await l("count", c);
      if (i !== 1 || d !== 1) throw Error("\u5F53\u524D\u9875\u9762\u8D26\u53F7\u5165\u53E3\u6570\u91CF\u5F02\u5E38\uFF1A" + JSON.stringify({ nameCount: i, resumeCount: d }));
      const p = await l("read", r), f = await l("attribute", c, "href");
      if (typeof p != "string" || p.normalize("NFKC").trim() !== e.accountName.normalize("NFKC").trim() || typeof f != "string" || new URL(f, a).href !== new URL(e.jobseekerResumeHref, e.sourceUrl).href || await l("url") !== a) throw Error("\u5F53\u524D\u767B\u5F55\u8EAB\u4EFD\u3001\u6C42\u804C\u5165\u53E3\u6216\u9875\u9762\u5DF2\u53D8\u5316\uFF0C\u505C\u6B62\u672C\u6279");
      return { version: 1, status: "current-account-source-matched", accountAlias: e.accountAlias, accountName: e.accountName, phoneMask: e.phoneMask, jobseekerResumeHref: e.jobseekerResumeHref, sourceUrl: e.sourceUrl, checkedAt: (/* @__PURE__ */ new Date()).toISOString(), currentPageUrl: a, currentAccountVerified: true, platformUniqueIdVerified: false, eligibleForActions: false, accountCheckMode: "confirmed-initial-account-and-visible-header", phoneMaskRechecked: false, reason: "\u4F7F\u7528\u5DF2\u786E\u8BA4\u7684\u521D\u59CB\u5316\u8D26\u53F7\uFF1B\u53EA\u8BFB\u6838\u5BF9\u5F53\u524D\u767B\u5F55\u59D3\u540D\u3001\u6C42\u804C\u5165\u53E3\u53CA\u9875\u9762\u8FDE\u7EED\u6027\uFF0C\u624B\u673A\u53F7\u63A9\u7801\u6CBF\u7528\u786E\u8BA4\u6765\u6E90\uFF0C\u6CA1\u6709\u91CD\u65B0\u8BFB\u53D6\u3002" };
    }
    return E;
  })(), q = (E) => Array.isArray(E) ? E.map(q) : E && typeof E == "object" ? Object.fromEntries(Object.keys(E).sort().map((C) => [C, q(E[C])])) : E, I = (E) => R("sha256").update(JSON.stringify(q(E))).digest("hex");
  async function Q({ input: E, template: C, signal: x, artifact: t }, e) {
    const l = E.configuration, a = await W({ input: E.account, signal: x });
    await Z({ input: { expected: a }, template: C, signal: x });
    const u = async (y) => {
      const D = JSON.parse(await C.file("communication-cache", { operation: "read", name: y })), { sha256: n, ...m } = D;
      if (n !== I(m)) throw Error("\u539F\u6062\u590D\u8BC1\u636E\u6458\u8981\u4E0D\u7B26");
      return D;
    };
    if (!/^test-greeting-completion-v1-[a-f0-9]{64}-[a-f0-9]{24}\.json$/u.test(e)) throw Error("\u6062\u590D\u6765\u6E90\u6587\u4EF6\u540D\u65E0\u6548");
    const r = await u(e), c = new URL(a.account.jobseekerResumeHref, a.account.sourceUrl), i = R("sha256").update(JSON.stringify(["boss-visible-account-source-v1", a.account.accountName, a.account.phoneMask, c.origin + c.pathname])).digest("hex");
    if (r.accountKey !== i || r.contextId !== l.contextId || r.kind !== "boss-test-new-greeting-completion" || r.confirmed !== true || r.newConfirmed !== 2) throw Error("\u6062\u590D\u8D26\u53F7\u3001\u5B9E\u4F8B\u6216\u539F\u4E24\u6B21\u56DE\u6267\u4E0D\u7B26");
    const d = e.match(/-([a-f0-9]{24})\.json$/u)[1], p = "test-fixed-unread-set-v1-" + d + "-" + i + "-" + r.day + ".json", f = "test-fixed-unread-progress-v1-" + d + "-" + i + "-" + r.day + ".json", h = await u(p), s = await u(f);
    if (h.sha256 !== s.fixedUnreadSetSha256 || h.siteDailyLimitEvidenceSha256 !== r.sha256 || h.accountKey !== i || s.accountKey !== i || h.sourceContextId !== l.contextId) throw Error("\u56FA\u5B9A\u6210\u5458\u3001\u8FDB\u5EA6\u6216\u6D3B\u52A8\u64CD\u4F5C\u6765\u6E90\u4E0D\u7B26");
    if (s.active) {
      const y = await C.state.get(), D = s.active, n = y.replyIntents.filter((N) => N.accountKey === i && N.conversationKey === "boss-chat:" + D.firstMessageId && N.status === "unknown");
      if (n.length !== 1) throw Error("\u5B58\u5728\u672A\u6838\u5BF9\u7684\u6D3B\u52A8\u64CD\u4F5C\uFF0C\u4E0D\u81EA\u52A8\u6E05\u9664");
      const m = s.completed.find((N) => N.memberKey === D.memberKey);
      if (!m || m.status !== "review" || m.operationKey) throw Error("\u6D3B\u52A8\u6765\u6E90\u5F85\u529E\u4E0D\u53EF\u66FF\u6362");
      const K = JSON.stringify(s);
      s.reviewHistory = [...s.reviewHistory || [], m], s.completed = s.completed.filter((N) => N.memberKey !== D.memberKey), s.completed.push({ ...m, status: "review", reason: "\u56DE\u8F66\u53D1\u9001\u672A\u53D6\u5F97\u9001\u8FBE\u56DE\u6267\uFF0Cunknown\u7981\u6B62\u91CD\u53D1", operationKey: n[0].key, incomingMessageId: n[0].incomingMessageId, sourceReviewVersion: "chat-list-direct-v5", checkedAt: (/* @__PURE__ */ new Date()).toISOString() }), s.active = null, s.revision++, s.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), delete s.sha256, s.sha256 = I(s);
      const g = JSON.parse(await C.file("communication-cache", { operation: "read", name: f }));
      if (I(g) !== I(JSON.parse(K))) throw Error("\u4FDD\u5B58\u672A\u77E5\u5F85\u529E\u524D\u8FDB\u5EA6\u53D8\u5316");
      if (await C.file("communication-cache", { operation: "write", name: f, content: JSON.stringify(s) }), (await u(f)).sha256 !== s.sha256) throw Error("\u672A\u77E5\u5F85\u529E\u672A\u8BFB\u56DE");
    }
    let B = false;
    for (const y of [...s.completed]) if (y.status === "review" && !y.operationKey && !y.modelRequestId && y.reason === "\u5173\u8054\u804C\u4F4D\u5B8C\u6574\u6807\u9898\u4E0E\u56FA\u5B9A\u4F1A\u8BDD\u4E0D\u7B26\uFF0C\u672A\u91C7\u7528\u6765\u6E90") {
      s.reviewHistory = [...s.reviewHistory || [], y];
      const D = s.completed.indexOf(y);
      s.completed[D] = { ...y, status: "skipped-job-source-mismatch", reason: "\u6309\u672C\u4EBA\u89C4\u5219\uFF0C\u65E2\u6709\u5C97\u4F4D\u6765\u6E90\u4E0D\u4E00\u81F4\u76F4\u63A5\u8DF3\u8FC7\uFF0C\u4E0D\u67E5\u8BE2\u516C\u53F8\u5C97\u4F4D\u3001\u4E0D\u5916\u53D1", sourceReviewVersion: "chat-list-direct-v5", checkedAt: (/* @__PURE__ */ new Date()).toISOString() }, B = true;
    }
    if (B) {
      if ((await u(f)).sha256 !== s.sha256) throw Error("\u6765\u6E90\u8DF3\u8FC7\u767B\u8BB0\u524D\u8FDB\u5EA6\u53D8\u5316");
      if (s.revision++, s.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), delete s.sha256, s.sha256 = I(s), await C.file("communication-cache", { operation: "write", name: f, content: JSON.stringify(s) }), (await u(f)).sha256 !== s.sha256) throw Error("\u6765\u6E90\u8DF3\u8FC7\u8FDB\u5EA6\u672A\u8BFB\u56DE");
    }
    const A = s.completed.filter((y) => y.status === "review" && !y.operationKey && !y.modelRequestId && ["\u56FA\u5B9A\u6210\u5458\u7F3A\u5C11\u552F\u4E00\u53EF\u89C1\u8EAB\u4EFD\uFF0C\u672A\u731C\u6D4B\u59D3\u540D", "\u56FA\u5B9A\u6210\u5458\u5B9A\u5411\u641C\u7D22\u7ED3\u679C\u4E0D\u552F\u4E00", "\u56FA\u5B9A\u6210\u5458\u59D3\u540D\u63A7\u4EF6\u4E0D\u552F\u4E00"].includes(y.reason) && y.sourceReviewVersion !== "chat-list-direct-v5"), S = h.members.filter((y) => A.some((D) => D.memberKey === y.key)).map((y) => ({ ...y, identityLine: y.text.split(/\r?\n/u).map((D) => D.trim()).filter(Boolean)[2] })), w = { version: 1, kind: "unread-closing-cohort", restoredExistingClosing: true, closingPhase: true, contextId: l.contextId, accountKey: i, day: r.day, timeZone: r.timeZone, accountSource: a, configuration: l.value, configurationRevision: l.revision, siteDailyLimitEvidence: null, testCompletionEvidence: r, closingTrigger: "two-new-greetings-test", fixedUnreadSetName: p, fixedUnreadSetSha256: h.sha256, progressName: f, progressSha256: s.sha256, progress: s, memberCount: h.members.length, unreadMessageCount: h.unreadMessageCount, newGreeting: false, newMembersAdded: 0, remaining: S.length, ready: S.length > 0, status: "resume-fixed-unread", member: S[0] || null }, b = { ...w, items: S.map((y) => ({ ...w, member: y, ready: true })) };
    return await t("fixed-cohort-recovery-source.json", JSON.stringify({ evidenceName: e, setName: p, progressName: f, memberCount: S.length, originalDay: r.day, newGreeting: false })), b;
  }
  async function oe({ input: E, template: C, signal: x }, recovery) {
    x.throwIfAborted();
    const t = E?.configuration, e = E?.state;
    if (!recovery && E?.restoreExistingClosing === true && t?.value?.recoveryEvidenceName) {
      const name=t.value.recoveryEvidenceName;
      if(!/^test-greeting-completion-v1-[a-f0-9]{64}-[a-f0-9]{24}\.json$/u.test(name))throw Error('恢复证据文件名无效');
      const load=async name=>{try{const value=JSON.parse(await C.file('communication-cache',{operation:'read',name}));const{sha256,...body}=value;if(sha256!==I(body))throw Error('恢复证据摘要不符');return value;}catch(error){if(String(error.message||error).includes('ENOENT'))return null;throw error;}};
      const proof=await load(name);
      if(!proof||proof.kind!=='boss-test-new-greeting-completion'||proof.confirmed!==true||proof.newConfirmed!==2||proof.newOccupied!==2||proof.target!==2||proof.contextId!==t.contextId||proof.timeZone!==t.value.replyTimeZone||t.value.firstContactDailyBudget!==0)throw Error('恢复仅允许同实例两次已确认且新增预算关闭');
      const suffix=name.match(/-([a-f0-9]{24})\.json$/u)[1];
      const set=await load('test-fixed-unread-set-v1-'+suffix+'-'+proof.accountKey+'-'+proof.day+'.json');
      const progress=await load('test-fixed-unread-progress-v1-'+suffix+'-'+proof.accountKey+'-'+proof.day+'.json');
      if(set||progress){if(!set||!progress)throw Error('原集合或进度部分丢失，不重建');return Q({input:E,template:C,signal:x,artifact:async()=>{}},name);}
      const baseline=await load(proof.baselineName),index=await load('account-outbound-safety-v1-'+proof.accountKey+'.json');
      if(!baseline||baseline.sha256!==proof.baselineSha256||baseline.identity.accountKey!==proof.accountKey||baseline.identity.contextId!==t.contextId||baseline.identity.day!==proof.day||baseline.identity.revision!==proof.revision||baseline.identity.target!==2||!Array.isArray(baseline.keys)||!index||index.accountKey!==proof.accountKey||!Array.isArray(index.records)||!Array.isArray(proof.confirmedKeys)||new Set(proof.confirmedKeys).size!==2)throw Error('原基线或安全索引来源不符');
      const added=index.records.filter(r=>r.type==='first-contact'&&!baseline.keys.includes(r.businessKey)&&r.sightings.some(v=>v.day===proof.day&&v.timeZone===proof.timeZone));
      if(added.length!==2||added.some(r=>!proof.confirmedKeys.includes(r.businessKey)||r.sightings.some(v=>v.day===proof.day&&v.timeZone===proof.timeZone&&(v.contextId!==t.contextId||v.status==='unknown'||v.status==='failed'))||!r.sightings.some(v=>v.day===proof.day&&v.timeZone===proof.timeZone&&v.contextId===t.contextId&&v.status==='confirmed')))throw Error('原两次真实回执冲突，不补发');
      return oe({input:{...E,restoreExistingClosing:false},template:C,signal:x},{proof,name,suffix});
    }
    if (t?.operation !== "configuration" || e?.operation !== "state.read" || t.contextId !== e.contextId || !t.value || !e.value) throw Error("\u7F3A\u5C11\u540C\u5B9E\u4F8B\u56FA\u5B9A\u914D\u7F6E\u4E0E\u5B8C\u6574\u72B6\u6001");
    const l = await W({ input: E.account, signal: x });
    await Z({ input: { expected: l }, template: C, signal: x });
    const a = l.account, u = new URL(a.jobseekerResumeHref, a.sourceUrl), r = R("sha256").update(JSON.stringify(["boss-visible-account-source-v1", a.accountName, a.phoneMask, u.origin + u.pathname])).digest("hex"), c = (o) => {
      const { sha256: F, ...M } = o;
      return F === I(M);
    }, i = async (o) => {
      try {
        return JSON.parse(await C.file("communication-cache", { operation: "read", name: o }));
      } catch (F) {
        if (String(F.message || F).includes("ENOENT")) return null;
        throw F;
      }
    }, d = async (o, F, M) => {
      if (((await i(o))?.sha256 || null) !== M) throw Error("\u6D88\u606F\u6536\u5C3E\u8BB0\u5F55\u88AB\u5176\u4ED6\u64CD\u4F5C\u66F4\u6539\uFF0C\u672A\u8986\u76D6");
      const k = { ...F };
      delete k.sha256, k.sha256 = I(k), await C.file("communication-cache", { operation: "write", name: o, content: JSON.stringify(k) });
      const H = await i(o);
      if (!c(H) || H.sha256 !== k.sha256) throw Error("\u6D88\u606F\u6536\u5C3E\u8BB0\u5F55\u5199\u5165\u540E\u672A\u5B8C\u6574\u8BFB\u56DE");
      return H;
    }, p = t.value.replyTimeZone, f = recovery ? recovery.proof.day : new Intl.DateTimeFormat("sv-SE", { timeZone: p, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()), h = !!recovery || t.value.acceptanceNewGreetings === 2;
    if (h && E?.restoreExistingClosing === true) throw Error("\u4E24\u6B21\u65B0\u62DB\u547C\u6D4B\u8BD5\u4E0D\u5F97\u4F7F\u7528\u65E7\u6536\u5C3E\u6062\u590D\u5F00\u5173");
    const s = recovery ? recovery.suffix : h ? I({ contextId: t.contextId, revision: t.revision, day: f, timeZone: p }).slice(0, 24) : null, B = recovery ? recovery.proof : await ne(C, x, { accountKey: r, contextId: t.contextId, day: f, timeZone: p, revision: t.revision, configuration: t.value });
    if(recovery && B.accountKey!==r)throw Error("当前账号与原两次回执不符");
    if (h && !B.confirmed) return { version: 1, kind: "unread-closing-cohort", closingPhase: false, ready: false, contextId: t.contextId, accountKey: r, day: f, timeZone: p, items: [], memberCount: 0, remaining: 0, status: "test-greeting-phase", testGreetingProgress: B, newGreeting: false, newMembersAdded: 0 };
    const A = h ? "test-greeting-completion-v1-" + r + "-" + s + ".json" : null;
    if (h) {
      const o = await i(A);
      if (o) {
        if (!c(o) || o.baselineSha256 !== B.baselineSha256 || I(o.confirmedKeys) !== I(B.confirmedKeys)) throw Error("\u4E24\u6B21\u62DB\u547C\u6D4B\u8BD5\u5B8C\u6210\u8BC1\u636E\u53D8\u5316\uFF0C\u505C\u6B62");
      } else await d(A, B, null);
    }
    const S = (h ? "test-active-unread-closing-v1-" + s + "-" : "active-unread-closing-v1-") + r + ".json";
    let w = await i(S);
    if (w && (!c(w) || w.kind !== "boss-active-unread-closing" || w.accountKey !== r || !/^\d{4}-\d{2}-\d{2}$/.test(w.day))) throw Error("\u6536\u5C3E\u6062\u590D\u6307\u9488\u8EAB\u4EFD\u6216\u6458\u8981\u65E0\u6548\uFF0C\u672A\u91CD\u5EFA");
    const b = E?.restoreExistingClosing === true;
    if (E?.restoreExistingClosing !== void 0 && typeof E.restoreExistingClosing != "boolean") throw Error("\u4EC5\u6062\u590D\u65E2\u6709\u6D88\u606F\u6536\u5C3E\u987B\u4E3A\u660E\u786E\u5F00\u5173");
    if (b && !w) throw Error("\u6CA1\u6709\u672C\u8D26\u53F7\u539F\u6536\u5C3E\u6307\u9488\uFF0C\u672A\u65B0\u5EFA\u96C6\u5408\u6216\u53D1\u9001\u62DB\u547C");
    const y = w?.sha256 || null;
    if (w && w.day !== f && !b) {
      const o = await i((h ? "test-fixed-unread-set-v1-" + s + "-" : "fixed-unread-set-v1-") + r + "-" + w.day + ".json"), F = await i((h ? "test-fixed-unread-progress-v1-" + s + "-" : "fixed-unread-progress-v1-") + r + "-" + w.day + ".json");
      if (!o || !F || !c(o) || !c(F) || o.sha256 !== w.fixedUnreadSetSha256 || F.fixedUnreadSetSha256 !== o.sha256 || F.accountKey !== r || !Array.isArray(o.members) || !Array.isArray(F.completed)) throw Error("\u5F80\u65E5\u6536\u5C3E\u6765\u6E90\u7F3A\u5931\u6216\u635F\u574F\uFF1B\u7981\u6B62\u91CD\u65B0\u6295\u9012");
      const M = new Set(o.members.map((k) => k.key));
      if (new Set(F.completed.map((k) => k.memberKey)).size !== F.completed.length || F.completed.some((k) => !M.has(k.memberKey))) throw Error("\u5F80\u65E5\u6536\u5C3E\u6210\u5458\u4E0D\u5B8C\u6574");
      !F.active && F.completed.length === o.members.length && F.completed.every((k) => k.status !== "review" || k.replyPolicyVersion === "work-questions-partial-known-v2") && (w = null);
    }
    const D = w?.day || f, n = h ? A : "site-daily-limit-v1-" + r + "-" + D + ".json", m = await i(n), K = (h ? "test-fixed-unread-set-v1-" + s + "-" : "fixed-unread-set-v1-") + r + "-" + D + ".json";
    let g = await i(K);
    if (!m && !w && !g) return { version: 1, kind: "unread-closing-cohort", closingPhase: false, ready: false, contextId: t.contextId, accountKey: r, day: D, timeZone: p, items: [], memberCount: 0, remaining: 0, status: "greeting-phase", newGreeting: false, newMembersAdded: 0 };
    if (!m || !c(m) || m.kind !== (h ? "boss-test-new-greeting-completion" : "boss-site-daily-limit") || m.accountKey !== r || m.confirmed !== true || m.day !== D || m.timeZone !== p) throw Error("\u672A\u627E\u5230\u672C\u8D26\u53F7\u771F\u5B9E\u7F51\u7AD9\u4E0A\u9650\u8BC1\u636E\uFF1B\u7981\u6B62\u91CD\u65B0\u6253\u62DB\u547C\u6216\u626B\u63CF\u5386\u53F2");
    if (b && !g) throw Error("\u539F\u56FA\u5B9A\u4F1A\u8BDD\u96C6\u5408\u7F3A\u5931\uFF0C\u672A\u626B\u63CF\u65B0\u589E\u6216\u91CD\u5EFA\u5386\u53F2");
    if (!g) {
      const o = async (O, U, V) => (x.throwIfAborted(), C.browser("browser", { operation: O, ...U ? { selector: U } : {}, ...V === void 0 ? {} : { value: V }, timeoutMs: 3e3 })), F = "https://www.zhipin.com/web/geek/chat", M = new URL(await o("url"));
      (M.origin !== new URL(F).origin || M.pathname !== "/web/geek/chat") && await o("navigate", null, F);
      const k = ".list-warp.v2 ul:has(> .selected)", H = k + " > :nth-child(2)", T = ".user-list-content > :first-child";
      let ae = false;
      for (let O = 0; O < 40; O++) {
        if (await o("count", H) === 1 && /^未读(?:\s*\(\d{1,4}\))?$/u.test(String(await o("read", H)).trim())) {
          ae = true;
          break;
        }
        await new Promise((U) => setTimeout(U, 250));
      }
      if (!ae) throw Error("\u7F51\u7AD9\u672A\u8BFB\u7B5B\u9009\u5165\u53E3\u672A\u5C31\u7EEA\uFF1B\u672A\u626B\u63CF\u5168\u90E8\u5386\u53F2");
      (await o("count", k + " .selected") !== 1 || !/^未读/u.test(String(await o("read", k + " .selected")).trim())) && await o("click", H);
      let j = null, G = 0;
      for (let O = 0; O < 40; O++) {
        if (await o("count", k + " .selected") === 1) {
          const U = String(await o("read", k + " .selected")).trim();
          let V = 0, $ = "";
          const R2 = await o("count", T);
          if (R2 === 1) {
            V = await o("count", T + " > *");
            $ = String(await o("read", T));
          } else if (R2 === 0 && await o("count", ".user-list-content .friend-content") === 0) {
            const body = String(await o("read", "body"));
            if (/(?:^|\s)30天内暂无联系人(?:\s|$)/u.test(body)) $ = "30\u5929\u5185\u6682\u65E0\u8054\u7CFB\u4EBA";
            else {
              j = null;
              G = 0;
              await new Promise((U2) => setTimeout(U2, 250));
              continue;
            }
          } else {
            j = null;
            G = 0;
            await new Promise((U2) => setTimeout(U2, 250));
            continue;
          }
          if (V === 0 && !/(?:30天内暂无联系人|暂无未读消息|暂无未读会话|没有未读消息|暂无消息)/u.test($)) {
            j = null;
            G = 0;
            await new Promise((U2) => setTimeout(U2, 250));
            continue;
          }
          const z = { tabText: U, count: V, text: $ };
          if (/^未读(?:\s*\(\d{1,4}\))?$/u.test(U) && JSON.stringify(z) === JSON.stringify(j) ? G++ : G = 0, j = z, G >= 2) break;
        }
        await new Promise((U) => setTimeout(U, 250));
      }
      if (G < 2 || !j || !Number.isSafeInteger(j.count) || j.count < 0 || j.count > 200) throw Error("\u672A\u8BFB\u5217\u8868\u672A\u7A33\u5B9A\uFF0C\u672A\u56FA\u5B9A\u90E8\u5206\u96C6\u5408");
      const se = /^未读\s*\((\d{1,4})\)$/u.exec(j.tabText), te = se ? Number(se[1]) : 0, P = [];
      for (let O = 1; O <= j.count; O++) {
        const U = T + " > :nth-child(" + O + ")", V = String(await o("read", U)).trim(), $ = U + " .friend-content";
        if (te === 0 && await o("count", $) === 0 && /^(?:30天内暂无联系人|暂无消息|暂无未读消息|暂无未读会话|没有未读消息)$/u.test(V)) continue;
        if (V.length > 1e4 || await o("count", $) !== 1) throw Error("\u672A\u8BFB\u6210\u5458\u8EAB\u4EFD\u6216\u5B8C\u6574\u6B63\u6587\u65E0\u6CD5\u6838\u5BF9");
        const z = String(await o("read", $)).trim(), ce = V.split(/\r?\n/u).map((de) => de.trim()).filter(Boolean), re = /^\d{1,4}$/u.test(ce[0] || "") ? Number(ce[0]) : null;
        if (!z || !Number.isSafeInteger(re) || re < 1) throw Error("\u672A\u8BFB\u6210\u5458\u8BA1\u6570\u65E0\u6CD5\u6838\u5BF9");
        P.push({ position: O, displayIdentity: z, unreadCount: re, text: V, attributes: [], key: I(["boss-fixed-unread-visible-member-v1", r, z]) });
      }
      if (P.reduce((O, U) => O + U.unreadCount, 0) !== te || new Set(P.map((O) => O.key)).size !== P.length) throw Error("\u672A\u8BFB\u4F1A\u8BDD\u96C6\u5408\u8986\u76D6\u6570\u91CF\u4E0D\u4E00\u81F4\uFF0C\u672A\u56FA\u5B9A\u90E8\u5206\u96C6\u5408");
      if (await o("url") !== F || String(await o("read", k + " .selected")).trim() !== j.tabText || await o("count", T + " > *") !== j.count || (await o("count",T)===0 ? (!/(?:^|\s)30天内暂无联系人(?:\s|$)/u.test(String(await o("read","body"))) || j.text!=="30天内暂无联系人") : String(await o("read",T))!==j.text) || I(await C.state.get()) !== I(e.value)) throw Error("\u56FA\u5B9A\u672A\u8BFB\u96C6\u5408\u524D\u6765\u6E90\u6216\u72B6\u6001\u53D8\u5316\uFF0C\u672A\u4FDD\u5B58");
      g = await d(K, { version: 1, kind: "boss-fixed-unread-set", accountKey: r, sourceContextId: t.contextId, day: D, timeZone: p, configurationRevision: t.revision, siteDailyLimitEvidenceName: n, siteDailyLimitEvidenceSha256: m.sha256, sourceUrl: F, selectedTabText: j.tabText, unreadMessageCount: te, members: P, createdAt: (/* @__PURE__ */ new Date()).toISOString(), membershipImmutable: true, ...(recovery ? {recoveredFirstCapture:true,originalGreetingDay:recovery.proof.day,recoveryEvidenceName:recovery.name,capturedAt:new Date().toISOString()} : {}) }, null);
    }
    if (!g || !c(g) || g.kind !== "boss-fixed-unread-set" || g.accountKey !== r || g.day !== D || g.siteDailyLimitEvidenceSha256 !== m.sha256 || !Array.isArray(g.members) || g.members.length > 200 || new Set(g.members.map((o) => o.key)).size !== g.members.length || g.members.reduce((o, F) => o + F.unreadCount, 0) !== g.unreadMessageCount) throw Error("\u56FA\u5B9A\u672A\u8BFB\u96C6\u5408\u7F3A\u5931\u6216\u8986\u76D6\u6570\u91CF\u4E0D\u4E00\u81F4\uFF1B\u672A\u91CD\u5EFA\u6216\u6269\u5C55\u96C6\u5408");
    const N = g.members.map((o) => {
      const F = o.text.split(/\r?\n/u).map((M) => M.trim()).filter(Boolean);
      if (!/^[a-f0-9]{64}$/.test(o.key) || !/^\d+$/.test(F[0]) || !F[2] || F[2].length > 500) throw Error("\u56FA\u5B9A\u4F1A\u8BDD\u53EF\u89C1\u8EAB\u4EFD\u7F3A\u5931");
      return { ...o, identityLine: F[2] };
    });
    if (new Set(N.map((o) => o.identityLine)).size !== N.length) throw Error("\u56FA\u5B9A\u4F1A\u8BDD\u5B58\u5728\u540C\u540D\u540C\u516C\u53F8\u8EAB\u4EFD\u6B67\u4E49\uFF0C\u7981\u6B62\u731C\u6D4B");
    const le = "account-outbound-safety-v1-" + r + ".json", J = await i(le);
    if (!J || !c(J) || J.kind !== "boss-account-outbound-safety" || J.accountKey !== r || !Array.isArray(J.records) || !J.records.length) throw Error("\u539F\u8D26\u53F7\u5916\u53D1\u5B89\u5168\u7D22\u5F15\u7F3A\u5931\uFF0C\u963B\u6B62\u7EED\u53D1");
    if (w && (w.fixedUnreadSetSha256 !== g.sha256 || w.siteDailyLimitEvidenceSha256 !== m.sha256)) throw Error("\u6062\u590D\u6307\u9488\u4E0E\u56FA\u5B9A\u96C6\u5408\u4E0D\u7B26");
    w || (w = await d(S, { version: 1, kind: "boss-active-unread-closing", accountKey: r, day: D, timeZone: p, fixedUnreadSetSha256: g.sha256, siteDailyLimitEvidenceSha256: m.sha256, createdAt: (/* @__PURE__ */ new Date()).toISOString() }, y));
    const X = (h ? "test-fixed-unread-progress-v1-" + s + "-" : "fixed-unread-progress-v1-") + r + "-" + D + ".json";
    let v = await i(X);
    if (v && (!c(v) || v.kind !== "boss-fixed-unread-progress" || v.accountKey !== r || v.fixedUnreadSetSha256 !== g.sha256 || !Array.isArray(v.completed) || v.completed.some((o) => !N.some((F) => F.key === o.memberKey)) || new Set(v.completed.map((o) => o.memberKey)).size !== v.completed.length || v.active && !N.some((o) => o.key === v.active.memberKey))) throw Error("\u6536\u5C3E\u8FDB\u5EA6\u8EAB\u4EFD\u3001\u6458\u8981\u6216\u6210\u5458\u65E0\u6548");
    if (b && !v) throw Error("\u539F\u6D88\u606F\u6536\u5C3E\u8FDB\u5EA6\u7F3A\u5931\uFF0C\u672A\u91CD\u5EFA\u6216\u91CD\u653E");
    v || (v = await d(X, { version: 1, kind: "boss-fixed-unread-progress", accountKey: r, day: D, timeZone: p, fixedUnreadSetSha256: g.sha256, revision: 0, active: null, completed: [], createdAt: (/* @__PURE__ */ new Date()).toISOString() }, null));
    const Y = (o) => !L(o) && (o.status !== "review" || o.replyPolicyVersion === "work-questions-partial-known-v2"), ee = v.active ? N.find((o) => o.key === v.active.memberKey) : N.find((o) => !v.completed.some((F) => F.memberKey === o.key && Y(F))), ue = { version: 1, kind: "unread-closing-cohort", restoredExistingClosing: b, closingPhase: true, ready: !!ee, contextId: t.contextId, accountKey: r, accountSource: l, configuration: t.value, configurationRevision: t.revision, siteDailyLimitEvidence: h ? null : m, testCompletionEvidence: h ? m : null, closingTrigger: h ? "two-new-greetings-test" : "real-site-daily-limit", fixedUnreadSetName: K, fixedUnreadSetSha256: g.sha256, member: ee || null, memberCount: N.length, unreadMessageCount: g.unreadMessageCount, progressName: X, progressSha256: v.sha256, progress: v, remaining: N.length - v.completed.filter(Y).length, status: ee ? "resume-fixed-unread" : "fixed-unread-complete", newGreeting: false, newMembersAdded: 0 };
    if (I(await C.state.get()) !== I(e.value)) throw Error("\u51C6\u5907\u6536\u5C3E\u671F\u95F4\u6B63\u5F0F\u72B6\u6001\u53D8\u5316\uFF0C\u672A\u7EE7\u7EED");
    return ue.items = N.filter((o) => !v.completed.some((F) => F.memberKey === o.key && Y(F))).sort((o, F) => +(F.key === v.active?.memberKey) - +(o.key === v.active?.memberKey)).map((o) => ({ ...ue, member: o, ready: true })), ue;
  }
  var ie = oe;
  return ie;
})(), fe = /* @__PURE__ */ (() => {
  const R = (t) => Array.isArray(t) ? t.map(R) : t && typeof t == "object" ? Object.fromEntries(Object.keys(t).sort().map((e) => [e, R(t[e])])) : t, L = (t) => _("sha256").update(JSON.stringify(R(t))).digest("hex"), ne = (t) => _("sha256").update(t).digest("hex"), W = (t, e) => (l, a, u) => (e.throwIfAborted(), t.browser("browser", { operation: l, ...a ? { selector: a } : {}, ...u === void 0 ? {} : { value: u }, timeoutMs: 3e3 }));
  async function Z(t, e, l, a, u = null) {
    let r = null;
    try {
      r = await t.file("communication-cache", { operation: "read", name: e });
    } catch (i) {
      if (!String(i.message || i).includes("ENOENT")) throw i;
    }
    const c = r === null ? u : JSON.parse(r);
    if (!c) throw Error("\u7F3A\u5C11\u6062\u590D\u6765\u6E90 " + e);
    if (r !== null) {
      const { sha256: i, ...d } = c;
      if (i !== L(d)) throw Error("\u6062\u590D\u6765\u6E90\u6458\u8981\u4E0D\u7B26 " + e);
    }
    if (c.kind !== l || c.accountKey !== a) throw Error("\u6062\u590D\u6765\u6E90\u8D26\u53F7\u6216\u7C7B\u578B\u4E0D\u7B26");
    return { name: e, raw: r, value: c };
  }
  async function q(t, e) {
    let l = null;
    try {
      l = await t.file("communication-cache", { operation: "read", name: e.name });
    } catch (r) {
      if (!String(r.message || r).includes("ENOENT")) throw r;
    }
    if (l !== e.raw) throw Error("\u6062\u590D\u8BB0\u5F55\u5E76\u53D1\u53D8\u5316");
    const a = e.value;
    a.revision++, a.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), delete a.sha256, a.sha256 = L(a);
    const u = JSON.stringify(a);
    if (await t.file("communication-cache", { operation: "write", name: e.name, content: u }), await t.file("communication-cache", { operation: "read", name: e.name }) !== u) throw Error("\u6062\u590D\u8BB0\u5F55\u672A\u51C6\u786E\u8BFB\u56DE");
    e.raw = u;
  }
  async function I(t, e) {
    return Z(t, "unknown-chat-reviews-v1-" + e + ".json", "boss-unknown-chat-reviews", e, { version: 1, kind: "boss-unknown-chat-reviews", accountKey: e, revision: 0, reviews: [] });
  }
  async function Q(t) {
    const e = await t("count", "li.message-item");
    if (!Number.isSafeInteger(e) || e < 1 || e > 150) throw Error("\u4F1A\u8BDD\u53EF\u89C1\u6D88\u606F\u8303\u56F4\u65E0\u6548");
    const l = [];
    for (let a = 1; a <= e; a++) {
      const u = "li.message-item:nth-child(" + a + " of li.message-item)", r = await t("attribute", u, "data-mid"), c = String(await t("attribute", u, "class") || "");
      if (!/^\d{6,40}$/u.test(r || "")) throw Error("\u7F3A\u5C11\u771F\u5B9E\u670D\u52A1\u5668\u6D88\u606F\u7F16\u53F7");
      const i = await t("count", u + " .text-content");
      if (i > 1) throw Error("\u5355\u6761\u6B63\u6587\u4E0D\u552F\u4E00");
      const d = i === 1 ? String(await t("read", u + " .text-content")).trim() : null, p = i === 1 ? null : String(await t("read", u)).trim(), f = !!d && /^您正在与Boss.+沟通$/u.test(d), h = !f && d !== null && c.split(/\s/u).includes("item-myself") ? "outgoing" : !f && d !== null && c.split(/\s/u).includes("item-friend") ? "incoming" : "system", s = u + " > div > div > i", B = await t("count", s) === 1 ? String(await t("read", s)).trim() : null;
      l.push({ mid: r, direction: h, text: d, context: p, receipt: B });
    }
    if (new Set(l.map((a) => a.mid)).size !== l.length) throw Error("\u670D\u52A1\u5668\u6D88\u606F\u7F16\u53F7\u91CD\u590D");
    return l;
  }
  async function oe(t, e, l = true) {
    const a = new URL(await t("url"));
    if (a.origin !== "https://www.zhipin.com" || a.pathname !== "/web/geek/chat" || String(await t("read", e.accountSelector)).trim() !== e.accountLabel || await t("count", 'li.message-item[data-mid="' + e.member.originalIncomingMid + '"]') !== 1 || await t("count", 'li.message-item[data-mid="' + e.member.firstMessageId + '"]') !== 1) throw Error("\u672A\u77E5\u6062\u590D\u7684\u8D26\u53F7\u6216\u539F\u6D88\u606F\u94FE\u53D8\u5316");
    if (l && L(await Q(t)) !== e.messagesHash) throw Error("AI\u5224\u65AD\u671F\u95F4\u804A\u5929\u5185\u5BB9\u53D8\u5316\uFF0C\u672A\u5916\u53D1");
  }
  async function ie(t, e) {
    const l = ".list-warp.v2 input";
    if (await t("count", l) !== 1) throw Error("\u8054\u7CFB\u4EBA\u641C\u7D22\u5165\u53E3\u4E0D\u552F\u4E00");
    await t("click", l), await t("fill", l, e.lookupQuery || e.recipientName);
    const a = ".boss-search-result .search-list";
    let u = 0;
    for (let i = 0; i < 30 && (u = await t("count", a), !(u > 0)); i++) await new Promise((d) => setTimeout(d, 150));
    if (u < 1 || u > 50) throw Error("\u672A\u627E\u5230\u539Funknown\u8054\u7CFB\u4EBA");
    const r = [];
    for (let i = 1; i <= u; i++) {
      const d = a + ":nth-child(" + i + " of .search-list)", p = [d];
      let f = 0;
      for (; p.length; ) {
        const h = p.shift();
        if (++f > 150) throw Error("\u59D3\u540D\u63A7\u4EF6\u8303\u56F4\u8FC7\u5927");
        const s = String(await t("read", h)).trim(), B = await t("count", h + " > *");
        if (s === e.recipientName && r.push({ selector: h, text: s }), B > 0 && B < 30) for (let A = 1; A <= B; A++) p.push(h + " > :nth-child(" + A + ")");
      }
    }
    const c = r.filter((i) => !r.some((d) => d !== i && d.selector.startsWith(i.selector + " > ")));
    if (c.length !== 1) throw Error("\u539Funknown\u59D3\u540D\u63A7\u4EF6\u4E0D\u552F\u4E00");
    if (String(await t("read", c[0].selector)).trim() !== c[0].text) throw Error("\u641C\u7D22\u7ED3\u679C\u53D8\u5316");
    await t("click", c[0].selector);
    for (let i = 0; i < 40; i++) {
      if (await t("count", 'li.message-item[data-mid="' + e.originalIncomingMid + '"]') === 1 && await t("count", 'li.message-item[data-mid="' + e.firstMessageId + '"]') === 1) return;
      await new Promise((d) => setTimeout(d, 150));
    }
    throw Error("\u641C\u7D22\u540E\u672A\u8BFB\u56DE\u539Funknown\u670D\u52A1\u5668\u6D88\u606F\u94FE");
  }
  const E = /* @__PURE__ */ (() => {
    var t = async ({ input: e, signal: l }) => {
      l.throwIfAborted();
      const a = e, u = a?.value;
      if (!a || a.version !== 1 || a.operation !== "read" || a.binding !== "account-source-result" || a.schemaValidation !== "passed" || a.dataChanged !== false || a.ref?.version !== 1 || a.ref.policy !== "credential-redacted-v1" || a.ref.source?.entryId !== "account-source") throw new Error("\u7F3A\u5C11\u672C\u5B9E\u4F8B\u5DF2\u9009\u62E9\u4E14\u5B8C\u6574\u53EF\u590D\u7528\u7684\u8D26\u53F7\u6765\u6E90\uFF0C\u8BF7\u5230\u8D44\u6E90\u9875\u91CD\u65B0\u6838\u5BF9\u5E76\u4FDD\u5B58");
      if (!u || u.version !== 1 || u.kind !== "boss-account-source" || u.status !== "account-source-confirmed" || u.accountVerified !== true || u.platformUniqueIdVerified !== false || u.eligibleForActions !== false || u.role !== "jobseeker") throw new Error("\u6240\u9009\u8BB0\u5F55\u5C1A\u672A\u5B8C\u6210\u672C\u4EBA\u786E\u8BA4\u548C\u6765\u6E90\u590D\u9A8C\uFF1B\u8BF7\u5728\u5F53\u524D\u5B9E\u4F8B\u5B8C\u6210\u8D26\u53F7\u6838\u5BF9\uFF0C\u518D\u9009\u62E9\u8BE5\u6B21\u5DF2\u4FDD\u5B58\u7ED3\u679C");
      const r = ["version", "kind", "status", "accountAlias", "accountName", "phoneMask", "jobseekerResumeHref", "role", "sourceUrl", "accountVerified", "platformUniqueIdVerified", "eligibleForActions", "confirmedAt", "checkedAt", "reason"];
      if (Object.keys(u).length !== r.length || r.some((f) => !Object.prototype.hasOwnProperty.call(u, f))) throw new Error("\u6240\u9009\u8D26\u53F7\u7ED3\u679C\u7ED3\u6784\u4E0D\u7B26\uFF0C\u505C\u6B62\u91C7\u7528");
      for (const f of ["accountAlias", "accountName", "phoneMask"]) if (typeof u[f] != "string" || !u[f].trim() || u[f] !== u[f].trim() || u[f].length > 100 || /[\r\n]/.test(u[f])) throw new Error("\u8D26\u53F7\u5FC5\u8981\u5B57\u6BB5\u7F3A\u5931\u6216\u683C\u5F0F\u65E0\u6548\uFF0C\u505C\u6B62\u91C7\u7528");
      if (!/^[+\d ()-]*\*{2,}[\d ()-]+$/.test(u.phoneMask) || /登录|注册|验证码/.test(u.accountName)) throw new Error("\u8D26\u53F7\u6765\u6E90\u7F3A\u5C11\u6709\u6548\u7684\u53EF\u89C1\u59D3\u540D\u6216\u624B\u673A\u53F7\u63A9\u7801");
      if (typeof u.reason != "string" || !u.reason.trim()) throw new Error("\u8D26\u53F7\u7ED3\u679C\u7F3A\u5C11\u660E\u786E\u6838\u5BF9\u8BF4\u660E");
      const c = Date.parse(u.confirmedAt), i = Date.parse(u.checkedAt);
      if (typeof u.confirmedAt != "string" || typeof u.checkedAt != "string" || !Number.isFinite(c) || !Number.isFinite(i) || c <= 0 || i < c || i > Date.now() + 6e4) throw new Error("\u8D26\u53F7\u786E\u8BA4\u6216\u590D\u9A8C\u65F6\u95F4\u65E0\u6CD5\u6838\u5BF9\uFF0C\u8BF7\u91CD\u65B0\u786E\u8BA4");
      if (typeof u.sourceUrl != "string" || typeof u.jobseekerResumeHref != "string" || !u.sourceUrl.trim() || !u.jobseekerResumeHref.trim() || u.sourceUrl.length > 16384 || u.jobseekerResumeHref.length > 16384) throw new Error("\u8D26\u53F7\u9875\u9762\u6216\u7B80\u5386\u5165\u53E3\u5730\u5740\u65E0\u6548");
      const d = new URL(u.sourceUrl), p = new URL(u.jobseekerResumeHref, u.sourceUrl);
      if (d.origin !== "https://www.zhipin.com" || d.pathname !== "/web/geek/account" || d.searchParams.get("type") !== "accountSet" || d.username || d.password || d.hash || p.origin !== d.origin || p.pathname !== "/web/geek/resume" || p.username || p.password) throw new Error("\u8D26\u53F7\u8BB0\u5F55\u7684\u9875\u9762\u6216\u6C42\u804C\u8005\u5165\u53E3\u6765\u6E90\u4E0D\u7B26");
      return l.throwIfAborted(), { version: 1, accountSourceValid: true, currentAccountVerified: false, account: u };
    };
    return t;
  })(), C = /* @__PURE__ */ (() => {
    async function t({ input: e, signal: l, template: a }) {
      l.throwIfAborted();
      const u = e?.expected?.account;
      if (e?.expected?.accountSourceValid !== true || u?.kind !== "boss-account-source" || u.status !== "account-source-confirmed" || u.accountVerified !== true) throw Error("\u7F3A\u5C11\u5DF2\u786E\u8BA4\u7684\u521D\u59CB\u5316\u8D26\u53F7\u6765\u6E90");
      const r = async (A, S, w) => {
        l.throwIfAborted();
        const b = await a.browser("browser", { operation: A, ...S ? { selector: S } : {}, ...w === void 0 ? {} : { value: w }, timeoutMs: 3e3 });
        return l.throwIfAborted(), b;
      };
      let c = await r("url");
      if (c === "about:blank") {
        await r("navigate", void 0, u.sourceUrl);
        for (let A = 0; A < 40; A++) {
          const S = await r("url");
          if (new URL(S).origin === "https://www.zhipin.com" && await r("count", "span:nth-of-type(1) > li:nth-of-type(1) > a:nth-of-type(1)") === 1) break;
          await new Promise((w) => setTimeout(w, 150));
        }
        c = await r("url");
      }
      const i = new URL(c);
      if (i.origin !== "https://www.zhipin.com" || i.username || i.password || !i.pathname.startsWith("/web/") && !/^\/job_detail\/[A-Za-z0-9_~-]+\.html$/.test(i.pathname)) throw Error("\u5F53\u524D\u9875\u9762\u4E0D\u662FBOSS\u6C42\u804C\u9875\u9762\uFF0C\u8BF7\u5148\u767B\u5F55");
      const d = "div:nth-of-type(3) > ul:nth-of-type(1) > li:nth-of-type(2) > a:nth-of-type(1) > span:nth-of-type(1), :root:not(:has(div:nth-of-type(3) > ul:nth-of-type(1) > li:nth-of-type(2) > a:nth-of-type(1) > span:nth-of-type(1))) div:nth-of-type(4) > ul:nth-of-type(1) > li:nth-of-type(2) > a:nth-of-type(1) > span:nth-of-type(1)", p = "span:nth-of-type(1) > li:nth-of-type(1) > a:nth-of-type(1)", f = await r("count", d), h = await r("count", p);
      if (f !== 1 || h !== 1) throw Error("\u5F53\u524D\u9875\u9762\u8D26\u53F7\u5165\u53E3\u6570\u91CF\u5F02\u5E38\uFF1A" + JSON.stringify({ nameCount: f, resumeCount: h }));
      const s = await r("read", d), B = await r("attribute", p, "href");
      if (typeof s != "string" || s.normalize("NFKC").trim() !== u.accountName.normalize("NFKC").trim() || typeof B != "string" || new URL(B, c).href !== new URL(u.jobseekerResumeHref, u.sourceUrl).href || await r("url") !== c) throw Error("\u5F53\u524D\u767B\u5F55\u8EAB\u4EFD\u3001\u6C42\u804C\u5165\u53E3\u6216\u9875\u9762\u5DF2\u53D8\u5316\uFF0C\u505C\u6B62\u672C\u6279");
      return { version: 1, status: "current-account-source-matched", accountAlias: u.accountAlias, accountName: u.accountName, phoneMask: u.phoneMask, jobseekerResumeHref: u.jobseekerResumeHref, sourceUrl: u.sourceUrl, checkedAt: (/* @__PURE__ */ new Date()).toISOString(), currentPageUrl: c, currentAccountVerified: true, platformUniqueIdVerified: false, eligibleForActions: false, accountCheckMode: "confirmed-initial-account-and-visible-header", phoneMaskRechecked: false, reason: "\u4F7F\u7528\u5DF2\u786E\u8BA4\u7684\u521D\u59CB\u5316\u8D26\u53F7\uFF1B\u53EA\u8BFB\u6838\u5BF9\u5F53\u524D\u767B\u5F55\u59D3\u540D\u3001\u6C42\u804C\u5165\u53E3\u53CA\u9875\u9762\u8FDE\u7EED\u6027\uFF0C\u624B\u673A\u53F7\u63A9\u7801\u6CBF\u7528\u786E\u8BA4\u6765\u6E90\uFF0C\u6CA1\u6709\u91CD\u65B0\u8BFB\u53D6\u3002" };
    }
    return t;
  })();
  return async function({ input: t, template: e, signal: l, artifact: a }) {
    const u = t.configuration;
    if (u?.operation !== "configuration") throw Error("\u7F3A\u5C11\u5F53\u524D\u914D\u7F6E");
    const r = await E({ input: t.account, signal: l });
    await C({ input: { expected: r }, template: e, signal: l });
    const c = r.account, i = new URL(c.jobseekerResumeHref, c.sourceUrl), d = _("sha256").update(JSON.stringify(["boss-visible-account-source-v1", c.accountName, c.phoneMask, i.origin + i.pathname])).digest("hex"), p = async (n, m) => {
      try {
        return await Z(e, n, m, d);
      } catch (K) {
        if (String(K.message || K).startsWith("\u7F3A\u5C11\u6062\u590D\u6765\u6E90 ")) return null;
        throw K;
      }
    }, f = await p("account-outbound-safety-v1-" + d + ".json", "boss-account-outbound-safety");
    if (!f) return null;
    const h = await p("resume-delivery-index-v1-" + d + ".json", "boss-resume-delivery-index"), s = await p("unknown-chat-sources-v1-" + d + ".json", "boss-unknown-chat-sources"), B = await I(e, d), A = [];
    for (const n of f.value.records) {
      if (n.type !== "reply" || n.parentBusinessKey || !n.sightings.some((g) => g.status === "unknown") || n.sightings.some((g) => g.status === "confirmed")) continue;
      const m = "reply:" + n.businessKey, K = s?.value.items.find((g) => g.key === m);
      A.push({ ...K, key: m, parentKind: "reply", parentKey: n.businessKey, parentRecordHash: L(n), originalIncomingMid: n.incomingMessageId, conversationKey: n.conversationKey, lookupQuery: K?.recipientName || null, sourceMissing: !K });
    }
    for (const n of h?.value.deliveries || []) {
      if (n.status !== "unknown") continue;
      const m = String(n.recipientLabel || "").split(/\r?\n/u)[0].trim();
      A.push({ key: "resume:" + n.key, parentKind: "resume", parentKey: n.key, parentRecordHash: L(n), originalIncomingMid: n.requestMid, firstMessageId: n.firstMessageId, recipientLabel: n.recipientLabel, recipientName: m, lookupQuery: m, historicalVerification: n.verification || null });
    }
    const S = /* @__PURE__ */ new Set(["skipped", "existing-answer", "confirmed-reply", "confirmed-native"]), w = A.filter((n) => !S.has(B.value.reviews.find((m) => m.key === n.key)?.status));
    if (!w.length) return null;
    const b = u.value.replyTimeZone, y = new Intl.DateTimeFormat("sv-SE", { timeZone: b, year: "numeric", month: "2-digit", day: "2-digit" }).format(/* @__PURE__ */ new Date()), D = { version: 1, kind: "unread-closing-cohort", unknownRecovery: true, closingPhase: true, closingTrigger: "unknown-chat-ai-takeover", accountKey: d, accountSource: r, contextId: u.contextId, configuration: u.value, configurationRevision: u.revision, day: y, timeZone: b, reviewSetHash: L(w.map((n) => n.key).sort()), memberCount: w.length, newGreeting: false, newMembersAdded: 0, readOnly: false, metadataKeys: w.map((n) => n.key), authorization: "\u4F7F\u7528\u8005\u660E\u786E\u542F\u52A8\u5DF2\u6388\u6743\u5165\u53E3\uFF1Aunknown\u5148\u8BFB\u53D6\u5B8C\u6574\u804A\u5929\uFF0C\u4F9D\u636E\u672C\u4EBA\u786E\u8BA4Skill\u548C\u4E8B\u5B9E\u5224\u65AD\uFF0C\u4FDD\u7559\u539F\u8BB0\u5F55\uFF0C\u4EC5\u56DE\u590D\u672A\u56DE\u7B54\u95EE\u9898\u4E00\u6B21" };
    return await a("unknown-review-inventory.json", JSON.stringify({ ...D, items: w.map((n) => ({ key: n.key, kind: n.parentKind, hasLookupSource: !n.sourceMissing })) })), { ...D, ready: true, items: w.map((n) => ({ ...D, member: n, ready: true })) };
  };
})();
async function we(R) {
  return await fe(R) || me(R);
}
export { we as default };
