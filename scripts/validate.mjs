#!/usr/bin/env node
// Validates package records under data/ and examples/.
// Zero dependencies: run with `node scripts/validate.mjs`.
//
// Usage:
//   node scripts/validate.mjs            # every file under data/ and examples/
//   node scripts/validate.mjs <file>...  # only the given files (incremental CI)
//
// Exits 1 if any file fails schema, layout, review, keyword-dump, or canonical checks.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalStringify } from "./lib/json.mjs";
import { collectUnsupportedKeywords } from "./lib/schema.mjs";
import { checkPackage } from "./lib/records.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA_PATH = path.join(ROOT, "schema", "package.schema.json");
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

function discoverAll() {
  const out = [];
  for (const root of ROOTS) {
    for (const typeDir of TYPE_DIRS) {
      for (const rel of listJsonFiles(path.join(ROOT, root, typeDir))) {
        out.push({
          file: `${root}/${typeDir}/${rel}`.replace(/\\/g, "/"),
          typeDir,
          packageId: path.basename(rel, ".json"),
        });
      }
    }
  }
  return out;
}

function toEntry(arg) {
  const rel = path.relative(ROOT, path.resolve(ROOT, arg)).split(path.sep);
  if (rel.length !== 3 || !ROOTS.includes(rel[0]) || !TYPE_DIRS.includes(rel[1])) return null;
  return { file: rel.join("/"), typeDir: rel[1], packageId: path.basename(rel[2], ".json") };
}

function main() {
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
  const unsupported = collectUnsupportedKeywords(schema);
  if (unsupported.length > 0) {
    console.error("schema uses keywords this validator does not implement:");
    for (const u of unsupported) console.error(`  - ${u}`);
    process.exit(1);
  }

  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  let entries;
  const unmatched = [];
  if (args.length) {
    entries = [];
    for (const arg of args) {
      const entry = toEntry(arg);
      if (entry) entries.push(entry);
      else if (path.relative(ROOT, path.resolve(ROOT, arg)).split(path.sep).join("/").startsWith("data/")) {
        unmatched.push(arg);
      }
    }
  } else {
    entries = discoverAll();
  }
  entries.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));

  if (entries.length === 0 && unmatched.length === 0) {
    console.log("No records to validate.");
  }

  let failed = 0;
  for (const file of unmatched) {
    console.error(`FAIL ${file}\n  - not a package path (expected data/<stickers|emojis>/<packageId>.json)`);
    failed++;
  }
  for (const entry of entries) {
    const raw = readFileSync(path.join(ROOT, entry.file), "utf8");
    let record;
    try {
      record = JSON.parse(raw);
    } catch (err) {
      console.error(`FAIL ${entry.file}\n  - invalid JSON: ${err.message}`);
      failed++;
      continue;
    }
    const errors = checkPackage(schema, record, entry);
    if (raw !== canonicalStringify(record)) {
      errors.push("file is not in canonical form (run `node scripts/format.mjs`)");
    }
    if (errors.length > 0) {
      failed++;
      console.error(`FAIL ${entry.file}`);
      for (const e of errors) console.error(`  - ${e.replace(/^: /, "(root): ")}`);
    } else {
      console.log(`ok   ${entry.file}`);
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} of ${entries.length + unmatched.length} file(s) failed validation.`);
    process.exit(1);
  }
  console.log(`\nAll ${entries.length} file(s) valid.`);
}

main();
