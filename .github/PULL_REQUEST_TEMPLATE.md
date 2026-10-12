<!-- 追加・変更したパッケージのパスを列挙してください（例: data/stickers/1234567.json） -->

## 追加・変更したパッケージ

-

## チェックリスト

- [ ] `node scripts/format.mjs` を実行した
- [ ] `node scripts/validate.mjs` が通る
- [ ] `description` は keywords の羅列ではなく、表情・動作・使われる状況を表す自然な説明文にした
- [ ] `provenance.keywords_raw` に由来（生キーワード）と `keyword_source` を残した
- [ ] 自動生成した説明文は人が確認し、`provenance.description_source` を実際の出所にした
- [ ] 人が確認した item は `review.status: "reviewed"`（`reviewed_by` / `reviewed_at` 付き）にした
- [ ] 画像・LINE の公式名称・公式説明文を同梱していない
- [ ] 個人情報（チャットログ・スクリーンショット等）を含めていない

## ライセンスへの同意（必須）

- [ ] 提出内容を **CC0-1.0** で提供できる権利があることを表明します
