export default async ({ input, template, signal }: any) => {
  signal.throwIfAborted();
  if (!input?.result || !['ask-user','resume-proposal'].includes(input.result.nextAction) || input.result.accountVerified !== false || input.result.eligibleForActions !== false || typeof input.reviewKey !== 'string') throw Error('缺少有效的本人核对建议');
  await template.attention({ key: input.reviewKey, title: 'BOSS 来信需要本人核对，尚未发送消息或附件', detail: input.result });
  await template.result(input.result);
  return input.result;
};
