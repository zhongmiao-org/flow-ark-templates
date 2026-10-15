export default async ({input, template, signal}: any) => {
  signal.throwIfAborted();
  if (!input || input.site !== 'boss' || !['site-mismatch', 'account-unverified'].includes(input.status) || input.accountVerified !== false || input.eligibleForActions !== false)
    throw new Error('待核对状态与本次网页观察不一致');
  await template.attention({key: 'preflight:' + input.status, title: input.status === 'site-mismatch' ? 'BOSS 当前网页不匹配，请核对所选浏览器' : 'BOSS 求职者账号尚未核验，请本人核对后继续', detail: input});
  return template.result(input);
};
