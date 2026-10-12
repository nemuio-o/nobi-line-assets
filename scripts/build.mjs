#!/usr/bin/env node
// Builds distribution artifacts from data/ (NOT examples/). These are not
// committed; release.yml attaches them to GitHub Releases.
//
//   node scripts/build.mjs [--out <dir>] [--include-draft]
//
// By default only items with review.status "reviewed" are emitted; pass
// --include-draft to include drafts too. Excluded drafts are counted in the manifest.
//
// Output:
//   <dir>/line-assets.jsonl   one asset per line, deterministic (sorted, keys sorted)
//   <dir>/manifest.json       counts and provenance of the build
//   <dir>/SHA256SUMS          checksum of line-assets.jsonl
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalStringify, canonicalize } from "./lib/json.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TYPE_DIRS = ["stickers", "emojis"];

const argv = process.argv.slice(2);
let outArg = "dist";
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--out") {
    outArg = argv[i + 1];
    if (!outArg) {
      console.error("--out requires a directory");
      process.exit(1);
    }
  }
}
const outDir = path.resolve(ROOT, outArg);
const includeDraft = argv.includes("--include-draft");

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

function numCompare(a, b) {
  const an = /^\d+$/.test(a) ? BigInt(a) : null;
  const bn = /^\d+$/.test(b) ? BigInt(b) : null;
  if (an !== null && bn !== null) return an < bn ? -1 : an > bn ? 1 : 0;
  return a < b ? -1 : a > b ? 1 : 0;
}

const records = [];
const packageStatus = { active: 0, retired: 0 };
let packages = 0;
let draftsExcluded = 0;

for (const typeDir of TYPE_DIRS) {
  for (const rel of listJsonFiles(path.join(ROOT, "data", typeDir))) {
    const pkg = JSON.parse(readFileSync(path.join(ROOT, "data", typeDir, rel), "utf8"));
    packages++;
    packageStatus[pkg.status] = (packageStatus[pkg.status] ?? 0) + 1;
    for (const item of pkg.items) {
      if (!includeDraft && item.review?.status !== "reviewed") {
        draftsExcluded++;
        continue;
      }
      const record = {
        asset_type: pkg.type,
        package_id: pkg.package_id,
        package_status: pkg.status,
        asset_id: item.id,
      };
      for (const key of [
        "resource_type",
        "name",
        "emotion",
        "intent",
        "tags",
        "description",
        "provenance",
        "review",
        "contributors",
        "updated_at",
      ]) {
        if (item[key] !== undefined) record[key] = item[key];
      }
      records.push(record);
    }
  }
}

records.sort(
  (a, b) =>
    (a.asset_type < b.asset_type ? -1 : a.asset_type > b.asset_type ? 1 : 0) ||
    numCompare(a.package_id, b.package_id) ||
    numCompare(a.asset_id, b.asset_id)
);

const jsonl = records.map((r) => JSON.stringify(canonicalize(r))).join("\n") + (records.length ? "\n" : "");

const byType = {};
const byReview = {};
for (const r of records) {
  byType[r.asset_type] = (byType[r.asset_type] ?? 0) + 1;
  byReview[r.review?.status ?? "unknown"] = (byReview[r.review?.status ?? "unknown"] ?? 0) + 1;
}

const manifest = {
  schema_version: 1,
  source_commit: process.env.GITHUB_SHA ?? null,
  include_draft: includeDraft,
  packages,
  items: records.length,
  drafts_excluded: draftsExcluded,
  by_type: byType,
  by_review_status: byReview,
  by_package_status: packageStatus,
};

mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "line-assets.jsonl"), jsonl, "utf8");
writeFileSync(path.join(outDir, "manifest.json"), canonicalStringify(manifest), "utf8");

const sha = createHash("sha256").update(jsonl, "utf8").digest("hex");
writeFileSync(path.join(outDir, "SHA256SUMS"), `${sha}  line-assets.jsonl\n`, "utf8");

console.log(
  `Built ${records.length} record(s) from ${packages} package(s)` +
    (draftsExcluded ? ` (${draftsExcluded} draft item(s) excluded)` : "") +
    ` into ${path.relative(ROOT, outDir) || "."}`
);
