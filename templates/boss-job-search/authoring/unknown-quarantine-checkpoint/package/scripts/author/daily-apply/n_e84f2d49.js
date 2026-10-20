var stdin_default = async ({ signal }) => {
  signal.throwIfAborted();
  return Array.from({ length: 24 }, (_, index) => index + 1);
};
export {
  stdin_default as default
};
