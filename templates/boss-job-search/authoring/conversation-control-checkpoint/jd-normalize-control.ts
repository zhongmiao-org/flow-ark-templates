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
  const prepared = input?.prepared, outcome = input?.outcome, ref = input?.profileRef;
  if (prepared?.ready !== true || typeof prepared.job?.description !== 'string' || !Array.isArray(prepared.configuration?.targetRoles) || !ref || typeof ref.key !== 'string' || typeof ref.versionId !== 'string' || !/^[a-f0-9]{64}$/.test(ref.sha256)) throw Error('缺少本次JD、求职配置或固定Skill来源');
  const list=controls(input.controlState), stamp=prepared.source?.control;
  if (!stamp || stamp.mode!=='draft' || !Number.isSafeInteger(stamp.controlEpoch) || stamp.controlEpoch<1) throw Error('缺少模型前固定的会话恢复范围');
  const latest=list.find((v:any)=>v.key===stamp.key);
  if (!latest || latest.mode!=='draft' || latest.controlEpoch!==stamp.controlEpoch || latest.configurationRevision!==stamp.configurationRevision || latest.descriptionSha256!==stamp.descriptionSha256 || latest.messageSha256!==stamp.messageSha256) {
    const source={...prepared.source,profile:{key:ref.key,versionId:ref.versionId,sha256:ref.sha256}};
    const result={version:1,kind:'job-assessment-advice',decision:'review',nextAction:'ask-user',draft:'',reason:'JD评估期间会话控制状态已变化，请本人核对',issues:['恢复范围已失效'],recommendation:null,source,accountVerified:false,eligibleForActions:false,checkedAt:new Date().toISOString(),note:'不继续来信模型，不执行招聘动作。'};
    return {reviewKey:'jd-control-changed:'+hash({source,epoch:latest?.controlEpoch??0}),result};
  }
  if (outcome?.status === 'failed') {
    const failure = failureOf(outcome, 'jd-assessment');
    const source = { ...prepared.source, profile: { key: ref.key, versionId: ref.versionId, sha256: ref.sha256 } };
    const result = { version: 1, kind: 'job-assessment-advice', decision: 'review', nextAction: 'ask-user', draft: '', reason: 'JD方向评估请求失败，交本人核对：' + failure.error.message, issues: ['AI请求失败，尚未形成岗位建议'], recommendation: null, failure, source, accountVerified: false, eligibleForActions: false, checkedAt: new Date().toISOString(), note: '未形成符合或不符合结论；不继续来信模型或执行招聘动作，不自动重试。' };
    signal.throwIfAborted();
    return { reviewKey: 'jd-ai-failure:' + createHash('sha256').update(JSON.stringify(source)).digest('hex'), result };
  }
  if (outcome?.status !== 'success' || !outcome.result || !Object.hasOwn(outcome.result, 'output')) throw Error('缺少成功AI结果，不采用评估');
  const raw = outcome.result.output;
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
