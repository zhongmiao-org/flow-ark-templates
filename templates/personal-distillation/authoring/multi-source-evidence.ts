export default async ({ input, signal }: any) => {
  signal.throwIfAborted();
  const { collection, conversation } = input;
  if (collection?.ready !== true || !collection.context || !Array.isArray(collection.evidence) || collection.evidence.length !== collection.documents.length || conversation?.status !== 'confirmed' || conversation.evidence?.kind !== 'conversation')
    throw Error('请先核对完整资料范围并明确确认真实访谈');
  return { evidence: [...collection.evidence, conversation.evidence] };
};
