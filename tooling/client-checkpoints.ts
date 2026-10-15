import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import JSZip from 'jszip';
import { LIMITS, sha256, validatePackage } from '../contracts/package-format';

/** Read-only source verification. Checkpoints are client exports, not generated business flows. */
export async function validateClientCheckpoints() {
  const upstream = JSON.parse(await readFile('vendor/nuwa-skill/source.json', 'utf8')) as {
    files: Record<string, { sha256: string }>;
  };
  for (const [name, value] of Object.entries(upstream.files))
    if (sha256(await readFile(join('vendor/nuwa-skill', name))) !== value.sha256)
      throw Error('固定nuwa来源摘要不符：' + name);
  const entries = JSON.parse(await readFile('client-checkpoints.json', 'utf8')) as {
    archive: string;
    directory: string;
    sha256: string;
    contentDigest: string;
    status: string;
  }[];
  for (const entry of entries) {
    const bytes = await readFile(entry.archive);
    if (bytes.length > LIMITS.archive || sha256(bytes) !== entry.sha256)
      throw Error('客户端导出归档摘要或大小不符：' + entry.archive);
    const zip = await JSZip.loadAsync(bytes, { checkCRC32: true });
    const files = new Map<string, Buffer>();
    for (const [name, file] of Object.entries(zip.files)) {
      if (file.dir) continue;
      const body = await file.async('nodebuffer');
      if (body.length > LIMITS.file) throw Error('导出文件超限：' + name);
      files.set(name, body);
    }
    const pkg = validatePackage(files);
    if (pkg.manifest.contentDigest !== entry.contentDigest)
      throw Error('客户端导出包摘要不符：' + entry.archive);
    const source = new Map<string, Buffer>();
    const collect = async (folder: string, prefix = '') => {
      for (const item of await readdir(folder, { withFileTypes: true })) {
        if (item.isSymbolicLink()) throw Error('检查点源文件不可为符号链接');
        const relative = prefix + item.name;
        if (item.isDirectory()) await collect(join(folder, item.name), relative + '/');
        else source.set(relative, await readFile(join(folder, item.name)));
      }
    };
    await collect(entry.directory);
    if (
      source.size !== files.size ||
      [...files].some(([name, body]) => !source.get(name)?.equals(body))
    )
      throw Error('可审阅源文件与客户端原始导出不一致：' + entry.directory);
    console.log(`${entry.archive} ${entry.status} ${pkg.manifest.contentDigest}`);
  }
}
