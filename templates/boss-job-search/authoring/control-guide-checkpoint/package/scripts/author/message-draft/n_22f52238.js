import { createHash } from "node:crypto";
const identity = (v) => typeof v === "string" && v.length > 0 && v.length <= 200 && v === v.trim() && !/[\u0000-\u001f\u007f]/.test(v);
const hash = (v) => createHash("sha256").update(JSON.stringify(v)).digest("hex");
const controls = (state) => {
  if (state?.version !== 1 || state.operation !== "state.read" || typeof state.contextId !== "string" || !Number.isSafeInteger(state.revision) || state.revision < 0 || !state.value || typeof state.value !== "object" || Array.isArray(state.value)) throw Error("\u7F3A\u5C11\u672C\u5B9E\u4F8B\u6700\u65B0\u72B6\u6001");
  const list = state.value.conversationControls === void 0 ? [] : state.value.conversationControls;
  if (!Array.isArray(list) || list.length > 100) throw Error("\u4F1A\u8BDD\u63A7\u5236\u8BB0\u5F55\u7ED3\u6784\u6216\u6570\u91CF\u65E0\u6548");
  const keys = /* @__PURE__ */ new Set();
  for (const c of list) {
    if (!c || Object.keys(c).sort().join(",") !== "accountKey,configurationRevision,controlEpoch,conversationKey,descriptionSha256,key,messageSha256,mode,updatedAt" || !identity(c.accountKey) || !identity(c.conversationKey) || c.key !== hash([c.accountKey, c.conversationKey]) || keys.has(c.key) || !["paused", "draft"].includes(c.mode) || !Number.isSafeInteger(c.controlEpoch) || c.controlEpoch < 1 || typeof c.updatedAt !== "string" || Number.isNaN(Date.parse(c.updatedAt))) throw Error("\u4F1A\u8BDD\u63A7\u5236\u8BB0\u5F55\u8EAB\u4EFD\u6216\u4EE3\u6B21\u65E0\u6548");
    if (c.mode === "paused" ? c.configurationRevision !== null || c.descriptionSha256 !== null || c.messageSha256 !== null : !Number.isSafeInteger(c.configurationRevision) || c.configurationRevision < 0 || !/^[a-f0-9]{64}$/.test(c.descriptionSha256) || !/^[a-f0-9]{64}$/.test(c.messageSha256)) throw Error("\u4F1A\u8BDD\u6062\u590D\u8303\u56F4\u65E0\u6548");
    keys.add(c.key);
  }
  return list;
};
var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  const fixed = input?.configuration;
  if (fixed?.version !== 1 || fixed.operation !== "configuration" || !Number.isSafeInteger(fixed.revision) || fixed.revision < 0) throw Error("\u7F3A\u5C11\u672C\u6B21\u56FA\u5B9A\u6C42\u804C\u914D\u7F6E\u4E0E\u4FEE\u8BA2");
  const c = fixed.value;
  if (!c || Object.keys(c).sort().join(",") !== "cities,excludedRoles,salaryMax,salaryMin,targetRoles") throw Error("\u6C42\u804C\u6761\u4EF6\u7ED3\u6784\u65E0\u6548");
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
  const title = input.jobTitle, description = input.jobDescription, label = input.sourceLabel ?? "";
  if (typeof title !== "string" || title.length > 200 || typeof description !== "string" || description.length > 2e4 || typeof label !== "string" || label.length > 500 || typeof input.descriptionComplete !== "boolean") throw Error("JD\u8F93\u5165\u7ED3\u6784\u65E0\u6548");
  if (!title.trim() || !description.trim()) issues.push("\u5C97\u4F4D\u540D\u79F0\u6216JD\u6B63\u6587\u7F3A\u5931");
  if (!input.descriptionComplete) issues.push("\u5C1A\u672A\u58F0\u660EJD\u6B63\u6587\u5B8C\u6574");
  const message = input.incomingMessage;
  if (typeof message !== "string" || message.length > 4e3 || typeof input.messageComplete !== "boolean" || typeof input.manualTakeover !== "boolean") throw Error("\u6765\u4FE1\u6216\u63A5\u7BA1\u8F93\u5165\u7ED3\u6784\u65E0\u6548");
  if (!message.trim()) issues.push("\u672C\u6B21\u6765\u4FE1\u6B63\u6587\u7F3A\u5931");
  if (!input.messageComplete) issues.push("\u5C1A\u672A\u58F0\u660E\u6765\u4FE1\u5B8C\u6574");
  if (input.manualTakeover) issues.push("\u672C\u4EBA\u63A5\u7BA1\u4E2D\u6216\u5C1A\u672A\u786E\u8BA4\u81EA\u52A8\u5904\u7406");
  const sha = (v) => createHash("sha256").update(JSON.stringify(v)).digest("hex");
  const list = controls(input.controlState);
  if (!identity(input.accountKey) || !identity(input.conversationKey)) throw Error("\u8D26\u53F7\u4E0E\u4F1A\u8BDD\u6765\u6E90\u952E\u65E0\u6548");
  const controlKey = hash([input.accountKey, input.conversationKey]), controlRecord = list.find((v) => v.key === controlKey);
  if (!controlRecord || controlRecord.mode !== "draft") issues.push("\u4F1A\u8BDD\u672A\u5EFA\u7ACB\u6062\u590D\u8303\u56F4\u6216\u672C\u4EBA\u63A5\u7BA1\u4E2D");
  else if (controlRecord.configurationRevision !== fixed.revision || controlRecord.descriptionSha256 !== sha(description) || controlRecord.messageSha256 !== sha(message)) issues.push("\u6062\u590D\u8303\u56F4\u4E0E\u5F53\u524DJD\u3001\u6765\u4FE1\u6216\u914D\u7F6E\u4FEE\u8BA2\u4E0D\u540C\uFF0C\u8BF7\u672C\u4EBA\u91CD\u65B0\u6838\u5BF9");
  const control = { key: controlKey, controlEpoch: controlRecord?.controlEpoch ?? 0, mode: controlRecord?.mode ?? "paused", configurationRevision: controlRecord?.configurationRevision ?? null, descriptionSha256: controlRecord?.descriptionSha256 ?? null, messageSha256: controlRecord?.messageSha256 ?? null };
  const source = { kind: "explicit-input", control, title, descriptionSha256: sha(description), sourceLabel: label, completeDeclared: input.descriptionComplete, configurationRevision: fixed.revision, messageSha256: sha(message), messageCompleteDeclared: input.messageComplete, manualTakeoverDeclared: input.manualTakeover };
  const result = { version: 1, kind: "message-draft-advice", decision: "review", nextAction: "ask-user", reason: issues.join("\uFF1B"), issues, source, accountVerified: false, eligibleForActions: false, checkedAt: (/* @__PURE__ */ new Date()).toISOString() };
  signal.throwIfAborted();
  return { ready: issues.length === 0, incomingMessage: message, job: { title, description, completeDeclared: input.descriptionComplete, sourceLabel: label }, configuration: c, source, reviewRecord: { reviewKey: "message-input:" + sha({ source, issues }), result } };
};
export {
  stdin_default as default
};
