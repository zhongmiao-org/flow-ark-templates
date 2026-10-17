var stdin_default = async ({ input, signal }) => {
  signal.throwIfAborted();
  const { collection, conversation } = input;
  if (collection?.ready !== true || !collection.context || !Array.isArray(collection.evidence) || collection.evidence.length !== collection.documents.length || conversation?.status !== "confirmed" || conversation.evidence?.kind !== "conversation")
    throw Error("\u8BF7\u5148\u6838\u5BF9\u5B8C\u6574\u8D44\u6599\u8303\u56F4\u5E76\u660E\u786E\u786E\u8BA4\u771F\u5B9E\u8BBF\u8C08");
  return { evidence: [...collection.evidence, conversation.evidence] };
};
export {
  stdin_default as default
};
