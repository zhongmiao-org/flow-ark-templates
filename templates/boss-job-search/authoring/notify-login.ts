export default async ({input, template, signal}: any) => {
  signal.throwIfAborted();
  if (!input || input.site !== 'boss' || input.status !== 'login-required' || input.accountVerified !== false || input.eligibleForActions !== false)
    throw new Error('登录待办与本次只读观察不一致');
  await template.attention({key: 'preflight:login-required', title: 'BOSS 需要本人登录，完成后重新运行只读预检', detail: input});
  return template.result(input);
};
