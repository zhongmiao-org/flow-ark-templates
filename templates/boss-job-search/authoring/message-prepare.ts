import { createHash } from 'node:crypto';

export default async ({ input, signal }: any) => {
  signal.throwIfAborted();
  const fixed = input?.configuration;
  if (fixed?.version !== 1 || fixed.operation !== 'configuration' || !Number.isSafeInteger(fixed.revision) || fixed.revision < 0) throw Error('缺少本次固定求职配置与修订');
  const c = fixed.value;
  if (!c || Object.keys(c).sort().join(',') !== 'cities,excludedRoles,salaryMax,salaryMin,targetRoles') throw Error('求职条件结构无效');
  const norm = (s: string) => s.normalize('NFKC').trim().toLocaleLowerCase('en-US');
  const issues: string[] = [];
  for (const k of ['targetRoles', 'excludedRoles', 'cities']) {
    if (!Array.isArray(c[k]) || c[k].length > 20 || c[k].some((v: any) => typeof v !== 'string' || v.length > 100)) throw Error('条件列表结构无效');
    const values = c[k].map(norm);
    if (values.some((v: string) => !v) || new Set(values).size !== values.length) issues.push('条件存在空白或重复项：' + k);
  }
  if (!c.targetRoles.length) issues.push('尚未明确目标职位');
  if (c.targetRoles.some((v: string) => c.excludedRoles.map(norm).includes(norm(v)))) issues.push('目标与排除方向冲突');
  for (const k of ['salaryMin', 'salaryMax']) if (!Number.isSafeInteger(c[k]) || c[k] < 0 || c[k] > 1000000) throw Error('薪资条件结构无效');
  if (c.salaryMax > 0 && c.salaryMin > c.salaryMax) issues.push('月薪上限低于下限');
  const title = input.jobTitle, description = input.jobDescription, label = input.sourceLabel ?? '';
  if (typeof title !== 'string' || title.length > 200 || typeof description !== 'string' || description.length > 20000 || typeof label !== 'string' || label.length > 500 || typeof input.descriptionComplete !== 'boolean') throw Error('JD输入结构无效');
  if (!title.trim() || !description.trim()) issues.push('岗位名称或JD正文缺失');
  if (!input.descriptionComplete) issues.push('尚未声明JD正文完整');
  const message = input.incomingMessage;
  if (typeof message !== 'string' || message.length > 4000 || typeof input.messageComplete !== 'boolean' || typeof input.manualTakeover !== 'boolean') throw Error('来信或接管输入结构无效');
  if (!message.trim()) issues.push('本次来信正文缺失');
  if (!input.messageComplete) issues.push('尚未声明来信完整');
  if (input.manualTakeover) issues.push('本人接管中或尚未确认自动处理');
  const sha = (v: any) => createHash('sha256').update(JSON.stringify(v)).digest('hex');
  const source = { kind: 'explicit-input', title, descriptionSha256: sha(description), sourceLabel: label, completeDeclared: input.descriptionComplete, configurationRevision: fixed.revision, messageSha256: sha(message), messageCompleteDeclared: input.messageComplete, manualTakeoverDeclared: input.manualTakeover };
  const result = { version: 1, kind: 'message-draft-advice', decision: 'review', nextAction: 'ask-user', reason: issues.join('；'), issues, source, accountVerified: false, eligibleForActions: false, checkedAt: new Date().toISOString() };
  signal.throwIfAborted();
  return { ready: issues.length === 0, incomingMessage: message, job: { title, description, completeDeclared: input.descriptionComplete, sourceLabel: label }, configuration: c, source, reviewRecord: { reviewKey: 'message-input:' + sha({ source, issues }), result } };
};
