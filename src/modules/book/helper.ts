export function toArray<T>(value: T | T[]): T[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

/**
 * readText(obj, fallback): возвращает то, что лежит в obj["#text"],
 * если оно есть (или fallback, если нет).
 */
export function readText(obj: any, fallback = ''): string {
  if (!obj) return fallback;
  if (typeof obj['#text'] === 'string') {
    return obj['#text'].trim();
  }
  return fallback;
}
