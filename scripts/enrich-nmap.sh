#!/usr/bin/env bash
set -euo pipefail

TARGETS_FILE="${1:-}"
if [[ -z "${TARGETS_FILE}" || ! -f "${TARGETS_FILE}" ]]; then
  echo "Usage: $0 <targets_file> (one IP per line)" >&2
  exit 2
fi

# Hostname + some ports + vendor (if MAC known on LAN)
# -sn = ping scan only ; -sV = version scan
# We use -p 80,443,8080 --script http-title to grab names
nmap -p 80,443,8080 --open --script http-title -iL "${TARGETS_FILE}" -oX - | node lib/parse-nmap.js
