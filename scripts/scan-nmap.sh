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
# BUT we want titles for service discovery.
# So we use -p 80,443,8080 to check common web ports light-weightly
# --script http-title: Grab the page title
# -oX -: Output XML

# We do a two-pass approach or a single pass with port scan?
# Single pass with common ports is efficient enough for home networks.

# Robust Discovery:
# Use -sn (Ping Scan) + --disable-arp-ping (Force L3)
# This prevents ARP confusion in Docker Bridge and acts as a proper external scan.
# We also add -PS80,443 to help with firewalled Windows hosts that block ICMP.

nmap -sn --disable-arp-ping -PS80,443 "${CIDR}" -oX - | node lib/parse-nmap.js
