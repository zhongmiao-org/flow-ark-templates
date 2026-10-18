import { createHash } from 'node:crypto';

export default async ({ input, signal, template }: any) => {
  signal.throwIfAborted();
  const result = input?.result, review = input?.review;
  if (input?.readyForReview !== true || result?.version !== 1 || result.kind !== 'web-jd-body' || result.status !== 'body-review-required' || result.accountVerified !== false || result.eligibleForActions !== false || result.modelInputAllowed !== false || result.source?.descriptionComplete !== false || review?.version !== 1 || typeof review.target !== 'string' || !review.target.trim() || review.target.length > 4096 || typeof review.content !== 'string' || !review.content.trim() || review.content.length > 100000 || Buffer.byteLength(review.content) > 65536 || createHash('sha256').update(review.content).digest('hex') !== result.source.descriptionSha256)
    throw Error('缺少本次完整且固定的正文核对候选');
  const accepted = '确认本次正文并评估', rejected = '拒绝本次评估';
  const decision = await template.human({
    title: '完整核对本次网页JD并选择是否评估',
    description: '请完整阅读固定目标和全部原文，与当前真实页面核对完整、未被登录遮挡或删节。确认后复核来源、求职条件与固定Skill，再以本入口明确绑定的自有Key最多请求一次内部方向评估；缺口或变化停止。拿不准请拒绝；拒绝不调用模型。账号/企业仍未核验，不授予投递、聊天、简历或不感兴趣动作。取消、超时或退出使请求失效，再次运行重新采集，不自动重试。',
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
    result: { ...result, source, sourceSha256: digest, status, assessmentRequested: confirmed,
      reason: confirmed ? '本人已声明本次固定正文完整并请求内部评估；仍须复核来源、配置与固定Skill，不开启招聘动作。' : '本人拒绝本次评估，停止采用，不调用模型或招聘动作。',
      nextAction: confirmed ? 'assessment-requested' : 'ask-user', checkedAt: new Date().toISOString() }
  };
};
