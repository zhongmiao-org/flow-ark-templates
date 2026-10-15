export default async function (ctx) {
  const { prepared, conversation, suggestion } = ctx.input;
  if (conversation.status !== 'confirmed' || conversation.evidence?.kind !== 'conversation')
    throw new Error('请先明确确认本次补充访谈');
  if (suggestion.decision !== 'ready') throw new Error('局部提案尚不明确，请补充访谈');
  const { parent, scope, kind, path, currentValue, fragment } = prepared;
  const value = JSON.parse(suggestion.valueJson);
  const data = structuredClone(parent.data);
  if (kind === 'field') {
    if (typeof currentValue === 'string' ? typeof value !== 'string' : !Array.isArray(value) || !value.every((v) => typeof v === 'string'))
      throw new Error('新值类型与所选字段不符，未创建草稿');
    if (scope === '事实状态' && !['reported', 'unknown', 'conflict'].includes(value))
      throw new Error('事实状态无效，未创建草稿');
    let container = data;
    for (const key of path.slice(0, -1)) container = container[key];
    Object.defineProperty(container, path.at(-1), { value, enumerable: true, configurable: true, writable: true });
  } else if (kind === 'append') {
    if (!value || Array.isArray(value) || typeof value !== 'object' || Object.keys(value).sort().join(',') !== 'source,statement,status' || !['statement', 'source', 'status'].every((key) => typeof value[key] === 'string') || !value.statement.trim() || !['reported', 'unknown', 'conflict'].includes(value.status))
      throw new Error('新增事实格式无效，未创建草稿');
    data.facts.push(value);
  } else if (kind === 'remove') {
    if (value !== null) throw new Error('删除事实提案格式无效，未创建草稿');
    data.facts.splice(path[1], 1);
  } else if (kind !== 'markdown' || value !== null) {
    throw new Error('局部更新类型无效，未创建草稿');
  }
  let markdown = parent.markdown;
  if (fragment) {
    const at = markdown.indexOf(fragment);
    if (at < 0 || markdown.indexOf(fragment, at + 1) >= 0)
      throw new Error('原片段不存在或不唯一，未创建草稿');
    markdown = markdown.slice(0, at) + suggestion.replacement + markdown.slice(at + fragment.length);
  } else if (suggestion.replacement !== '') {
    throw new Error('未选择正文片段，不能额外改写正文');
  }
  return {
    key: parent.ref.key, base: parent.ref, title: parent.title, markdown, data,
    evidence: [...parent.evidence, conversation.evidence],
    changes: [{ scope, path, before: kind === 'markdown' ? fragment : currentValue, after: kind === 'markdown' ? suggestion.replacement : value, reason: suggestion.reason }],
  };
}
