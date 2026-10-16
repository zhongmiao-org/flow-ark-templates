export default async ({ input, signal }: any) => {
  signal.throwIfAborted();
  if (!input || input.version !== 1 || input.operation !== 'configuration' || !Number.isSafeInteger(input.revision) || input.revision < 0 || !input.value || typeof input.value !== 'object' || Array.isArray(input.value))
    throw new Error('缺少本次固定配置及修订，请先使用读取本次配置步骤');
  const c = input.value;
  if (Object.keys(c).sort().join(',') !== 'cities,excludedRoles,salaryMax,salaryMin,targetRoles') throw new Error('求职条件字段结构不匹配');
  const issues: { field: string; reason: string }[] = [];
  const normalize = (v: string) => v.normalize('NFKC').trim().toLocaleLowerCase('en-US');
  for (const key of ['targetRoles', 'cities', 'excludedRoles']) {
    if (!Array.isArray(c[key]) || c[key].length > 20 || c[key].some((v: unknown) => typeof v !== 'string' || v.length < 1 || v.length > 100))
      throw new Error('求职条件文本列表结构无效：' + key);
    const normalized = c[key].map(normalize);
    if (normalized.some((v: string) => !v)) issues.push({ field: key, reason: '条目不能仅含空白' });
    if (new Set(normalized).size !== normalized.length) issues.push({ field: key, reason: '同一列表存在重复条目，请本人核对' });
  }
  if (!c.targetRoles.length) issues.push({ field: 'targetRoles', reason: '请至少填写一个目标职位' });
  const excluded = new Set(c.excludedRoles.map(normalize));
  if (c.targetRoles.some((v: string) => normalize(v) && excluded.has(normalize(v)))) issues.push({ field: 'excludedRoles', reason: '目标职位与排除方向存在完全相同条目，请本人核对' });
  for (const key of ['salaryMin', 'salaryMax']) if (!Number.isSafeInteger(c[key]) || c[key] < 0 || c[key] > 1000000) throw new Error('月薪范围须为0至1000000整数');
  if (c.salaryMax > 0 && c.salaryMin > c.salaryMax) issues.push({ field: 'salaryMax', reason: '已设置的月薪上限小于下限' });
  signal.throwIfAborted();
  return { version: 1, ready: issues.length === 0, status: issues.length ? 'needs-review' : 'ready', configurationRevision: input.revision, issues, summary: { targetRoleCount: c.targetRoles.length, cityCount: c.cities.length, excludedRoleCount: c.excludedRoles.length, salaryMin: c.salaryMin, salaryMax: c.salaryMax, salaryUnit: 'CNY/month;0=unset' }, accountVerified: false, eligibleForActions: false, checkedAt: new Date().toISOString(), note: '仅核对本次配置的一致性，不代表账号、完整JD、职位匹配、Skill或任何外发授权通过。' };
};
