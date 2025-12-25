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
# -sn: Ping Scan (disable port scan) - usually fast but minimal info
# -O: OS detection (requires root/sudo, may fail on some hosts)
# --osscan-guess: Be more aggressive with OS detection
# -PS80,443: TCP SYN ping on common ports
# --disable-arp-ping: Force L3 for Docker compatibility
# -oX -: Output XML

# Try OS detection, but don't fail if it doesn't work
nmap -sn -O --osscan-guess --disable-arp-ping -PS80,443 "${CIDR}" -oX - 2>/dev/null | node lib/parse-nmap.js || \
  nmap -sn --disable-arp-ping -PS80,443 "${CIDR}" -oX - | node lib/parse-nmap.js
