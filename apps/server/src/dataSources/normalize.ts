import type { RawData } from "./types";

function flattenRecord(item: unknown): Record<string, unknown> {
  if (item === null || item === undefined) return { value: null };
  if (typeof item !== "object") return { value: item };

  const record = item as Record<string, unknown>;
  const flat: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
        flat[`${key}_${nestedKey}`] = nestedValue;
      }
    } else if (Array.isArray(value)) {
      flat[key] = JSON.stringify(value);
    } else {
      flat[key] = value;
    }
  }

  return flat;
}

function extractArray(payload: unknown, dataPath?: string): unknown[] | null {
  if (Array.isArray(payload)) return payload;

  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;

  if (dataPath && obj[dataPath] !== undefined) {
    const value = obj[dataPath];
    return Array.isArray(value) ? value : null;
  }

  const arrayKeys = ["data", "breakdown", "carts", "products", "items", "results", "records"];
  for (const key of arrayKeys) {
    if (Array.isArray(obj[key])) return obj[key] as unknown[];
  }

  return null;
}

export function normalizeJsonToRawData(source: string, payload: unknown, dataPath?: string): RawData {
  const array = extractArray(payload, dataPath);

  const rows = array
    ? array.map(flattenRecord)
    : payload && typeof payload === "object"
      ? [flattenRecord(payload)]
      : [{ value: payload }];

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return {
    query: source,
    columns,
    rows,
    row_count: rows.length,
    source: "webhook",
    fetched_at: new Date().toISOString(),
  };
}
