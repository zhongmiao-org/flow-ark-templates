async function stdin_default(ctx) {
  const { parent, scope, requirements, fragment, factNumber, round } = ctx.input;
  if (!parent?.ref || typeof parent.title !== "string" || !Array.isArray(parent.evidence))
    throw new Error("\u8BF7\u5148\u9009\u62E9\u51C6\u786E\u7684\u7236\u786E\u8BA4\u7248\u672C");
  if (typeof requirements !== "string" || !requirements.trim())
    throw new Error("\u8BF7\u5148\u8BF4\u660E\u672C\u6B21\u660E\u786E\u7684\u66F4\u65B0\u8981\u6C42");
  if (typeof fragment !== "string" || typeof round !== "string" || !round.trim())
    throw new Error("\u539F\u6587\u7247\u6BB5\u6216\u8BBF\u8C08\u6807\u8BC6\u65E0\u6548\uFF0C\u8BF7\u91CD\u65B0\u6838\u5BF9");
  const routes = {
    \u76EE\u6807\u5C97\u4F4D: ["preferences", "roles"],
    \u671F\u671B\u5730\u70B9: ["preferences", "locations"],
    \u5DE5\u4F5C\u5F62\u5F0F: ["preferences", "workModes"],
    \u671F\u671B\u85AA\u8D44: ["preferences", "salary"],
    \u6392\u9664\u65B9\u5411: ["preferences", "exclusions"],
    \u771F\u5B9E\u8868\u8FBE\u6837\u4F8B: ["expression", "examples"],
    \u8868\u8FBE\u89C4\u5219: ["expression", "rules"],
    \u5F85\u786E\u8BA4\u8868\u8FBE\u63A8\u65AD: ["expression", "inferred"],
    \u5141\u8BB8\u81EA\u52A8\u56DE\u590D: ["boundaries", "allowed"],
    \u9700\u8981\u672C\u4EBA\u5904\u7406: ["boundaries", "askUser"],
    \u7981\u6B62\u81EA\u52A8\u56DE\u590D: ["boundaries", "prohibited"],
    \u5F85\u8865\u95EE\u9898: ["unknown"],
    \u77DB\u76FE\u8BB0\u5F55: ["conflicts"]
  };
  let path = Object.hasOwn(routes, scope) ? routes[scope] : null;
  let kind = "field";
  if (["\u4E8B\u5B9E\u5185\u5BB9", "\u4E8B\u5B9E\u6765\u6E90\u8BF4\u660E", "\u4E8B\u5B9E\u72B6\u6001", "\u5220\u9664\u6307\u5B9A\u4E8B\u5B9E"].includes(scope)) {
    if (!Number.isSafeInteger(factNumber) || factNumber < 1 || !Array.isArray(parent.data?.facts) || factNumber > parent.data.facts.length)
      throw new Error("\u4E8B\u5B9E\u5E8F\u53F7\u4E0D\u5B58\u5728\uFF0C\u8BF7\u91CD\u65B0\u6838\u5BF9\u7236\u7248\u672C");
    path = ["facts", factNumber - 1];
    if (scope === "\u5220\u9664\u6307\u5B9A\u4E8B\u5B9E") kind = "remove";
    else path.push({ \u4E8B\u5B9E\u5185\u5BB9: "statement", \u4E8B\u5B9E\u6765\u6E90\u8BF4\u660E: "source", \u4E8B\u5B9E\u72B6\u6001: "status" }[scope]);
  } else if (scope === "\u65B0\u589E\u4E8B\u5B9E") {
    if (!Array.isArray(parent.data?.facts)) throw new Error("\u7236\u7248\u672C\u6CA1\u6709\u53EF\u7528\u7684\u4E8B\u5B9E\u5217\u8868");
    path = ["facts"];
    kind = "append";
  } else if (scope === "\u4EC5\u6B63\u6587\u7247\u6BB5") {
    path = [];
    kind = "markdown";
    if (!fragment) throw new Error("\u4EC5\u66F4\u65B0\u6B63\u6587\u65F6\u987B\u63D0\u4F9B\u51C6\u786E\u7684\u539F\u7247\u6BB5");
  }
  if (!path) throw new Error("\u8BF7\u9009\u62E9\u4E00\u4E2A\u660E\u786E\u7684\u66F4\u65B0\u9879\u76EE");
  let currentValue = parent.data;
  for (const key of path) {
    if (currentValue === null || typeof currentValue !== "object" || !Object.hasOwn(currentValue, key))
      throw new Error("\u7236\u7248\u672C\u4E2D\u7F3A\u5C11\u6240\u9009\u5B57\u6BB5\uFF0C\u8BF7\u5148\u901A\u8FC7\u9010\u9879\u7F16\u8F91\u6838\u5BF9");
    currentValue = currentValue[key];
  }
  if (kind === "field" && typeof currentValue !== "string" && !(Array.isArray(currentValue) && currentValue.every((v) => typeof v === "string")))
    throw new Error("\u6240\u9009\u5B57\u6BB5\u7ED3\u6784\u4E0D\u7B26\uFF0C\u8BF7\u5148\u6838\u5BF9\u7236\u7248\u672C");
  if (fragment) {
    const at = parent.markdown.indexOf(fragment);
    if (at < 0 || parent.markdown.indexOf(fragment, at + 1) >= 0)
      throw new Error("\u6B63\u6587\u539F\u7247\u6BB5\u4E0D\u5B58\u5728\u6216\u4E0D\u552F\u4E00\uFF0C\u8BF7\u9009\u62E9\u66F4\u5B8C\u6574\u7684\u51C6\u786E\u539F\u6587");
  }
  return {
    parent,
    scope,
    path,
    kind,
    currentValue,
    fragment,
    context: {
      parent: { ref: parent.ref, title: parent.title, markdown: parent.markdown, data: parent.data },
      scope,
      kind,
      currentValue: kind === "markdown" ? null : currentValue,
      requirements,
      fragment,
      factNumber
    }
  };
}
export {
  stdin_default as default
};
