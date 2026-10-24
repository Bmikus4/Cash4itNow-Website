/**
 * Every photograph in public/img has its smaller copies, and the manifest says so. Runs in the build.
 *
 * A file added without running scripts/img-variants.py would still load, at full size, through
 * srcSetOf() returning nothing: the exact regression the copies exist to prevent, and invisible on
 * a fast connection. A copy the manifest names but the disk lacks is worse, a broken image on the
 * screens that pick it. Both fail here.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMG = path.join(ROOT, "public", "img");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "content", "imgVariants.json"), "utf8"));

const problems = [];
const photos = fs.readdirSync(IMG).filter((n) => fs.statSync(path.join(IMG, n)).isFile() && /\.(webp|jpe?g|png)$/i.test(n));
for (const name of photos) {
  const entry = manifest[name];
  if (!entry) { problems.push(`${name} has no entry; run python scripts/img-variants.py`); continue; }
  for (const w of entry.widths) {
    const copy = path.join(IMG, String(w), name.replace(/\.[^.]+$/, ".webp"));
    if (!fs.existsSync(copy)) problems.push(`${name}: the manifest lists ${w}w and public/img/${w}/ has no copy`);
  }
}
for (const name of Object.keys(manifest)) if (!photos.includes(name)) problems.push(`the manifest lists ${name}, which public/img does not have`);

if (problems.length) {
  process.stderr.write(`IMAGE VARIANTS CHECK FAILED:\n  ${problems.join("\n  ")}\n`);
  process.exitCode = 1;
} else {
  console.log(`IMAGE VARIANTS: ${photos.length} photographs, every copy present`);
}
