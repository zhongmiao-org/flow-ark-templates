export default async ({ input, template, signal }: any) => {
  signal.throwIfAborted();
  if (!input || input.version !== 1 || input.ready !== true || input.status !== 'sources-ready' || input.resume?.status !== 'ready' || input.accountVerified !== false || input.eligibleForActions !== false) throw new Error('资料来源就绪结果不一致');
  return template.result(input);
};
