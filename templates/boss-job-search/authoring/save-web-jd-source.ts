export default async ({ input, signal, template }: any) => {
  signal.throwIfAborted();
  if (!input?.result || input.result.version !== 1 || input.result.kind !== 'web-jd-source' || input.result.accountVerified !== false || input.result.eligibleForActions !== false || input.result.modelInputAllowed !== false || typeof input.attentionKey !== 'string') throw Error('缺少本次网页JD来源核对结果');
  await template.result(input.result);
  signal.throwIfAborted();
  const attention = await template.attention({ key: input.attentionKey, title: '网页JD来源仍需本人核对', detail: input.result });
  signal.throwIfAborted();
  return { ...input.result, attention };
};
