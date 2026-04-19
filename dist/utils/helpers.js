function countMatches(text, tokens) {
    return tokens.reduce((count, token) => (text.includes(token) ? count + 1 : count), 0);
}
export function calculateStringScore(text, tokens, additionalFlags) {
    const matches = countMatches(text, tokens);
    const maxPossible = tokens.length + Object.values(additionalFlags ?? {}).filter(Boolean).length;
    return Math.max(0, Math.min(1, Number((matches / Math.max(maxPossible, 1)).toFixed(2))));
}
export function groupBy(items, keySelector) {
    const groups = new Map();
    for (const item of items) {
        const key = keySelector(item);
        const group = groups.get(key) ?? [];
        group.push(item);
        groups.set(key, group);
    }
    return groups;
}
export function toRecord(entries) {
    const record = {};
    for (const [key, value] of entries) {
        record[key] = value;
    }
    return record;
}
