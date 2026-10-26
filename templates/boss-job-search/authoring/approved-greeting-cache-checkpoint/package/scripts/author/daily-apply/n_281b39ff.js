async function stdin_default({ input, signal, template }) {
  signal.throwIfAborted();
  const a = input?.expected?.account;
  if (input?.expected?.accountSourceValid !== true || a?.kind !== "boss-account-source" || a.status !== "account-source-confirmed" || a.accountVerified !== true) throw Error("\u7F3A\u5C11\u5DF2\u786E\u8BA4\u7684\u521D\u59CB\u5316\u8D26\u53F7\u6765\u6E90");
  const call = async (operation, selector, value) => {
    signal.throwIfAborted();
    const r2 = await template.browser("browser", { operation, ...selector ? { selector } : {}, ...value === void 0 ? {} : { value }, timeoutMs: 3e3 });
    signal.throwIfAborted();
    return r2;
  };
  const before = await call("url"), p = new URL(before);
  if (p.origin !== "https://www.zhipin.com" || p.username || p.password || !p.pathname.startsWith("/web/") && !/^\/job_detail\/[A-Za-z0-9_~-]+\.html$/.test(p.pathname)) throw Error("\u5F53\u524D\u9875\u9762\u4E0D\u662FBOSS\u6C42\u804C\u9875\u9762\uFF0C\u8BF7\u5148\u767B\u5F55");
  const n = "div:nth-of-type(3) > ul:nth-of-type(1) > li:nth-of-type(2) > a:nth-of-type(1) > span:nth-of-type(1), :root:not(:has(div:nth-of-type(3) > ul:nth-of-type(1) > li:nth-of-type(2) > a:nth-of-type(1) > span:nth-of-type(1))) div:nth-of-type(4) > ul:nth-of-type(1) > li:nth-of-type(2) > a:nth-of-type(1) > span:nth-of-type(1)", r = "span:nth-of-type(1) > li:nth-of-type(1) > a:nth-of-type(1)";
  const nameCount = await call("count", n), resumeCount = await call("count", r);
  if (nameCount !== 1 || resumeCount !== 1) throw Error("\u5F53\u524D\u9875\u9762\u8D26\u53F7\u5165\u53E3\u6570\u91CF\u5F02\u5E38\uFF1A" + JSON.stringify({ nameCount, resumeCount }));
  const name = await call("read", n), href = await call("attribute", r, "href");
  if (typeof name !== "string" || name.normalize("NFKC").trim() !== a.accountName.normalize("NFKC").trim() || typeof href !== "string" || new URL(href, before).href !== new URL(a.jobseekerResumeHref, a.sourceUrl).href || await call("url") !== before) throw Error("\u5F53\u524D\u767B\u5F55\u8EAB\u4EFD\u3001\u6C42\u804C\u5165\u53E3\u6216\u9875\u9762\u5DF2\u53D8\u5316\uFF0C\u505C\u6B62\u672C\u6279");
  return { version: 1, status: "current-account-source-matched", accountAlias: a.accountAlias, accountName: a.accountName, phoneMask: a.phoneMask, jobseekerResumeHref: a.jobseekerResumeHref, sourceUrl: a.sourceUrl, checkedAt: (/* @__PURE__ */ new Date()).toISOString(), currentPageUrl: before, currentAccountVerified: true, platformUniqueIdVerified: false, eligibleForActions: false, accountCheckMode: "confirmed-initial-account-and-visible-header", phoneMaskRechecked: false, reason: "\u4F7F\u7528\u5DF2\u786E\u8BA4\u7684\u521D\u59CB\u5316\u8D26\u53F7\uFF1B\u53EA\u8BFB\u6838\u5BF9\u5F53\u524D\u767B\u5F55\u59D3\u540D\u3001\u6C42\u804C\u5165\u53E3\u53CA\u9875\u9762\u8FDE\u7EED\u6027\uFF0C\u624B\u673A\u53F7\u63A9\u7801\u6CBF\u7528\u786E\u8BA4\u6765\u6E90\uFF0C\u6CA1\u6709\u91CD\u65B0\u8BFB\u53D6\u3002" };
}
export {
  stdin_default as default
};
