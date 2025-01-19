export function toArray<T>(value: T | T[]): T[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

export function readText(obj: any, fallback = ''): string {
  if (!obj) return fallback;
  // ONIX может хранить текст в _text или _cdata
  if (typeof obj._cdata === 'string') return obj._cdata.trim();
  if (typeof obj._text === 'string') return obj._text.trim();
  return fallback;
}
