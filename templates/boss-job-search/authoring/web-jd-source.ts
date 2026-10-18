import { createHash } from 'node:crypto';

export default async ({ input, signal }: any) => {
  signal.throwIfAborted();
  if (!input || input.version !== 1 || input.operation !== 'collect' || input.selector !== 'html' || !Array.isArray(input.framePath) || input.framePath.length || typeof input.url !== 'string' || input.url !== input.documentUrl || typeof input.complete !== 'boolean' || !Array.isArray(input.fields) || input.fields.length !== 4)
    throw Error('缺少本次网页JD来源的同次关联采集');
  const specs = [
    ['title', 'head > title', true],
    ['loginGate', 'div:nth-of-type(3) > div > div > div:nth-of-type(1) > span', false],
    ['jobTitle', 'h1', false],
    ['companyLabel', 'div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > div > div:nth-of-type(3) > div:nth-of-type(2)', false]
  ];
  for (let i = 0; i < specs.length; i++) {
    const f = input.fields[i], [key, selector, required] = specs[i];
    if (!f || f.key !== key || f.selector !== selector || f.operation !== 'text' || f.attribute !== null || f.required !== required || !Number.isSafeInteger(f.count) || f.count < 0 || !(f.value === null || typeof f.value === 'string')) throw Error('网页JD来源字段与当前制作约定不符');
    const status = f.count === 0 ? 'missing' : f.count > 1 ? 'ambiguous' : f.value === null ? 'missing-attribute' : f.value.trim() ? 'ok' : 'empty';
    if (f.status !== status || (f.count !== 1 && f.value !== null) || (f.count === 1 && f.value === null) || (typeof f.value === 'string' && Buffer.byteLength(f.value) > 8192)) throw Error('网页JD来源字段状态无效');
  }
  const complete = input.fields.every((f: any) => f.status !== 'ambiguous' && (!f.required || f.status === 'ok'));
  if (complete !== input.complete || Buffer.byteLength(input.url) > 16384) throw Error('网页JD来源采集完整性无效');
  const page = new URL(input.url);
  const site = page.protocol === 'https:' && ['www.zhipin.com', 'zhipin.com'].includes(page.hostname) && !page.username && !page.password && (!page.port || page.port === '443');
  const jobPage = site && /^\/job_detail\/[^/]+\.html$/.test(page.pathname);
  const [title, gate, role, company] = input.fields;
  const text = (f: any, max: number) => f.status === 'ok' && f.count === 1 && typeof f.value === 'string' && f.value.trim().length <= max ? f.value.trim() : null;
  const pageTitle = text(title, 4096), jobTitle = text(role, 200), companyLabel = text(company, 500);
  const login = site && (/^\/web\/user\/?$/.test(page.pathname) || (jobPage && text(gate, 500) === '登录查看完整内容'));
  const status = !site ? 'site-mismatch' : login ? 'login-required' : !jobPage ? 'not-job-page' : !complete || !pageTitle || !jobTitle || !companyLabel ? 'source-incomplete' : 'body-review-required';
  const reasons: Record<string, string> = {
    'site-mismatch': '当前页面不属于预期BOSS站点，本批停止。',
    'login-required': '页面要求本人登录或登录查看完整内容；本批未读取正文，不调用模型。',
    'not-job-page': '当前不是职位详情页，不能将城市页或列表当作JD。',
    'source-incomplete': '同次来源字段缺失、重复或超出范围，请本人核对定位和页面。',
    'body-review-required': '仅关联了网页、岗位和公司标签；未读取完整正文，仍需正文能力与本人核对后接入评估。'
  };
  const source = {
    kind: 'associated-web-jd-metadata',
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
    attentionKey: 'web-jd-source:' + digest,
    result: {
      version: 1, kind: 'web-jd-source', status, reason: reasons[status], source, sourceSha256: digest,
      accountVerified: false, eligibleForActions: false, modelInputAllowed: false, nextAction: 'ask-user',
      checkedAt: new Date().toISOString()
    }
  };
};
