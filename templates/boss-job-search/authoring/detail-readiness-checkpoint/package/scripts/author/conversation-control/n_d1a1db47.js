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
  const state = input?.state, config = input?.configuration, list = controls(state);
  if (config?.version !== 1 || config.operation !== "configuration" || !Number.isSafeInteger(config.revision) || config.revision < 0) throw Error("\u7F3A\u5C11\u672C\u6B21\u56FA\u5B9A\u6C42\u804C\u914D\u7F6E");
  const { accountKey, conversationKey, mode, jobDescription, incomingMessage, reviewedLatest } = input;
  if (!identity(accountKey) || !identity(conversationKey) || !["paused", "draft"].includes(mode) || typeof jobDescription !== "string" || jobDescription.length > 2e4 || typeof incomingMessage !== "string" || incomingMessage.length > 4e3 || typeof reviewedLatest !== "boolean") throw Error("\u8BF7\u660E\u786E\u63D0\u4F9B\u6709\u6548\u8D26\u53F7\u4E0E\u4F1A\u8BDD\u6765\u6E90\u53CA\u63A7\u5236\u64CD\u4F5C");
  if (mode === "draft" && (!reviewedLatest || !jobDescription.trim() || !incomingMessage.trim())) throw Error("\u6062\u590D\u5185\u90E8\u8349\u7A3F\u524D\u987B\u672C\u4EBA\u6838\u5BF9\u6700\u65B0\u5B8C\u6574JD\u548C\u6765\u4FE1");
  const key = hash([accountKey, conversationKey]), old = list.find((v) => v.key === key);
  const scope = mode === "draft" ? { configurationRevision: config.revision, descriptionSha256: hash(jobDescription), messageSha256: hash(incomingMessage) } : { configurationRevision: null, descriptionSha256: null, messageSha256: null };
  const unchanged = old && old.mode === mode && Object.entries(scope).every(([k, v]) => old[k] === v);
  if (!old && list.length >= 100) throw Error("\u4F1A\u8BDD\u63A7\u5236\u8BB0\u5F55\u5DF2\u8FBE100\u6761\uFF0C\u672A\u8986\u76D6\u5176\u4ED6\u4F1A\u8BDD");
  if (!unchanged && old?.controlEpoch === Number.MAX_SAFE_INTEGER) throw Error("\u4F1A\u8BDD\u63A7\u5236\u4EE3\u6B21\u5DF2\u8FBE\u4E0A\u9650");
  const record = unchanged ? old : { key, accountKey, conversationKey, mode, controlEpoch: (old?.controlEpoch ?? 0) + 1, updatedAt: (/* @__PURE__ */ new Date()).toISOString(), ...scope };
  const nextState = { ...state.value, conversationControls: old ? list.map((v) => v.key === key ? record : v) : [...list, record] };
  const result = { version: 1, kind: "conversation-control", sourceKind: "explicit-input", key, mode, controlEpoch: record.controlEpoch, configurationRevision: record.configurationRevision, descriptionSha256: record.descriptionSha256, messageSha256: record.messageSha256, updatedAt: record.updatedAt, accountVerified: false, eligibleForActions: false, note: mode === "paused" ? "\u5DF2\u8BB0\u5F55\u672C\u5730\u6682\u505C\uFF1B\u4E0D\u8BC1\u660E\u7AD9\u70B9\u68C0\u6D4B\u6216\u64A4\u56DE\u5728\u9014\u53D1\u9001\u3002" : "\u4EC5\u6062\u590D\u5DF2\u6838\u5BF9\u8303\u56F4\u7684\u5185\u90E8\u8349\u7A3F\uFF1B\u4E0D\u6062\u590D\u53D1\u9001\u6388\u6743\u3002" };
  signal.throwIfAborted();
  return { changed: !unchanged, expectedRevision: state.revision, contextId: state.contextId, nextState, result };
};
export {
  stdin_default as default
};
