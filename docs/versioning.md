# Versioning

Two independent axes: the **schema** contract and the **data** releases.

## Schema (`schema_version`)

Every package record carries `schema_version` (currently `1`). Change rules:

- **Additive optional field, or new members of an existing `emotion`/`intent`/`resource_type`
  enum** → keep the same `schema_version`.
- **Adding a required field, removing a field, or changing a field's meaning** → bump
  `schema_version` (major).
- Update `schema/package.schema.json`, `schema/CHANGELOG.md`, and any affected `docs/` in the
  **same PR**. If existing records must change, include a migration note.

This repository is pre-release (v0). The rewrite from one-file-per-asset to one-file-per-
package is the **initial** published contract, so it keeps `schema_version: 1` rather than
counting as a break.

## Data releases

- Tag format: `data-YYYY.MM.DD`, with `.2`, `.3`, … for a second release the same day.
- A tag triggers `.github/workflows/release.yml`, which builds and attaches
  `line-assets.jsonl`, `manifest.json`, and `SHA256SUMS` (see
  [`data-dictionary.md`](data-dictionary.md)).
- Distribution URL: `releases/latest/download/...`. `git clone` of `main` is a **work
  queue**, not a distribution channel — use Releases, or run `node scripts/build.mjs`.
- `line-assets.jsonl` is deterministic (given the same data, the same bytes). SQLite and
  other binary formats are not byte-reproducible and are deferred until a consumer needs them.

### Cadence

Roughly monthly, plus on demand when notable data lands and CI is green.

## Duplicates and claims

The filesystem makes one package per file; two PRs touching the same package conflict.
First merged PR wins; coordinate on an issue if you intend to work on a large batch.

## Backup

Git history plus published Releases are the durable copies. No separate backup is kept.
