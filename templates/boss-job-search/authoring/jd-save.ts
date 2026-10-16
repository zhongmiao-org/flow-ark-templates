export default async ({ input, template, signal }: any) => {
  signal.throwIfAborted();
  if (!input?.result || input.result.accountVerified !== false || input.result.eligibleForActions !== false) throw Error('缺少有效的内部建议结果');
  await template.result(input.result);
  return input.result;
};
