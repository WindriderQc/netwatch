# NetWatch Evolution Plan

**Target Ecosystem:** SBQC (AgentX, DataAPI)
**Version:** 1.0

This document outlines the roadmap for evolving NetWatch from a standalone tool into a component of the SBQC ecosystem.

## Phase 1: Hardening & Reliability (Immediate)

Before integration, the core system must be robust.

### 1.1 Data Persistence Safety
- **Objective:** Prevent data corruption during power loss or crashes.
- **Action:** Implement atomic file writes (Write-to-Temp-and-Rename) in `store.js`.
- **Status:** Planned.

### 1.2 Robust Parsing
- **Objective:** Eliminate fragility in Nmap XML parsing.
- **Action:** Replace regex-based parsing in `parse-nmap.js` with a streaming XML parser (e.g., `sax` or `fast-xml-parser`).
- **Status:** Planned.

### 1.3 Concurrency Control
- **Objective:** Avoid race conditions between scan loops and API updates.
- **Action:** Implement a `StateStore` manager that queues updates or uses a mutex to ensure `lastSnapshot` transitions are atomic.

## Phase 2: SBQC Ecosystem Integration

### 2.1 AgentX Interface (Control Plane)
AgentX needs to control NetWatch programmatically.

- **Feature: Trigger Scan API**
  - **Endpoint:** `POST /api/scan/trigger`
  - **Payload:** `{ "target": "192.168.1.0/24", "type": "nmap" }`
  - **Description:** Allows AgentX to request an immediate scan of a specific target (e.g., after detecting an anomaly elsewhere).

- **Feature: Query Device Status**
  - **Endpoint:** `GET /api/device/:key`
  - **Description:** Allows AgentX to fetch the latest state of a specific device.

### 2.2 DataAPI Integration (Data Plane)
NetWatch should act as a data producer for the centralized DataAPI.

- **Feature: Webhook / Event Stream**
  - **Mechanism:** Configurable Webhook URL in `config.json`.
  - **Behavior:** When a generic event (Join/Leave/Change) occurs, NetWatch POSTs the payload to DataAPI.
  - **Payload Standard:** Must align with DataAPI's ingestion schema.

- **Feature: Inventory Synchronization**
  - **Direction:** Bidirectional.
  - **Behavior:** On startup, NetWatch fetches the "Master Inventory" from DataAPI to populate aliases and metadata. Local changes are pushed back to DataAPI.

## Phase 3: Advanced Features

### 3.1 Security & Access Control
- **Authentication:** Implement JWT-based or API-Key based authentication for all API endpoints.
- **Role-Based Access:** Distinguish between "Viewer" (UI) and "Admin" (AgentX/Owner).

### 3.2 Enhanced Monitoring
- **Port History:** Track open ports over time, not just the current state.
- **Service Fingerprinting:** Store detailed service versions (e.g., "OpenSSH 8.2p1").
- **Alerting:** Integration with external notification systems (Slack, Discord, Email) via AgentX.

### 3.3 Scalability
- **Database Migration:** For networks > 1000 devices, migrate from `snapshot.json` to SQLite.
- **Distributed Scanning:** Run multiple NetWatch "Agents" on different subnets reporting to a central "Collector".

## Roadmap Timeline

| Phase | Milestone | Est. Effort |
|-------|-----------|-------------|
| 1.1 | Atomic Writes | 2 hours |
| 1.2 | XML Parser | 4 hours |
| 2.1 | AgentX API | 6 hours |
| 2.2 | DataAPI Sync | 8 hours |
| 3.1 | Auth & Security | 10 hours |

## Success Metrics

- **Reliability:** 0 corrupt data files reported.
- **Integration:** AgentX can successfully trigger scans and read results without human intervention.
- **Data Consistency:** NetWatch inventory matches DataAPI records within 5 seconds of change.
