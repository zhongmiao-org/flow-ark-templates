import { createHash } from 'node:crypto';

export default async ({ input, signal }: any) => {
  signal.throwIfAborted();
  const prepared = input?.prepared, job = input?.jobAdvice, profile = input?.profile, raw = input?.advice;
  if (prepared?.ready !== true || job?.decision !== 'match' || typeof prepared.incomingMessage !== 'string' || typeof profile?.markdown !== 'string' || !profile.ref || typeof profile.ref.key !== 'string' || typeof profile.ref.versionId !== 'string' || !/^[a-f0-9]{64}$/.test(profile.ref.sha256)) throw Error('缺少本次完整来信、明确匹配JD或固定Skill');
  if (job.source?.profile?.sha256 !== profile.ref.sha256 || job.source.profile.versionId !== profile.ref.versionId || job.source.profile.key !== profile.ref.key) throw Error('JD建议与本次固定Skill来源不一致');
  if (!raw || !['greeting','introduction','resume-fact','technical','resume-request','interview','identity','commitment','review'].includes(raw.intent) || typeof raw.draft !== 'string' || raw.draft.length > 300 || typeof raw.reason !== 'string' || !raw.reason.trim() || raw.reason.length > 800) throw Error('模型来信建议结构无效，未采用');
  const issues: string[] = [];
  for (const k of ['facts','unknowns','conflicts']) if (!Array.isArray(raw[k]) || raw[k].length > (k === 'facts' ? 5 : 10) || raw[k].some((v: any) => typeof v !== 'string' || v.trim().length < (k === 'facts' ? 2 : 1) || v.length > 500)) throw Error('模型引用或缺口结构无效，未采用');
  if (raw.facts.some((q: string) => !profile.markdown.includes(q))) issues.push('事实原句不在本次固定SKILL.md正文中');
  if (['introduction','resume-fact','technical'].includes(raw.intent) && !raw.facts.length) issues.push('草稿缺少固定Skill事实原句');
  if (raw.unknowns.length) issues.push('存在尚未解决的未知');
  if (raw.conflicts.length) issues.push('存在尚未解决的冲突');
  const reserved = ['resume-request','interview','identity','commitment','review'].includes(raw.intent);
  if (reserved) issues.push('该类来信须本人处理或独立核对附件');
  if (/(面试题|笔试|测评|课后作业|是不是.{0,6}(?:AI|人工智能|机器人)|你是.{0,4}(?:AI|人工智能))/iu.test(prepared.incomingMessage)) issues.push('来信包含正式考核或身份质疑线索，交本人核对');
  if (!raw.draft.trim() && !reserved) issues.push('普通回复草稿为空');
  const needsHuman = issues.length > 0;
  const source = { ...job.source, profile: { key: profile.ref.key, versionId: profile.ref.versionId, sha256: profile.ref.sha256 } };
  if (source.messageSha256 !== createHash('sha256').update(JSON.stringify(prepared.incomingMessage)).digest('hex') || source.messageCompleteDeclared !== true || source.manualTakeoverDeclared !== false) throw Error('本次来信摘要或接管声明与JD来源不一致');
  const result = { version: 1, kind: 'message-draft-advice', intent: raw.intent, nextAction: needsHuman ? (raw.intent === 'resume-request' ? 'resume-proposal' : 'ask-user') : 'review-draft', draft: needsHuman ? '' : raw.draft, reason: raw.reason, issues, factQuotes: raw.facts, recommendation: raw, source, accountVerified: false, eligibleForActions: false, checkedAt: new Date().toISOString(), note: '仅内部草稿或本人建议；原句存在不证明全部语义正确，不是附件/消息送达、会话接管或发送授权。' };
  const reviewKey = 'message-advice:' + createHash('sha256').update(JSON.stringify(source)).digest('hex');
  signal.throwIfAborted();
  return { needsHuman, reviewKey, result };
};
