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

# Nmap Strategy for Docker Bridge Mode:
# The challenge: Docker bridge networking makes ARP unreliable and ICMP can give false positives.
# Solution: Use TCP SYN probes to common ports and require actual responses.
#
# -sn: Ping scan (no port scan)
# -PS80,443,22,3389: TCP SYN probes to common ports (HTTP, HTTPS, SSH, RDP)
# --disable-arp-ping: Don't use ARP (doesn't work in Docker bridge)
# -PE: ICMP Echo (disabled - causes false positives in Docker)
# --host-timeout 2s: Don't wait too long for unresponsive hosts
# -T4: Faster timing
# -oX -: Output XML

# CRITICAL: We rely ONLY on TCP SYN responses to determine if a host is up.
# This is more reliable than ICMP in Docker bridge mode.

nmap -sn -PS80,443,22,3389,8080 --disable-arp-ping --host-timeout 2s -T4 "${CIDR}" -oX - | node lib/parse-nmap.js
