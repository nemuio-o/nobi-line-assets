# Contributing

誰でもフォークして 1 パッケージずつ追加できます。依存ゼロ・`npm install` 不要です（Node.js 24+）。
行動規範は [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) を守ってください。

## 最短手順

1. `data/` に 1 パッケージ分のファイルを追加する（下記「命名規則」）
2. `node scripts/format.mjs` で canonical 形式に整える
3. `node scripts/validate.mjs` が通ることを確認する
4. Pull Request を送る（テンプレートのチェック項目と CC0 提供の表明を埋める）

1 パッケージ = 1 ファイルなので、別のパッケージ同士ではコンフリクトしません。

## 命名規則

- sticker: `data/stickers/<packageId>.json`
- emoji: `data/emojis/<packageId>.json`
- `packageId` は数字の文字列。ファイル名はレコード内の `package_id` と一致させる（`validate.mjs` が検査）
- `items[]` は `id` の昇順に並べる（差分を安定させるため）

## フィールド

正は [`schema/package.schema.json`](schema/package.schema.json)。概要は
[`docs/data-model.md`](docs/data-model.md)。

- パッケージ: `schema_version` / `type` / `package_id` / `license` / `status` / `items[]`
- item: `id` / `resource_type`（sticker のみ）/ `name` / `emotion` / `intent` / `tags` /
  `description` / `provenance` / `review` / `contributors` / `updated_at`

`emotion` は必須で統制語彙（[`docs/emotion-vocabulary.md`](docs/emotion-vocabulary.md)）。
`intent` は任意で統制語彙。`tags` は任意の自由語（同 docs の指針）。

## 説明文の書き方（重要）

- LINE 公式の keywords をそのまま並べない。`provenance.keywords_raw` に **由来としてのみ** 残す
- 表情・動作・使われる状況を、第三者が読んで分かる自然な日本語で書く（`en` は任意）
- 自動生成した説明文（LLM・vision）は **そのままコミットしない**。人が確認・修正してから採用し、
  `provenance.description_source` を実際の出所（`human` / `llm` / `vision`）にする

| keywords_raw | NG（羅列） | OK（自然な説明） |
| --- | --- | --- |
| `["hi", "howdy"]` | hi howdy | 手を振って明るくあいさつしている |
| `["thanks", "arigato"]` | thanks arigato | 両手を合わせてうれしそうにお礼を言っている |

## レビュー状態

item ごとに `review.status` を持ちます。

- 人が確認した item: `{ "status": "reviewed", "reviewed_by": "@handle", "reviewed_at": "YYYY-MM-DD" }`
- 未確認の item（bot ドラフト等）: `{ "status": "draft" }`（`reviewed_by`/`reviewed_at` は付けない）

`main` はワークキューです。配布（Releases）には既定で `reviewed` のみが含まれます。

## 出典の書き方

- `provenance.keyword_source`: `line`（LINE 公式 keywords）/ `human` / `vision`
- `provenance.keywords_raw`: 取得した生のキーワード
- `provenance.captured_at`: 取得日（`YYYY-MM-DD`）
- `provenance.description_source`: 説明文の出所

## ライセンスへの同意（必須）

データは CC0-1.0 です。PR テンプレートの「提出内容を CC0-1.0 で提供できる権利がある」表明にチェックして
ください。DCO（`Signed-off-by`）は不要です。

## 禁止事項

- 画像・LINE の公式名称・公式説明文そのものを同梱しない
- 個人情報（チャットログ、スクリーンショット、私的な会話）を含めない
- 配布物（`dist/`）をコミットしない（生成物）

## ローカルでの検証

```bash
node scripts/format.mjs                  # 正規化
node scripts/validate.mjs                # 検証（違反があれば exit 1）
node scripts/build.mjs --out dist        # 配布物を生成（任意）
node --test "test/**/*.test.mjs"         # 検証器のテスト
```

キーワードから説明文ドラフトを作る補助（後続機能の骨組み。ネットワーク/LLM は呼ばない）:

```bash
node scripts/draft-from-keywords.mjs --in examples/keywords.example.json --confirm
```

出力は未レビューの `drafts/`（コミット対象外）に出ます。人が `name` / `emotion` / `intent` /
`tags` / `description` を埋めてから `data/` へ移してください。

## 大量追加（bot / 一括取込）

自動取込は `data/` に直接書かず、`review.status: "draft"` で PR を出します。運用方針は
[`scripts/import/README.md`](scripts/import/README.md) を参照（新規パッケージのみ・バッチ分割）。
