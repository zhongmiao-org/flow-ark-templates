var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  const object = (value) => value && typeof value === "object" && !Array.isArray(value);
  if (!object(input) || Object.keys(input).sort().join(",") !== "check,click") throw Error("\u7F3A\u5C11\u672C\u6B21\u552F\u4E00\u70B9\u51FB\u4E0E\u63D0\u4EA4\u524D\u6765\u6E90");
  const c = input.check, k = input.click;
  if (!object(c) || c.version !== 1 || c.kind !== "daily-first-communication-submit-check" || c.readyForWebsiteSubmission !== true || c.websiteGreetingVerified !== false || c.applied !== false || c.attachmentSent !== false || !["operationId", "operationKey", "runId", "jobSource", "jobTitle", "actualCity"].every((key) => typeof c[key] === "string" && c[key].length > 0) || !object(k) || Object.keys(k).sort().join(",") !== "clicked,verified" || k.clicked !== true || k.verified !== false) throw Error("\u70B9\u51FB\u8FD4\u56DE\u4E0E\u672C\u6B21\u56FA\u5B9A\u64CD\u4F5C\u6765\u6E90\u4E0D\u7B26\uFF1B\u4FDD\u7559\u672A\u77E5\uFF0C\u4E0D\u91CD\u8BD5");
  const source = new URL(c.jobSource);
  if (source.protocol !== "https:" || source.hostname !== "www.zhipin.com" || source.port || source.username || source.password || source.search || source.hash || !/^\/job_detail\/[A-Za-z0-9_~-]+\.html$/.test(source.pathname)) throw Error("\u804C\u4F4D\u6765\u6E90\u65E0\u6548\uFF0C\u4FDD\u7559\u672A\u77E5\u4E14\u4E0D\u91CD\u8BD5");
  await new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      reject(signal.reason ?? Error("\u7B49\u5F85\u5DF2\u53D6\u6D88"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve(void 0);
    }, 1500);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
  });
  signal.throwIfAborted();
  return { version: 1, kind: "daily-first-communication-click-returned", clicked: true, businessResultVerified: false, operationId: c.operationId, operationKey: c.operationKey, runId: c.runId, jobSource: c.jobSource, observedAt: (/* @__PURE__ */ new Date()).toISOString() };
};
export {
  stdin_default as default
};
