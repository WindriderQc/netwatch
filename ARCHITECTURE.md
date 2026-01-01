# NetWatch Architecture

**Version:** 1.0
**Status:** Active
**Last Updated:** 2025-10-26

## 1. Overview

NetWatch is a lightweight, real-time network monitoring and inventory management system. It discovers devices on the network, tracks their availability, and allows users to annotate them with metadata. It is designed to be deployed as a Docker container.

## 2. System Architecture

The system follows a **Monolithic Architecture** with a clear separation of internal loops for data gathering and an API layer for data presentation.

```mermaid
graph TD
    User[User / Browser] <-->|WebSocket & HTTP| Server[Node.js Server]
    AgentX[AgentX] <-->|HTTP API| Server

    subgraph "NetWatch Container"
        Server -->|Spawn| Runner[Script Runner]
        Runner -->|Exec| Nmap[Nmap / ARP-Scan]

        Server <-->|Read/Write| Store[Data Store]
        Store <-->|File I/O| FS[File System (JSON)]

        Server -->|Enrich| EnrichedData[Enriched Device Data]
    end
```

### 2.1 Components

#### 2.1.1 Backend (Node.js)
- **Entry Point:** `server.js`
- **Responsibilities:**
  - Serves the static UI.
  - Manages WebSocket connections for real-time broadcasting.
  - Orchestrates scanning loops (`ScanLoop` and `EnrichLoop`).
  - Provides HTTP API endpoints for inventory management.

#### 2.1.2 Data Gathering Layer (`lib/runner.js`)
- **Mechanism:** Spawns child processes to execute shell scripts.
- **Tools:**
  - `scan-arp.sh` / `scan-nmap.sh`: Fast discovery using ARP or Nmap Ping scans.
  - `enrich-nmap.sh`: Detailed scanning using Nmap (OS detection, Service detection).
- **Abstraction:** The runner handles platform differences (WSL vs Linux vs Windows PowerShell).

#### 2.1.3 Storage Layer (`lib/store.js`)
- **Type:** Local File System (JSON).
- **Artifacts:**
  - `snapshot.json`: The current state of all known devices.
  - `inventory.json`: Persistent user-defined metadata (Alias, Notes, etc.).
  - `events.jsonl`: Append-only log of network events (Join, Leave, Change).

#### 2.1.4 Frontend (`ui/`)
- **Technology:** Vanilla JavaScript, HTML5, CSS3.
- **Communication:** WebSocket for state sync; REST for write operations.

## 3. Data Flow

### 3.1 Discovery Cycle
1. **Trigger:** `scanLoop` runs every `intervalSeconds` (default: 15s).
2. **Execution:** Runs `scan-*.sh` against defined targets (CIDR ranges).
3. **Normalization:** Output is parsed into standardized JSON objects (IP, MAC, Vendor).
4. **Merge:** New data is merged with `lastSnapshot`.
   - New devices are marked `firstSeen`.
   - Existing devices update `lastSeen`.
   - Missing devices are marked `offline`.
5. **Persistence:** Updated snapshot is written to `snapshot.json`.
6. **Broadcast:** New state is pushed to all WebSocket clients.

### 3.2 Enrichment Cycle
1. **Trigger:** `nmapEnrichLoop` runs every `nmapIntervalSeconds` (default: 15m) or upon new device discovery.
2. **Execution:** Runs Nmap against active IP addresses.
3. **Parsing:** Extracts OS, Hostname, and HTTP Title.
4. **Update:** Merges detailed info into `lastSnapshot`.

## 4. Data Model

### Device Object
```json
{
  "key": "aa:bb:cc:dd:ee:ff",  // MAC Address (Primary Key) or "ip:x.x.x.x"
  "ip": "192.168.1.50",
  "mac": "aa:bb:cc:dd:ee:ff",
  "hostname": "work-laptop",
  "vendor": "Apple",
  "status": "online",          // "online" | "offline"
  "firstSeen": 1672531200000,
  "lastSeen": 1672534800000,
  "ipHistory": [ ... ],
  "hardware": {
    "os": "macOS",
    "model": "MacBook Pro"
  },
  "alias": "My MacBook",       // User-defined
  "location": "Office"         // User-defined
}
```

## 5. Design Decisions

- **Why JSON Files?** Simplicity and portability. No external database dependency required for typical home/small office networks (< 500 devices).
- **Why Shell Scripts?** leveraging Nmap's power without complex Node.js native bindings. Allows users to customize scan commands easily.
- **Why WebSocket?** Real-time feedback is crucial for a monitoring tool.

## 6. Security Considerations

- **Current State:** Zero-trust internal model. No authentication.
- **Network Access:** Requires `NET_ADMIN` capability in Docker to perform ARP scans and OS fingerprinting.

## 7. Interfaces

### 7.1 WebSocket API
- **`snapshot`**: Sends the full current state.
- **`events`**: Sends a list of recent events.
- **`status`**: Updates the scanning status indicator.

### 7.2 REST API
- `POST /api/device`: Update device metadata.
- `GET /api/events`: Retrieve event history.
