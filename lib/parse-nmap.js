import fs from "fs";

// Read from stdin
const chunks = [];
process.stdin.on("data", d => chunks.push(d));
process.stdin.on("end", () => {
    try {
        const xml = Buffer.concat(chunks).toString();

        // Simple regex-based XML parsing to avoid external deps
        // Matches <host ... > ... </host> cleanly across newlines
        const hostRegex = /<host[\s\S]*?>([\s\S]*?)<\/host>/g;
        const hosts = [];
        let match;

        while ((match = hostRegex.exec(xml)) !== null) {
            hosts.push(match[1]);
        }

        for (const h of hosts) {
            // Check if up
            if (!/<status state="up"/.test(h)) continue;

            const ip = (h.match(/<address addr="([^"]+)" addrtype="ipv4"/) || [])[1];
            const mac = (h.match(/<address addr="([^"]+)" addrtype="mac"/) || [])[1] || "";
            const vendor = (h.match(/<address[^>]*addrtype="mac"[^>]*vendor="([^"]+)"/) || [])[1] || "";
            let hostname = (h.match(/<hostname name="([^"]+)"/) || [])[1] || "";

            // Extract OS information
            // <osmatch name="Linux 4.15 - 5.6" accuracy="95" line="123"/>
            const osMatch = h.match(/<osmatch name="([^"]+)" accuracy="(\d+)"/);
            let os = "";
            if (osMatch && parseInt(osMatch[2]) >= 80) {
                os = osMatch[1];
            }

            // Extract HTTP title from script output
            // <script id="http-title" output="Requested resource was ... Title: SOMETHING" />
            // OR output="Title: SOMETHING"
            const scriptOutput = (h.match(/<script id="http-title" output="([^"]+)"/) || [])[1] || "";
            let httpTitle = "";
            const titleMatch = scriptOutput.match(/Title: (.*?)(?:&#xa;|$)/);
            if (titleMatch) {
                httpTitle = titleMatch[1].trim();
            }

            if (ip) {
                // Filter out network/broadcast addresses generically (ending in .0 or .255)
                if (ip.endsWith(".0") || ip.endsWith(".255")) continue;

                // Heuristics for best name
                if (httpTitle && (!hostname || hostname === ip)) {
                    hostname = httpTitle;
                }

                console.log(JSON.stringify({
                    ip,
                    mac,
                    vendor,
                    hostname,
                    httpTitle,
                    os,
                    source: "nmap-http"
                }));
            }
        }
    } catch (e) {
        console.error("Parse error:", e);
        process.exit(1);
    }
});
