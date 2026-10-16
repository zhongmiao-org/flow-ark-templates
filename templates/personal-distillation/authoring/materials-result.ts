export default async ({ input, template, signal }: any) => {
  signal.throwIfAborted();
  if (input?.version !== 1 || typeof input.ready !== 'boolean' || !Array.isArray(input.documents) || input.modelRequested !== false)
    throw Error('资料范围结果不一致，未保存');
  return template.result(input);
};
