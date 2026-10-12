# Data dictionary — release artifacts

`scripts/build.mjs` flattens `data/` (packages) into one record per asset. By default only
items with `review.status: "reviewed"` are emitted; pass `--include-draft` to include drafts
too. These artifacts are attached to GitHub Releases (tag `data-YYYY.MM.DD`), not committed.

| Artifact | Description |
| --- | --- |
| `line-assets.jsonl` | One canonical JSON object per line, sorted by `asset_type`, `package_id`, `asset_id`. Deterministic. |
| `manifest.json` | Counts and build provenance (see below). |
| `SHA256SUMS` | SHA-256 of `line-assets.jsonl`. |

Stable download URL: `https://github.com/nemuio-o/nobi-line-assets/releases/latest/download/<artifact>`.

## Flattened record

| Field | Notes |
| --- | --- |
| `asset_type` | `sticker` or `emoji` (from the package) |
| `package_id` | Package id (from the package) |
| `package_status` | `active` or `retired` |
| `asset_id` | The item `id` |
| `resource_type` | Present for stickers only |
| `name` | `{ ja, en? }` |
| `emotion` | Array from the controlled vocabulary |
| `intent` | Optional array from the controlled vocabulary |
| `tags` | Optional array |
| `description` | `{ ja, en? }` |
| `provenance` | Same shape as in the package |
| `review` | Same shape as in the package (`status` is the per-item review state) |
| `contributors` | Optional array |
| `updated_at` | Optional date |

## manifest.json

```json
{
  "by_package_status": { "active": 0, "retired": 0 },
  "by_review_status": { "reviewed": 0 },
  "by_type": { "emoji": 0, "sticker": 0 },
  "drafts_excluded": 0,
  "include_draft": false,
  "items": 0,
  "packages": 0,
  "schema_version": 1,
  "source_commit": "<git commit or null>"
}
```

`packages` counts the package files under `data/`; `items` counts emitted records;
`drafts_excluded` counts items skipped because they are not `reviewed` (zero when
`--include-draft` is used).

## Consumers and unknown values

Validate strictly inside this repository, but **tolerate unknown values downstream**:
`emotion`, `intent`, and `resource_type` may gain members, and new optional item fields
may appear. Ignore what you do not recognize instead of failing.
