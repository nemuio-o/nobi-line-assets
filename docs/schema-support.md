# Supported JSON Schema keywords

`scripts/lib/schema.mjs` is a zero-dependency interpreter, not a full JSON Schema engine.
`schema/package.schema.json` may use **only** the keywords below. If it uses any other
keyword, `scripts/validate.mjs` stops with a `unsupported keyword` error instead of silently
ignoring the constraint.

| Keyword | Supported |
| --- | --- |
| `type` | `object`, `array`, `string`, `integer`, `number`, `boolean`, `null`, or an array of these |
| `required` | yes |
| `properties` | yes |
| `additionalProperties` | `false` only |
| `const` | yes |
| `enum` | yes |
| `items` | single schema |
| `uniqueItems` | yes (compared via `JSON.stringify`, so order-sensitive — fine for scalar arrays) |
| `minItems` | yes |
| `minLength` | yes (counts code points) |
| `pattern` | yes (JavaScript `RegExp`, unanchored — anchor explicitly) |
| `allOf` | yes |
| `$ref` / `$defs` | `$ref` only as `#/$defs/...` within the same document |
| `$schema`, `$id`, `title`, `description` | accepted metadata, ignored |

Not supported (will fail loudly): `if`/`then`/`else`, `not`, `anyOf`, `oneOf`,
`patternProperties`, `propertyNames`, `dependentRequired`/`dependentSchemas`, `format`,
`minimum`/`maximum`, `minProperties`/`maxProperties`, `contains`, `unevaluatedProperties`.

Additional notes:

- `additionalProperties` must be a boolean; a schema object is rejected by the
  unsupported-keyword guard.
- `type` values must be one of the seven known names; a typo (e.g. `"sting"`) is rejected.
- `$ref` is resolved and returned early, so sibling keywords next to a `$ref` are not
  applied — do not put constraints beside a `$ref`.

## Why a subset

Contributors must be able to run `node scripts/validate.mjs` with no `npm install`. A small,
fully-tested interpreter keeps that promise. The subset is anchored to the official
[JSON-Schema-Test-Suite](https://github.com/json-schema-org/JSON-Schema-Test-Suite) via
`test/json-schema-test-suite/keywords.json`.

## Extending the validator

1. Implement the keyword in `scripts/lib/schema.mjs` and add it to `SUPPORTED_KEYWORDS`.
2. Add cases to `test/json-schema-test-suite/keywords.json` (adapt from the reference suite).
3. Update the table above and run `node --test test/`.
