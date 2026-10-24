var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const r = input?.receipt, s = input?.source;
  if (!r || r.version !== 1 || r.operation !== "prepare" || r.action !== "apply" || r.key !== s?.key || s?.kind !== "daily-application-operation-input" || typeof r.execute !== "boolean" || typeof r.id !== "string" || typeof r.runId !== "string" || !["submitting", "confirmed", "failed", "unknown"].includes(r.state) || r.execute && r.state !== "submitting") throw Error("\u72EC\u7ACB\u64CD\u4F5C\u51C6\u5907\u56DE\u6267\u4E0E\u672C\u6B21\u6301\u4E45\u610F\u56FE\u4E0D\u4E00\u81F4");
  const result = { version: 1, kind: "daily-application-operation-preparation", status: r.execute ? "operation-prepared-awaiting-site-verification" : "existing-operation-not-replayed", jobTitle: s.jobTitle, jobSource: s.jobSource, actualCity: s.actualCity, operationPrepared: r.execute, existingOperation: !r.execute, operationStatus: { submitting: "\u63D0\u4EA4\u51C6\u5907\u4E2D", confirmed: "\u5DF2\u6709\u786E\u8BA4\u8BB0\u5F55", failed: "\u5DF2\u6709\u5931\u8D25\u8BB0\u5F55", unknown: "\u5DF2\u6709\u672A\u77E5\u8BB0\u5F55" }[r.state], reservationPersisted: true, applied: false, websiteGreetingVerified: false, readyForWebsiteSubmission: false, dayTaskComplete: false, siteDailyLimitConfirmed: false, nextAction: r.execute ? "\u6838\u5BF9\u7F51\u9875\u9996\u6B21\u6C9F\u901A\u5185\u5BB9\u3001\u5B9E\u9645\u63D0\u4EA4\u76EE\u6807\u4E0E\u56DE\u6267" : "\u6838\u5BF9\u539F\u64CD\u4F5C\u8BB0\u5F55\uFF0C\u4E0D\u5F97\u518D\u6B21\u63D0\u4EA4", note: "\u672C\u68C0\u67E5\u70B9\u4EC5\u5B8C\u6210\u6301\u4E45\u64CD\u4F5C\u51C6\u5907\uFF0C\u5C1A\u672A\u70B9\u51FB\u7ACB\u5373\u6C9F\u901A\u6216\u53D1\u9001\u4EFB\u4F55\u5185\u5BB9\uFF1B\u672A\u6838\u5BF9\u7F51\u7AD9\u62DB\u547C\u8BED\u548C\u771F\u5B9E\u56DE\u6267\u3002\u8FD0\u884C\u7ED3\u675F\u540E\u672A\u6838\u9A8C\u7684\u51C6\u5907\u8BB0\u5F55\u7531\u5BBF\u4E3B\u7F6E\u4E3A\u672A\u77E5\uFF0C\u539F\u9884\u7559\u4ECD\u5360\u989D\uFF0C\u4E0D\u81EA\u52A8\u9000\u989D\u6216\u91CD\u653E\u3002" };
  await Promise.resolve(result);
  signal.throwIfAborted();
  return { receipt: r, result };
};
export {
  stdin_default as default
};
