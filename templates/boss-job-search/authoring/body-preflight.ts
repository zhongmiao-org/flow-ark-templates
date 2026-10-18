import { createHash } from 'node:crypto';

export default async ({ input, signal }: any) => {
  signal.throwIfAborted();
  if (!input || input.version !== 1 || input.operation !== 'collect' || input.selector !== 'html' || !Array.isArray(input.framePath) || input.framePath.length || typeof input.url !== 'string' || input.url !== input.documentUrl || typeof input.complete !== 'boolean' || !Array.isArray(input.fields) || input.fields.length !== 4)
    throw Error('缺少本次正文预检的同次元数据采集');
  const specs = [
    ['title', 'head > title', true],
    ['loginGate', 'div:nth-of-type(3) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1)', false],
    ['jobTitle', 'h1', false],
    ['companyLabel', 'div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > div > div:nth-of-type(3) > div:nth-of-type(2)', false]
  ];
  for (let i = 0; i < specs.length; i++) {
    const f = input.fields[i], [key, selector, required] = specs[i];
    if (!f || f.key !== key || f.selector !== selector || f.operation !== 'text' || f.attribute !== null || f.required !== required || !Number.isSafeInteger(f.count) || f.count < 0 || !(f.value === null || typeof f.value === 'string')) throw Error('正文预检字段与当前编排不符');
    const status = f.count === 0 ? 'missing' : f.count > 1 ? 'ambiguous' : f.value === null ? 'missing-attribute' : f.value.trim() ? 'ok' : 'empty';
    if (f.status !== status || (f.count !== 1 && f.value !== null) || (f.count === 1 && f.value === null) || (typeof f.value === 'string' && Buffer.byteLength(f.value) > 8192)) throw Error('正文预检字段状态无效');
  }
  const complete = input.fields.every((f: any) => f.status !== 'ambiguous' && (!f.required || f.status === 'ok'));
  if (complete !== input.complete || Buffer.byteLength(input.url) > 16384) throw Error('正文预检采集完整性无效');
  const page = new URL(input.url);
  const site = page.protocol === 'https:' && ['www.zhipin.com', 'zhipin.com'].includes(page.hostname) && !page.username && !page.password && (!page.port || page.port === '443');
  const jobPage = site && /^\/job_detail\/[^/]+\.html$/.test(page.pathname);
  const [title, gate, role, company] = input.fields;
  const text = (f: any, max: number) => f.status === 'ok' && f.count === 1 && typeof f.value === 'string' && f.value.trim().length <= max ? f.value.trim() : null;
  const pageTitle = text(title, 4096), jobTitle = text(role, 200), companyLabel = text(company, 500);
  const gateText = text(gate, 500);
  const login = site && (/^\/web\/user\/?$/.test(page.pathname) || (jobPage && gateText === '登录查看完整内容'));
  const status = !site ? 'site-mismatch' : login ? 'login-required' : !jobPage ? 'not-job-page' : !complete || !pageTitle || !jobTitle || !companyLabel || (gate.status === 'ok' && gateText !== '登录查看完整内容') ? 'source-incomplete' : 'body-candidate-required';
  const reasons: Record<string, string> = {
    'site-mismatch': '当前页面不属于预期BOSS站点，未执行正文采集。',
    'login-required': '页面要求本人登录或登录查看完整内容，未执行正文采集。',
    'not-job-page': '当前不是职位详情页，不能把列表或城市页当作JD。',
    'source-incomplete': '同次元数据缺失、重复、超限或登录提示含义不明，请本人核对。',
    'body-candidate-required': '仅通过初步元数据检查；下一步仍须采集有限正文并由本人完整阅读。'
  };
  const source = {
    kind: 'associated-web-jd-body-source',
    page: { origin: page.origin, pathname: page.pathname, title: pageTitle },
    jobTitle: jobPage ? jobTitle : null,
    companyLabel: jobPage ? companyLabel : null,
    companyVerified: false,
    fields: input.fields.map((f: any) => ({ key: f.key, count: f.count, status: f.status })),
    collectionComplete: complete,
    descriptionRead: false,
    descriptionComplete: false
  };
  const digest = createHash('sha256').update(JSON.stringify({ source, status })).digest('hex');
  signal.throwIfAborted();
  return {
    readyForBody: status === 'body-candidate-required',
    metadata: { page: source.page, jobTitle: source.jobTitle, companyLabel: source.companyLabel, sourceSha256: digest },
    attentionKey: 'web-jd-body:' + digest,
    result: {
      version: 1, kind: 'web-jd-body', status, reason: reasons[status], source, sourceSha256: digest,
      accountVerified: false, eligibleForActions: false, modelInputAllowed: false, nextAction: 'ask-user',
      checkedAt: new Date().toISOString()
    }
  };
};
