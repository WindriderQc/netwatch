import fs from "fs";
import path from "path";

export function loadConfig(p) {
    return JSON.parse(fs.readFileSync(p, "utf8"));
}

export class StateStore {
    constructor(dir) {
        this.dir = dir;
        fs.mkdirSync(dir, { recursive: true });
        this.snapPath = path.join(dir, "snapshot.json");
        this.evPath = path.join(dir, "events.jsonl");
        this.invPath = path.join(dir, "inventory.json");
    }

    async readSnapshot() {
        if (!fs.existsSync(this.snapPath)) return null;
        return JSON.parse(fs.readFileSync(this.snapPath, "utf8"));
    }

    async writeSnapshot(snapshot) {
        fs.writeFileSync(this.snapPath, JSON.stringify(snapshot, null, 2));
    }

    async readInventory() {
        if (!fs.existsSync(this.invPath)) return {};
        try {
            return JSON.parse(fs.readFileSync(this.invPath, "utf8"));
        } catch { return {}; }
    }

    async writeInventory(inventory) {
        fs.writeFileSync(this.invPath, JSON.stringify(inventory, null, 2));
    }

    async appendEvents(events) {
        const lines = events.map(e => JSON.stringify(e)).join("\n") + "\n";
        fs.appendFileSync(this.evPath, lines);
    }

    async readRecentEvents(limit = 100) {
        if (!fs.existsSync(this.evPath)) return [];
        try {
            const content = fs.readFileSync(this.evPath, "utf8");
            const lines = content.trim().split("\n").filter(Boolean);
            // Return last N lines
            return lines.slice(-limit).map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            }).filter(Boolean);
        } catch {
            return [];
        }
    }
}
