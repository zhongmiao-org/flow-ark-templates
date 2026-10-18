import { createHash } from 'node:crypto';

export default async ({ input, signal, template }: any) => {
  signal.throwIfAborted();
  const result = input?.result, review = input?.review;
  if (input?.readyForReview !== true || result?.version !== 1 || result.kind !== 'web-jd-body' || result.status !== 'body-review-required' || result.accountVerified !== false || result.eligibleForActions !== false || result.modelInputAllowed !== false || result.source?.descriptionComplete !== false || review?.version !== 1 || typeof review.target !== 'string' || !review.target.trim() || review.target.length > 4096 || typeof review.content !== 'string' || !review.content.trim() || review.content.length > 100000 || Buffer.byteLength(review.content) > 65536 || createHash('sha256').update(review.content).digest('hex') !== result.source.descriptionSha256)
    throw Error('缺少本次完整且固定的正文核对候选');
  const accepted = '确认并保留来源', rejected = '拒绝本次正文';
  const decision = await template.human({
    title: '完整阅读并核对本次网页JD正文',
    description: '请完整阅读固定目标与全部原文，并与当前真实页面核对是否完整、未被登录遮挡或删节。确认只保留本次来源；不调用模型，不核验账号/企业，不授予投递、聊天、附件或其他外发权限。拿不准请拒绝。取消、超时或退出使本请求失效，再次运行须重新采集。',
    schema: { type: 'string', enum: [accepted, rejected] },
    review
  });
  signal.throwIfAborted();
  if (decision !== accepted && decision !== rejected) throw Error('正文核对回执不是本次明确选择');
  const confirmed = decision === accepted;
  const source = { ...result.source, descriptionComplete: confirmed, humanCompletenessDeclaration: confirmed, humanDecision: decision, humanReviewedAt: new Date().toISOString() };
  const status = confirmed ? 'body-source-confirmed' : 'body-source-rejected';
  const digest = createHash('sha256').update(JSON.stringify({ parent: result.sourceSha256, status })).digest('hex');
  return {
    attentionKey: 'web-jd-body:' + digest,
    result: { ...result, source, sourceSha256: digest, status,
      reason: confirmed ? '本人已声明本次固定正文完整，仅保留来源；未开启模型或招聘动作。' : '本人拒绝本次正文，停止采用，未开启模型或招聘动作。',
      nextAction: confirmed ? 'source-retained-only' : 'ask-user', checkedAt: new Date().toISOString() }
  };
};
