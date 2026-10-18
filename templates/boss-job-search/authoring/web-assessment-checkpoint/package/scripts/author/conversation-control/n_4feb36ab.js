var stdin_default = async ({ input, template, signal }) => {
  signal.throwIfAborted();
  const { prepared, receipt } = input;
  if (typeof prepared?.changed !== "boolean" || prepared.result?.kind !== "conversation-control" || prepared.result.accountVerified !== false || prepared.result.eligibleForActions !== false) throw Error("\u7F3A\u5C11\u660E\u786E\u63A7\u5236\u7ED3\u679C");
  if (prepared.changed ? receipt?.version !== 1 || receipt.operation !== "state.write" || receipt.contextId !== prepared.contextId || receipt.previousRevision !== prepared.expectedRevision || receipt.revision !== prepared.expectedRevision + 1 || typeof receipt.operationId !== "string" : receipt !== null) throw Error("\u63A7\u5236\u63D0\u4EA4\u56DE\u6267\u4E0D\u4E00\u81F4\uFF0C\u987B\u8BFB\u53D6\u6700\u65B0\u72B6\u6001\u6838\u5BF9");
  const result = { ...prepared.result, changed: prepared.changed, stateReceipt: receipt === null ? null : { operationId: receipt.operationId, previousRevision: receipt.previousRevision, revision: receipt.revision, committedAt: receipt.committedAt } };
  await template.result(result);
  return result;
};
export {
  stdin_default as default
};
