export default async ({ input, signal, template }: any) => {
  signal.throwIfAborted();
  const result = input?.result;
  if (!result || result.version !== 1 || result.kind !== 'web-job-assessment-advice' || !['match', 'mismatch', 'review'].includes(result.decision) || result.accountVerified !== false || result.eligibleForActions !== false || typeof input.reviewKey !== 'string' || !/^(web-jd-input|jd-advice|jd-ai-failure):[a-f0-9]{64}$/.test(input.reviewKey) || result.source?.kind !== 'reviewed-web-jd-assessment-source' || result.source?.companyVerified !== false) throw Error('缺少本次网页来源与内部评估结果');
  const source = result.source;
  const decision = result.decision === 'match' ? '明确符合建议，仅准备内部草稿' : result.decision === 'mismatch' ? '明确不符合建议，仅保留不感兴趣提案' : '需要本人判断';
  const detail = {
    '处理结果': decision,
    '原因': result.reason || '请核对本次来源与内部建议',
    '需核对项': Array.isArray(result.issues) && result.issues.length ? result.issues.join('；') : '格式及原句核对通过不证明语义正确',
    '来源页面': source.page.origin + source.page.pathname,
    '网页岗位': source.jobTitle ?? '未取得唯一岗位',
    '公司候选（未核验）': source.companyLabel ?? '未取得唯一公司候选',
    '正文摘要': source.descriptionSha256,
    '本人核对': '仅作用本次固定来源；确认后再次采集并核对精确正文',
    '求职条件修订': String(source.configurationRevision),
    '固定Skill': source.profile ? source.profile.key + ' · ' + source.profile.versionId + ' · ' + source.profile.sha256 : '本分支未读取Skill，不伪造版本',
    '模型状态': result.failure ? '本次请求失败：' + result.failure.error.message : source.profile ? '本次内部建议；实际请求与用量见关联Run' : '准备阶段停止，未请求模型',
    '依据原句': result.recommendation?.quotes?.length ? result.recommendation.quotes.join('\n') : '无可采用的明确结论原句',
    '后续操作': result.decision === 'review' ? '请本人核对缺口或故障；不自动重试。再次运行重新采集并确认来源。' : '仅内部建议。实际站点动作另行核对账号/会话/授权与回执。',
    '权限边界': '未核验账号或公司，不投递、不发送消息或简历、不点击不感兴趣。'
  };
  await template.result(result);
  signal.throwIfAborted();
  const attention = await template.attention({ key: input.reviewKey, title: result.decision === 'review' ? '网页JD方向需要本人核对' : '网页JD方向建议已保存，尚未执行招聘动作', detail });
  signal.throwIfAborted();
  return { ...result, attention };
};
