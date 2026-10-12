// Package-level rules that JSON Schema alone cannot express:
// - path layout matches `type` and `package_id`
// - item `id`s are unique and sorted ascending
// - type-specific fields (sticker has resource_type, emoji does not)
// - review status is internally consistent
// - description is not a keyword dump (see docs/data-model.md)
import { validateAgainst } from "./schema.mjs";

function norm(text) {
  return text.toLowerCase().replace(/[\s\p{P}\p{S}]/gu, "");
}

function keywordDumpLang(item) {
  const raw = Array.isArray(item?.provenance?.keywords_raw) ? item.provenance.keywords_raw : [];
  const tokens = raw.map(norm).filter(Boolean);
  if (tokens.length === 0) return null;
  const joined = tokens.join("");
  for (const lang of ["ja", "en"]) {
    const value = item?.description?.[lang];
    if (typeof value !== "string" || value.trim() === "") continue;
    const nd = norm(value);
    if (nd && (nd === joined || tokens.includes(nd))) return lang;
  }
  return null;
}

// ctx: { typeDir: "stickers"|"emojis", packageId: string, display: string }
export function checkPackage(schema, record, ctx) {
  const errors = validateAgainst(schema, record);

  const wantType = ctx.typeDir === "stickers" ? "sticker" : ctx.typeDir === "emojis" ? "emoji" : null;
  if (!wantType) {
    errors.push(`unknown data directory "${ctx.typeDir}" (expected stickers/ or emojis/)`);
  } else {
    if (record.type !== wantType) {
      errors.push(`type is "${record.type}" but file is under ${ctx.typeDir}/`);
    }
    if (String(record.package_id) !== ctx.packageId) {
      errors.push(`package_id "${record.package_id}" != filename "${ctx.packageId}"`);
    }
  }

  const items = Array.isArray(record.items) ? record.items : [];
  const seen = new Set();
  let prev = null;
  items.forEach((item, i) => {
    if (!item || typeof item !== "object") return;
    const p = `/items/${i}`;
    const id = item.id;
    if (typeof id === "string") {
      if (seen.has(id)) errors.push(`${p}: duplicate item id "${id}"`);
      seen.add(id);
      if (/^[0-9]+$/.test(id)) {
        const n = BigInt(id);
        if (prev !== null && n < prev) errors.push(`${p}: items must be sorted by ascending id`);
        prev = n;
      }
    }
    if (wantType === "sticker" && item.resource_type === undefined) {
      errors.push(`${p}: sticker items require resource_type`);
    }
    if (wantType === "emoji" && item.resource_type !== undefined) {
      errors.push(`${p}: emoji items must not have resource_type`);
    }
    const review = item.review;
    if (review && typeof review === "object") {
      if (review.status === "reviewed") {
        if (!review.reviewed_by) errors.push(`${p}/review: status "reviewed" requires reviewed_by`);
        if (!review.reviewed_at) errors.push(`${p}/review: status "reviewed" requires reviewed_at`);
      } else if (review.status === "draft") {
        if (review.reviewed_by || review.reviewed_at) {
          errors.push(`${p}/review: status "draft" must not set reviewed_by/reviewed_at`);
        }
      }
    }
    const dumpLang = keywordDumpLang(item);
    if (dumpLang) {
      errors.push(`${p}/description/${dumpLang}: looks like a keyword dump, not a description`);
    }
  });

  return errors;
}
