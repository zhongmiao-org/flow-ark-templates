import { createHash } from 'node:crypto';

export default async ({ input, signal }: any) => {
  signal.throwIfAborted();
  const before = input?.preflight, data = input?.collection;
  if (before?.readyForBody !== true || before.result?.version !== 1 || before.result?.kind !== 'web-jd-body' || before.result?.status !== 'body-candidate-required' || !before.metadata || before.metadata.sourceSha256 !== before.result.sourceSha256 || before.result.accountVerified !== false || before.result.eligibleForActions !== false || before.result.modelInputAllowed !== false)
    throw Error('缺少本次允许读取正文候选的预检来源');
  if (!data || data.version !== 2 || data.operation !== 'collect' || data.renderPolicy !== 'bounded-rendered-text-v1' || data.selector !== 'html' || !Array.isArray(data.framePath) || data.framePath.length || typeof data.url !== 'string' || data.url !== data.documentUrl || typeof data.complete !== 'boolean' || !Array.isArray(data.fields) || data.fields.length !== 5 || Buffer.byteLength(data.url) > 16384 || Buffer.byteLength(JSON.stringify(data)) > 131072)
    throw Error('缺少本次同次元数据与已排版正文采集');
  const specs = [
    ['description', 'div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3)', 'rendered-text', true],
    ['title', 'head > title', 'text', true],
    ['loginGate', 'div:nth-of-type(3) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1)', 'text', false],
    ['jobTitle', 'h1', 'text', false],
    ['companyLabel', 'div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > div > div:nth-of-type(3) > div:nth-of-type(2)', 'text', false]
  ];
  const issueOrder = ['hidden-target', 'hidden-descendant', 'line-clamp', 'overflow-clip', 'unsupported-layout', 'embedded-content', 'generated-content'];
  let complete = true;
  for (let i = 0; i < specs.length; i++) {
    const f = data.fields[i], [key, selector, operation, required] = specs[i];
    if (!f || f.key !== key || f.selector !== selector || f.operation !== operation || f.attribute !== null || f.required !== required || !Number.isSafeInteger(f.count) || f.count < 0 || !Array.isArray(f.issues) || !(f.value === null || typeof f.value === 'string')) throw Error('正文来源字段与当前编排不符');
    if (JSON.stringify(f.issues) !== JSON.stringify(issueOrder.filter(v => f.issues.includes(v))) || (operation !== 'rendered-text' && f.issues.length) || (f.count !== 1 && (f.value !== null || f.issues.length))) throw Error('正文来源字段原因无效');
    let status = f.count === 0 ? 'missing' : f.count > 1 ? 'ambiguous' : f.issues.some((v: string) => v.startsWith('hidden-')) ? 'hidden' : f.issues.some((v: string) => ['line-clamp', 'overflow-clip'].includes(v)) ? 'clipped' : f.issues.length ? 'unsupported' : f.value === null ? 'missing-attribute' : f.value.trim() ? 'ok' : 'empty';
    if (f.status !== status || (f.issues.length && f.value !== null) || (f.count === 1 && !f.issues.length && f.value === null) || (typeof f.value === 'string' && Buffer.byteLength(f.value) > (operation === 'rendered-text' ? 65536 : 8192))) throw Error('正文来源字段状态或长度无效');
    if (['ambiguous', 'hidden', 'clipped', 'unsupported'].includes(status) || (f.required && status !== 'ok')) complete = false;
  }
  if (complete !== data.complete) throw Error('正文采集完整性与字段状态不符');
  const page = new URL(data.url), [body, title, gate, role, company] = data.fields;
  const text = (f: any, max: number) => f.status === 'ok' && f.count === 1 && typeof f.value === 'string' && f.value.trim().length <= max ? f.value.trim() : null;
  const pageTitle = text(title, 4096), jobTitle = text(role, 200), companyLabel = text(company, 500), gateText = text(gate, 500);
  const pageSource = { origin: page.origin, pathname: page.pathname, title: pageTitle };
  const expected = before.metadata;
  const site = page.protocol === 'https:' && ['www.zhipin.com', 'zhipin.com'].includes(page.hostname) && !page.username && !page.password && (!page.port || page.port === '443');
  const sameTarget = site && /^\/job_detail\/[^/]+\.html$/.test(page.pathname) && JSON.stringify(pageSource) === JSON.stringify(expected.page) && jobTitle === expected.jobTitle && companyLabel === expected.companyLabel;
  const description = body.status === 'ok' && typeof body.value === 'string' ? body.value : null;
  const login = gateText === '登录查看完整内容' || (description !== null && /登录查看完整内容|立即登录|登录\s*\/\s*注册|短信验证码/.test(description));
  let status = !sameTarget ? 'source-changed' : login ? 'login-required' : !complete || !pageTitle || !jobTitle || !companyLabel || (gate.status === 'ok' && gateText !== '登录查看完整内容') || !description?.trim() ? 'body-incomplete' : 'body-review-required';
  const descriptionSha256 = description === null ? null : createHash('sha256').update(description).digest('hex');
  const target = `BOSS网页JD来源\n页面：${page.origin}${page.pathname}\n岗位：${jobTitle}\n公司候选（未核验）：${companyLabel}\n正文SHA-256：${descriptionSha256}`;
  if (status === 'body-review-required' && (target.length > 4096 || description!.length > 100000)) status = 'review-too-large';
  const reasons: Record<string, string> = {
    'source-changed': '正文采集的页面、岗位或公司候选与本次预检不一致，停止采用。',
    'login-required': '再次采集发现登录遮挡或正文仍含登录界面提示，不采用正文。',
    'body-incomplete': '正文为空、隐藏、裁切、无法判定，或元数据不完整，请本人核对。',
    'body-review-required': '有限策略已取得正文候选；仍须本人完整阅读，不能据此认定未删节。',
    'review-too-large': '完整目标或正文超过人工核对上限，整次停止，不截断。'
  };
  const source = {
    kind: 'associated-web-jd-body-source',
    page: pageSource, jobTitle, companyLabel, companyVerified: false,
    preflight: { page: expected.page, jobTitle: expected.jobTitle, companyLabel: expected.companyLabel, sourceSha256: expected.sourceSha256 },
    fields: data.fields.map((f: any) => ({ key: f.key, count: f.count, status: f.status, issues: f.issues })),
    collectionComplete: complete, renderPolicy: data.renderPolicy,
    descriptionRead: description !== null, descriptionSha256, descriptionComplete: false,
    humanCompletenessDeclaration: false
  };
  const digest = createHash('sha256').update(JSON.stringify({ source, status })).digest('hex');
  signal.throwIfAborted();
  return {
    readyForReview: status === 'body-review-required',
    review: status === 'body-review-required' ? { version: 1, target, content: description } : null,
    attentionKey: 'web-jd-body:' + digest,
    result: {
      version: 1, kind: 'web-jd-body', status, reason: reasons[status], source, sourceSha256: digest,
      accountVerified: false, eligibleForActions: false, modelInputAllowed: false, nextAction: 'ask-user',
      checkedAt: new Date().toISOString()
    }
  };
};
