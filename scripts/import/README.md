# Collecting real LINE sticker data

This guide adapts the LINE STORE collection procedure to this repository's schema and review pipeline. It covers sticker packages; do not apply the sticker-page ID parser to emoji products unless their source page and ID format have been verified separately.

## Repository format and policy

Store exactly one package per file:

```text
data/stickers/<STKPKGID>.json
data/emojis/<productId>.json
```

For stickers, `package_id` is the LINE package ID (`STKPKGID`) and each `items[].id` is the actual sticker ID (`STKID`). Both are decimal **strings**, never numbers. Keep `items` sorted by ascending numeric ID. Do not use an array index or a made-up per-package sequence as the real item ID.

The repository publishes contributor-authored descriptions, not LINE artwork, official package/item names, or official package descriptions. Use official page text only as private context during visual interpretation; do not copy it into a record. Downloaded images are temporary analysis inputs and must not be committed.

Generated records start as drafts. A vision/LLM-generated description must not be marked reviewed until a person has checked it against the source image. Draft records remain in `data/` for review but are omitted from the normal release build.

## 1. Discover package IDs

Use LINE STORE's Japanese pages and search API, for example:

```text
https://store.line.me/stickershop/showcase/top/ja
https://store.line.me/stickershop/showcase/new/ja
https://store.line.me/api/search/sticker?query=<URL-encoded-term>&offset=0&limit=20
```

Advance `offset` for additional search results and deduplicate package IDs. The search API returns product IDs in JSON; the showcase pages expose links matching `stickershop/product/<STKPKGID>`. Do not use `/stickershop/showcase/ranking/ja` (404), the regular search page for ID extraction, or the nonexistent `/api/products/<id>` endpoint.

Treat these sources as discovery aids, not a complete catalog. In the 2026-11-26 Japanese-store crawl, showcase pagination ended at top page 99 and new page 60 (page 61 returned 404); keyword searches often reached an API limit at `offset=5020` (HTTP 400), and some queries timed out. Record each source's page range and stopping reason; never infer exhaustive coverage from a successful search.

## 2. Read one Japanese package page

For each selected package, fetch:

```text
https://store.line.me/stickershop/product/<STKPKGID>/ja
```

Extract the unique IDs from `stickershop/v1/sticker/<STKID>/` in the HTML. The same sticker ID occurs repeatedly; deduplicate it, preserve it as a string, and verify that the resulting item count matches the page. Read each item's `data-preview` metadata to map its resource type (`static` → `STATIC`, `animation` → `ANIMATION`, `sound` → `SOUND`, `message` → `MESSAGE`); do not guess a type from the image alone. `/ja` is required for Japanese source context.

The product's `og:title`, `og:description`, author link, and `og:image` can help identify and interpret the source package, but the repository schema has no package-level title/author/image fields. Do not add those official values to the data file.

## 3. Fetch temporary analysis images

For each `STKID`, use the static iOS image endpoint:

```text
https://stickershop.line-scdn.net/stickershop/v1/sticker/<STKID>/ios/sticker.png
```

Use these images only for analysis, store them outside the repository, and remove them after the import if no longer needed. For animated stickers, the static PNG is sufficient for a still-image description; do not fetch the much larger animation unless a specific task requires it. `preview` and `@2x` variants are not valid endpoints.

## 4. Create contributor-authored metadata

Use the image plus private package context to write a short, original `name.ja` and a natural `description.ja` describing visible expression/action or conversational use. These must not be the official item name or a copy/list of keywords. Add only supported `emotion` and `intent` values from `schema/package.schema.json`; use concise Japanese `tags` for visual/search concepts.

`provenance` is required on every item. Preserve available source keywords only in `keywords_raw`, never as the description. If the LINE page supplies no item keywords, use an empty array and record the inspected source as `keyword_source: "line"`; use `description_source: "vision"` for a description generated from image interpretation. Set `captured_at` to the collection date. Do not invent official keywords.

Use this review state for generated imports:

```json
"review": { "status": "draft" }
```

Do not add `reviewed_by` or `reviewed_at` to a draft. After human verification, a reviewer may change the item to `reviewed` and add both fields. `contributors` may identify the contributor who prepared the record.

## 5. Validate and build

Before committing:

```bash
node scripts/format.mjs
node scripts/validate.mjs
node --test "test/**/*.test.mjs"
node scripts/build.mjs
```

`format.mjs` writes canonical JSON ordering/formatting. `validate.mjs` checks the schema, package path/ID agreement, unique ascending string item IDs, sticker-only `resource_type`, review-state consistency, and that descriptions are not keyword dumps. CI runs validation on pull requests.

The default build emits only `review.status: "reviewed"` items. To inspect drafts in a local preview, use `node scripts/build.mjs --include-draft`; generated files under `dist/` are build artifacts and must not be committed. After review, run formatting, validation, tests, and build again.

## Per-package checklist

- One Japanese product page fetched per `STKPKGID`; all unique `STKID`s captured and sorted as strings.
- Resource types mapped from page metadata.
- Temporary iOS PNGs visually checked; no images or official names/descriptions committed.
- One JSON file at `data/stickers/<STKPKGID>.json` with original descriptions and honest provenance.
- Generated records marked `draft` until a human verifies them.
- Formatting, validation, tests, and a local build pass.

## 6. Submit for review

Submit generated package drafts through a Pull Request, following [`CONTRIBUTING.md`](../../CONTRIBUTING.md) and its CC0 declaration. Keep vision/LLM-generated items in `draft` until a person checks them against the source images; only that reviewer may mark an item `reviewed` and add reviewer metadata. Do not modify a package already reviewed when preparing a new import. The normal release build excludes drafts, so a successful local draft build is a review aid, not a published release.
