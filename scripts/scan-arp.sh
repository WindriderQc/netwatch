#!/usr/bin/env bash
set -euo pipefail

IFACE="${1:-}"
CIDR="${2:-}"

if [[ -z "${IFACE}" || -z "${CIDR}" ]]; then
  echo "Usage: $0 <iface> <cidr>   (ex: $0 eno1 192.168.2.0/24)" >&2
  exit 2
fi

# Output JSON lines: {"ip":"", "mac":"", "vendor":"", "source":"arp-scan"}
# 'sudo' might be needed inside the script if the user running node doesn't have permissions,
# but usually it's better to configure sudoers or capabilities. 
# For this lab setup, assuming the user might need to handle permissions manually or run the whole thing as root/admin.
arp-scan --interface="${IFACE}" --localnet --quiet --numeric --plain \
  | awk '
    BEGIN { OFS=""; }
    /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+[ \t]+([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}/ {
      ip=$1; mac=$2;
      vendor="";
      for (i=3; i<=NF; i++) vendor = vendor (i==3?"":" ") $i;
      gsub(/"/, "\\\"", vendor);
      printf("{\"ip\":\"%s\",\"mac\":\"%s\",\"vendor\":\"%s\",\"source\":\"arp-scan\"}\n", ip, mac, vendor);
    }
  '
