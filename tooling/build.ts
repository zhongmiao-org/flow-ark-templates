import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { build } from "esbuild";
import JSZip from "jszip";
import { readCatalog, readClientExport, verifyDelivery } from "./catalog";
import {
  canonical,
  sha256,
  manifestDigest,
  validatePackage,
  LIMITS,
} from "../contracts/package-format";
async function buildSource(directory: string) {
  const spec = JSON.parse(
    await readFile(join(directory, "template.json"), "utf8"),
  );
  const files = new Map<string, Buffer>();
  const collect = async (root: string, rel = "") => {
    for (const e of await readdir(root, { withFileTypes: true })) {
      const p = rel ? rel + "/" + e.name : e.name;
      if (e.isSymbolicLink()) throw new Error("源码资源不可为符号链接");
      if (e.isDirectory()) await collect(join(root, e.name), p);
      else files.set(p, await readFile(join(root, e.name)));
    }
  };
  await collect(join(directory, "package"));
  const scripts: string[] = [];
  const dependencies = new Map<
    string,
    { name: string; version: string; license: string }
  >();
  for (const [name, entry] of Object.entries(spec.build ?? {})) {
    const result = await build({
      entryPoints: [join(directory, String(entry))],
      bundle: true,
      write: false,
      platform: "node",
      format: "esm",
      target: "node24",
      legalComments: "inline",
      metafile: true,
    });
    for (const output of Object.values(result.metafile!.outputs))
      for (const i of output.imports)
        if (i.external && !i.path.startsWith("node:"))
          throw new Error("依赖必须静态打包 " + i.path);
    for (const input of Object.keys(result.metafile!.inputs))
      if (input.includes("node_modules/")) {
        let dir = dirname(resolve(input));
        let found = false;
        while (dir !== dirname(dir)) {
          try {
            const dep = JSON.parse(
              await readFile(join(dir, "package.json"), "utf8"),
            );
            if (!dep.name || !dep.version || typeof dep.license !== "string")
              throw new Error("依赖缺少精确版本或许可证");
            dependencies.set(dep.name + "@" + dep.version, {
              name: dep.name,
              version: dep.version,
              license: dep.license,
            });
            found = true;
            break;
          } catch (error: any) {
            if (error.code !== "ENOENT") throw error;
          }
          dir = dirname(dir);
        }
        if (!found) throw new Error("无法记录依赖来源");
      }
    const path = "scripts/" + name + ".js";
    files.set(path, Buffer.from(result.outputFiles[0].contents));
    scripts.push(path);
  }
  const { build: _, ...manifest } = spec;
  manifest.scripts = scripts;
  manifest.dependencies = [...dependencies.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  manifest.files = [...files]
    .map(([path, b]) => ({ path, size: b.length, sha256: sha256(b) }))
    .sort((a, b) => a.path.localeCompare(b.path));
  manifest.contentDigest = manifestDigest(manifest);
  files.set("manifest.json", Buffer.from(canonical(manifest)));
  validatePackage(files);
  const zip = new JSZip();
  for (const [path, b] of [...files].sort(([a], [b]) => a.localeCompare(b)))
    zip.file(path, b, {
      date: new Date("2000-01-01T00:00:00Z"),
      createFolders: false,
    });
  const bytes = await zip.generateAsync({
    type: "nodebuffer",
    platform: "UNIX",
    compression: "DEFLATE",
  });
  if (bytes.length > LIMITS.archive) throw new Error("压缩包超过上限");
  return { manifest, files, bytes };
}

export async function buildTemplate(directory: string) {
  const entry = (await readCatalog()).find(
    (e) => resolve("templates", e.id) === resolve(directory),
  );
  if (entry)
    return entry.kind === "client-export"
      ? readClientExport(entry)
      : buildSource(entry.source!);
  return buildSource(directory);
}
export async function buildAll(publish = false) {
  await mkdir("dist", { recursive: true });
  const entries = await readCatalog();
  for (const entry of entries) {
    const p =
      entry.kind === "client-export"
        ? await readClientExport(entry)
        : await buildSource(entry.source!);
    if (p.manifest.id !== entry.id || p.manifest.version !== entry.version)
      throw Error("目录登记与模板身份不一致：" + entry.id);
    if (publish && entry.kind === "source") {
      await mkdir(dirname(entry.archive), { recursive: true });
      await writeFile(entry.archive, p.bytes);
      await writeFile(
        join(dirname(entry.archive), "README.md"),
        p.files.get("README.md")!,
      );
    }
    await verifyDelivery(entry, p);
    const path = join(
      "dist",
      entry.id + "-" + entry.version + ".flowark-template.zip",
    );
    await writeFile(path, p.bytes);
    if (!(await readFile(path)).equals(p.bytes))
      throw Error("构建产物读回不一致：" + path);
    console.log(path + " " + entry.status + " " + p.manifest.contentDigest);
  }
  const allowed = new Set(
    entries.map((e) => e.id + "-" + e.version + ".flowark-template.zip"),
  );
  for (const file of await readdir("dist"))
    if (file.endsWith(".flowark-template.zip") && !allowed.has(file))
      throw Error("dist 含旧模板包，请先移走旧产物：" + file);
}
if (process.argv[1]?.endsWith("/build.ts")) await buildAll();
