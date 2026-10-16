import { createHash } from 'node:crypto';

const identity = (v: any) => typeof v === 'string' && v.length > 0 && v.length <= 200 && v === v.trim() && !/[\u0000-\u001f\u007f]/.test(v);
const hash = (v: any) => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const controls = (state: any) => {
  if (state?.version !== 1 || state.operation !== 'state.read' || typeof state.contextId !== 'string' || !Number.isSafeInteger(state.revision) || state.revision < 0 || !state.value || typeof state.value !== 'object' || Array.isArray(state.value)) throw Error('缺少本实例最新状态');
  const list = state.value.conversationControls === undefined ? [] : state.value.conversationControls;
  if (!Array.isArray(list) || list.length > 100) throw Error('会话控制记录结构或数量无效');
  const keys = new Set<string>();
  for (const c of list) {
    if (!c || Object.keys(c).sort().join(',') !== 'accountKey,configurationRevision,controlEpoch,conversationKey,descriptionSha256,key,messageSha256,mode,updatedAt' || !identity(c.accountKey) || !identity(c.conversationKey) || c.key !== hash([c.accountKey,c.conversationKey]) || keys.has(c.key) || !['paused','draft'].includes(c.mode) || !Number.isSafeInteger(c.controlEpoch) || c.controlEpoch < 1 || typeof c.updatedAt !== 'string' || Number.isNaN(Date.parse(c.updatedAt))) throw Error('会话控制记录身份或代次无效');
    if (c.mode === 'paused' ? c.configurationRevision !== null || c.descriptionSha256 !== null || c.messageSha256 !== null : !Number.isSafeInteger(c.configurationRevision) || c.configurationRevision < 0 || !/^[a-f0-9]{64}$/.test(c.descriptionSha256) || !/^[a-f0-9]{64}$/.test(c.messageSha256)) throw Error('会话恢复范围无效');
    keys.add(c.key);
  }
  return list;
};



// Only receives the preceding visible AI v2 node; never accepts model-authored receipts.
const failureOf = (outcome: any, stage: string) => {
  const codes = ['authentication','rate-limit','http','network','request-timeout','refused','incomplete','invalid-response'];
  if (!outcome || outcome.status !== 'failed' || Object.keys(outcome).sort().join(',') !== 'error,model,provider,requestId,status,usage' || !codes.includes(outcome.error?.code) || typeof outcome.error.message !== 'string' || !outcome.error.message || outcome.error.message.length > 200 || !['deepseek','openai-codex'].includes(outcome.provider) || typeof outcome.model !== 'string' || !outcome.model || outcome.model.length > 512 || !(outcome.requestId === null || typeof outcome.requestId === 'string' && outcome.requestId.length <= 512)) throw Error('缺少有效的上一步AI请求故障，不采用建议');
  const error = outcome.error;
  if (Object.keys(error).sort().join(',') !== 'code,httpStatus,message' || !(error.httpStatus === null || Number.isSafeInteger(error.httpStatus) && error.httpStatus >= 100 && error.httpStatus <= 599)) throw Error('AI请求故障状态无效');
  const usage = outcome.usage;
  const counts = ['prompt_tokens','completion_tokens','total_tokens','input_tokens','output_tokens','prompt_cache_hit_tokens','prompt_cache_miss_tokens'];
  const details = ['prompt_tokens_details','completion_tokens_details','input_tokens_details','output_tokens_details'];
  const detailCounts = ['cached_tokens','reasoning_tokens','audio_tokens','accepted_prediction_tokens','rejected_prediction_tokens'];
  const count = (n: any) => Number.isSafeInteger(n) && n >= 0;
  if (usage !== null && (!usage || Array.isArray(usage) || typeof usage !== 'object' || Object.entries(usage).some(([k,v]: any) => counts.includes(k) ? !count(v) : !details.includes(k) || !v || Array.isArray(v) || typeof v !== 'object' || Object.entries(v).some(([dk,dv]) => !detailCounts.includes(dk) || !count(dv))))) throw Error('AI用量元数据无效');
  return { stage, status: 'failed', provider: outcome.provider, model: outcome.model, requestId: outcome.requestId, usage, error: { code: error.code, message: error.message, httpStatus: error.httpStatus } };
};

export default async ({ input, signal }: any) => {
  signal.throwIfAborted();
  const prepared = input?.prepared, job = input?.jobAdvice, profile = input?.profile, outcome = input?.outcome;
  if (prepared?.ready !== true || job?.decision !== 'match' || typeof prepared.incomingMessage !== 'string' || typeof profile?.markdown !== 'string' || !profile.ref || typeof profile.ref.key !== 'string' || typeof profile.ref.versionId !== 'string' || !/^[a-f0-9]{64}$/.test(profile.ref.sha256)) throw Error('缺少本次完整来信、明确匹配JD或固定Skill');
  if (job.source?.profile?.sha256 !== profile.ref.sha256 || job.source.profile.versionId !== profile.ref.versionId || job.source.profile.key !== profile.ref.key) throw Error('JD建议与本次固定Skill来源不一致');
  const list=controls(input.controlState), stamp=prepared.source?.control;
  if (!stamp || stamp.mode!=='draft' || !Number.isSafeInteger(stamp.controlEpoch) || stamp.controlEpoch<1) throw Error('缺少模型前固定的会话恢复范围');
  const latest=list.find((v:any)=>v.key===stamp.key);
  if (!latest || latest.mode!=='draft' || latest.controlEpoch!==stamp.controlEpoch || latest.configurationRevision!==stamp.configurationRevision || latest.descriptionSha256!==stamp.descriptionSha256 || latest.messageSha256!==stamp.messageSha256) {
    const source={...job.source,control:stamp};
    const result={version:1,kind:'message-draft-advice',intent:'review',nextAction:'ask-user',draft:'',reason:'草稿生成期间会话控制状态已变化，请本人核对',issues:['恢复范围已失效'],factQuotes:[],recommendation:null,source,accountVerified:false,eligibleForActions:false,checkedAt:new Date().toISOString(),note:'未发送消息或附件，不采用旧草稿。'};
    return {needsHuman:true,reviewKey:'message-control-changed:'+hash({source,epoch:latest?.controlEpoch??0}),result};
  }
  if (outcome?.status === 'failed') {
    const failure = failureOf(outcome, 'message-draft');
    const source = { ...job.source, profile: { key: profile.ref.key, versionId: profile.ref.versionId, sha256: profile.ref.sha256 } };
    if (source.messageSha256 !== createHash('sha256').update(JSON.stringify(prepared.incomingMessage)).digest('hex') || source.messageCompleteDeclared !== true || source.manualTakeoverDeclared !== false) throw Error('本次来信摘要或接管声明与JD来源不一致');
    const result = { version: 1, kind: 'message-draft-advice', intent: 'review', nextAction: 'ask-user', draft: '', reason: '来信分类与草稿请求失败，交本人核对：' + failure.error.message, issues: ['AI请求失败，没有可采用草稿'], factQuotes: [], recommendation: null, failure, source, accountVerified: false, eligibleForActions: false, checkedAt: new Date().toISOString(), note: '未发送消息或附件，不执行招聘动作，不自动重试或更换服务。' };
    signal.throwIfAborted();
    return { needsHuman: true, reviewKey: 'message-ai-failure:' + createHash('sha256').update(JSON.stringify(source)).digest('hex'), result };
  }
  if (outcome?.status !== 'success' || !outcome.result || !Object.hasOwn(outcome.result, 'output')) throw Error('缺少成功AI结果，不采用草稿');
  const raw = outcome.result.output;
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
