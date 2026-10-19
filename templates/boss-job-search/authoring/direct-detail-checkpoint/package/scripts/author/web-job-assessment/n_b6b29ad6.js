import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  if (!input || input.version !== 1 || input.operation !== "collect" || input.selector !== "html" || !Array.isArray(input.framePath) || input.framePath.length || typeof input.url !== "string" || input.url !== input.documentUrl || typeof input.complete !== "boolean" || !Array.isArray(input.fields) || input.fields.length !== 4)
    throw Error("\u7F3A\u5C11\u672C\u6B21\u6B63\u6587\u9884\u68C0\u7684\u540C\u6B21\u5143\u6570\u636E\u91C7\u96C6");
  const specs = [
    ["title", "head > title", true],
    ["loginGate", "div:nth-of-type(3) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1)", false],
    ["jobTitle", "h1", false],
    ["companyLabel", "div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > div > div:nth-of-type(3) > div:nth-of-type(2)", false]
  ];
  for (let i = 0; i < specs.length; i++) {
    const f = input.fields[i], [key, selector, required] = specs[i];
    if (!f || f.key !== key || f.selector !== selector || f.operation !== "text" || f.attribute !== null || f.required !== required || !Number.isSafeInteger(f.count) || f.count < 0 || !(f.value === null || typeof f.value === "string")) throw Error("\u6B63\u6587\u9884\u68C0\u5B57\u6BB5\u4E0E\u5F53\u524D\u7F16\u6392\u4E0D\u7B26");
    const status2 = f.count === 0 ? "missing" : f.count > 1 ? "ambiguous" : f.value === null ? "missing-attribute" : f.value.trim() ? "ok" : "empty";
    if (f.status !== status2 || f.count !== 1 && f.value !== null || f.count === 1 && f.value === null || typeof f.value === "string" && Buffer.byteLength(f.value) > 8192) throw Error("\u6B63\u6587\u9884\u68C0\u5B57\u6BB5\u72B6\u6001\u65E0\u6548");
  }
  const complete = input.fields.every((f) => f.status !== "ambiguous" && (!f.required || f.status === "ok"));
  if (complete !== input.complete || Buffer.byteLength(input.url) > 16384) throw Error("\u6B63\u6587\u9884\u68C0\u91C7\u96C6\u5B8C\u6574\u6027\u65E0\u6548");
  const page = new URL(input.url);
  const site = page.protocol === "https:" && ["www.zhipin.com", "zhipin.com"].includes(page.hostname) && !page.username && !page.password && (!page.port || page.port === "443");
  const jobPage = site && /^\/job_detail\/[^/]+\.html$/.test(page.pathname);
  const [title, gate, role, company] = input.fields;
  const text = (f, max) => f.status === "ok" && f.count === 1 && typeof f.value === "string" && f.value.trim().length <= max ? f.value.trim() : null;
  const pageTitle = text(title, 4096), jobTitle = text(role, 200), companyLabel = text(company, 500);
  const gateText = text(gate, 500);
  const login = site && (/^\/web\/user\/?$/.test(page.pathname) || jobPage && gateText === "\u767B\u5F55\u67E5\u770B\u5B8C\u6574\u5185\u5BB9");
  const status = !site ? "site-mismatch" : login ? "login-required" : !jobPage ? "not-job-page" : !complete || !pageTitle || !jobTitle || !companyLabel || gate.status === "ok" && gateText !== "\u767B\u5F55\u67E5\u770B\u5B8C\u6574\u5185\u5BB9" ? "source-incomplete" : "body-candidate-required";
  const reasons = {
    "site-mismatch": "\u5F53\u524D\u9875\u9762\u4E0D\u5C5E\u4E8E\u9884\u671FBOSS\u7AD9\u70B9\uFF0C\u672A\u6267\u884C\u6B63\u6587\u91C7\u96C6\u3002",
    "login-required": "\u9875\u9762\u8981\u6C42\u672C\u4EBA\u767B\u5F55\u6216\u767B\u5F55\u67E5\u770B\u5B8C\u6574\u5185\u5BB9\uFF0C\u672A\u6267\u884C\u6B63\u6587\u91C7\u96C6\u3002",
    "not-job-page": "\u5F53\u524D\u4E0D\u662F\u804C\u4F4D\u8BE6\u60C5\u9875\uFF0C\u4E0D\u80FD\u628A\u5217\u8868\u6216\u57CE\u5E02\u9875\u5F53\u4F5CJD\u3002",
    "source-incomplete": "\u540C\u6B21\u5143\u6570\u636E\u7F3A\u5931\u3001\u91CD\u590D\u3001\u8D85\u9650\u6216\u767B\u5F55\u63D0\u793A\u542B\u4E49\u4E0D\u660E\uFF0C\u8BF7\u672C\u4EBA\u6838\u5BF9\u3002",
    "body-candidate-required": "\u4EC5\u901A\u8FC7\u521D\u6B65\u5143\u6570\u636E\u68C0\u67E5\uFF1B\u4E0B\u4E00\u6B65\u4ECD\u987B\u91C7\u96C6\u6709\u9650\u6B63\u6587\u5E76\u7531\u672C\u4EBA\u5B8C\u6574\u9605\u8BFB\u3002"
  };
  const source = {
    kind: "associated-web-jd-body-source",
    page: { origin: page.origin, pathname: page.pathname, title: pageTitle },
    jobTitle: jobPage ? jobTitle : null,
    companyLabel: jobPage ? companyLabel : null,
    companyVerified: false,
    fields: input.fields.map((f) => ({ key: f.key, count: f.count, status: f.status })),
    collectionComplete: complete,
    descriptionRead: false,
    descriptionComplete: false
  };
  const digest = createHash("sha256").update(JSON.stringify({ source, status })).digest("hex");
  signal.throwIfAborted();
  return {
    readyForBody: status === "body-candidate-required",
    metadata: { page: source.page, jobTitle: source.jobTitle, companyLabel: source.companyLabel, sourceSha256: digest },
    attentionKey: "web-jd-body:" + digest,
    result: {
      version: 1,
      kind: "web-jd-body",
      status,
      reason: reasons[status],
      source,
      sourceSha256: digest,
      accountVerified: false,
      eligibleForActions: false,
      modelInputAllowed: false,
      nextAction: "ask-user",
      checkedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
};
export {
  stdin_default as default
};
