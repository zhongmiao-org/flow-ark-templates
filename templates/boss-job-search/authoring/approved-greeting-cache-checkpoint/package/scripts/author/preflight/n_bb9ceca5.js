var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  if (!input || input.version !== 1 || input.operation !== "collect" || input.selector !== "html" || !Array.isArray(input.framePath) || input.framePath.length || typeof input.url !== "string" || input.url !== input.documentUrl || typeof input.complete !== "boolean" || !Array.isArray(input.fields) || input.fields.length !== 2)
    throw new Error("\u7F3A\u5C11\u672C\u6B21\u540C\u6E90\u5173\u8054\u91C7\u96C6\uFF0C\u8BF7\u91CD\u65B0\u6838\u5BF9\u9884\u68C0\u6D41\u7A0B");
  const [title, gate] = input.fields;
  for (const [field, key, required] of [[title, "title", true], [gate, "loginGate", false]]) {
    if (!field || field.key !== key || field.operation !== "text" || field.attribute !== null || field.required !== required || !Number.isSafeInteger(field.count) || field.count < 0 || typeof field.status !== "string" || !(field.value === null || typeof field.value === "string"))
      throw new Error("\u91C7\u96C6\u5B57\u6BB5\u4E0E\u5F53\u524D\u9884\u68C0\u7EA6\u5B9A\u4E0D\u4E00\u81F4");
  }
  if (input.url.length > 16384 || typeof title.value === "string" && title.value.length > 4096)
    throw new Error("\u7F51\u9875\u89C2\u5BDF\u8D85\u8FC7\u672C\u6B21\u9884\u68C0\u8303\u56F4");
  const page = new URL(input.url);
  const expected = page.protocol === "https:" && ["www.zhipin.com", "zhipin.com"].includes(page.hostname) && !page.username && !page.password && (!page.port || page.port === "443");
  const titleReady = title.status === "ok" && title.count === 1 && typeof title.value === "string" && !!title.value.trim();
  const gateReady = gate.status === "ok" && gate.count === 1 && typeof gate.value === "string";
  const complete = input.complete && titleReady;
  const login = complete && expected && /^\/web\/user\/?$/.test(page.pathname);
  const jobDetail = expected && /^\/job_detail\/[^/]+\.html$/.test(page.pathname);
  const jdLoginGate = complete && jobDetail && gateReady && gate.value.trim() === "\u767B\u5F55\u67E5\u770B\u5B8C\u6574\u5185\u5BB9";
  return {
    version: 3,
    site: "boss",
    status: !expected ? "site-mismatch" : login || jdLoginGate ? "login-required" : "account-unverified",
    accountVerified: false,
    eligibleForActions: false,
    observedPage: { origin: page.origin, pathname: page.pathname, title: titleReady ? title.value : null },
    collection: {
      kind: "associated-browser-fields",
      complete,
      fields: [title, gate].map((field) => ({ key: field.key, count: field.count, status: field.status }))
    },
    jdContentStatus: jdLoginGate ? "login-gated" : "unverified",
    loginReason: login ? "login-page" : jdLoginGate ? "job-description-login-gate" : null,
    classifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
    note: !complete ? "\u540C\u6B21\u91C7\u96C6\u4E0D\u5B8C\u6574\u6216\u5B57\u6BB5\u4E0D\u552F\u4E00\uFF0C\u8BF7\u672C\u4EBA\u6838\u5BF9\u9875\u9762\u548C\u5B9A\u4F4D\uFF1B\u6CA1\u6709\u91C7\u7EB3\u5B8C\u6574JD\u3001\u8D26\u53F7\u6216\u4EFB\u4F55\u5916\u53D1\u8D44\u683C\u3002" : jdLoginGate ? "\u804C\u4F4D\u6B63\u6587\u660E\u786E\u8981\u6C42\u767B\u5F55\u67E5\u770B\u5B8C\u6574\u5185\u5BB9\uFF0C\u5F53\u524DJD\u4E0D\u5B8C\u6574\uFF0C\u8BF7\u672C\u4EBA\u767B\u5F55\u540E\u91CD\u65B0\u6838\u5BF9\u3002\u6CA1\u6709\u8FDB\u884C\u5C97\u4F4D\u5224\u65AD\u6216\u62DB\u8058\u52A8\u4F5C\u3002" : login ? "\u5F53\u524D\u4E3ABOSS\u767B\u5F55\u9875\uFF0C\u8BF7\u672C\u4EBA\u5B8C\u6210\u5FC5\u8981\u767B\u5F55\u540E\u91CD\u65B0\u53EA\u8BFB\u6838\u5BF9\uFF1B\u672C\u6D41\u7A0B\u4E0D\u8F93\u5165\u9A8C\u8BC1\u7801\u3001\u4E0D\u63A5\u53D7\u534F\u8BAE\u3002" : "\u540C\u6B21\u53EA\u8BFB\u9884\u68C0\u4EC5\u5173\u8054\u672C\u6B21\u7F51\u5740\u3001\u6807\u9898\u53CA\u767B\u5F55\u63D0\u793A\u3002\u63D0\u793A\u7F3A\u5931\u4E0D\u8BC1\u660E\u8D26\u53F7\u6216JD\u5B8C\u6574\uFF0C\u4ECD\u987B\u672C\u4EBA\u6838\u9A8C\uFF1B\u672A\u6388\u4E88\u6295\u9012\u6216\u804A\u5929\u6743\u9650\u3002"
  };
};
export {
  stdin_default as default
};
