# Controlled vocabulary

`emotion` and `intent` are closed lists enforced by `schema/package.schema.json`. Adding a
value is a PR that edits the schema **and** this file together (see
[`versioning.md`](versioning.md)). Consumers must tolerate unknown values they receive.

## `emotion` (required, at least one)

The list is based on **Paul Ekman's six basic emotions** and a few practical additions for
sticker use. We intentionally do not mix in Plutchik's wheel, whose terms overlap
(e.g. `fear`/`anxiety`, `joy`/`happiness`) and would cause near-duplicates.

| Value | Meaning (ja) |
| --- | --- |
| `joy` | 喜び・うれしさ（Ekman: happiness） |
| `sadness` | 悲しみ |
| `anger` | 怒り |
| `fear` | 恐れ・不安 |
| `surprise` | 驚き |
| `disgust` | 嫌悪・うんざり |
| `love` | 愛情・好意 |
| `gratitude` | 感謝 |
| `confusion` | 困惑・戸惑い |
| `calm` | 平静・落ち着き |
| `excitement` | 興奮・わくわく |
| `tired` | 疲れ・眠気 |

## `intent` (optional)

The communicative function of the sticker — what it *does*, rather than how it feels.

`greeting`, `farewell`, `thanks`, `apology`, `request`, `agree`, `refuse`, `celebrate`,
`encourage`, `comfort`, `question`, `answer`, `ok`, `no`

## `tags` (optional, free text)

`tags` is free text for search. Guidelines:

- Japanese primary; lower-case Latin when used.
- Short, common words. No duplicates (the schema enforces uniqueness).
- Prefer descriptive words, not a copy of `provenance.keywords_raw`.
