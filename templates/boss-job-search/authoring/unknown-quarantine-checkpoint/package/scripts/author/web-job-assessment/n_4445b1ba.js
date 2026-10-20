import { createHash } from "node:crypto";
const prepareCollection = async ({ input, signal }) => {
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
var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  const original = input?.candidate, human = input?.human?.result, fixed = input?.configuration;
  if (original?.readyForReview !== true || original.result?.status !== "body-review-required" || original.result?.kind !== "web-jd-body" || typeof original.review?.content !== "string" || typeof original.review?.target !== "string") throw Error("\u7F3A\u5C11\u672C\u6B21\u56FA\u5B9A\u539F\u6587\u6838\u5BF9\u5019\u9009");
  const parent = original.result;
  const sha = (v) => createHash("sha256").update(JSON.stringify(v)).digest("hex");
  const bodySha = createHash("sha256").update(original.review.content).digest("hex");
  if (bodySha !== parent.source?.descriptionSha256 || human?.version !== 1 || human.kind !== "web-jd-body" || human.status !== "body-source-confirmed" || human.assessmentRequested !== true || human.accountVerified !== false || human.eligibleForActions !== false || human.modelInputAllowed !== false || human.sourceSha256 !== sha({ parent: parent.sourceSha256, status: "body-source-confirmed" })) throw Error("\u7F3A\u5C11\u672C\u6B21\u660E\u786E\u8BF7\u6C42\u8BC4\u4F30\u7684\u4EBA\u5DE5\u56DE\u6267");
  const reviewedAt = human.source?.humanReviewedAt;
  if (typeof reviewedAt !== "string" || !Number.isFinite(Date.parse(reviewedAt))) throw Error("\u672C\u4EBA\u6838\u5BF9\u65F6\u95F4\u65E0\u6548");
  const expectedSource = { ...parent.source, descriptionComplete: true, humanCompletenessDeclaration: true, humanDecision: "\u786E\u8BA4\u672C\u6B21\u6B63\u6587\u5E76\u8BC4\u4F30", humanReviewedAt: reviewedAt };
  if (JSON.stringify(human.source) !== JSON.stringify(expectedSource)) throw Error("\u4EBA\u5DE5\u56DE\u6267\u4E0E\u672C\u6B21\u539F\u6587\u6765\u6E90\u4E0D\u7B26");
  if (fixed?.version !== 1 || fixed.operation !== "configuration" || !Number.isSafeInteger(fixed.revision) || fixed.revision < 0) throw Error("\u7F3A\u5C11\u672C\u6B21\u56FA\u5B9A\u6C42\u804C\u914D\u7F6E\u4E0E\u4FEE\u8BA2");
  const c = fixed.value;
  if (!c || (!["cities", "excludedRoles", "replyDailyLimit", "replyTimeZone", "salaryMax", "salaryMin", "targetRoles"].every((k) => Object.hasOwn(c, k)) || Object.keys(c).some((k) => !["cities", "excludedRoles", "replyDailyLimit", "replyTimeZone", "salaryMax", "salaryMin", "targetRoles", "knownContactedJobs", "knownContactAccountAlias", "knownContactPhoneMask", "knownGreetingDate", "knownGreetingsUsed"].includes(k)))) throw Error("\u6C42\u804C\u6761\u4EF6\u7ED3\u6784\u65E0\u6548");
  if (!Number.isSafeInteger(c.replyDailyLimit) || c.replyDailyLimit < 0 || c.replyDailyLimit > 100 || typeof c.replyTimeZone !== "string" || !c.replyTimeZone.trim() || c.replyTimeZone.length > 100) throw Error("\u56DE\u590D\u989D\u5EA6\u914D\u7F6E\u7ED3\u6784\u65E0\u6548");
  const norm = (s) => s.normalize("NFKC").trim().toLocaleLowerCase("en-US");
  const issues = [];
  for (const k of ["targetRoles", "excludedRoles", "cities"]) {
    if (!Array.isArray(c[k]) || c[k].length > 20 || c[k].some((v) => typeof v !== "string" || v.length > 100)) throw Error("\u6761\u4EF6\u5217\u8868\u7ED3\u6784\u65E0\u6548");
    const values = c[k].map(norm);
    if (values.some((v) => !v) || new Set(values).size !== values.length) issues.push("\u6761\u4EF6\u5B58\u5728\u7A7A\u767D\u6216\u91CD\u590D\u9879\uFF1A" + k);
  }
  if (!c.targetRoles.length) issues.push("\u5C1A\u672A\u660E\u786E\u76EE\u6807\u804C\u4F4D");
  if (c.targetRoles.some((v) => c.excludedRoles.map(norm).includes(norm(v)))) issues.push("\u76EE\u6807\u4E0E\u6392\u9664\u65B9\u5411\u51B2\u7A81");
  for (const k of ["salaryMin", "salaryMax"]) if (!Number.isSafeInteger(c[k]) || c[k] < 0 || c[k] > 1e6) throw Error("\u85AA\u8D44\u6761\u4EF6\u7ED3\u6784\u65E0\u6548");
  if (c.salaryMax > 0 && c.salaryMin > c.salaryMax) issues.push("\u6708\u85AA\u4E0A\u9650\u4F4E\u4E8E\u4E0B\u9650");
  const current = await prepareCollection({ input: { preflight: input.preflight, collection: input.collection }, signal });
  if (!current.readyForReview || current.result.sourceSha256 !== parent.sourceSha256 || current.review?.content !== original.review.content || current.review?.target !== original.review.target) issues.push("\u786E\u8BA4\u540E\u7684\u7F51\u9875\u6765\u6E90\u3001\u5B57\u6BB5\u72B6\u6001\u6216\u7CBE\u786E\u6B63\u6587\u5DF2\u53D8\u5316\uFF0C\u505C\u6B62\u91C7\u7528\uFF0C\u8BF7\u91CD\u65B0\u91C7\u96C6\u6838\u5BF9");
  if (original.review.content.length > 2e4 || Buffer.byteLength(original.review.content) > 65536) issues.push("\u5B8C\u6574\u6B63\u6587\u8D85\u8FC7\u672C\u5165\u53E3\u8BC4\u4F30\u8F93\u5165\u9884\u7B97\uFF0C\u6574\u6B21\u505C\u6B62\uFF0C\u4E0D\u622A\u65AD\u6216\u81EA\u52A8\u6458\u8981");
  const source = {
    ...expectedSource,
    kind: "reviewed-web-jd-assessment-source",
    confirmationSha256: human.sourceSha256,
    configurationRevision: fixed.revision,
    recheck: { sourceSha256: current.result.sourceSha256, status: current.result.status, source: current.result.source }
  };
  const result = {
    version: 1,
    kind: "web-job-assessment-advice",
    decision: "review",
    nextAction: "ask-user",
    reason: issues.join("\uFF1B"),
    issues,
    source,
    accountVerified: false,
    eligibleForActions: false,
    checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
    note: "\u4EC5\u5185\u90E8\u5EFA\u8BAE\uFF1B\u672A\u6838\u9A8C\u8D26\u53F7/\u516C\u53F8\uFF0C\u4E0D\u8C03\u7528\u7AD9\u70B9\u52A8\u4F5C\uFF0C\u4E0D\u81EA\u52A8\u91CD\u8BD5\u3002"
  };
  signal.throwIfAborted();
  return {
    ready: issues.length === 0,
    job: { title: parent.source.jobTitle, description: original.review.content, completeDeclared: true, sourceLabel: parent.source.page.origin + parent.source.page.pathname },
    configuration: c,
    source,
    reviewRecord: { reviewKey: "web-jd-input:" + sha({ source, issues }), result }
  };
};
export {
  stdin_default as default
};
