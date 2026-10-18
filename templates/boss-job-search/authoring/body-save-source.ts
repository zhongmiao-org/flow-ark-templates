export default async ({ input, signal, template }: any) => {
  signal.throwIfAborted();
  const result = input?.result;
  const statuses = ['site-mismatch', 'login-required', 'not-job-page', 'source-incomplete', 'source-changed', 'body-incomplete', 'review-too-large', 'body-source-confirmed', 'body-source-rejected'];
  if (!result || result.version !== 1 || result.kind !== 'web-jd-body' || !statuses.includes(result.status) || result.accountVerified !== false || result.eligibleForActions !== false || result.modelInputAllowed !== false || typeof input.attentionKey !== 'string' || !/^web-jd-body:[a-f0-9]{64}$/.test(input.attentionKey) || result.source?.companyVerified !== false || result.source?.descriptionComplete !== (result.status === 'body-source-confirmed'))
    throw Error('缺少本次已停止或已人工核对的正文结果');
  await template.result(result);
  signal.throwIfAborted();
  const source = result.source;
  const detail = {
    '处理结果': result.status === 'body-source-confirmed' ? '本人已确认，仅保留本次来源' : result.status === 'body-source-rejected' ? '本人已拒绝本次正文' : '停止采用，请本人核对',
    '原因': result.reason,
    '来源页面': source.page.origin + source.page.pathname,
    '页面标题': source.page.title ?? '尚未取得唯一标题',
    '岗位候选': source.jobTitle ?? '尚未取得唯一岗位',
    '公司候选（未核验）': source.companyLabel ?? '尚未取得唯一公司标签',
    '正文状态': source.descriptionComplete ? '本人已阅读并声明完整；该声明仅作用本次固定来源' : source.descriptionRead ? '仅取得待核对候选，未确认完整' : '未读取可采用正文',
    '后续处理': result.status === 'body-source-confirmed' ? '来源已保留。网页方向评估仍需独立入口与自己的Key，本次未调用模型。' : '核对页面、登录限制或定位后，由本人明确重新运行；不自动重试。',
    '权限边界': '未核验账号或公司，不调用模型，不投递、不发消息或简历、不点击不感兴趣。',
    '来源摘要': result.sourceSha256
  };
  const attention = await template.attention({ key: input.attentionKey, title: result.status === 'body-source-confirmed' ? '网页JD正文已由本人确认，仅保留来源' : '网页JD正文来源需要本人处理', detail });
  signal.throwIfAborted();
  return { ...result, attention };
};
