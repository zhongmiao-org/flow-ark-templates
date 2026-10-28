import { readFile, readdir } from "node:fs/promises";
import { dirname, basename, join } from "node:path";
import JSZip from "jszip";
import { build } from "esbuild";
import { isBuiltin } from "node:module";
import {
  LIMITS,
  sha256,
  validatePackage,
  type PackageData,
} from "../contracts/package-format";

export type CatalogEntry = {
  id: string;
  version: string;
  kind: "source" | "client-export";
  status: "candidate" | "example";
  archive: string;
  source?: string;
};
export async function readCatalog(): Promise<CatalogEntry[]> {
  const entries: CatalogEntry[] = JSON.parse(
    await readFile("catalog.json", "utf8"),
  );
  if (!Array.isArray(entries) || !entries.length)
    throw Error("模板目录登记为空");
  const ids = new Set<string>();
  for (const entry of entries) {
    if (
      !/^[a-z][a-z0-9-]*$/.test(entry.id) ||
      ids.has(entry.id) ||
      !/^\d+\.\d+\.\d+$/.test(entry.version) ||
      !["source", "client-export"].includes(entry.kind) ||
      !["candidate", "example"].includes(entry.status) ||
      entry.archive !==
        `templates/${entry.id}/${entry.id}-${entry.version}.flowark-template.zip` ||
      (entry.kind === "source" && entry.source !== `development/${entry.id}`)
    )
      throw Error("模板目录登记无效或重复");
    ids.add(entry.id);
  }
  const folders = await readdir("templates", { withFileTypes: true });
  if (
    folders.length !== ids.size ||
    folders.some(
      (f) => !f.isDirectory() || f.isSymbolicLink() || !ids.has(f.name),
    )
  )
    throw Error("使用者模板目录与登记不一致");
  return entries;
}
export async function readClientExport(entry: CatalogEntry) {
  const records = JSON.parse(await readFile("client-checkpoints.json", "utf8"));
  const matches = records.filter((r: any) => r.archive === entry.archive);
  if (matches.length !== 1)
    throw Error("客户端原始导出缺少唯一摘要登记：" + entry.id);
  const record = matches[0],
    bytes = await readFile(entry.archive);
  if (bytes.length > LIMITS.archive || sha256(bytes) !== record.sha256)
    throw Error("客户端原始 ZIP 摘要或大小不符：" + entry.archive);
  const zip = await JSZip.loadAsync(bytes, { checkCRC32: true });
  const files = new Map<string, Buffer>();
  for (const [name, file] of Object.entries(zip.files)) {
    if (file.dir) throw Error("ZIP 只允许普通文件：" + name);
    const content = await file.async("nodebuffer");
    if (content.length > LIMITS.file) throw Error("ZIP 文件超限：" + name);
    files.set(name, content);
  }
  const pkg = validatePackage(files);
  if (
    pkg.manifest.contentDigest !== record.contentDigest ||
    record.status !== entry.status
  )
    throw Error("客户端原始包摘要或状态不符：" + entry.id);
  return { ...pkg, bytes };
}
export async function verifyDelivery(
  entry: CatalogEntry,
  pkg: PackageData & { bytes: Buffer },
) {
  const folder = dirname(entry.archive),
    items = await readdir(folder, { withFileTypes: true });
  if (
    items.length !== 2 ||
    items.some(
      (i) =>
        !i.isFile() ||
        i.isSymbolicLink() ||
        !["README.md", basename(entry.archive)].includes(i.name),
    )
  )
    throw Error("模板交付目录只允许 README 和单个当前 ZIP：" + folder);
  if (!(await readFile(entry.archive)).equals(pkg.bytes))
    throw Error("源码构建与交付 ZIP 不一致，请显式重新打包：" + entry.id);
  const readme = pkg.files.get("README.md");
  if (
    !readme ||
    !readme.toString("utf8").trim() ||
    !(await readFile(join(folder, "README.md"))).equals(readme)
  )
    throw Error("README 必须非空且与 ZIP 内逐字节一致：" + entry.id);
  for (const path of pkg.manifest.scripts) {
    const result = await build({
      stdin: {
        contents: pkg.files.get(path)!.toString("utf8"),
        sourcefile: path,
        loader: "js",
      },
      bundle: true,
      write: false,
      platform: "node",
      format: "esm",
      target: "node24",
      logLevel: "silent",
      logOverride: {
        "unsupported-dynamic-import": "warning",
        "unsupported-require-call": "warning",
        "require-resolve-not-external": "warning",
      },
      plugins: [
        {
          name: "self-contained-template",
          setup(builder) {
            builder.onResolve({ filter: /.*/ }, (args) => {
              if (isBuiltin(args.path))
                return { path: args.path, external: true };
              throw Error(
                "模板脚本须先静态打包，不能依赖旁边文件或本机 npm：" +
                  path +
                  " / " +
                  args.path,
              );
            });
          },
        },
      ],
    });
    if (result.warnings.length) throw Error("模板脚本依赖无法固定：" + path);
  }
}
