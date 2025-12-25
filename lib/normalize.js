function keyFor(o) {
    if (o.mac && o.mac !== "") return o.mac.toLowerCase();
    return `ip:${o.ip}`;
}

// Update IP history array with new IP observation (immutable)
export function updateIpHistory(ipHistory = [], currentIp, ts) {
    if (!currentIp) return ipHistory;
    
    // Find if this IP already exists in history
    const existing = ipHistory.find(h => h.ip === currentIp);
    if (existing) {
        // Return a new array with the matching entry's lastSeen updated immutably
        return ipHistory.map(h =>
            h.ip === currentIp ? { ...h, lastSeen: ts } : h
        );
    }
    
    // Add new IP to history
    return [...ipHistory, { ip: currentIp, firstSeen: ts, lastSeen: ts }];
}

// inventory is a map of key -> { alias, type, location, notes, purpose, hardware, ... }
export function mergeObservations(observations, ts, inventory = {}, opts = {}) {
    const devices = {};

    for (const o of observations) {
        if (!o.ip && !o.mac) continue;
        const key = keyFor(o);
        // Important: we don't assume we have the previous state here inside the merge loop for *new* observations from this batch.
        // However, if we are passing in *existing* state as part of 'observations', we'd see it.
        // But typically this function is used to merge a batch of *new* observations.
        // The "prev" logic in the original snippet was slightly ambitious assuming it had access to global state.
        // We will build a map of THIS batch first.

        const prev = devices[key] ?? {};
        const inv = inventory[key] ?? {};

        devices[key] = {
            key,
            ip: o.ip ?? prev.ip ?? "",
            mac: (o.mac ?? prev.mac ?? "").toLowerCase(),
            hostname: o.hostname ?? prev.hostname ?? "",
            vendor: o.vendor ?? prev.vendor ?? "",
            target: o.target ?? prev.target ?? "",
            
            // Enhanced inventory fields
            alias: inv.alias || "",
            type: inv.type || "",
            location: inv.location || "",
            notes: inv.notes || "",
            purpose: inv.purpose || "", // NEW: "Proxmox server", "Node.js server", etc.
            
            // Hardware metadata: spread inventory first, then explicit properties override
            hardware: {
                ...(inv.hardware || {}),
                os: o.os || inv.hardware?.os || "",
                cpu: inv.hardware?.cpu || "",
                ram: inv.hardware?.ram || "",
                gpu: inv.hardware?.gpu || "",
                ethernetSpeed: inv.hardware?.ethernetSpeed || "",
                manufacturer: inv.hardware?.manufacturer || "",
                model: inv.hardware?.model || "",
                serialNumber: inv.hardware?.serialNumber || ""
            },

            // IP history tracking
            ipHistory: updateIpHistory(prev.ipHistory, o.ip, ts),

            firstSeen: prev.firstSeen ?? ts,
            lastSeen: opts.preserveLastSeen ? (prev.lastSeen ?? ts) : ts,
            sources: Array.from(new Set([...(prev.sources ?? []), o.source].filter(Boolean)))
        };
    }

    return { ts, devices };
}
