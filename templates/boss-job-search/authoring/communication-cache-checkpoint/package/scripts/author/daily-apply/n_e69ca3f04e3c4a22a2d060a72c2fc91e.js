var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const expected = input?.expected?.account;
  const initialized = input?.snapshot;
  if (input?.expected?.accountSourceValid !== true || expected?.status !== "account-source-confirmed" || expected.accountVerified !== true || initialized?.status !== "current-account-source-matched" || initialized.currentAccountVerified !== true || initialized.platformUniqueIdVerified !== false || initialized.accountName !== expected.accountName || initialized.phoneMask !== expected.phoneMask || initialized.sourceUrl !== expected.sourceUrl || initialized.jobseekerResumeHref !== expected.jobseekerResumeHref || !Number.isFinite(Date.parse(initialized.checkedAt))) throw Error("\u7F3A\u5C11\u672C\u6B21\u521D\u59CB\u5316\u6838\u5BF9\u901A\u8FC7\u7684\u8D26\u53F7\u6765\u6E90");
  const call = async (operation, selector, value) => {
    signal.throwIfAborted();
    const result = await template.browser("browser", { operation, ...selector ? { selector } : {}, ...value === void 0 ? {} : { value }, timeoutMs: 3e3 });
    signal.throwIfAborted();
    return result;
  };
  const before = await call("url");
  const page = new URL(before);
  if (page.origin !== "https://www.zhipin.com" || page.username || page.password || page.hash || page.pathname !== "/web/geek/jobs" && !/^\/job_detail\/[A-Za-z0-9_~-]+\.html$/.test(page.pathname)) throw Error("\u5F53\u524D\u9875\u9762\u4E0D\u662F\u672C\u6B21\u804C\u4F4D\u5217\u8868\uFF0C\u505C\u6B62\u672C\u9879\uFF0C\u4E0D\u91CD\u65B0\u767B\u5F55\u6216\u91CD\u653E\u64CD\u4F5C");
  const nameSelector = "div:nth-of-type(3) > ul:nth-of-type(1) > li:nth-of-type(2) > a:nth-of-type(1) > span:nth-of-type(1), :root:not(:has(div:nth-of-type(3) > ul:nth-of-type(1) > li:nth-of-type(2) > a:nth-of-type(1) > span:nth-of-type(1))) div:nth-of-type(4) > ul:nth-of-type(1) > li:nth-of-type(2) > a:nth-of-type(1) > span:nth-of-type(1)";
  const resumeSelector = "span:nth-of-type(1) > li:nth-of-type(1) > a:nth-of-type(1)";
  const nameCount = await call("count", nameSelector), resumeCount = await call("count", resumeSelector);
  if (nameCount !== 1 || resumeCount !== 1) throw Error("\u5F53\u524D\u9875\u9762\u8D26\u53F7\u5165\u53E3\u6570\u91CF\u5F02\u5E38\uFF1A" + JSON.stringify({ nameCount, resumeCount }));
  const name = await call("read", nameSelector);
  const href = await call("attribute", resumeSelector, "href");
  if (typeof name !== "string" || name.normalize("NFKC").trim() !== initialized.accountName.normalize("NFKC").trim() || typeof href !== "string" || new URL(href, before).href !== new URL(initialized.jobseekerResumeHref, initialized.sourceUrl).href || await call("url") !== before) throw Error("\u5F53\u524D\u767B\u5F55\u8EAB\u4EFD\u3001\u6C42\u804C\u5165\u53E3\u6216\u9875\u9762\u4E0E\u521D\u59CB\u5316\u6765\u6E90\u4E0D\u4E00\u81F4\uFF0C\u505C\u6B62\u672C\u9879");
  signal.throwIfAborted();
  return { ...initialized, checkedAt: (/* @__PURE__ */ new Date()).toISOString(), initializationCheckedAt: initialized.checkedAt, currentPageUrl: before, accountCheckMode: "initialized-account-and-current-visible-header", phoneMaskRechecked: false, reason: "\u672C\u6B21\u521D\u59CB\u5316\u5DF2\u6838\u5BF9\u59D3\u540D\u3001\u624B\u673A\u53F7\u63A9\u7801\u548C\u8D26\u53F7\u6765\u6E90\uFF1B\u672C\u9879\u53EA\u5728\u5F53\u524D\u7F51\u9875\u6838\u5BF9\u767B\u5F55\u59D3\u540D\u3001\u6C42\u804C\u5165\u53E3\u53CA\u9875\u9762\u8FDE\u7EED\u6027\uFF0C\u4E0D\u91CD\u590D\u8DF3\u8F6C\u8D26\u53F7\u9875\uFF1B\u624B\u673A\u53F7\u63A9\u7801\u6CBF\u7528\u521D\u59CB\u5316\u6765\u6E90\uFF0C\u672A\u58F0\u79F0\u91CD\u65B0\u8BFB\u53D6\u3002" };
};
export {
  stdin_default as default
};
