export default async function (ctx) {
  const { parent, scope, requirements, fragment, factNumber, round } = ctx.input;
  if (!parent?.ref || typeof parent.title !== 'string' || !Array.isArray(parent.evidence))
    throw new Error('请先选择准确的父确认版本');
  if (typeof requirements !== 'string' || !requirements.trim())
    throw new Error('请先说明本次明确的更新要求');
  if (typeof fragment !== 'string' || typeof round !== 'string' || !round.trim())
    throw new Error('原文片段或访谈标识无效，请重新核对');
  const routes = {
    目标岗位: ['preferences', 'roles'],
    期望地点: ['preferences', 'locations'],
    工作形式: ['preferences', 'workModes'],
    期望薪资: ['preferences', 'salary'],
    排除方向: ['preferences', 'exclusions'],
    真实表达样例: ['expression', 'examples'],
    表达规则: ['expression', 'rules'],
    待确认表达推断: ['expression', 'inferred'],
    允许自动回复: ['boundaries', 'allowed'],
    需要本人处理: ['boundaries', 'askUser'],
    禁止自动回复: ['boundaries', 'prohibited'],
    待补问题: ['unknown'],
    矛盾记录: ['conflicts'],
  };
  let path = Object.hasOwn(routes, scope) ? routes[scope] : null;
  let kind = 'field';
  if (['事实内容', '事实来源说明', '事实状态', '删除指定事实'].includes(scope)) {
    if (!Number.isSafeInteger(factNumber) || factNumber < 1 || !Array.isArray(parent.data?.facts) || factNumber > parent.data.facts.length)
      throw new Error('事实序号不存在，请重新核对父版本');
    path = ['facts', factNumber - 1];
    if (scope === '删除指定事实') kind = 'remove';
    else path.push({ 事实内容: 'statement', 事实来源说明: 'source', 事实状态: 'status' }[scope]);
  } else if (scope === '新增事实') {
    if (!Array.isArray(parent.data?.facts)) throw new Error('父版本没有可用的事实列表');
    path = ['facts'];
    kind = 'append';
  } else if (scope === '仅正文片段') {
    path = [];
    kind = 'markdown';
    if (!fragment) throw new Error('仅更新正文时须提供准确的原片段');
  }
  if (!path) throw new Error('请选择一个明确的更新项目');
  let currentValue = parent.data;
  for (const key of path) {
    if (currentValue === null || typeof currentValue !== 'object' || !Object.hasOwn(currentValue, key))
      throw new Error('父版本中缺少所选字段，请先通过逐项编辑核对');
    currentValue = currentValue[key];
  }
  if (kind === 'field' && typeof currentValue !== 'string' && !(Array.isArray(currentValue) && currentValue.every((v) => typeof v === 'string')))
    throw new Error('所选字段结构不符，请先核对父版本');
  if (fragment) {
    const at = parent.markdown.indexOf(fragment);
    if (at < 0 || parent.markdown.indexOf(fragment, at + 1) >= 0)
      throw new Error('正文原片段不存在或不唯一，请选择更完整的准确原文');
  }
  return {
    parent, scope, path, kind, currentValue, fragment,
    context: {
      parent: { ref: parent.ref, title: parent.title, markdown: parent.markdown, data: parent.data },
      scope, kind, currentValue: kind === 'markdown' ? null : currentValue,
      requirements, fragment, factNumber,
    },
  };
}
