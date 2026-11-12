import { readFile, lstat, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';

type PlatformSkill = {id: string; version: string; status: 'draft'; path: string; sha256: string};
/** Repository authoring assets only. Does not register, load into AI, or execute a skill. */
export async function buildPlatformSkills() {
  const catalogBytes = await readFile('skills/catalog.json');
  const catalog: unknown = JSON.parse(catalogBytes.toString('utf8'));
  if (!Array.isArray(catalog) || catalog.length > 20) throw Error('平台Skill登记须为至多20项数组');
  const seen = new Set<string>();
  const checked: {entry: PlatformSkill; bytes: Buffer}[] = [];
  for (const raw of catalog) {
    if (!raw || typeof raw !== 'object' || Object.keys(raw).sort().join(',') !== 'id,path,sha256,status,version') throw Error('平台Skill登记字段无效');
    const e = raw as PlatformSkill;
    if (!/^[a-z][a-z0-9-]{0,63}$/.test(e.id) || seen.has(e.id) ||
        !/^\d+\.\d+\.\d+-draft$/.test(e.version) || e.status !== 'draft' ||
        e.path !== `skills/${e.id}/SKILL.md` || !/^[a-f0-9]{64}$/.test(e.sha256)) throw Error('平台Skill身份/路径/版本无效');
    seen.add(e.id);
    for (const path of ['skills', `skills/${e.id}`, e.path]) if ((await lstat(path)).isSymbolicLink()) throw Error('平台Skill不允许符号链接');
    const stat = await lstat(e.path);
    if (!stat.isFile() || stat.size > 48 * 1024) throw Error('平台Skill须为至多48KiB普通文件');
    const bytes = await readFile(e.path), text = bytes.toString('utf8');
    const front = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text)?.[1];
    if (!front || /^name:\s*([^\r\n]+)$/m.exec(front)?.[1] !== e.id ||
        /^  version:\s*([^\r\n]+)$/m.exec(front)?.[1] !== e.version ||
        !/^description:\s*\S.+$/m.test(front)) throw Error('平台Skill元数据与登记不一致');
    if (createHash('sha256').update(bytes).digest('hex') !== e.sha256) throw Error('平台Skill原文摘要与登记不一致');
    if (/\/Users\/|[A-Z]:\\Users\\|https?:\/\/[^\s/]*feishu\.cn\/(?:base|wiki|sheets)\/|\bsk-[A-Za-z0-9]{24,}/i.test(text)) throw Error('平台Skill含本机路径、业务对象链接或疑似密钥');
    checked.push({entry:e,bytes});
  }
  for (const {entry,bytes} of checked) {
    const target=join('dist',entry.path);
    await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes);
    if (!(await readFile(target)).equals(bytes)) throw Error('平台Skill构建读回不一致');
  }
  await mkdir('dist/skills',{recursive:true});await writeFile('dist/skills/catalog.json',catalogBytes);
  console.log(`platform skills: ${checked.length} verified (assets copied; client snapshot adoption not checked)`);
}
