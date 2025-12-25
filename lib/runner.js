import { spawn } from "child_process";
import readline from "readline";

export async function runWorker(scriptPath, args = []) {
    // Determine if we're running a PowerShell script
    const isPowerShell = scriptPath.endsWith('.ps1');

    let cmd, cmdArgs;

    if (isPowerShell) {
        // Windows PowerShell execution
        cmd = 'powershell.exe';
        cmdArgs = ['-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...args];
    } else {
        // Bash script execution (Linux/WSL)
        cmd = scriptPath;
        cmdArgs = args;
    }

    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, cmdArgs, {
            stdio: ['ignore', 'pipe', 'pipe']
        });

        const lines = [];
        const rl = readline.createInterface({ input: proc.stdout });
        rl.on('line', line => {
            if (line.trim()) lines.push(line.trim());
        });

        let stderrData = '';
        proc.stderr.on('data', chunk => {
            stderrData += chunk.toString();
        });

        proc.on('close', code => {
            if (code !== 0) {
                reject(new Error(`Worker failed (${scriptPath}): ${stderrData.trim()}`));
            } else {
                resolve(lines);
            }
        });

        proc.on('error', err => {
            reject(new Error(`Failed to spawn ${cmd}: ${err.message}`));
        });
    });
}
