var stdin_default = async ({ template, signal }) => {
  const entry = "body > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > div > div:nth-of-type(1) > span";
  const groups = "div:nth-of-type(4) > div:nth-of-type(2) > div:nth-of-type(2) > div > ul:nth-of-type(1) > li";
  const call = async (operation, selector, value, timeoutMs = 3e3) => {
    signal.throwIfAborted();
    const result = await template.browser("browser", { operation, ...selector ? { selector } : {}, ...value === void 0 ? {} : { value }, timeoutMs });
    signal.throwIfAborted();
    return result;
  };
  const source = await call("url");
  const u = new URL(source);
  if (u.protocol !== "https:" || u.hostname !== "www.zhipin.com" || u.pathname !== "/web/geek/jobs" || u.port || u.username || u.password) throw Error("\u57CE\u5E02\u5165\u53E3\u6765\u6E90\u4E0D\u662F\u672C\u6B21\u804C\u4F4D\u5217\u8868\uFF0C\u505C\u6B62\u3002");
  await call("wait", entry, void 0, 1e4);
  if (await call("url") !== source || await call("count", entry) !== 1) throw Error("\u57CE\u5E02\u5165\u53E3\u6216\u804C\u4F4D\u5217\u8868\u5DF2\u53D8\u5316\uFF0C\u5C1A\u672A\u70B9\u51FB\u3002");
  let clickReceipt = "returned";
  try {
    const result = await call("click", entry, void 0, 1e4);
    if (!result || result.clicked !== true || result.verified !== false) throw Error("\u57CE\u5E02\u5165\u53E3\u6CA1\u6709\u660E\u786E\u7684\u5355\u6B21\u70B9\u51FB\u56DE\u6267\u3002");
  } catch (error) {
    signal.throwIfAborted();
    const message = String(error?.message || error);
    if (!message.includes("\u70B9\u51FB\u671F\u95F4\u76EE\u6807\u53D1\u751F\u53D8\u5316\uFF0C\u672A\u786E\u8BA4\u70B9\u51FB\u7ED3\u679C") && !message.includes("\u7F51\u9875\u64CD\u4F5C\u8D85\u65F6")) throw error;
    clickReceipt = "uncertain";
  }
  await call("wait", groups + ":nth-of-type(1)", void 0, 1e4);
  const count = await call("count", groups);
  if (!Number.isSafeInteger(count) || count < 1 || count > 20) throw Error("\u672A\u53D6\u5F97\u6709\u6548\u7684\u771F\u5B9E\u57CE\u5E02\u5206\u7EC4\uFF0C\u505C\u6B62\u4E14\u4E0D\u91CD\u8BD5\u70B9\u51FB\u3002");
  const names = [];
  for (let p = 1; p <= count; p++) {
    const value = await call("read", groups + ":nth-of-type(" + p + ")");
    if (typeof value !== "string" || !value.trim() || value.length > 30 || /[\r\n\t]/.test(value)) throw Error("\u771F\u5B9E\u57CE\u5E02\u5206\u7EC4\u6587\u5B57\u4E0D\u5B8C\u6574\u3002");
    names.push(value.trim());
  }
  if (names[0] !== "\u70ED\u95E8\u57CE\u5E02" || new Set(names).size !== count || await call("count", groups) !== count || await call("url") !== source) throw Error("\u771F\u5B9E\u57CE\u5E02\u5F39\u5C42\u6216\u6765\u6E90\u672A\u786E\u8BA4\uFF0C\u505C\u6B62\u4E14\u4E0D\u91CD\u8BD5\u70B9\u51FB\u3002");
  return { version: 1, kind: "city-dialog-observed", clickAttempts: 1, clickReceipt, dialogVerified: true, groupCount: count, groupNames: names, cityVerified: false, eligibleForApplications: false };
};
export {
  stdin_default as default
};
