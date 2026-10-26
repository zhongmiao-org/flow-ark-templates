async function stdin_default({ input, signal, template }) {
  signal.throwIfAborted();
  if (input?.kind !== "configured-city" || input.ready !== true || typeof input.searchURL !== "string") throw Error("\u7F3A\u5C11\u56FA\u5B9A\u57CE\u5E02\u4E0E\u68C0\u7D22\u76EE\u6807");
  const u = new URL(input.searchURL);
  if (u.origin !== "https://www.zhipin.com" || u.pathname !== "/web/geek/jobs" || u.username || u.password || u.hash || u.searchParams.get("query") !== input.searchRole) throw Error("\u68C0\u7D22\u76EE\u6807\u4E0D\u5728\u56FA\u5B9A\u8303\u56F4\u5185");
  const current = await template.browser("browser", { operation: "url", timeoutMs: 3e3 });
  signal.throwIfAborted();
  if (current === u.href && input.initializedCityReused === true) return { url: current, title: "", reusedInitializedList: true };
  const result = await template.browser("browser", { operation: "navigate", value: u.href, timeoutMs: 3e4 });
  signal.throwIfAborted();
  return result;
}
export {
  stdin_default as default
};
