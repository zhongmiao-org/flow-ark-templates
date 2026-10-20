import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  if (!input || input.version !== 1 || input.operation !== "collect" || input.selector !== "html" || !Array.isArray(input.framePath) || input.framePath.length || typeof input.url !== "string" || input.url !== input.documentUrl || typeof input.complete !== "boolean" || !Array.isArray(input.fields) || input.fields.length !== 4)
    throw Error("\u7F3A\u5C11\u672C\u6B21\u7F51\u9875JD\u6765\u6E90\u7684\u540C\u6B21\u5173\u8054\u91C7\u96C6");
  const specs = [
    ["title", "head > title", true],
    ["loginGate", "div:nth-of-type(3) > div > div > div:nth-of-type(1) > span", false],
    ["jobTitle", "h1", false],
    ["companyLabel", "div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > div > div:nth-of-type(3) > div:nth-of-type(2)", false]
  ];
  for (let i = 0; i < specs.length; i++) {
    const f = input.fields[i], [key, selector, required] = specs[i];
    if (!f || f.key !== key || f.selector !== selector || f.operation !== "text" || f.attribute !== null || f.required !== required || !Number.isSafeInteger(f.count) || f.count < 0 || !(f.value === null || typeof f.value === "string")) throw Error("\u7F51\u9875JD\u6765\u6E90\u5B57\u6BB5\u4E0E\u5F53\u524D\u5236\u4F5C\u7EA6\u5B9A\u4E0D\u7B26");
    const status2 = f.count === 0 ? "missing" : f.count > 1 ? "ambiguous" : f.value === null ? "missing-attribute" : f.value.trim() ? "ok" : "empty";
    if (f.status !== status2 || f.count !== 1 && f.value !== null || f.count === 1 && f.value === null || typeof f.value === "string" && Buffer.byteLength(f.value) > 8192) throw Error("\u7F51\u9875JD\u6765\u6E90\u5B57\u6BB5\u72B6\u6001\u65E0\u6548");
  }
  const complete = input.fields.every((f) => f.status !== "ambiguous" && (!f.required || f.status === "ok"));
  if (complete !== input.complete || Buffer.byteLength(input.url) > 16384) throw Error("\u7F51\u9875JD\u6765\u6E90\u91C7\u96C6\u5B8C\u6574\u6027\u65E0\u6548");
  const page = new URL(input.url);
  const site = page.protocol === "https:" && ["www.zhipin.com", "zhipin.com"].includes(page.hostname) && !page.username && !page.password && (!page.port || page.port === "443");
  const jobPage = site && /^\/job_detail\/[^/]+\.html$/.test(page.pathname);
  const [title, gate, role, company] = input.fields;
  const text = (f, max) => f.status === "ok" && f.count === 1 && typeof f.value === "string" && f.value.trim().length <= max ? f.value.trim() : null;
  const pageTitle = text(title, 4096), jobTitle = text(role, 200), companyLabel = text(company, 500);
  const login = site && (/^\/web\/user\/?$/.test(page.pathname) || jobPage && text(gate, 500) === "\u767B\u5F55\u67E5\u770B\u5B8C\u6574\u5185\u5BB9");
  const status = !site ? "site-mismatch" : login ? "login-required" : !jobPage ? "not-job-page" : !complete || !pageTitle || !jobTitle || !companyLabel ? "source-incomplete" : "body-review-required";
  const reasons = {
    "site-mismatch": "\u5F53\u524D\u9875\u9762\u4E0D\u5C5E\u4E8E\u9884\u671FBOSS\u7AD9\u70B9\uFF0C\u672C\u6279\u505C\u6B62\u3002",
    "login-required": "\u9875\u9762\u8981\u6C42\u672C\u4EBA\u767B\u5F55\u6216\u767B\u5F55\u67E5\u770B\u5B8C\u6574\u5185\u5BB9\uFF1B\u672C\u6279\u672A\u8BFB\u53D6\u6B63\u6587\uFF0C\u4E0D\u8C03\u7528\u6A21\u578B\u3002",
    "not-job-page": "\u5F53\u524D\u4E0D\u662F\u804C\u4F4D\u8BE6\u60C5\u9875\uFF0C\u4E0D\u80FD\u5C06\u57CE\u5E02\u9875\u6216\u5217\u8868\u5F53\u4F5CJD\u3002",
    "source-incomplete": "\u540C\u6B21\u6765\u6E90\u5B57\u6BB5\u7F3A\u5931\u3001\u91CD\u590D\u6216\u8D85\u51FA\u8303\u56F4\uFF0C\u8BF7\u672C\u4EBA\u6838\u5BF9\u5B9A\u4F4D\u548C\u9875\u9762\u3002",
    "body-review-required": "\u4EC5\u5173\u8054\u4E86\u7F51\u9875\u3001\u5C97\u4F4D\u548C\u516C\u53F8\u6807\u7B7E\uFF1B\u672A\u8BFB\u53D6\u5B8C\u6574\u6B63\u6587\uFF0C\u4ECD\u9700\u6B63\u6587\u80FD\u529B\u4E0E\u672C\u4EBA\u6838\u5BF9\u540E\u63A5\u5165\u8BC4\u4F30\u3002"
  };
  const source = {
    kind: "associated-web-jd-metadata",
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
    attentionKey: "web-jd-source:" + digest,
    result: {
      version: 1,
      kind: "web-jd-source",
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
