export default async ({ input, template, signal }: any) => {
  signal.throwIfAborted();
  if (!input?.result || input.result.decision !== 'review' || input.result.accountVerified !== false || input.result.eligibleForActions !== false || typeof input.reviewKey !== 'string') throw Error('缺少有效的本人核对结果');
  await template.attention({ key: input.reviewKey, title: 'BOSS 职位方向需要本人判断，请核对JD与求职条件', detail: input.result });
  await template.result(input.result);
  return input.result;
};
