#!/usr/bin/env bash
set -euo pipefail

# Simple TCP-based scanner - more reliable than Nmap in Docker bridge mode
# This script attempts actual TCP connections to determine if hosts are up

ARG1="${1:-}"
ARG2="${2:-}"
CIDR=""

if [[ -n "${ARG2}" ]]; then
  CIDR="${ARG2}"
else
  CIDR="${ARG1}"
fi

if [[ -z "${CIDR}" ]]; then
  echo "Usage: $0 [iface] <cidr>" >&2
  exit 2
fi

# Extract network and range from CIDR
# For simplicity, assume /24 network
NETWORK=$(echo "$CIDR" | cut -d'/' -f1 | cut -d'.' -f1-3)

# Common ports to check
PORTS="80 443 22 3389 8080"

# Scan each IP in the range
for i in {1..254}; do
    IP="${NETWORK}.${i}"
    
    # Try to connect to any of the common ports with a very short timeout
    for PORT in $PORTS; do
        # Use timeout and nc (netcat) to test connection
        if timeout 0.3 bash -c "echo >/dev/tcp/${IP}/${PORT}" 2>/dev/null; then
            # Host is up! Output JSON
            echo "{\"ip\":\"${IP}\",\"source\":\"tcp-scan\",\"port\":${PORT}}"
            break  # Found one open port, move to next IP
        fi
    done
done
