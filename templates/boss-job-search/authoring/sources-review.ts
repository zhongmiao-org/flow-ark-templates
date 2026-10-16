export default async ({ input, template, signal }: any) => {
  signal.throwIfAborted();
  if (!input || input.version !== 1 || input.ready !== false || input.status !== 'needs-review' || !['partial', 'empty'].includes(input.resume?.status) || typeof input.resume?.source?.name !== 'string' || typeof input.resume?.source?.sha256 !== 'string' || typeof input.profile?.ref?.sha256 !== 'string' || input.accountVerified !== false || input.eligibleForActions !== false) throw new Error('资料缺口与本次来源不一致');
  await template.attention({ key: 'profile-sources:' + input.resume.source.name + ':' + input.resume.source.sha256 + ':' + input.profile.ref.sha256 + ':' + input.resume.status, title: 'BOSS 简历资料尚不完整，请本人核对后再采用', detail: input });
  return template.result(input);
};
