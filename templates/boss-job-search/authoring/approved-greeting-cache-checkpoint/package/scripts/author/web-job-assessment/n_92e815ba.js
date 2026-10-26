import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  const before = input?.preflight, data = input?.collection;
  if (before?.readyForBody !== true || before.result?.version !== 1 || before.result?.kind !== "web-jd-body" || before.result?.status !== "body-candidate-required" || !before.metadata || before.metadata.sourceSha256 !== before.result.sourceSha256 || before.result.accountVerified !== false || before.result.eligibleForActions !== false || before.result.modelInputAllowed !== false)
    throw Error("\u7F3A\u5C11\u672C\u6B21\u5141\u8BB8\u8BFB\u53D6\u6B63\u6587\u5019\u9009\u7684\u9884\u68C0\u6765\u6E90");
  if (!data || data.version !== 2 || data.operation !== "collect" || data.renderPolicy !== "bounded-rendered-text-v1" || data.selector !== "html" || !Array.isArray(data.framePath) || data.framePath.length || typeof data.url !== "string" || data.url !== data.documentUrl || typeof data.complete !== "boolean" || !Array.isArray(data.fields) || data.fields.length !== 5 || Buffer.byteLength(data.url) > 16384 || Buffer.byteLength(JSON.stringify(data)) > 131072)
    throw Error("\u7F3A\u5C11\u672C\u6B21\u540C\u6B21\u5143\u6570\u636E\u4E0E\u5DF2\u6392\u7248\u6B63\u6587\u91C7\u96C6");
  const specs = [
    ["description", "div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3)", "rendered-text", true],
    ["title", "head > title", "text", true],
    ["loginGate", "div:nth-of-type(3) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1)", "text", false],
    ["jobTitle", "h1", "text", false],
    ["companyLabel", "div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > div > div:nth-of-type(3) > div:nth-of-type(2)", "text", false]
  ];
  const issueOrder = ["hidden-target", "hidden-descendant", "line-clamp", "overflow-clip", "unsupported-layout", "embedded-content", "generated-content"];
  let complete = true;
  for (let i = 0; i < specs.length; i++) {
    const f = data.fields[i], [key, selector, operation, required] = specs[i];
    if (!f || f.key !== key || f.selector !== selector || f.operation !== operation || f.attribute !== null || f.required !== required || !Number.isSafeInteger(f.count) || f.count < 0 || !Array.isArray(f.issues) || !(f.value === null || typeof f.value === "string")) throw Error("\u6B63\u6587\u6765\u6E90\u5B57\u6BB5\u4E0E\u5F53\u524D\u7F16\u6392\u4E0D\u7B26");
    if (JSON.stringify(f.issues) !== JSON.stringify(issueOrder.filter((v) => f.issues.includes(v))) || operation !== "rendered-text" && f.issues.length || f.count !== 1 && (f.value !== null || f.issues.length)) throw Error("\u6B63\u6587\u6765\u6E90\u5B57\u6BB5\u539F\u56E0\u65E0\u6548");
    let status2 = f.count === 0 ? "missing" : f.count > 1 ? "ambiguous" : f.issues.some((v) => v.startsWith("hidden-")) ? "hidden" : f.issues.some((v) => ["line-clamp", "overflow-clip"].includes(v)) ? "clipped" : f.issues.length ? "unsupported" : f.value === null ? "missing-attribute" : f.value.trim() ? "ok" : "empty";
    if (f.status !== status2 || f.issues.length && f.value !== null || f.count === 1 && !f.issues.length && f.value === null || typeof f.value === "string" && Buffer.byteLength(f.value) > (operation === "rendered-text" ? 65536 : 8192)) throw Error("\u6B63\u6587\u6765\u6E90\u5B57\u6BB5\u72B6\u6001\u6216\u957F\u5EA6\u65E0\u6548");
    if (["ambiguous", "hidden", "clipped", "unsupported"].includes(status2) || f.required && status2 !== "ok") complete = false;
  }
  if (complete !== data.complete) throw Error("\u6B63\u6587\u91C7\u96C6\u5B8C\u6574\u6027\u4E0E\u5B57\u6BB5\u72B6\u6001\u4E0D\u7B26");
  const page = new URL(data.url), [body, title, gate, role, company] = data.fields;
  const text = (f, max) => f.status === "ok" && f.count === 1 && typeof f.value === "string" && f.value.trim().length <= max ? f.value.trim() : null;
  const pageTitle = text(title, 4096), jobTitle = text(role, 200), companyLabel = text(company, 500), gateText = text(gate, 500);
  const pageSource = { origin: page.origin, pathname: page.pathname, title: pageTitle };
  const expected = before.metadata;
  const site = page.protocol === "https:" && ["www.zhipin.com", "zhipin.com"].includes(page.hostname) && !page.username && !page.password && (!page.port || page.port === "443");
  const sameTarget = site && /^\/job_detail\/[^/]+\.html$/.test(page.pathname) && JSON.stringify(pageSource) === JSON.stringify(expected.page) && jobTitle === expected.jobTitle && companyLabel === expected.companyLabel;
  const description = body.status === "ok" && typeof body.value === "string" ? body.value : null;
  const login = gateText === "\u767B\u5F55\u67E5\u770B\u5B8C\u6574\u5185\u5BB9" || description !== null && /登录查看完整内容|立即登录|登录\s*\/\s*注册|短信验证码/.test(description);
  let status = !sameTarget ? "source-changed" : login ? "login-required" : !complete || !pageTitle || !jobTitle || !companyLabel || gate.status === "ok" && gateText !== "\u767B\u5F55\u67E5\u770B\u5B8C\u6574\u5185\u5BB9" || !description?.trim() ? "body-incomplete" : "body-review-required";
  const descriptionSha256 = description === null ? null : createHash("sha256").update(description).digest("hex");
  const target = `BOSS\u7F51\u9875JD\u6765\u6E90
\u9875\u9762\uFF1A${page.origin}${page.pathname}
\u5C97\u4F4D\uFF1A${jobTitle}
\u516C\u53F8\u5019\u9009\uFF08\u672A\u6838\u9A8C\uFF09\uFF1A${companyLabel}
\u6B63\u6587SHA-256\uFF1A${descriptionSha256}`;
  if (status === "body-review-required" && (target.length > 4096 || description.length > 1e5)) status = "review-too-large";
  const reasons = {
    "source-changed": "\u6B63\u6587\u91C7\u96C6\u7684\u9875\u9762\u3001\u5C97\u4F4D\u6216\u516C\u53F8\u5019\u9009\u4E0E\u672C\u6B21\u9884\u68C0\u4E0D\u4E00\u81F4\uFF0C\u505C\u6B62\u91C7\u7528\u3002",
    "login-required": "\u518D\u6B21\u91C7\u96C6\u53D1\u73B0\u767B\u5F55\u906E\u6321\u6216\u6B63\u6587\u4ECD\u542B\u767B\u5F55\u754C\u9762\u63D0\u793A\uFF0C\u4E0D\u91C7\u7528\u6B63\u6587\u3002",
    "body-incomplete": "\u6B63\u6587\u4E3A\u7A7A\u3001\u9690\u85CF\u3001\u88C1\u5207\u3001\u65E0\u6CD5\u5224\u5B9A\uFF0C\u6216\u5143\u6570\u636E\u4E0D\u5B8C\u6574\uFF0C\u8BF7\u672C\u4EBA\u6838\u5BF9\u3002",
    "body-review-required": "\u6709\u9650\u7B56\u7565\u5DF2\u53D6\u5F97\u6B63\u6587\u5019\u9009\uFF1B\u4ECD\u987B\u672C\u4EBA\u5B8C\u6574\u9605\u8BFB\uFF0C\u4E0D\u80FD\u636E\u6B64\u8BA4\u5B9A\u672A\u5220\u8282\u3002",
    "review-too-large": "\u5B8C\u6574\u76EE\u6807\u6216\u6B63\u6587\u8D85\u8FC7\u4EBA\u5DE5\u6838\u5BF9\u4E0A\u9650\uFF0C\u6574\u6B21\u505C\u6B62\uFF0C\u4E0D\u622A\u65AD\u3002"
  };
  const source = {
    kind: "associated-web-jd-body-source",
    page: pageSource,
    jobTitle,
    companyLabel,
    companyVerified: false,
    preflight: { page: expected.page, jobTitle: expected.jobTitle, companyLabel: expected.companyLabel, sourceSha256: expected.sourceSha256 },
    fields: data.fields.map((f) => ({ key: f.key, count: f.count, status: f.status, issues: f.issues })),
    collectionComplete: complete,
    renderPolicy: data.renderPolicy,
    descriptionRead: description !== null,
    descriptionSha256,
    descriptionComplete: false,
    humanCompletenessDeclaration: false
  };
  const digest = createHash("sha256").update(JSON.stringify({ source, status })).digest("hex");
  signal.throwIfAborted();
  return {
    readyForReview: status === "body-review-required",
    review: status === "body-review-required" ? { version: 1, target, content: description } : null,
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
