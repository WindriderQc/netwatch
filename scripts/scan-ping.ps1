# PowerShell Network Scanner
# Simple, reliable ping-based scanning for Windows

param(
    [string]$Interface = "",
    [string]$CIDR = ""
)

# Use the second parameter if both are provided
if ($Interface -and $CIDR) {
    $network = $CIDR
} elseif ($Interface) {
    $network = $Interface
} else {
    Write-Error "Usage: scan-ping.ps1 <cidr>"
    exit 2
}

# Extract network base and range
if ($network -match '^(\d+\.\d+\.\d+)\.0/24$') {
    $base = $matches[1]
} else {
    Write-Error "Only /24 networks supported for now"
    exit 2
}

# Scan each IP (skip .0 and .255)
1..254 | ForEach-Object -ThrottleLimit 50 -Parallel {
    $ip = "$using:base.$_"
    
    # Use Test-Connection with 1 ping, 500ms timeout
    $result = Test-Connection -ComputerName $ip -Count 1 -TimeoutSeconds 1 -Quiet -ErrorAction SilentlyContinue
    
    if ($result) {
        # Try to get hostname
        $hostname = ""
        try {
            $dns = [System.Net.Dns]::GetHostEntry($ip)
            $hostname = $dns.HostName
        } catch {
            # Hostname lookup failed, that's ok
        }
        
        # Output JSON
        $obj = @{
            ip = $ip
            hostname = $hostname
            source = "ping"
        }
        
        Write-Output ($obj | ConvertTo-Json -Compress)
    }
}
