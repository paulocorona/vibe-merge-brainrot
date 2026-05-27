/**
 * Writes 1x1 transparent PNG placeholders into MergeBrainrots/public/assets
 * for every art file the source code references. Files that already exist
 * are left alone, so dropping in real art at any path will survive future
 * runs of this script.
 *
 * Run via the deploy workflow before `npm run build`. You can also run it
 * locally:
 *
 *     node scripts/generate-placeholders.mjs
 */

import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");
const publicAssets = resolve(projectRoot, "public", "assets");

// Smallest possible valid PNG: 1x1 fully-transparent pixel, decoded from
// a known-good base64 blob. We re-encode at runtime so we don't have to
// commit any binary files to source control.
const TRANSPARENT_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII=";
const PNG_BYTES = Buffer.from(TRANSPARENT_PNG_BASE64, "base64");

const TARGETS = [
  "ui/btn-index.png",
  "ui/btn-spawn.png",
  "ui/btn-wipe.png",
  "ui/tile-base.png",
  "ui/background.png",
  "pieces/machine-1.png",
  "pieces/machine-2.png",
  "pieces/machine-3.png",
  "pieces/machine-4.png",
  "pieces/machine-5.png",
];

async function fileExists(path) {
  try {
    await stat(path);
    return true;
  } catch (err) {
    if (err && err.code === "ENOENT") return false;
    throw err;
  }
}

async function ensurePlaceholder(relPath) {
  const fullPath = resolve(publicAssets, relPath);
  if (await fileExists(fullPath)) {
    console.log(`[placeholders] keep   ${relPath} (already present)`);
    return;
  }
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, PNG_BYTES);
  console.log(`[placeholders] write  ${relPath}`);
}

async function main() {
  await mkdir(publicAssets, { recursive: true });
  for (const target of TARGETS) {
    await ensurePlaceholder(target);
  }
  console.log(`[placeholders] done — ${TARGETS.length} target(s) processed.`);
}

main().catch((err) => {
  console.error("[placeholders] failed:", err);
  process.exit(1);
});
