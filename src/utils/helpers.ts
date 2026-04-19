import type { Response } from "express";

function countMatches(text: string, tokens: string[]): number {
  return tokens.reduce((count, token) => (text.includes(token) ? count + 1 : count), 0);
}

export function calculateStringScore(
  text: string,
  tokens: string[],
  additionalFlags?: { location?: boolean; industry?: boolean }
): number {
  const matches = countMatches(text, tokens);
  const maxPossible = tokens.length + Object.values(additionalFlags ?? {}).filter(Boolean).length;
  return Math.max(0, Math.min(1, Number((matches / Math.max(maxPossible, 1)).toFixed(2))));
}

export function groupBy<T, K extends PropertyKey>(
  items: T[],
  keySelector: (item: T) => K
): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const key = keySelector(item);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}

export function toRecord<K extends PropertyKey, V>(
  entries: Array<[K, V]>
): Record<K, V> {
  const record = {} as Record<K, V>;
  for (const [key, value] of entries) {
    record[key] = value;
  }
  return record;
}
