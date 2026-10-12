# Bulk import (future)

This directory is a placeholder for the **automated bulk ingestion** seam. Nothing here
is implemented yet; `scripts/draft-from-keywords.mjs` is the current, manual skeleton.

## Intended design

Bulk sources (LINE keyword dumps, vision runs over screenshots, etc.) must not write to
`data/` directly. They produce draft packages that a human reviews before merge.

Policy (see [`docs/data-model.md`](../../docs/data-model.md) and
[`docs/versioning.md`](../../docs/versioning.md)):

1. **Bots open new packages only.** Never rewrite a package that a human has already
   marked `reviewed`.
2. **Batched PRs.** GitHub truncates PR diffs around ~300 files, so imports are split into
   reviews of N packages each (start with N=50).
3. **Bulk goes through an `ingest` branch**, then is merged into `main` after review.
4. **Draft is explicit.** Imported items are written with `review.status: "draft"` and
   `provenance.description_source` set to `llm` or `vision`. A human flips each verified
   item to `reviewed`.
5. **Deterministic output.** Generated files must pass `node scripts/format.mjs` and
   `node scripts/validate.mjs`.

Release artifacts include `reviewed` items only by default; draft items are excluded and
counted in `manifest.json` as `drafts_excluded` (see `scripts/build.mjs`).
