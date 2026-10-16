export default async ({ input, template, signal }: any) => {
  signal.throwIfAborted();
  if (!input || input.version !== 1 || input.ready !== false || input.status !== 'needs-review' || !Number.isSafeInteger(input.configurationRevision) || input.configurationRevision < 0 || input.accountVerified !== false || input.eligibleForActions !== false || !Array.isArray(input.issues) || !input.issues.length) throw new Error('待核对条件与配置修订不一致');
  await template.attention({ key: 'conditions-review:' + input.configurationRevision, title: 'BOSS 求职条件需要本人补充或核对', detail: input });
  return template.result(input);
};
