export default async ({ input, template, signal }: any) => {
  signal.throwIfAborted();
  if (!input || input.version !== 1 || input.ready !== true || input.status !== 'ready' || input.accountVerified !== false || input.eligibleForActions !== false || !Array.isArray(input.issues) || input.issues.length) throw new Error('求职条件核对结果不一致');
  return template.result(input);
};
