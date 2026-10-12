import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateAgainst } from "../scripts/lib/schema.mjs";
import { checkPackage } from "../scripts/lib/records.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(readFileSync(path.join(ROOT, "schema", "package.schema.json"), "utf8"));
const read = (...p) => JSON.parse(readFileSync(path.join(ROOT, ...p), "utf8"));
const list = (dir) => readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith(".json"));

test("good fixtures pass schema validation", () => {
  const files = list("test/fixtures/good");
  assert.ok(files.length > 0, "expected good fixtures");
  for (const f of files) {
    const errors = validateAgainst(schema, read("test/fixtures/good", f));
    assert.deepEqual(errors, [], `${f}: ${errors.join("; ")}`);
  }
});

test("bad fixtures fail schema validation", () => {
  const files = list("test/fixtures/bad");
  assert.ok(files.length > 0, "expected bad fixtures");
  for (const f of files) {
    const errors = validateAgainst(schema, read("test/fixtures/bad", f));
    assert.ok(errors.length > 0, `${f} unexpectedly passed schema validation`);
  }
});

test("package-level consistency rules", () => {
  const item = () => ({
    id: "1",
    resource_type: "STATIC",
    name: { ja: "あ" },
    emotion: ["joy"],
    description: { ja: "手を振る" },
    provenance: { keyword_source: "human", keywords_raw: ["a"], captured_at: "2026-10-12", description_source: "human" },
    review: { status: "draft" },
  });
  const base = () => ({
    schema_version: 1,
    type: "sticker",
    package_id: "9000001",
    license: "CC0-1.0",
    status: "active",
    items: [item()],
  });
  const check = (rec, typeDir = "stickers", packageId = "9000001") =>
    checkPackage(schema, rec, { typeDir, packageId });

  assert.deepEqual(check(base()), []);
  assert.ok(check(base(), "emojis").some((e) => /under emojis/.test(e)), "type/dir mismatch");
  assert.ok(check(base(), "stickers", "12345").some((e) => /filename/.test(e)), "package_id/filename mismatch");

  const noResource = base();
  delete noResource.items[0].resource_type;
  assert.ok(check(noResource).some((e) => /resource_type/.test(e)), "sticker missing resource_type");

  const emojiWithResource = base();
  emojiWithResource.type = "emoji";
  assert.ok(check(emojiWithResource, "emojis").some((e) => /must not have resource_type/.test(e)));

  const dup = base();
  dup.items = [item(), item()];
  assert.ok(check(dup).some((e) => /duplicate item id/.test(e)), "duplicate id");

  const unsorted = base();
  const second = item();
  second.id = "2";
  unsorted.items = [second, item()];
  assert.ok(check(unsorted).some((e) => /ascending/.test(e)), "unsorted id");

  const reviewedIncomplete = base();
  reviewedIncomplete.items[0].review = { status: "reviewed" };
  assert.ok(check(reviewedIncomplete).some((e) => /requires reviewed_by/.test(e)), "review missing fields");

  const draftWithReviewer = base();
  draftWithReviewer.items[0].review = { status: "draft", reviewed_by: "@x" };
  assert.ok(check(draftWithReviewer).some((e) => /must not set/.test(e)), "draft with reviewer");

  const dump = base();
  dump.items[0].description = { ja: "a" };
  assert.ok(check(dump).some((e) => /keyword dump/.test(e)), "keyword dump");
});

test("JSON-Schema-Test-Suite subset", () => {
  const suite = read("test/json-schema-test-suite", "keywords.json");
  for (const group of suite) {
    for (const t of group.tests) {
      const errors = validateAgainst(group.schema, t.data);
      assert.equal(
        errors.length === 0,
        t.valid,
        `${group.description} / ${t.description}: ${errors.join("; ")}`
      );
    }
  }
});
