import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { sha256 } from "../contracts/package-format";
import { readCatalog, readClientExport } from "./catalog";
/** Current original UI exports only; historical checkpoints remain in Git history. */
export async function validateClientCheckpoints() {
  const upstream = JSON.parse(
    await readFile("vendor/nuwa-skill/source.json", "utf8"),
  );
  for (const [name, value] of Object.entries(upstream.files) as [
    string,
    { sha256: string },
  ][])
    if (
      sha256(await readFile(join("vendor/nuwa-skill", name))) !== value.sha256
    )
      throw Error("固定 nuwa 来源摘要不符：" + name);
  const entries = (await readCatalog()).filter(
    (e) => e.kind === "client-export",
  );
  const records = JSON.parse(await readFile("client-checkpoints.json", "utf8"));
  if (records.length !== entries.length)
    throw Error("原始包登记含未交付的旧检查点");
  for (const entry of entries) await readClientExport(entry);
}
