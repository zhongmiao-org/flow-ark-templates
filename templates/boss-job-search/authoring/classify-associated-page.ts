export default async ({ input, signal }: any) => {
  signal.throwIfAborted();
  if (!input || input.version !== 1 || input.operation !== 'collect' || input.selector !== 'html' || !Array.isArray(input.framePath) || input.framePath.length || typeof input.url !== 'string' || input.url !== input.documentUrl || typeof input.complete !== 'boolean' || !Array.isArray(input.fields) || input.fields.length !== 2)
    throw new Error('缺少本次同源关联采集，请重新核对预检流程');
  const [title, gate] = input.fields;
  for (const [field, key, required] of [[title, 'title', true], [gate, 'loginGate', false]]) {
    if (!field || field.key !== key || field.operation !== 'text' || field.attribute !== null || field.required !== required || !Number.isSafeInteger(field.count) || field.count < 0 || typeof field.status !== 'string' || !(field.value === null || typeof field.value === 'string'))
      throw new Error('采集字段与当前预检约定不一致');
  }
  if (input.url.length > 16384 || (typeof title.value === 'string' && title.value.length > 4096))
    throw new Error('网页观察超过本次预检范围');
  const page = new URL(input.url);
  const expected = page.protocol === 'https:' && ['www.zhipin.com', 'zhipin.com'].includes(page.hostname) && !page.username && !page.password && (!page.port || page.port === '443');
  const titleReady = title.status === 'ok' && title.count === 1 && typeof title.value === 'string' && !!title.value.trim();
  const gateReady = gate.status === 'ok' && gate.count === 1 && typeof gate.value === 'string';
  const complete = input.complete && titleReady;
  const login = complete && expected && /^\/web\/user\/?$/.test(page.pathname);
  const jobDetail = expected && /^\/job_detail\/[^/]+\.html$/.test(page.pathname);
  const jdLoginGate = complete && jobDetail && gateReady && gate.value.trim() === '登录查看完整内容';
  return {
    version: 3,
    site: 'boss',
    status: !expected ? 'site-mismatch' : login || jdLoginGate ? 'login-required' : 'account-unverified',
    accountVerified: false,
    eligibleForActions: false,
    observedPage: { origin: page.origin, pathname: page.pathname, title: titleReady ? title.value : null },
    collection: {
      kind: 'associated-browser-fields',
      complete,
      fields: [title, gate].map((field: any) => ({ key: field.key, count: field.count, status: field.status }))
    },
    jdContentStatus: jdLoginGate ? 'login-gated' : 'unverified',
    loginReason: login ? 'login-page' : jdLoginGate ? 'job-description-login-gate' : null,
    classifiedAt: new Date().toISOString(),
    note: !complete
      ? '同次采集不完整或字段不唯一，请本人核对页面和定位；没有采纳完整JD、账号或任何外发资格。'
      : jdLoginGate
        ? '职位正文明确要求登录查看完整内容，当前JD不完整，请本人登录后重新核对。没有进行岗位判断或招聘动作。'
        : login
          ? '当前为BOSS登录页，请本人完成必要登录后重新只读核对；本流程不输入验证码、不接受协议。'
          : '同次只读预检仅关联本次网址、标题及登录提示。提示缺失不证明账号或JD完整，仍须本人核验；未授予投递或聊天权限。'
  };
};