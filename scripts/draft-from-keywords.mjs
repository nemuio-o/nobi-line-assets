#!/usr/bin/env node
// SKELETON — not wired to any model yet.
//
// Turns raw keywords into *draft package* files under drafts/ for human review.
// It deliberately does NOT call an LLM or vision model and never writes to data/.
// It only structures the reviewer's work: fill in name/emotion/intent/tags/
// description by hand, then move the file into data/ and run validate + format.
//
// Usage (explicit flag required):
//   node scripts/draft-from-keywords.mjs --in examples/keywords.example.json --confirm
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalStringify } from "./lib/json.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REVIEW_MARK = "TODO(未レビュー): keywords を自然な説明文に書き換える";

function usage() {
  console.log(
    [
      "Usage: node scripts/draft-from-keywords.mjs --in <keywords.json> --confirm",
      "",
      "  --in <file>  input file: { \"packages\": [ ... ] }",
      "  --confirm    required; without it nothing is written (safety)",
      "",
      "Input package fields:",
      "  type            \"sticker\" | \"emoji\"",
      "  package_id      numeric string",
      "  items[]         { id, resource_type? (sticker), keyword_source,",
      "                    keywords_raw[], captured_at, description_source }",
      "",
      "Output: drafts/<type>-<package_id>.json (unreviewed; edit before moving to data/).",
    ].join("\n")
  );
}

function toDraftItem(item) {
  return {
    id: item.id,
    ...(item.resource_type ? { resource_type: item.resource_type } : {}),
    name: { ja: "" },
    emotion: [],
    tags: [],
    description: { ja: REVIEW_MARK },
    provenance: {
      keyword_source: item.keyword_source,
      keywords_raw: item.keywords_raw ?? [],
      captured_at: item.captured_at,
      description_source: item.description_source ?? "llm",
    },
    review: { status: "draft" },
  };
}

function main() {
  const args = process.argv.slice(2);
  const inIndex = args.indexOf("--in");
  const inputPath = inIndex >= 0 ? args[inIndex + 1] : null;

  if (!args.includes("--confirm") || !inputPath) {
    usage();
    process.exit(1);
  }

  const parsed = JSON.parse(readFileSync(path.resolve(process.cwd(), inputPath), "utf8"));
  const packages = parsed.packages;
  if (!Array.isArray(packages) || packages.length === 0) {
    console.error("input has no packages");
    process.exit(1);
  }

  const outDir = path.join(ROOT, "drafts");
  mkdirSync(outDir, { recursive: true });

  for (const pkg of packages) {
    const draft = {
      schema_version: 1,
      type: pkg.type,
      package_id: pkg.package_id,
      license: "CC0-1.0",
      status: "active",
      items: (pkg.items ?? []).map(toDraftItem),
    };
    const outPath = path.join(outDir, `${pkg.type}-${pkg.package_id}.json`);
    writeFileSync(outPath, canonicalStringify(draft), "utf8");
    console.log(`draft -> ${path.relative(ROOT, outPath).replace(/\\/g, "/")}`);
  }

  console.log(
    "\nDrafts are UNREVIEWED. Fill in name/emotion/intent/tags/description by hand (or with a" +
      " model), have a human confirm, then move the file into data/ and run validate + format."
  );
}

main();
