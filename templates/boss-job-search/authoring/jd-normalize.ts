import { createHash } from 'node:crypto';

export default async ({ input, signal }: any) => {
  signal.throwIfAborted();
  const prepared = input?.prepared, raw = input?.advice, ref = input?.profileRef;
  if (prepared?.ready !== true || typeof prepared.job?.description !== 'string' || !Array.isArray(prepared.configuration?.targetRoles) || !ref || typeof ref.key !== 'string' || typeof ref.versionId !== 'string' || !/^[a-f0-9]{64}$/.test(ref.sha256)) throw Error('缺少本次JD、求职配置或固定Skill来源');
  if (!raw || !['match', 'mismatch', 'review'].includes(raw.decision) || typeof raw.reason !== 'string' || !raw.reason.trim() || raw.reason.length > 800 || typeof raw.targetRole !== 'string' || !Array.isArray(raw.quotes) || !Array.isArray(raw.unknowns) || !Array.isArray(raw.conflicts)) throw Error('模型评估结构无效，未采用结果');
  const issues: string[] = [];
  const norm = (s: string) => s.normalize('NFKC').trim().toLocaleLowerCase('en-US');
  if (!prepared.configuration.targetRoles.some((v: string) => norm(v) === norm(raw.targetRole))) issues.push('模型引用的目标职位不在本次明确配置中');
  if (raw.quotes.length > 3 || raw.quotes.some((q: any) => typeof q !== 'string' || q.trim().length < 2 || q.length > 500 || !prepared.job.description.includes(q))) issues.push('模型原句不在本次JD正文中或超过范围');
  if (raw.decision !== 'review' && raw.quotes.length === 0) issues.push('明确结论缺少JD原句依据');
  for (const k of ['unknowns', 'conflicts']) {
    if (raw[k].length > 10 || raw[k].some((v: any) => typeof v !== 'string' || !v.trim() || v.length > 500)) throw Error('模型未知或冲突结构无效，未采用结果');
    if (raw[k].length) issues.push(k === 'unknowns' ? '存在尚未解决的未知条件' : '存在尚未解决的冲突');
  }
  const decision = issues.length ? 'review' : raw.decision;
  const source = { ...prepared.source, profile: { key: ref.key, versionId: ref.versionId, sha256: ref.sha256 } };
  const result = { version: 1, kind: 'job-assessment-advice', decision, nextAction: decision === 'match' ? 'draft-only' : decision === 'mismatch' ? 'not-interested-proposal' : 'ask-user', reason: raw.reason, issues, recommendation: raw, source, accountVerified: false, eligibleForActions: false, checkedAt: new Date().toISOString(), note: '原句和规则引用有效不证明语义判断正确；未核验真实账号/会话，不授权任何外发。' };
  const reviewKey = 'jd-advice:' + createHash('sha256').update(JSON.stringify(source)).digest('hex');
  signal.throwIfAborted();
  return { reviewKey, result };
};
