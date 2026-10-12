# nobi-line-assets

LINE のスタンプ / 絵文字を、機械可読な **説明メタデータ** として公開するオープンデータプロジェクトです。
画像や公式名称は含めません。誰でもフォークして 1 パッケージずつ追加できる形（fork-friendly）を目指しています。

## これは何か / 何ではないか

公開するもの:

- 我々が作成した説明メタデータ（`description`、`emotion`、`intent`、`tags`、`name`）
- 識別情報（`package_id`、item の `id`、`resource_type`）
- keywords の **由来情報**（`provenance.keywords_raw`）

公開しないもの:

- スタンプ・絵文字の画像
- LINE の公式名称・公式説明文そのもの
- 個人情報（チャットログ、スクリーンショット等）

## ライセンス

- コード（`scripts/`, `.github/` など）: **MIT** — [`LICENSE-CODE`](LICENSE-CODE)
- データ（`data/`, `examples/`）: **CC0-1.0** — [`LICENSE-DATA`](LICENSE-DATA)

データはパブリックドメインとして提供します。クレジットは不要ですが `contributors` に協力者を記録します。

## 配布物（Releases）

集約物はリポジトリにコミットしません。タグ（`data-YYYY.MM.DD`）で CI が生成し Releases に添付します。

- `line-assets.jsonl` … 1行1アセット（決定的）
- `manifest.json` … 件数・出所
- `SHA256SUMS` … チェックサム

安定 URL: `https://github.com/nemuio-o/nobi-line-assets/releases/latest/download/line-assets.jsonl`

`main` はワークキューです。配布には Releases を使ってください（または `node scripts/build.mjs`）。
形式の詳細は [`docs/data-dictionary.md`](docs/data-dictionary.md)。

## データ形式

1 パッケージ = 1 ファイル:

```
data/stickers/<packageId>.json
data/emojis/<packageId>.json
```

例（`examples/stickers/9000001.json` の抜粋）:

```json
{
  "schema_version": 1,
  "type": "sticker",
  "package_id": "9000001",
  "license": "CC0-1.0",
  "status": "active",
  "items": [
    {
      "id": "1",
      "resource_type": "STATIC",
      "name": { "ja": "あいさつ", "en": "Greeting" },
      "emotion": ["joy"],
      "intent": ["greeting"],
      "tags": ["あいさつ", "手を振る"],
      "description": { "ja": "手を振って明るくあいさつしている" },
      "provenance": {
        "keyword_source": "line",
        "keywords_raw": ["hi", "howdy"],
        "captured_at": "2026-10-12",
        "description_source": "human"
      },
      "review": { "status": "reviewed", "reviewed_by": "@nemuio-o", "reviewed_at": "2026-10-12" }
    }
  ]
}
```

- スキーマ（正）: [`schema/package.schema.json`](schema/package.schema.json)
- データモデルの説明: [`docs/data-model.md`](docs/data-model.md)
- 統制語彙（emotion / intent）: [`docs/emotion-vocabulary.md`](docs/emotion-vocabulary.md)

## 説明文の方針（重要）

- LINE 公式の keywords を **そのまま説明として使わない**。
- keywords は `provenance.keywords_raw` に **由来情報としてのみ** 保存する。
- `description` は表情・動作・使われる状況を表す**自然な説明文**（日本語を主、英語も任意）。
- keywords → 説明文の変換は LLM または人手で行い、**自動生成した文はそのままコミットせず、人が確認**してから採用する。

例: keywords `["hi", "howdy"]` → `description.ja`「手を振って明るくあいさつしている」

`validate.mjs` は「description が keywords の羅列になっていないか」も検査します。

## 使い方（依存ゼロ・Node.js 24+）

```bash
node scripts/validate.mjs        # data/ と examples/ を全件検証
node scripts/validate.mjs <file> # 指定ファイルのみ検証（増分用）
node scripts/format.mjs          # canonical 形式に正規化（--check で検査のみ）
node scripts/build.mjs           # dist/ に配布物を生成（コミットしない）
node --test "test/**/*.test.mjs" # 検証器のテスト
```

`npm install` は不要です。

## コントリビュート

最短手順は [`CONTRIBUTING.md`](CONTRIBUTING.md) を参照。行動規範は
[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) です。

1. `data/` に 1 パッケージ分のファイルを追加
2. `node scripts/format.mjs`
3. `node scripts/validate.mjs`
4. Pull Request（CC0 提供の表明をチェック）

## ロードマップ

- [x] データモデル・検証・整形・配布の枠組み
- [ ] keywords の一括取込（`scripts/import/`、bot が PR）
- [ ] vision（画像からの説明文ドラフト）連携
- [ ] 検索 API / サイト（配布物を配信元にする）

## サンプルについて

`examples/` の `package_id` は実在の LINE アセットを指さない**合成 ID**です。`examples/` は CI で
検証しますが、データセットにもリリース成果物にも含まれません。

## 権利・削除の要請

画像・公式名称は掲載していません。掲載内容に問題がある場合はリポジトリの Issue でご連絡ください。
権利者からの要請に応じて該当項目を修正・削除します。
