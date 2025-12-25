import { spawn } from "child_process";

export function runWorker(cmd, args = []) {
    return new Promise((resolve, reject) => {
        // Check if we are on Windows and running a shell script
        const isWindows = process.platform === "win32";
        const isShellScript = cmd.endsWith(".sh");

        let commandToRun = cmd;
        let argsToRun = args;

        if (isWindows && isShellScript) {
            // Use WSL to run bash scripts on Windows
            // This is a robust fallback for Windows users
            commandToRun = "wsl";
            argsToRun = [cmd, ...args];
        }
        // Docker container (Linux) environment check can be implicitly handled:
        // process.platform will be 'linux', so isWindows is false, and it runs 'cmd' directly.


        const p = spawn(commandToRun, argsToRun, { stdio: ["ignore", "pipe", "pipe"] });

        let out = "";
        let err = "";

        p.stdout.on("data", d => out += d.toString("utf8"));
        p.stderr.on("data", d => err += d.toString("utf8"));

        p.on("close", code => {
            if (code !== 0) return reject(new Error(`Worker failed (${cmd}): ${err.trim()}`));
            const lines = out.split("\n").map(s => s.trim()).filter(Boolean);
            resolve(lines);
        });
    });
}
