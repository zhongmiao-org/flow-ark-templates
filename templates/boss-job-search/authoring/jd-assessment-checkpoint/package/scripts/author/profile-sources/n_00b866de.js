var stdin_default = async ({ input, template, signal }) => {
  signal.throwIfAborted();
  if (!input || input.version !== 1 || input.ready !== false || input.status !== "needs-review" || !["partial", "empty"].includes(input.resume?.status) || typeof input.resume?.source?.name !== "string" || typeof input.resume?.source?.sha256 !== "string" || typeof input.profile?.ref?.sha256 !== "string" || input.accountVerified !== false || input.eligibleForActions !== false) throw new Error("\u8D44\u6599\u7F3A\u53E3\u4E0E\u672C\u6B21\u6765\u6E90\u4E0D\u4E00\u81F4");
  await template.attention({ key: "profile-sources:" + input.resume.source.name + ":" + input.resume.source.sha256 + ":" + input.profile.ref.sha256 + ":" + input.resume.status, title: "BOSS \u7B80\u5386\u8D44\u6599\u5C1A\u4E0D\u5B8C\u6574\uFF0C\u8BF7\u672C\u4EBA\u6838\u5BF9\u540E\u518D\u91C7\u7528", detail: input });
  return template.result(input);
};
export {
  stdin_default as default
};
