export default async function (ctx) {
  const { document, conversation } = ctx.input;
  if (document.status !== 'ready' || conversation.status !== 'confirmed')
    throw new Error('请先核对资料并明确确认访谈');
  const units = document.units.map((unit) => unit.index);
  if (!units.length || units.some((n) => !Number.isInteger(n) || n < 1))
    throw new Error('资料定位不完整，请回到资料核对');
  if (!conversation.evidence || conversation.evidence.kind !== 'conversation')
    throw new Error('已确认访谈缺少真实来源，请重新核对');
  return {
    evidence: [
      { kind: 'document', label: '本人选定资料', source: document.source, units },
      conversation.evidence,
    ],
  };
}
