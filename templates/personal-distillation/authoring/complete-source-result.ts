/** Small adapter only. Reading, model batching and Skill proposal remain visual nodes. */
export default async ({ input, signal }: any) => {
  signal.throwIfAborted();
  if (input?.version !== 1 || input.phase !== 'complete' || input.checkpoint?.next !== null ||
      !input.proof || input.proof.checkpointSha256 !== input.checkpoint.sha256)
    throw new Error('完整来源仍未全部覆盖；保留进度并核对后继续原整理入口。');
  const draft = input.checkpoint.accumulator;
  for (const field of ['markdown', 'facts', 'preferences', 'expression', 'boundaries', 'unknowns', 'continuation'])
    if (typeof draft?.[field] !== 'string') throw new Error('完整草稿字段缺失，请核对整理结果。');
  if (!draft.markdown.trim() || draft.continuation.trim())
    throw new Error('草稿正文为空或仍有未接续内容，不能创建Skill。');
  return {
    markdown: draft.markdown,
    data: { version: 1, facts: draft.facts, preferences: draft.preferences,
      expression: draft.expression, boundaries: draft.boundaries, unknowns: draft.unknowns },
    evidence: [{ kind: 'source-reduction', label: '本人选择的固定完整材料与访谈来源', proof: input.proof }],
    usage: { reportedTotalTokens: input.reportedTotalTokens, unknownUsageRequests: input.unknownUsageRequests,
      attempts: input.attempts, note: '仅本次来源整理；不含此前访谈，未知用量不能填零。' },
  };
};
