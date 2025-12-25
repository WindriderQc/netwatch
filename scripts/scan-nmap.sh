#!/usr/bin/env bash
set -euo pipefail

# Argument handling
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

# Nmap Strategy for comprehensive device discovery:
# We need MAC addresses, vendors, hostnames, and OS info for inventory tracking
#
# -sn: Ping scan (no port scan for speed)
# -PR: ARP ping (Layer 2 - gets MAC addresses on local subnet)
# -R: Always do reverse DNS lookup (get hostnames)
# -O: OS detection
# --osscan-limit: Only try OS detection on hosts that look promising
# -oX -: Output XML for parsing

# On Linux with proper network access, ARP scanning works perfectly
# This will give us MAC addresses which are critical for tracking hardware
nmap -sn -PR -R -O --osscan-limit "${CIDR}" -oX - 2>/dev/null | node lib/parse-nmap.js
