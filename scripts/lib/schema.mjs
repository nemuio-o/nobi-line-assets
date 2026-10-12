// Minimal JSON Schema interpreter (zero dependencies).
//
// Only the keywords listed in SUPPORTED_KEYWORDS are implemented. The supported
// set is documented in docs/schema-support.md. If schema/ uses any other
// keyword, collectUnsupportedKeywords() reports it so validation fails loudly
// instead of silently ignoring a constraint.
export const SUPPORTED_KEYWORDS = new Set([
  "$schema",
  "$id",
  "title",
  "description",
  "type",
  "required",
  "properties",
  "additionalProperties",
  "const",
  "enum",
  "items",
  "uniqueItems",
  "minItems",
  "minLength",
  "pattern",
  "allOf",
  "$ref",
  "$defs",
]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function typeName(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function typeMatches(type, value) {
  const types = Array.isArray(type) ? type : [type];
  return types.some((t) => {
    switch (t) {
      case "object":
        return isPlainObject(value);
      case "array":
        return Array.isArray(value);
      case "string":
        return typeof value === "string";
      case "integer":
        return Number.isInteger(value);
      case "number":
        return typeof value === "number" && Number.isFinite(value);
      case "boolean":
        return typeof value === "boolean";
      case "null":
        return value === null;
      default:
        return true;
    }
  });
}

function resolveRef(ref, root) {
  if (!ref.startsWith("#/")) throw new Error(`unsupported $ref: ${ref}`);
  let node = root;
  for (const part of ref.slice(2).split("/")) {
    node = node[decodeURIComponent(part.replace(/~1/g, "/").replace(/~0/g, "~"))];
  }
  return node;
}

function walk(schema, data, root, pointer, errors) {
  if (schema.$ref) {
    walk(resolveRef(schema.$ref, root), data, root, pointer, errors);
    return;
  }
  if (schema.const !== undefined) {
    if (JSON.stringify(data) !== JSON.stringify(schema.const)) {
      errors.push(`${pointer}: must equal ${JSON.stringify(schema.const)}`);
    }
    return;
  }
  if (schema.enum !== undefined) {
    const allowed = schema.enum.map((v) => JSON.stringify(v));
    if (!allowed.includes(JSON.stringify(data))) {
      errors.push(`${pointer}: must be one of ${allowed.join(", ")}`);
    }
  }
  if (schema.type !== undefined && !typeMatches(schema.type, data)) {
    errors.push(`${pointer}: expected type ${schema.type}, got ${typeName(data)}`);
    return;
  }
  if (isPlainObject(data)) {
    for (const key of schema.required ?? []) {
      if (!(key in data)) errors.push(`${pointer}: missing required property "${key}"`);
    }
    const props = schema.properties ?? {};
    for (const [key, sub] of Object.entries(props)) {
      if (key in data) walk(sub, data[key], root, `${pointer}/${key}`, errors);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(data)) {
        if (!(key in props)) errors.push(`${pointer}: unknown property "${key}"`);
      }
    }
  }
  if (Array.isArray(data)) {
    if (schema.items) {
      data.forEach((item, i) => walk(schema.items, item, root, `${pointer}/${i}`, errors));
    }
    if (schema.uniqueItems) {
      const seen = new Set();
      data.forEach((item, i) => {
        const key = JSON.stringify(item);
        if (seen.has(key)) errors.push(`${pointer}/${i}: duplicate item`);
        seen.add(key);
      });
    }
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      errors.push(`${pointer}: needs at least ${schema.minItems} item(s)`);
    }
  }
  if (typeof data === "string") {
    if (schema.minLength !== undefined && [...data].length < schema.minLength) {
      errors.push(`${pointer}: string shorter than minLength ${schema.minLength}`);
    }
    if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(data)) {
      errors.push(`${pointer}: does not match pattern ${schema.pattern}`);
    }
  }
  if (schema.allOf) {
    for (const sub of schema.allOf) walk(sub, data, root, pointer, errors);
  }
}

export function validateAgainst(schema, data) {
  const errors = [];
  walk(schema, data, schema, "", errors);
  return errors;
}

export function collectUnsupportedKeywords(schema, pointer = "", out = []) {
  if (schema === null || typeof schema !== "object") return out;
  for (const key of Object.keys(schema)) {
    if (!SUPPORTED_KEYWORDS.has(key)) out.push(`${pointer}: unsupported keyword "${key}"`);
  }
  if (schema.additionalProperties !== undefined && typeof schema.additionalProperties !== "boolean") {
    out.push(`${pointer}: "additionalProperties" only supports a boolean (false)`);
  }
  if (schema.type !== undefined) {
    const known = new Set(["object", "array", "string", "integer", "number", "boolean", "null"]);
    for (const t of Array.isArray(schema.type) ? schema.type : [schema.type]) {
      if (!known.has(t)) out.push(`${pointer}: unknown type "${t}"`);
    }
  }
  for (const [key, sub] of Object.entries(schema.properties ?? {})) {
    collectUnsupportedKeywords(sub, `${pointer}/properties/${key}`, out);
  }
  if (schema.items) collectUnsupportedKeywords(schema.items, `${pointer}/items`, out);
  for (const [key, sub] of Object.entries(schema.$defs ?? {})) {
    collectUnsupportedKeywords(sub, `${pointer}/$defs/${key}`, out);
  }
  for (const [i, sub] of (schema.allOf ?? []).entries()) {
    collectUnsupportedKeywords(sub, `${pointer}/allOf/${i}`, out);
  }
  return out;
}
