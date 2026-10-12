# Data model

## What this repository publishes

Machine-readable **description metadata** for LINE stickers and emoji, authored by
contributors. It does **not** contain sticker/emoji images, official names, or personal
data. See [`../README.md`](../README.md) for the project overview.

## Files

One file per package (the unit LINE publishes):

```
data/stickers/<packageId>.json   # one sticker package
data/emojis/<packageId>.json     # one emoji product
```

- `package_id` is a numeric string. For emoji this corresponds to LINE's `productId`.
- A package file holds a `items[]` array; each item is one sticker/emoji in the package.
- `examples/` holds the same shape with synthetic IDs. Examples are validated in CI but
  are **not** part of the dataset or of release artifacts.
- `data/` is the real dataset (empty until contributions arrive).
- Aggregates are **not committed**; they are built and attached to Releases
  (see [`data-dictionary.md`](data-dictionary.md)).

## Why one file per package (not per sticker)

Aiming to cover LINE means hundreds of thousands to 1M+ records. One file per record
would create up to 1M tiny files, making `git clone` / checkout unusable. Per package,
the count drops to roughly `records ÷ items-per-package` (≈ 8–40×), and a package is the
natural unit to transcribe and review. Items are kept sorted by `id` so diffs stay stable.

Trade-off: `items[]` arrays do not line-merge cleanly, so **bots only add new packages**
and never rewrite a package a human has already reviewed.

## Package fields

| Field | Required | Notes |
| --- | --- | --- |
| `schema_version` | ✓ | Currently `1` (see [`versioning.md`](versioning.md)) |
| `type` | ✓ | `sticker` or `emoji` |
| `package_id` | ✓ | Numeric string; must match the filename |
| `license` | ✓ | Always `CC0-1.0` |
| `status` | ✓ | `active` or `retired` (see lifecycle below) |
| `items` | ✓ | Non-empty array of items |

## Item fields

| Field | Required | Notes |
| --- | --- | --- |
| `id` | ✓ | Sticker/emoji ID within the package (numeric string) |
| `resource_type` | sticker only | `STATIC` / `ANIMATION` / `SOUND` / `MESSAGE` |
| `name` | ✓ | Short label `{ ja, en? }` |
| `emotion` | ✓ | Non-empty array from the controlled vocabulary |
| `intent` | | Array from the controlled vocabulary |
| `tags` | | Free-text search terms (guidelines in [`emotion-vocabulary.md`](emotion-vocabulary.md)) |
| `description` | ✓ | Natural prose `{ ja, en? }` — never a keyword dump |
| `provenance` | ✓ | See below |
| `review` | ✓ | See below |
| `contributors` | | Handles, e.g. `["@handle"]` |
| `updated_at` | | Date of the last correction |

### `provenance`

| Field | Notes |
| --- | --- |
| `keyword_source` | `line` / `human` / `vision` — where the raw keywords came from |
| `keywords_raw` | The raw keywords, kept **only as provenance** |
| `captured_at` | `YYYY-MM-DD` when keywords were captured |
| `description_source` | `human` / `llm` / `vision` — where the description came from |

### `review`

One review state per item (a human may verify only part of a package):

- `status`: `draft` (unreviewed) or `reviewed`.
- `reviewed` requires `reviewed_by` and `reviewed_at`.
- `draft` must not set them.

`main` is a **work queue**, not a distribution source. Release artifacts include
`reviewed` items by default; `draft` counts are reported in `manifest.json`.

## Description policy

LINE official keywords must **not** be reused as the description. `keywords_raw` keeps
the origin only. `description` states, in natural language, the sticker's expression,
action, or situation. `validate.mjs` flags a description that reduces to its keywords.

Example: keywords `["hi", "howdy"]` → `description.ja` 「手を振って明るくあいさつしている」.

## Lifecycle (retired assets)

LINE delists packages; IDs persist. Do not delete a package. Set `status: "retired"` so
the historical record remains, and consumers can filter it out.

## Corrections

Treat published records as stable. Fix only genuine errors (a wrong label, a typo) and
set `updated_at` to the correction date. Do not repurpose an existing item for a
different asset.

## Keywords and rights

We publish neither images nor official names. `keywords_raw` records short search words
as provenance; storing them is how we cite where a description came from, not a claim of
ownership. `keyword_source: "line"` marks LINE-derived keywords explicitly. Rights holders
can request removal via the repository issue tracker (see `README.md`).

## Internationalization

`name` and `description` are `{ ja, en? }` for now (Japanese primary). A future change may
generalize them to a language-code map; that would be a schema change governed by
[`versioning.md`](versioning.md).
