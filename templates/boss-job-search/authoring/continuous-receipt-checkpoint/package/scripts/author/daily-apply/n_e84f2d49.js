import { createHash } from "node:crypto";
var stdin_default = async ({ input, signal, template }) => {
  signal.throwIfAborted();
  const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  if (!obj(input) || Object.keys(input).sort().join(",") !== "account,configuration") throw Error("\u7F3A\u5C11\u672C\u6B21\u53D1\u73B0\u6240\u9700\u7684\u6761\u4EF6\u4E0E\u8D26\u53F7");
  const { account: a, configuration: c } = input;
  if (c?.kind !== "daily-apply-configuration" || c.readyForLoop !== true || !Number.isSafeInteger(c.batchSize) || c.batchSize < 1 || c.batchSize > 150 || !Number.isSafeInteger(c.configurationRevision) || a?.status !== "current-account-source-matched" || a.currentAccountVerified !== true || typeof a.accountName !== "string" || typeof a.phoneMask !== "string") throw Error("\u53D1\u73B0\u6761\u4EF6\u6216\u8D26\u53F7\u6765\u6E90\u4E0D\u9002\u7528");
  const dayOf = (v) => new Intl.DateTimeFormat("sv-SE", { timeZone: c.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(v);
  const day = dayOf(/* @__PURE__ */ new Date());
  if (day !== c.configuredDay || !Number.isFinite(Date.parse(a.checkedAt)) || Date.parse(a.checkedAt) > Date.now() || dayOf(new Date(a.checkedAt)) !== day) throw Error("\u53D1\u73B0\u51C6\u5907\u671F\u95F4\u65E5\u671F\u6216\u8D26\u53F7\u6765\u6E90\u53D8\u5316");
  const resume = new URL(a.jobseekerResumeHref, a.sourceUrl);
  if (resume.origin !== "https://www.zhipin.com" || resume.pathname !== "/web/geek/resume" || resume.username || resume.password) throw Error("\u8D26\u53F7\u6765\u6E90\u65E0\u6548");
  const hash = (v) => createHash("sha256").update(JSON.stringify(v)).digest("hex");
  const accountHash = hash(["boss-visible-account-source-v1", a.accountName, a.phoneMask, resume.origin + resume.pathname]);
  const state = await template.state.get(), configuration = await template.configuration();
  signal.throwIfAborted();
  if (!obj(state) || !Array.isArray(state.queueEntries) || state.queueEntries.length > 1e3 || !Array.isArray(state.applicationIntents) || state.applicationIntents.length > 500 || !obj(configuration)) throw Error("\u53D1\u73B0\u51C6\u5907\u7F3A\u5C11\u5B8C\u6574\u961F\u5217\u6216\u914D\u7F6E");
  const known = configuration.knownContactedJobs ?? [];
  if (!Array.isArray(known) || known.length > 500 || known.some((v) => typeof v !== "string")) throw Error("\u65E2\u6709\u6C9F\u901A\u6392\u9664\u6765\u6E90\u65E0\u6548");
  const intentKeys = new Set(state.applicationIntents.map((r) => r?.key)), seen = /* @__PURE__ */ new Set();
  let pending = 0;
  for (const r of state.queueEntries) {
    signal.throwIfAborted();
    if (r?.status !== "queued" || r.accountSourceSha256 !== accountHash || r.configurationRevision !== c.configurationRevision || r.day !== day || r.timeZone !== c.timeZone || intentKeys.has(r.key) || known.includes(r.jobSource)) continue;
    const u = new URL(r.jobSource), m = /^\/job_detail\/([A-Za-z0-9_~-]+)\.html$/.exec(u.pathname);
    if (u.origin !== "https://www.zhipin.com" || u.username || u.password || u.search || u.hash || !m || r.jobSource !== u.origin + u.pathname || r.jobId !== m[1] || r.key !== hash(["boss-application-v1", accountHash, m[1]]) || seen.has(r.key)) throw Error("\u5F85\u5904\u7406\u961F\u5217\u8EAB\u4EFD\u65E0\u6CD5\u6838\u5BF9");
    seen.add(r.key);
    pending++;
  }
  if (pending > 0) return [];
  const anchors = "div > div:nth-of-type(1) > li > div:nth-of-type(1) > div:nth-of-type(1) > a:nth-of-type(1)";
  const knownSources = [...state.queueEntries.map((r) => r.jobSource), ...state.applicationIntents.map((r) => r.jobSource), ...known];
  const exclusions = [...new Set(knownSources)].flatMap((value) => {
    const url = new URL(value);
    if (url.origin !== "https://www.zhipin.com" || !/^\/job_detail\/[A-Za-z0-9_~-]+\.html$/.test(url.pathname) || url.username || url.password || url.search || url.hash) throw Error("\u5217\u8868\u53D1\u73B0\u6392\u9664\u6765\u6E90\u65E0\u6548");
    return [url.href, url.pathname];
  }).map((value) => "[href=" + JSON.stringify(value) + "]").join(",");
  if (exclusions.length <= 16e4) {
    const source = await template.browser("browser", { operation: "url", timeoutMs: 1e4 });
    const page = new URL(source);
    if (page.origin !== "https://www.zhipin.com" || page.pathname !== "/web/geek/jobs" || page.username || page.password || page.hash) throw Error("\u5217\u8868\u53D1\u73B0\u9875\u9762\u6765\u6E90\u4E0D\u7B26");
    const count = await template.browser("browser", { operation: "count", selector: anchors + (exclusions ? ":not(:is(" + exclusions + "))" : ""), timeoutMs: 1e4 });
    if (!Number.isSafeInteger(count) || count < 0 || count > 500) throw Error("\u5217\u8868\u65B0\u589E\u5019\u9009\u6570\u91CF\u65E0\u6548");
    if (await template.browser("browser", { operation: "url", timeoutMs: 1e4 }) !== source) throw Error("\u5217\u8868\u53D1\u73B0\u671F\u95F4\u9875\u9762\u53D8\u5316");
    if (count > 0) return [];
  }
  return Array.from({ length: 24 }, (_, index) => index + 1);
};
export {
  stdin_default as default
};
