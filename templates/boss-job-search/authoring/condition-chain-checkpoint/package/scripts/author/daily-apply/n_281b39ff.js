var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  const expected = input?.expected, data = input?.snapshot, account = expected?.account;
  if (expected?.version !== 1 || expected.accountSourceValid !== true || expected.currentAccountVerified !== false || account?.kind !== "boss-account-source" || account.status !== "account-source-confirmed" || account.accountVerified !== true) throw new Error("\u7F3A\u5C11\u672C\u6B21\u5DF2\u6821\u9A8C\u7684\u51C6\u786E\u8D26\u53F7\u786E\u8BA4\u6765\u6E90");
  if (!data || data.version !== 3 || data.operation !== "collect" || data.renderPolicy !== "bounded-rendered-text-v2" || data.selector !== "body" || !Array.isArray(data.framePath) || data.framePath.length || data.url !== data.documentUrl || data.url !== account.sourceUrl || data.complete !== true || !Array.isArray(data.fields) || data.fields.length !== 4) throw new Error("\u5F53\u524D\u8D26\u53F7\u9875\u9762\u6765\u6E90\u7F3A\u5931\u6216\u5DF2\u53D8\u5316\uFF0C\u505C\u6B62\u672C\u6B21\u6BCF\u65E5\u6D41\u7A0B");
  const specs = [
    ["accountName", "div:nth-of-type(3) > ul:nth-of-type(1) > li:nth-of-type(2) > a:nth-of-type(1) > span:nth-of-type(1)", "text", null, account.accountName],
    ["phoneMask", "div:nth-of-type(3) > div:nth-of-type(3) > span:nth-of-type(1)", "text", null, account.phoneMask],
    ["jobseekerResumeHref", "span:nth-of-type(1) > li:nth-of-type(1) > a:nth-of-type(1)", "attribute", "href", account.jobseekerResumeHref],
    ["accountPageHeading", "div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1)", "text", null, "\u8D26\u53F7\u7BA1\u7406"]
  ];
  for (let i = 0; i < specs.length; i++) {
    const f = data.fields[i], [key, selector, operation, attribute, value] = specs[i];
    if (!f || f.key !== key || f.selector !== selector || f.operation !== operation || f.attribute !== attribute || f.required !== true || f.count !== 1 || f.status !== "ok" || !Array.isArray(f.issues) || f.issues.length || f.ignoredAncestorSpaces !== 0 || typeof f.value !== "string" || f.value.trim() !== value) throw new Error("\u5F53\u524D\u59D3\u540D\u3001\u624B\u673A\u53F7\u63A9\u7801\u3001\u6C42\u804C\u8005\u5165\u53E3\u6216\u8D26\u53F7\u9875\u6807\u9898\u4E0E\u6240\u9009\u6765\u6E90\u4E0D\u4E00\u81F4\uFF1B\u505C\u6B62\uFF0C\u8BF7\u672C\u4EBA\u91CD\u65B0\u6838\u5BF9");
  }
  signal.throwIfAborted();
  return { version: 1, status: "current-account-source-matched", accountAlias: account.accountAlias, accountName: account.accountName, phoneMask: account.phoneMask, jobseekerResumeHref: account.jobseekerResumeHref, sourceUrl: data.url, checkedAt: (/* @__PURE__ */ new Date()).toISOString(), currentAccountVerified: true, platformUniqueIdVerified: false, eligibleForActions: false, reason: "\u8FD0\u884C\u5F00\u59CB\u7684\u53EF\u89C1\u8D26\u53F7\u6765\u6E90\u4E0E\u672C\u4EBA\u6240\u9009\u786E\u8BA4\u8BB0\u5F55\u4E00\u81F4\uFF1B\u540E\u7EED\u5C97\u4F4D\u4E0E\u5B9E\u9645\u52A8\u4F5C\u4ECD\u987B\u5206\u522B\u590D\u9A8C\u3002" };
};
export {
  stdin_default as default
};
