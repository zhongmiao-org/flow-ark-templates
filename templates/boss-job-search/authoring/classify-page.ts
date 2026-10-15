export default async ({input, signal}: any) => {
  signal.throwIfAborted();
  if (!input || typeof input.urlBefore !== 'string' || typeof input.urlAfter !== 'string' || typeof input.title !== 'string')
    throw new Error('网页观察不完整，请重新运行只读预检');
  if (input.urlBefore.length > 16384 || input.urlAfter.length > 16384 || input.title.length > 4096)
    throw new Error('网页观察超过本次预检范围');
  if (input.urlBefore !== input.urlAfter)
    throw new Error('观察期间网页地址变化，请重新核对');
  const page = new URL(input.urlAfter);
  const expected = page.protocol === 'https:' && ['www.zhipin.com', 'zhipin.com'].includes(page.hostname) && !page.username && !page.password && (!page.port || page.port === '443');
  const login = expected && /^\/web\/user\/?$/.test(page.pathname);
  return {
    version: 1,
    site: 'boss',
    status: !expected ? 'site-mismatch' : login ? 'login-required' : 'account-unverified',
    accountVerified: false,
    eligibleForActions: false,
    observedPage: {origin: page.origin, pathname: page.pathname, title: input.title},
    classifiedAt: new Date().toISOString(),
    note: '这是独立网页观察。登录页需要本人继续；其他页面也须实际核对求职者账号，本检查点不授予投递或聊天权限。'
  };
};
