export default async ({ input, signal }: any) => {
  signal.throwIfAborted();
  const d = input?.resume, s = input?.profile;
  if (!d || d.version !== 1 || !['ready', 'partial', 'empty'].includes(d.status) || !d.source || !Array.isArray(d.units) || !Array.isArray(d.warnings) || typeof d.text !== 'string') throw new Error('缺少本次真实资料解析结果');
  if (!s || s.version !== 1 || !s.ref || typeof s.ref.sha256 !== 'string' || typeof s.ref.versionId !== 'string' || typeof s.markdown !== 'string' || !s.markdown.trim() || !Array.isArray(s.evidence) || typeof s.confirmedAt !== 'string') throw new Error('缺少本次固定确认Skill结果');
  const ready = d.status === 'ready' && !!d.text.trim();
  return { version: 1, ready, status: ready ? 'sources-ready' : 'needs-review', resume: { source: d.source, status: d.status, unitCount: d.units.length, warnings: d.warnings }, profile: { ref: s.ref, title: s.title, confirmedAt: s.confirmedAt, evidenceCount: s.evidence.length }, accountVerified: false, eligibleForActions: false, checkedAt: new Date().toISOString(), note: '仅核对资料可读性与固定来源；不证明身份或事实一致、账号/JD有效，不授权模型使用、投递或回复。' };
};
