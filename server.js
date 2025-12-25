import express from "express";
import { WebSocketServer } from "ws";
import { loadConfig } from "./lib/store.js";
import { runWorker } from "./lib/runner.js";
import { mergeObservations } from "./lib/normalize.js";
import { diffSnapshots } from "./lib/diff.js";
import { StateStore } from "./lib/store.js";
import fs from "fs";

const app = express();
app.use(express.static("ui"));
app.use(express.json());

const server = app.listen(8787, () => {
    console.log("NetWatch on http://localhost:8787");
});

const wss = new WebSocketServer({ server });

function broadcast(obj) {
    const msg = JSON.stringify(obj);
    for (const c of wss.clients) {
        if (c.readyState === 1) c.send(msg);
    }
}

const store = new StateStore("./data");
const config = loadConfig("./config.json");

let inventory = await store.readInventory();
let lastSnapshot = await store.readSnapshot() ?? { ts: 0, devices: {} };
broadcast({ type: "snapshot", snapshot: lastSnapshot });

app.post("/api/device", async (req, res) => {
    const { key, ...data } = req.body;
    if (!key) return res.status(400).json({ error: "Missing key" });

    // Merge with existing inventory for this key
    inventory[key] = { ...(inventory[key] || {}), ...data };
    await store.writeInventory(inventory);

    // Update currently known device in memory if it exists
    if (lastSnapshot && lastSnapshot.devices[key]) {
        // Re-merge just this device to be safe, or direct update
        lastSnapshot.devices[key] = { ...lastSnapshot.devices[key], ...inventory[key] };
        // Broadcast full snapshot so everyone sees the change
        broadcast({ type: "snapshot", snapshot: lastSnapshot });
    }

    res.json({ ok: true });
});

app.get("/api/events", async (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const events = await store.readRecentEvents(limit);
    res.json({ events });
});

let isScanning = false;
async function scanLoop() {
    if (isScanning) return;
    isScanning = true;

    const ts = Date.now();

    // Notify UI
    broadcast({ type: "status", status: "scanning" });

    // 1) run scanner for each target
    const allObs = [];
    for (const t of config.targets) {
        try {
            // Default to arp-scan if not specified, but support "nmap"
            const scannerType = t.scanner || "arp-scan";
            let script = "scripts/scan-arp.sh";
            if (scannerType === "nmap") {
                script = "scripts/scan-nmap.sh";
            }

            const lines = await runWorker(script, [t.iface, t.cidr]);
            for (const line of lines) {
                try {
                    allObs.push({ ...JSON.parse(line), target: t.name });
                } catch (e) {
                    console.error("Failed to parse line:", line);
                }
            }
        } catch (err) {
            console.error(`Scan failed for target ${t.name} using ${t.scanner || "arp-scan"}:`, err.message);
        }
    }

    // 2) Update logic: Don't just replace snapshot. Merge into history.
    // We want to keep track of ALL devices ever seen, but mark them as online/offline.

    // Create a set of IPs found in THIS scan
    const foundKeys = new Set();
    const newDevices = [];
    const ipChanges = [];

    for (const o of allObs) {
        // Normalize key (mac or ip)
        let key = o.mac ? o.mac.toLowerCase() : `ip:${o.ip}`;
        foundKeys.add(key);

        // Merge into lastSnapshot
        const prev = lastSnapshot.devices[key] || {};
        const isNewDevice = !prev.firstSeen;
        const ipChanged = prev.ip && prev.ip !== o.ip;

        // Update IP history
        const ipHistory = prev.ipHistory || [];
        if (o.ip && !ipHistory.find(h => h.ip === o.ip)) {
            ipHistory.push({ ip: o.ip, firstSeen: ts, lastSeen: ts });
        } else if (o.ip) {
            const entry = ipHistory.find(h => h.ip === o.ip);
            if (entry) entry.lastSeen = ts;
        }

        lastSnapshot.devices[key] = {
            ...prev,
            ...o,
            key,
            mac: (o.mac || prev.mac || "").toLowerCase(),
            hostname: o.hostname || prev.hostname || "",
            vendor: o.vendor || prev.vendor || "",
            os: o.os || prev.os || "",
            lastSeen: ts,
            firstSeen: prev.firstSeen || ts,
            status: "online",
            ipHistory,
            // Preserve hardware info
            hardware: prev.hardware || {},
            // Explicitly re-apply persistent inventory
            purpose: inventory[key]?.purpose || prev.purpose || "",
            alias: inventory[key]?.alias || prev.alias || "",
            type: inventory[key]?.type || prev.type || "",
            location: inventory[key]?.location || prev.location || "",
            notes: inventory[key]?.notes || prev.notes || "",
            ...(inventory[key]?.hardware && { hardware: { ...prev.hardware, ...inventory[key].hardware } })
        };

        // Track new devices and IP changes for events
        if (isNewDevice) {
            newDevices.push({ key, device: lastSnapshot.devices[key] });
        }
        if (ipChanged) {
            ipChanges.push({ key, oldIp: prev.ip, newIp: o.ip, device: lastSnapshot.devices[key] });
        }
    }

    // 3) Mark missing devices as offline
    for (const key of Object.keys(lastSnapshot.devices)) {
        if (!foundKeys.has(key)) {
            lastSnapshot.devices[key].status = "offline";
        }
    }

    // 4) Generate events for new devices and IP changes
    const events = [];
    for (const { key, device } of newDevices) {
        events.push({ type: "new_device", ts, key, device: { ip: device.ip, mac: device.mac, hostname: device.hostname } });
    }
    for (const { key, oldIp, newIp, device } of ipChanges) {
        events.push({ type: "ip_change", ts, key, oldIp, newIp, device: { mac: device.mac, hostname: device.hostname } });
    }
    if (events.length > 0) {
        await store.appendEvents(events);
        broadcast({ type: "events", events });
    }

    // 5) Immediate Enrichment for NEW devices
    if (newDevices.length > 0) {
        setTimeout(() => quickEnrich(newDevices.map(nd => nd.device)), 100);
    }

    // 6) Store & Broadcast
    await store.writeSnapshot(lastSnapshot);
    broadcast({ type: "snapshot", snapshot: lastSnapshot });
    broadcast({ type: "status", status: "idle" });

    isScanning = false;

    // Schedule next run
    setTimeout(scanLoop, (config.intervalSeconds ?? 15) * 1000);
}

// Quick enrich for specific devices (run immediately after discovery)
async function quickEnrich(devices) {
    const ips = devices.map(d => d.ip).filter(Boolean);
    if (!ips.length) return;

    // Create a temp file for this batch
    const tmp = `./data/new_targets_${Date.now()}.txt`;
    try {
        fs.writeFileSync(tmp, ips.join("\n"));
        // Ensure we handle non-existent scripts gracefully or assume paths are correct
        const lines = await runWorker("scripts/enrich-nmap.sh", [tmp]);

        let changed = false;
        for (const line of lines) {
            try {
                const info = JSON.parse(line);
                const dKey = info.mac ? info.mac.toLowerCase() : `ip:${info.ip}`;
                if (lastSnapshot.devices[dKey]) {
                    Object.assign(lastSnapshot.devices[dKey], info);
                    changed = true;
                }
            } catch { }
        }

        if (changed) {
            await store.writeSnapshot(lastSnapshot);
            broadcast({ type: "snapshot", snapshot: lastSnapshot });
        }
    } catch (e) {
        console.error("Quick enrich failed:", e);
    } finally {
        if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    }
}

// Regular enrichment loop (now just a fallback/updater)

// Same logic for enrichment: prevent overlaps
let isEnriching = false;
async function nmapEnrichLoop() {
    if (isEnriching) return;
    isEnriching = true;

    try {
        // Enrich current IPs
        const devices = Object.values(lastSnapshot.devices);
        // Only enrich connected devices or recently seen?
        // Let's stick to devices seen in last scan for efficiency, or just all 'up' devices.
        // Actually, 'lastSnapshot' has the latest state.
        const ips = devices.map(d => d.ip).filter(Boolean);

        if (!ips.length) {
            isEnriching = false;
            setTimeout(nmapEnrichLoop, (config.nmapIntervalSeconds ?? 900) * 1000);
            return;
        }

        const tmp = "./data/targets.txt";
        fs.writeFileSync(tmp, ips.join("\n"));

        // Note: ensure scripts/enrich-nmap.sh is executable or handled by runner
        const lines = await runWorker("scripts/enrich-nmap.sh", [tmp]);
        const obs = [];
        for (const line of lines) {
            try { obs.push(JSON.parse(line)); } catch { }
        }

        if (obs.length) {
            // Merge enrichment into snapshot without resetting lastSeen
            // We mix the current snapshot devices (as 'state') with new observations
            const combinedObs = Object.values(lastSnapshot.devices).map(d => ({ ...d, source: "state" })).concat(obs);

            const enriched = mergeObservations(
                combinedObs,
                Date.now(),
                inventory,
                { preserveLastSeen: true }
            );

            const events = diffSnapshots(lastSnapshot, enriched, { onlyChanges: true });
            await store.writeSnapshot(enriched);
            if (events.length) await store.appendEvents(events);

            broadcast({ type: "events", events });
            broadcast({ type: "snapshot", snapshot: enriched });

            lastSnapshot = enriched;
        }
    } catch (err) {
        console.error("Enrichment failed:", err.message);
    }

    isEnriching = false;
    setTimeout(nmapEnrichLoop, (config.nmapIntervalSeconds ?? 900) * 1000);
}

// Start Loops
scanLoop();
nmapEnrichLoop();
