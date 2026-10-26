import { randomUUID } from "node:crypto";
var stdin_default = async ({ signal }) => {
  signal.throwIfAborted();
  return { version: 1, batchId: randomUUID(), createdAt: (/* @__PURE__ */ new Date()).toISOString() };
};
export {
  stdin_default as default
};
