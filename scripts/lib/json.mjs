// Canonical JSON serialization shared by scripts.
// Determinism contract: UTF-8 without BOM, LF newlines, keys sorted
// recursively, 2-space indent, single trailing newline.
export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = canonicalize(value[key]);
    return out;
  }
  return value;
}

export function canonicalStringify(value) {
  return JSON.stringify(canonicalize(value), null, 2) + "\n";
}
