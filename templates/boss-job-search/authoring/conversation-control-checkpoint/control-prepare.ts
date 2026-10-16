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

export default async ({ input, signal }: any) => {
  signal.throwIfAborted();
  const state=input?.state, config=input?.configuration, list=controls(state);
  if (config?.version !== 1 || config.operation !== 'configuration' || !Number.isSafeInteger(config.revision) || config.revision < 0) throw Error('缺少本次固定求职配置');
  const {accountKey,conversationKey,mode,jobDescription,incomingMessage,reviewedLatest}=input;
  if (!identity(accountKey) || !identity(conversationKey) || !['paused','draft'].includes(mode) || typeof jobDescription !== 'string' || jobDescription.length > 20000 || typeof incomingMessage !== 'string' || incomingMessage.length > 4000 || typeof reviewedLatest !== 'boolean') throw Error('请明确提供有效账号与会话来源及控制操作');
  if (mode === 'draft' && (!reviewedLatest || !jobDescription.trim() || !incomingMessage.trim())) throw Error('恢复内部草稿前须本人核对最新完整JD和来信');
  const key=hash([accountKey,conversationKey]), old=list.find((v:any)=>v.key===key);
  const scope=mode==='draft'?{configurationRevision:config.revision,descriptionSha256:hash(jobDescription),messageSha256:hash(incomingMessage)}:{configurationRevision:null,descriptionSha256:null,messageSha256:null};
  const unchanged=old && old.mode===mode && Object.entries(scope).every(([k,v])=>old[k]===v);
  if (!old && list.length>=100) throw Error('会话控制记录已达100条，未覆盖其他会话');
  if (!unchanged && old?.controlEpoch===Number.MAX_SAFE_INTEGER) throw Error('会话控制代次已达上限');
  const record=unchanged?old:{key,accountKey,conversationKey,mode,controlEpoch:(old?.controlEpoch??0)+1,updatedAt:new Date().toISOString(),...scope};
  const nextState={...state.value,conversationControls:old?list.map((v:any)=>v.key===key?record:v):[...list,record]};
  const result={version:1,kind:'conversation-control',sourceKind:'explicit-input',key,mode,controlEpoch:record.controlEpoch,configurationRevision:record.configurationRevision,descriptionSha256:record.descriptionSha256,messageSha256:record.messageSha256,updatedAt:record.updatedAt,accountVerified:false,eligibleForActions:false,note:mode==='paused'?'已记录本地暂停；不证明站点检测或撤回在途发送。':'仅恢复已核对范围的内部草稿；不恢复发送授权。'};
  signal.throwIfAborted();
  return {changed:!unchanged,expectedRevision:state.revision,contextId:state.contextId,nextState,result};
};
