import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v), hash = (v) => createHash("sha256").update(v).digest("hex");
  if (!obj(input) || Object.keys(input).sort().join(",") !== "check,clickResult,pageText,pageUrl,receipt,source") throw Error("\u7F3A\u5C11\u5B9E\u9645\u63D0\u4EA4\u540E\u7684\u7F51\u7AD9\u7ED3\u679C\u6765\u6E90");
  const { check: c, clickResult: k, pageText: text, pageUrl: url, receipt: r, source: s } = input;
  if (c?.kind !== "daily-first-communication-submit-check" || c.readyForWebsiteSubmission !== true || k?.kind !== "daily-first-communication-click-returned" || k.clicked !== true || k.businessResultVerified !== false || k.operationId !== c.operationId || k.operationKey !== c.operationKey || k.jobSource !== c.jobSource || r?.version !== 1 || r.operation !== "prepare" || r.execute !== true || r.state !== "submitting" || r.id !== c.operationId || r.key !== c.operationKey || r.runId !== c.runId || r.action !== "apply" || s?.key !== r.key || s.jobSource !== c.jobSource || typeof url !== "string" || typeof text !== "string" || Buffer.byteLength(text) > 65536) throw Error("\u7F51\u7AD9\u91C7\u96C6\u4E0E\u672C\u6B21\u552F\u4E00\u70B9\u51FB\u3001\u5C97\u4F4D\u6216\u64CD\u4F5C\u6765\u6E90\u4E0D\u4E00\u81F4");
  let pageSource = null;
  try {
    const page = new URL(url);
    if (page.protocol === "https:" && page.hostname === "www.zhipin.com" && !page.port && !page.username && !page.password) pageSource = page.origin + page.pathname;
  } catch {
  }
  const observedAt = (/* @__PURE__ */ new Date()).toISOString(), evidence = { version: 1, kind: "first-communication-result-awaiting-calibration", jobSource: c.jobSource, pageSource, pageTextSha256: hash(text), observedAt, clicked: true, businessResultVerified: false };
  await template.effect.resolve({ id: r.id, state: "unknown", evidence });
  signal.throwIfAborted();
  const result = { version: 1, kind: "daily-first-communication-website-observation", status: "website-result-needs-verification", jobTitle: c.jobTitle, jobSource: c.jobSource, actualCity: c.actualCity, pageSource, operationStatus: "\u672A\u77E5\uFF0C\u7981\u6B62\u91CD\u653E", attempted: true, clicked: true, reservationPersisted: true, reservationStatus: "\u5DF2\u9884\u7559\uFF0C\u4ECD\u5360\u989D\u5EA6", applied: false, attachmentSent: false, websiteGreetingVerified: false, businessResultVerified: false, dayTaskComplete: false, siteDailyLimitConfirmed: false, nextAction: "\u6838\u5BF9\u672C\u6B21\u5B9E\u9645\u804A\u5929\u5BF9\u8C61\u3001\u5DF2\u53D1\u9001\u6D88\u606F\u548C\u7F51\u7AD9\u5F39\u6846\uFF1B\u5148\u6821\u51C6\u56DE\u6267\uFF0C\u518D\u7EE7\u7EED\u81EA\u52A8\u5FAA\u73AF", note: "\u5F53\u524D\u4EC5\u53D6\u5F97\u771F\u5B9E\u70B9\u51FB\u540E\u7684\u7F51\u9875\u5185\u5BB9\uFF0C\u4E0D\u628A\u5BFC\u822A\u6216\u70B9\u51FB\u56DE\u6267\u8BA1\u4E3A\u6295\u9012\u6210\u529F\u3002\u4FDD\u7559\u539F\u610F\u56FE\u4E0E\u672A\u77E5\u64CD\u4F5C\uFF1B\u672C\u6B21\u505C\u6B62\uFF0C\u4E0D\u80FD\u518D\u6B21\u70B9\u51FB\u540C\u4E00\u804C\u4F4D\u3002", websitePageText: text, observedAt };
  await template.result(result);
  signal.throwIfAborted();
  await template.attention({ key: "daily-actual-receipt:" + r.id, title: "\u9996\u6B21\u6C9F\u901A\u7ED3\u679C\u9700\u8981\u6838\u5BF9\uFF1A" + c.jobTitle, detail: { jobTitle: c.jobTitle, jobSource: c.jobSource, pageSource, pageTextSha256: hash(text), message: result.nextAction, applied: false, doNotReplay: true } });
  signal.throwIfAborted();
  throw Error("\u5DF2\u4FDD\u5B58\u5B9E\u9645\u7F51\u7AD9\u7ED3\u679C\uFF1B\u56DE\u6267\u5C1A\u5F85\u5B9E\u7AD9\u6838\u5BF9\uFF0C\u505C\u6B62\u5E76\u7981\u6B62\u91CD\u653E\u540C\u4E00\u804C\u4F4D");
};
export {
  stdin_default as default
};
