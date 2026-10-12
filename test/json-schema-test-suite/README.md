# JSON-Schema-Test-Suite subset

`keywords.json` holds a small set of cases adapted from the official
[JSON-Schema-Test-Suite](https://github.com/json-schema-org/JSON-Schema-Test-Suite)
(MIT License, JSON Schema authors). They cover only the keywords this repository's
zero-dependency validator implements (see `docs/schema-support.md`) and anchor the
hand-rolled interpreter against the reference suite so the tests are not purely
self-referential.

Cases are adapted to this repository's compact `{ description, schema, tests }` shape;
the semantics are unchanged. When the validator gains a keyword, add the corresponding
suite cases here.
