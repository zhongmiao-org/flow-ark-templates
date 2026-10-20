var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  const read = input, account = read?.value;
  if (!read || read.version !== 1 || read.operation !== "read" || read.binding !== "account-source-result" || read.schemaValidation !== "passed" || read.dataChanged !== false || read.ref?.version !== 1 || read.ref.policy !== "credential-redacted-v1" || read.ref.source?.entryId !== "account-source") throw new Error("\u7F3A\u5C11\u672C\u5B9E\u4F8B\u5DF2\u9009\u62E9\u4E14\u5B8C\u6574\u53EF\u590D\u7528\u7684\u8D26\u53F7\u6765\u6E90\uFF0C\u8BF7\u5230\u8D44\u6E90\u9875\u91CD\u65B0\u6838\u5BF9\u5E76\u4FDD\u5B58");
  if (!account || account.version !== 1 || account.kind !== "boss-account-source" || account.status !== "account-source-confirmed" || account.accountVerified !== true || account.platformUniqueIdVerified !== false || account.eligibleForActions !== false || account.role !== "jobseeker") throw new Error("\u6240\u9009\u8BB0\u5F55\u5C1A\u672A\u5B8C\u6210\u672C\u4EBA\u786E\u8BA4\u548C\u6765\u6E90\u590D\u9A8C\uFF1B\u8BF7\u5728\u5F53\u524D\u5B9E\u4F8B\u5B8C\u6210\u8D26\u53F7\u6838\u5BF9\uFF0C\u518D\u9009\u62E9\u8BE5\u6B21\u5DF2\u4FDD\u5B58\u7ED3\u679C");
  const keys = ["version", "kind", "status", "accountAlias", "accountName", "phoneMask", "jobseekerResumeHref", "role", "sourceUrl", "accountVerified", "platformUniqueIdVerified", "eligibleForActions", "confirmedAt", "checkedAt", "reason"];
  if (Object.keys(account).length !== keys.length || keys.some((k) => !Object.prototype.hasOwnProperty.call(account, k))) throw new Error("\u6240\u9009\u8D26\u53F7\u7ED3\u679C\u7ED3\u6784\u4E0D\u7B26\uFF0C\u505C\u6B62\u91C7\u7528");
  for (const key of ["accountAlias", "accountName", "phoneMask"]) if (typeof account[key] !== "string" || !account[key].trim() || account[key] !== account[key].trim() || account[key].length > 100 || /[\r\n]/.test(account[key])) throw new Error("\u8D26\u53F7\u5FC5\u8981\u5B57\u6BB5\u7F3A\u5931\u6216\u683C\u5F0F\u65E0\u6548\uFF0C\u505C\u6B62\u91C7\u7528");
  if (!/^[+\d ()-]*\*{2,}[\d ()-]+$/.test(account.phoneMask) || /登录|注册|验证码/.test(account.accountName)) throw new Error("\u8D26\u53F7\u6765\u6E90\u7F3A\u5C11\u6709\u6548\u7684\u53EF\u89C1\u59D3\u540D\u6216\u624B\u673A\u53F7\u63A9\u7801");
  if (typeof account.reason !== "string" || !account.reason.trim()) throw new Error("\u8D26\u53F7\u7ED3\u679C\u7F3A\u5C11\u660E\u786E\u6838\u5BF9\u8BF4\u660E");
  const confirmedAt = Date.parse(account.confirmedAt), checkedAt = Date.parse(account.checkedAt);
  if (typeof account.confirmedAt !== "string" || typeof account.checkedAt !== "string" || !Number.isFinite(confirmedAt) || !Number.isFinite(checkedAt) || confirmedAt <= 0 || checkedAt < confirmedAt || checkedAt > Date.now() + 6e4) throw new Error("\u8D26\u53F7\u786E\u8BA4\u6216\u590D\u9A8C\u65F6\u95F4\u65E0\u6CD5\u6838\u5BF9\uFF0C\u8BF7\u91CD\u65B0\u786E\u8BA4");
  if (typeof account.sourceUrl !== "string" || typeof account.jobseekerResumeHref !== "string" || !account.sourceUrl.trim() || !account.jobseekerResumeHref.trim() || account.sourceUrl.length > 16384 || account.jobseekerResumeHref.length > 16384) throw new Error("\u8D26\u53F7\u9875\u9762\u6216\u7B80\u5386\u5165\u53E3\u5730\u5740\u65E0\u6548");
  const page = new URL(account.sourceUrl), resume = new URL(account.jobseekerResumeHref, account.sourceUrl);
  if (page.origin !== "https://www.zhipin.com" || page.pathname !== "/web/geek/account" || page.searchParams.get("type") !== "accountSet" || page.username || page.password || page.hash || resume.origin !== page.origin || resume.pathname !== "/web/geek/resume" || resume.username || resume.password) throw new Error("\u8D26\u53F7\u8BB0\u5F55\u7684\u9875\u9762\u6216\u6C42\u804C\u8005\u5165\u53E3\u6765\u6E90\u4E0D\u7B26");
  signal.throwIfAborted();
  return { version: 1, accountSourceValid: true, currentAccountVerified: false, account };
};
export {
  stdin_default as default
};
