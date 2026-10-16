export default async ({ input, template, signal }: any) => {
  signal.throwIfAborted();
  const {prepared,receipt}=input;
  if (typeof prepared?.changed !== 'boolean' || prepared.result?.kind !== 'conversation-control' || prepared.result.accountVerified !== false || prepared.result.eligibleForActions !== false) throw Error('缺少明确控制结果');
  if (prepared.changed ? receipt?.version !== 1 || receipt.operation !== 'state.write' || receipt.contextId !== prepared.contextId || receipt.previousRevision !== prepared.expectedRevision || receipt.revision !== prepared.expectedRevision+1 || typeof receipt.operationId !== 'string' : receipt !== null) throw Error('控制提交回执不一致，须读取最新状态核对');
  const result={...prepared.result,changed:prepared.changed,stateReceipt:receipt===null?null:{operationId:receipt.operationId,previousRevision:receipt.previousRevision,revision:receipt.revision,committedAt:receipt.committedAt}};
  await template.result(result);
  return result;
};
