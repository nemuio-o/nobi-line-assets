#!/usr/bin/env node
// Rewrites data/ and examples/ records into canonical form:
// UTF-8 without BOM, LF newlines, keys sorted recursively, 2-space indent,
// single trailing newline. Zero dependencies.
//
//   node scripts/format.mjs           # normalize files in place
//   node scripts/format.mjs --check   # exit 1 if any file is not normalized
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalStringify } from "./lib/json.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOTS = ["data", "examples"];
const TYPE_DIRS = ["stickers", "emojis"];

function listJsonFiles(dir, base = dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listJsonFiles(full, base));
    else if (entry.isFile() && entry.name.endsWith(".json")) out.push(path.relative(base, full));
  }
  return out.sort();
}

const check = process.argv.includes("--check");
let changed = 0;
let broken = 0;

for (const root of ROOTS) {
  for (const typeDir of TYPE_DIRS) {
    for (const rel of listJsonFiles(path.join(ROOT, root, typeDir))) {
      const full = path.join(ROOT, root, typeDir, rel);
      const display = `${root}/${typeDir}/${rel}`.replace(/\\/g, "/");
      const raw = readFileSync(full, "utf8");
      let record;
      try {
        record = JSON.parse(raw);
      } catch (err) {
        console.error(`invalid JSON, left unchanged: ${display} (${err.message})`);
        broken++;
        continue;
      }
      const canonical = canonicalStringify(record);
      if (raw === canonical) continue;
      if (check) {
        console.error(`not canonical: ${display}`);
        changed++;
      } else {
        writeFileSync(full, canonical, "utf8");
        console.log(`formatted ${display}`);
        changed++;
      }
    }
  }
}

if (check) {
  if (changed > 0) {
    console.error(`\n${changed} file(s) are not canonical. Run \`node scripts/format.mjs\`.`);
  }
  if (broken > 0) {
    console.error(`\n${broken} file(s) are not valid JSON.`);
  }
  if (changed > 0 || broken > 0) process.exit(1);
  console.log("All files are canonical.");
} else {
  console.log(`\nFormatted ${changed} file(s).`);
  if (broken > 0) process.exit(1);
}
