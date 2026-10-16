export default async ({ input, signal }: any) => {
  signal.throwIfAborted();
  const files = input?.files;
  if (!Array.isArray(files) || files.length < 1 || files.length > 10)
    throw Error('请明确选择1–10份简历或项目资料');
  for (const name of files)
    if (typeof name !== 'string' || !name.trim() || name.length > 1000 || /^[A-Za-z]:/.test(name) || /[\\\0]/.test(name) || name.split('/').some((s: string) => !s || s === '.' || s === '..'))
      throw Error('资料文件名须为安全的相对路径，不自动修剪或替换');
  if (new Set(files).size !== files.length) throw Error('资料清单存在重复文件，请先移除重复项');
  return { files: [...files] };
};
