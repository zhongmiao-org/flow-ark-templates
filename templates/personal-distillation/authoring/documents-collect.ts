export default async ({ input, signal }: any) => {
  signal.throwIfAborted();
  const { files, results } = input;
  if (!Array.isArray(files) || !files.length || files.length > 10 || !Array.isArray(results) || results.length !== files.length)
    throw Error('资料清单与实际解析结果数量不一致');
  const documents = results.map((row: any, index: number) => {
    const values = row && typeof row === 'object' && !Array.isArray(row) ? Object.values(row) : [];
    if (values.length !== 1) throw Error('每份资料必须对应一次明确解析');
    const d: any = values[0];
    if (!d?.source || d.source.name !== files[index] || !['ready', 'partial', 'empty'].includes(d.status) || !Array.isArray(d.units) || !Array.isArray(d.warnings) || d.text !== d.units.map((u: any) => u.text).join('\n'))
      throw Error('资料来源、顺序或正文定位不一致');
    return { status: d.status, source: d.source, units: d.units, warnings: d.warnings };
  });
  const context = { version: 1, documents };
  const characters = documents.reduce((n: number, d: any) => n + d.units.map((u: any) => u.text).join('\n').length, 0);
  const contextBytes = Buffer.byteLength(JSON.stringify(context), 'utf8');
  const overBudget = characters > 50000 || contextBytes > 196608;
  const issues = documents.flatMap((d: any) => d.status === 'ready' ? [] : [`${d.source.name}：${d.status === 'empty' ? '正文为空' : '存在内容缺口'}，请本人核对`]);
  if (overBudget) issues.push('资料合计超过50,000字符或192KiB上下文；未截断、未建立访谈');
  const evidence = documents.filter((d: any) => d.units.length).map((d: any) => ({ kind: 'document', label: d.source.name, source: d.source, units: d.units.map((u: any) => u.index) }));
  const metadata = documents.map((d: any) => ({ status: d.status, source: d.source, unitCount: d.units.length, warnings: d.warnings }));
  signal.throwIfAborted();
  return { version: 1, ready: issues.length === 0, status: issues.length ? 'materials-review' : 'materials-ready', documents: metadata, totals: { files: files.length, characters, contextBytes }, context: overBudget ? null : context, evidence, issues, modelRequested: false };
};
