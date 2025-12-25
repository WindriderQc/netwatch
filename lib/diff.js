export function diffSnapshots(prev, next, opts = {}) {
    const events = [];
    const p = prev?.devices ?? {};
    const n = next?.devices ?? {};

    const pKeys = new Set(Object.keys(p));
    const nKeys = new Set(Object.keys(n));

    for (const k of nKeys) {
        if (!pKeys.has(k)) {
            events.push({ type: "join", ts: next.ts, device: n[k] });
            continue;
        }
        // changes
        const a = p[k], b = n[k];
        const changed =
            a.ip !== b.ip ||
            a.hostname !== b.hostname ||
            a.vendor !== b.vendor ||
            a.target !== b.target;

        if (changed) {
            events.push({ type: "change", ts: next.ts, before: a, after: b });
        }
    }

    for (const k of pKeys) {
        if (!nKeys.has(k)) {
            // device disappeared from scan results
            events.push({ type: "leave", ts: next.ts, device: p[k] });
        }
    }

    if (opts.onlyChanges) return events.filter(e => e.type === "change");
    return events;
}
