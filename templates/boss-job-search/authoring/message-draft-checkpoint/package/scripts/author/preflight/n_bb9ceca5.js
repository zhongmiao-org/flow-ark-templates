var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  if (!input || typeof input.urlBefore !== "string" || typeof input.urlAfter !== "string" || typeof input.title !== "string" || typeof input.pageText !== "string" || !input.pageText.trim())
    throw new Error("\u7F51\u9875\u89C2\u5BDF\u4E0D\u5B8C\u6574\uFF0C\u8BF7\u91CD\u65B0\u8FD0\u884C\u53EA\u8BFB\u9884\u68C0");
  if (input.urlBefore.length > 16384 || input.urlAfter.length > 16384 || input.title.length > 4096 || input.pageText.length > 65536)
    throw new Error("\u7F51\u9875\u89C2\u5BDF\u8D85\u8FC7\u672C\u6B21\u9884\u68C0\u8303\u56F4");
  if (input.urlBefore !== input.urlAfter)
    throw new Error("\u89C2\u5BDF\u671F\u95F4\u7F51\u9875\u5730\u5740\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u6838\u5BF9");
  const page = new URL(input.urlAfter);
  const expected = page.protocol === "https:" && ["www.zhipin.com", "zhipin.com"].includes(page.hostname) && !page.username && !page.password && (!page.port || page.port === "443");
  const login = expected && /^\/web\/user\/?$/.test(page.pathname);
  const jobDetail = expected && /^\/job_detail\/[^/]+\.html$/.test(page.pathname);
  const jdLoginGate = jobDetail && input.pageText.includes("\u767B\u5F55\u67E5\u770B\u5B8C\u6574\u5185\u5BB9");
  return {
    version: 2,
    site: "boss",
    status: !expected ? "site-mismatch" : login || jdLoginGate ? "login-required" : "account-unverified",
    accountVerified: false,
    eligibleForActions: false,
    observedPage: { origin: page.origin, pathname: page.pathname, title: input.title },
    jdContentStatus: jdLoginGate ? "login-gated" : "unverified",
    loginReason: login ? "login-page" : jdLoginGate ? "job-description-login-gate" : null,
    classifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
    note: jdLoginGate ? "\u804C\u4F4D\u6B63\u6587\u660E\u786E\u8981\u6C42\u767B\u5F55\u67E5\u770B\u5B8C\u6574\u5185\u5BB9\uFF0C\u5F53\u524DJD\u4E0D\u5B8C\u6574\uFF0C\u8BF7\u672C\u4EBA\u767B\u5F55\u540E\u91CD\u65B0\u6838\u5BF9\u3002\u6CA1\u6709\u8FDB\u884C\u5C97\u4F4D\u5224\u65AD\u6216\u62DB\u8058\u52A8\u4F5C\u3002" : "\u8FD9\u662F\u72EC\u7ACB\u7F51\u9875\u89C2\u5BDF\u3002\u622A\u65AD\u6807\u8BB0\u7F3A\u5931\u4E0D\u8BC1\u660EJD\u5B8C\u6574\uFF1B\u767B\u5F55\u9875\u9700\u8981\u672C\u4EBA\u7EE7\u7EED\uFF0C\u5176\u4ED6\u9875\u9762\u4E5F\u987B\u5B9E\u9645\u6838\u5BF9\u6C42\u804C\u8005\u8D26\u53F7\u3002\u672C\u68C0\u67E5\u70B9\u4E0D\u6388\u4E88\u6295\u9012\u6216\u804A\u5929\u6743\u9650\u3002"
  };
};
export {
  stdin_default as default
};
