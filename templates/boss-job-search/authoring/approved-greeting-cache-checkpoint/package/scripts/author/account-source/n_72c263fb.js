var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  const accountAlias = input?.accountAlias, data = input?.snapshot;
  if (typeof accountAlias !== "string" || !accountAlias.trim() || accountAlias !== accountAlias.trim() || accountAlias.length > 100 || /[\r\n]/.test(accountAlias)) throw new Error("\u8BF7\u5148\u586B\u5199\u56FA\u5B9A\u7684\u672C\u5730\u8D26\u53F7\u522B\u540D");
  if (!data || data.version !== 3 || data.operation !== "collect" || data.renderPolicy !== "bounded-rendered-text-v2" || data.selector !== "body" || !Array.isArray(data.framePath) || data.framePath.length || data.url !== data.documentUrl || typeof data.complete !== "boolean" || !Array.isArray(data.fields) || data.fields.length !== 4) throw new Error("\u8D26\u53F7\u6765\u6E90\u4E0D\u662F\u672C\u6B21\u56FA\u5B9A\u7684\u540C\u9875\u56DB\u5B57\u6BB5\u91C7\u96C6");
  const specs = [
    ["accountName", "div:nth-of-type(3) > ul:nth-of-type(1) > li:nth-of-type(2) > a:nth-of-type(1) > span:nth-of-type(1)", "text", null],
    ["phoneMask", "div:nth-of-type(3) > div:nth-of-type(3) > span:nth-of-type(1)", "text", null],
    ["jobseekerResumeHref", "span:nth-of-type(1) > li:nth-of-type(1) > a:nth-of-type(1)", "attribute", "href"],
    ["accountPageHeading", "div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1)", "text", null]
  ];
  for (let i = 0; i < specs.length; i++) {
    const f = data.fields[i], [key, selector, operation, attribute] = specs[i];
    if (!f || f.key !== key || f.selector !== selector || f.operation !== operation || f.attribute !== attribute || f.required !== true || !Number.isSafeInteger(f.count) || f.count < 0 || !Array.isArray(f.issues) || f.issues.length || f.ignoredAncestorSpaces !== 0 || !(f.value === null || typeof f.value === "string")) throw new Error("\u8D26\u53F7\u5B57\u6BB5\u5B9A\u4E49\u4E0E\u672C\u6B21\u7F16\u6392\u4E0D\u4E00\u81F4");
    const status = f.count === 0 ? "missing" : f.count > 1 ? "ambiguous" : f.value === null ? "missing-attribute" : f.value.trim() ? "ok" : "empty";
    if (f.status !== status || f.count !== 1 && f.value !== null) throw new Error("\u8D26\u53F7\u5B57\u6BB5\u72B6\u6001\u65E0\u6548");
  }
  const complete = data.fields.every((f) => f.status === "ok" && f.count === 1);
  if (data.complete !== complete) throw new Error("\u8D26\u53F7\u91C7\u96C6\u5B8C\u6574\u6027\u4E0E\u5B57\u6BB5\u72B6\u6001\u4E0D\u7B26");
  const text = (i) => data.fields[i].status === "ok" ? data.fields[i].value.trim() : "";
  const accountName = text(0), phoneMask = text(1), jobseekerResumeHref = text(2), heading = text(3);
  const gaps = [];
  let page;
  try {
    page = new URL(data.url);
  } catch {
    gaps.push("\u9875\u9762\u5730\u5740\u65E0\u6CD5\u6838\u5BF9");
  }
  if (!page || page.origin !== "https://www.zhipin.com" || page.pathname !== "/web/geek/account" || page.searchParams.get("type") !== "accountSet" || page.username || page.password || page.hash) gaps.push("\u5F53\u524D\u4E0D\u662F\u9884\u671F\u7684\u6C42\u804C\u8D26\u53F7\u7BA1\u7406\u9875");
  if (!complete) gaps.push("\u59D3\u540D\u3001\u624B\u673A\u53F7\u63A9\u7801\u3001\u6C42\u804C\u8005\u5165\u53E3\u6216\u8D26\u53F7\u9875\u6807\u9898\u7F3A\u5931/\u4E0D\u552F\u4E00");
  if (!accountName || accountName.length > 100 || /登录|注册|验证码/.test(accountName)) gaps.push("\u8D26\u53F7\u540D\u79F0\u5C1A\u672A\u5C31\u7EEA");
  if (!phoneMask || phoneMask.length > 100 || !/^[+\d ()-]*\*{2,}[\d ()-]+$/.test(phoneMask)) gaps.push("\u672A\u53D6\u5F97\u53EF\u6838\u5BF9\u7684\u624B\u673A\u53F7\u63A9\u7801\uFF0C\u4E0D\u91C7\u96C6\u660E\u6587\u53F7\u7801");
  if (heading !== "\u8D26\u53F7\u7BA1\u7406") gaps.push("\u8D26\u53F7\u9875\u6807\u9898\u4E0D\u7B26");
  try {
    const resume = new URL(jobseekerResumeHref, data.url);
    if (resume.origin !== "https://www.zhipin.com" || resume.pathname !== "/web/geek/resume" || resume.username || resume.password) gaps.push("\u6C42\u804C\u8005\u7B80\u5386\u5165\u53E3\u4E0D\u7B26");
  } catch {
    gaps.push("\u7F3A\u5C11\u6C42\u804C\u8005\u7B80\u5386\u5165\u53E3");
  }
  const readyForReview = gaps.length === 0;
  const result = { version: 1, kind: "boss-account-source", status: readyForReview ? "account-review-required" : "account-source-incomplete", accountAlias, accountName, phoneMask, jobseekerResumeHref, role: readyForReview ? "jobseeker" : "unverified", sourceUrl: data.url, accountVerified: false, platformUniqueIdVerified: false, eligibleForActions: false, confirmedAt: null, checkedAt: (/* @__PURE__ */ new Date()).toISOString(), reason: readyForReview ? "\u5DF2\u53D6\u5F97\u5FC5\u8981\u53EF\u89C1\u6765\u6E90\uFF0C\u7B49\u5F85\u672C\u4EBA\u6838\u5BF9\uFF1B\u5C1A\u672A\u786E\u8BA4\u8D26\u53F7\u3002" : gaps.join("\uFF1B") };
  const review = readyForReview ? { version: 1, target: "\u672C\u6B21BOSS\u6C42\u804C\u8D26\u53F7\u6765\u6E90 \xB7 " + accountAlias, content: ["\u672C\u5730\u8D26\u53F7\u522B\u540D\uFF1A" + accountAlias, "\u9875\u9762\u8D26\u53F7\u540D\u79F0\uFF1A" + accountName, "\u624B\u673A\u53F7\u63A9\u7801\uFF1A" + phoneMask, "\u89D2\u8272\u6765\u6E90\uFF1A\u6C42\u804C\u8005\u8D26\u53F7\u7BA1\u7406\u9875\u53CA\u7B80\u5386\u5165\u53E3", "\u6765\u6E90\u9875\u9762\uFF1A" + data.url, "\u7B80\u5386\u5165\u53E3\uFF1A" + jobseekerResumeHref, "", "\u8BF7\u4E0E\u53F3\u4FA7\u771F\u5B9E\u7F51\u9875\u6838\u5BF9\u3002\u522B\u540D\u3001\u59D3\u540D\u548C\u63A9\u7801\u5747\u4E0D\u662F\u5E73\u53F0\u552F\u4E00\u8D26\u53F7ID\u3002", "\u672C\u6B21\u786E\u8BA4\u53EA\u4FDD\u7559\u8D26\u53F7\u6765\u6E90\uFF0C\u4E0D\u6388\u6743\u6295\u9012\u3001\u804A\u5929\u3001\u9644\u4EF6\u6216\u6A21\u578B\u8C03\u7528\u3002"].join("\n") } : null;
  return { readyForReview, snapshot: data, result, review };
};
export {
  stdin_default as default
};
