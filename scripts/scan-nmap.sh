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

# Nmap Strategy:
# -sn: Ping Scan (disable port scan)
# -O: OS detection (requires root/sudo, may fail on some hosts)
# --osscan-guess: Be more aggressive with OS detection
# --disable-arp-ping: CRITICAL for Docker bridge mode - forces L3 scanning
# -PS80,443: TCP SYN ping on common ports (helps if ICMP is blocked)
# -oX -: Output XML

# Note: --disable-arp-ping is REQUIRED in Docker bridge mode.
# Without it, Nmap gets confused and reports all IPs as "up" (false positives).

# Try OS detection, but don't fail if it doesn't work
nmap -sn -O --osscan-guess --disable-arp-ping -PS80,443 "${CIDR}" -oX - 2>/dev/null | node lib/parse-nmap.js || \
  nmap -sn --disable-arp-ping -PS80,443 "${CIDR}" -oX - | node lib/parse-nmap.js
