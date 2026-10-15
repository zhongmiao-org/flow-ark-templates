import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import JSZip from 'jszip';
import { transform } from 'esbuild';
import { canonical, LIMITS, sha256, validatePackage } from '../contracts/package-format';

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
    scriptSources?: { source: string; file: string; loader: 'ts' | 'js' }[];
    nodeSchemas?: { source: string; entry: string; node: string }[];
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
    for (const mapping of entry.scriptSources ?? []) {
      const compiled = await transform(await readFile(mapping.source, 'utf8'), {
        loader: mapping.loader,
        format: 'esm',
        target: 'node24',
      });
      if (!files.get(mapping.file)?.equals(Buffer.from(compiled.code)))
        throw Error('可审阅脚本编译结果与客户端原始导出不一致：' + mapping.source);
    }
    for (const mapping of entry.nodeSchemas ?? []) {
      const definition = pkg.manifest.entries.find((value) => value.id === mapping.entry);
      if (!definition) throw Error('Schema来源的入口不存在：' + mapping.entry);
      const flow = JSON.parse(files.get(definition.flow)!.toString('utf8'));
      const find = (nodes: any[]): any => {
        for (const node of nodes) {
          if (node.id === mapping.node) return node;
          for (const key of ['then', 'else', 'body']) {
            const found = Array.isArray(node[key]) && find(node[key]);
            if (found) return found;
          }
        }
      };
      const node = find(flow.steps);
      if (
        node?.type !== 'ai' ||
        canonical(node.schema) !== canonical(JSON.parse(await readFile(mapping.source, 'utf8')))
      )
        throw Error('可审阅Schema与客户端原始导出不一致：' + mapping.source);
    }
    console.log(`${entry.archive} ${entry.status} ${pkg.manifest.contentDigest}`);
  }
}
