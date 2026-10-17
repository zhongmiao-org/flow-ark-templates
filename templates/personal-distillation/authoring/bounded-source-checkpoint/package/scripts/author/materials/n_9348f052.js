var stdin_default = async ({ input, template, signal }) => {
  signal.throwIfAborted();
  if (input?.version !== 1 || typeof input.ready !== "boolean" || !Array.isArray(input.documents) || input.modelRequested !== false)
    throw Error("\u8D44\u6599\u8303\u56F4\u7ED3\u679C\u4E0D\u4E00\u81F4\uFF0C\u672A\u4FDD\u5B58");
  return template.result(input);
};
export {
  stdin_default as default
};
