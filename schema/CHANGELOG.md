# Schema changelog

`schema_version` is the contract version carried by every package record.
Rules for changing the schema are in [`docs/versioning.md`](../docs/versioning.md).

## schema_version 1 — 2026-10-12

Initial contract (pre-release). The repository was rewritten from a one-file-per-asset
layout to one-file-per-package (`items[]`); this is the initial published contract, not a
break from a previous released version.

- Package: `schema_version`, `type` (`sticker`|`emoji`), `package_id`, `license`
  (`CC0-1.0`), `status` (`active`|`retired`), `items[]`.
- Item: `id`, `resource_type` (sticker only), `name`, `emotion`, `intent`, `tags`,
  `description`, `provenance`, `review`, `contributors`, `updated_at`.
- `emotion` and `intent` are controlled vocabularies (see
  [`docs/emotion-vocabulary.md`](../docs/emotion-vocabulary.md)).
