export default async ({input, signal}: any) => {
  signal.throwIfAborted();
  if (!input || typeof input.urlBefore !== 'string' || typeof input.urlAfter !== 'string' || typeof input.title !== 'string' || typeof input.pageText !== 'string' || !input.pageText.trim())
    throw new Error('网页观察不完整，请重新运行只读预检');
  if (input.urlBefore.length > 16384 || input.urlAfter.length > 16384 || input.title.length > 4096 || input.pageText.length > 65536)
    throw new Error('网页观察超过本次预检范围');
  if (input.urlBefore !== input.urlAfter)
    throw new Error('观察期间网页地址变化，请重新核对');
  const page = new URL(input.urlAfter);
  const expected = page.protocol === 'https:' && ['www.zhipin.com', 'zhipin.com'].includes(page.hostname) && !page.username && !page.password && (!page.port || page.port === '443');
  const login = expected && /^\/web\/user\/?$/.test(page.pathname);
  const jobDetail = expected && /^\/job_detail\/[^/]+\.html$/.test(page.pathname);
  const jdLoginGate = jobDetail && input.pageText.includes('登录查看完整内容');
  return {
    version: 2,
    site: 'boss',
    status: !expected ? 'site-mismatch' : login || jdLoginGate ? 'login-required' : 'account-unverified',
    accountVerified: false,
    eligibleForActions: false,
    observedPage: {origin: page.origin, pathname: page.pathname, title: input.title},
    jdContentStatus: jdLoginGate ? 'login-gated' : 'unverified',
    loginReason: login ? 'login-page' : jdLoginGate ? 'job-description-login-gate' : null,
    classifiedAt: new Date().toISOString(),
    note: jdLoginGate
      ? '职位正文明确要求登录查看完整内容，当前JD不完整，请本人登录后重新核对。没有进行岗位判断或招聘动作。'
      : '这是独立网页观察。截断标记缺失不证明JD完整；登录页需要本人继续，其他页面也须实际核对求职者账号。本检查点不授予投递或聊天权限。'
  };
};
