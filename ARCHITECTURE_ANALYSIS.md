# NetWatch Architecture Analysis

**Date:** 2025-12-25  
**Reviewer:** GitHub Copilot Agent  
**Requested by:** @WindriderQc

---

## Executive Summary

This document analyzes the current NetWatch architecture and proposes improvements based on the stated goals:
- Show real-time active network
- Journalize variations
- Use IP as base but link usage and hardware to IP mapping
- Serve as reference documentation for security and maintenance

---

## Current Architecture

### Technology Stack
- **Backend:** Node.js + Express + WebSocket (ws)
- **Scanner:** Nmap for network discovery
- **Storage:** JSON files (snapshot.json, inventory.json, events.jsonl)
- **Frontend:** Vanilla JavaScript with real-time WebSocket updates
- **Deployment:** Docker with network capabilities

### Current Data Model

#### Snapshot (snapshot.json)
```javascript
{
  "ts": 1735149068484,
  "devices": {
    "aa:bb:cc:dd:ee:ff": {
      "key": "aa:bb:cc:dd:ee:ff",
      "ip": "192.168.2.100",
      "mac": "aa:bb:cc:dd:ee:ff",
      "hostname": "living-room-tv",
      "vendor": "Samsung",
      "status": "online",
      "firstSeen": 1735000000000,
      "lastSeen": 1735149068484,
      "alias": "Living Room TV",
      "type": "TV",
      "location": "Living Room",
      "notes": "Smart TV"
    }
  }
}
```

#### Inventory (inventory.json)
```javascript
{
  "aa:bb:cc:dd:ee:ff": {
    "alias": "Living Room TV",
    "type": "TV", 
    "location": "Living Room",
    "notes": "..."
  }
}
```

#### Events (events.jsonl)
```javascript
{"type":"join","ts":1735149068484,"device":{...}}
{"type":"change","ts":1735149068484,"before":{...},"after":{...}}
{"type":"leave","ts":1735149068484,"device":{...}}
```

### Current Features

✅ **Working Well:**
- Real-time network scanning (configurable interval)
- Device discovery via nmap
- Online/offline status tracking
- Manual device metadata (alias, type, location, notes)
- WebSocket-based live updates
- Persistent storage
- Docker deployment
- HTTP title extraction for web services

⚠️ **Architectural Concerns:**

1. **Key Inconsistency**
   - Devices can have MAC-based keys (`aa:bb:cc:dd:ee:ff`) or IP-based keys (`ip:192.168.2.100`)
   - This creates ambiguity when MAC addresses aren't available
   - Problematic for tracking device history

2. **No IP History**
   - When a device gets a new IP (DHCP), previous IP is lost
   - Cannot track IP changes over time
   - Difficult to correlate historical data

3. **Limited Journaling**
   - Events are written but not displayed in UI
   - Only tracks join/leave/change events
   - Missing: IP changes, port changes, service changes
   - No event search or filtering

4. **Minimal Hardware Metadata**
   - Only stores: alias, type, location, notes
   - Missing: model, serial number, purchase date, warranty
   - No structured hardware specifications

5. **No Usage Tracking**
   - "Usage" mentioned in requirements is undefined
   - Could mean: bandwidth, connection frequency, service usage, etc.

6. **No Security Features**
   - No open port tracking over time
   - No vulnerability detection
   - No alerts for unusual activity
   - No baseline establishment

7. **Reference Documentation Gap**
   - Current system is good for "what's connected now"
   - Not optimized for "what was connected when" or "device lifecycle"
   - Missing: maintenance logs, service history, documentation links

---

## Questions Requiring Clarification

Before proposing specific changes, please clarify:

### 1. Primary Key Strategy
**Question:** Should MAC address always be the primary identifier?
- **Option A:** MAC is always primary, IP is secondary (current approach for devices with MAC)
- **Option B:** Support both MAC-based and IP-only devices (current hybrid)
- **Option C:** Always require MAC, exclude IP-only devices

**Recommendation:** Option A - MAC as primary, but track all IPs seen for that MAC

### 2. IP History Tracking
**Question:** How should IP address changes be tracked?
- Track IP history per device (array of {ip, firstSeen, lastSeen})?
- Show IP change events in UI?
- Alert on IP changes?

**Recommendation:** Yes to all - full IP history with change events

### 3. "Usage" Definition
**Question:** What does "usage" mean in the context of "link usage to IP mapping"?
- **Option A:** Network bandwidth usage (requires packet capture)
- **Option B:** Connection frequency (when device is online/offline)
- **Option C:** Service usage (which ports/services are active)
- **Option D:** Application usage (what the device is used for - manual entry)

**Recommendation:** Need clarification - different options have very different implementation complexity

### 4. Hardware Metadata
**Question:** What hardware information should be tracked?
- **Basic:** Model, Manufacturer, Serial Number
- **Purchasing:** Purchase Date, Price, Vendor, Warranty Expiration
- **Technical:** CPU, RAM, Storage, OS Version
- **Custom:** Free-form custom fields

**Recommendation:** Start with Basic + Purchasing, add Custom fields option

### 5. Security Features
**Question:** What security tracking is needed?
- Open ports monitoring?
- Service version tracking?
- Vulnerability scanning integration?
- Alerts for new/unknown devices?
- Network baseline with anomaly detection?

**Recommendation:** Start with ports + alerts for new devices

### 6. Maintenance Features
**Question:** What maintenance information should be tracked?
- Maintenance history (service dates, issues, resolutions)?
- Scheduled maintenance?
- Documentation links (manuals, support sites)?
- Warranty and support contact info?

**Recommendation:** Maintenance log + documentation links

### 7. Event System Enhancement
**Question:** What events should be tracked and displayed?
- Current: join, leave, change
- Proposed additions: IP change, port change, service change, status change, manual updates?
- Should events be displayed in UI?
- Should events be searchable/filterable?

**Recommendation:** Enhanced events with UI viewer

---

## Proposed Architecture Improvements

### Phase 1: Core Data Model (Foundation)
**Goal:** Fix key architecture issues

1. **Standardize on MAC as Primary Key**
   - All devices identified by MAC when available
   - IP-only fallback for devices without MAC (rare)
   - Clear separation in code

2. **Add IP History Tracking**
   ```javascript
   {
     "ipHistory": [
       {"ip": "192.168.2.100", "firstSeen": 1735000000, "lastSeen": 1735100000},
       {"ip": "192.168.2.101", "firstSeen": 1735100001, "lastSeen": 1735149068}
     ]
   }
   ```

3. **Enhance Inventory Schema**
   ```javascript
   {
     // Current fields
     "alias": "Living Room TV",
     "type": "TV",
     "location": "Living Room",
     "notes": "...",
     
     // New fields
     "hardware": {
       "manufacturer": "Samsung",
       "model": "QN65Q80A",
       "serialNumber": "...",
       "purchaseDate": "2023-01-15",
       "warrantyExpiration": "2025-01-15",
       "specifications": {
         // Custom key-value pairs
       }
     },
     "documentation": {
       "manualUrl": "...",
       "supportUrl": "...",
       "notes": "..."
     },
     "maintenance": [
       {
         "date": "2024-03-15",
         "type": "repair",
         "description": "...",
         "technician": "..."
       }
     ],
     "tags": ["critical", "iot", "smart-home"]
   }
   ```

### Phase 2: Enhanced Event System
**Goal:** Better variation tracking

1. **Expand Event Types**
   - `ip_change`: IP address changed
   - `port_change`: Open ports changed
   - `service_change`: Service version changed
   - `status_change`: Online/offline transition
   - `metadata_update`: Manual inventory update
   - `first_seen`: New device discovered

2. **Event Viewer UI**
   - Show recent events in dashboard
   - Filter by device, type, date range
   - Export event history

3. **Event Storage Enhancement**
   - Keep events.jsonl for append-only log
   - Add in-memory index for recent events
   - Add query API for event history

### Phase 3: Service & Port Tracking
**Goal:** Better device characterization

1. **Port Scanning**
   - Track open ports per device
   - Detect port changes over time
   - Identify common services

2. **Service Identification**
   - Use nmap service detection
   - Track service versions
   - Alert on service changes

### Phase 4: Security & Alerts
**Goal:** Security awareness

1. **New Device Alerts**
   - Notify when unknown device joins
   - Require acknowledgment/classification

2. **Baseline Establishment**
   - Learn normal network behavior
   - Alert on deviations

3. **Port Change Alerts**
   - Alert when new ports open
   - Track port history

### Phase 5: UI/UX Improvements
**Goal:** Better usability

1. **Enhanced Device Details**
   - Show full device history
   - Display IP history
   - Show event timeline
   - Display maintenance log

2. **Better Filtering**
   - Filter by type, location, tag, status
   - Search by any field
   - Group by network segment

3. **Reports & Export**
   - Network inventory report
   - Device lifecycle report
   - Export to CSV/PDF

---

## Implementation Priorities

### Must Have (Critical Path)
1. Standardize MAC as primary key
2. Add IP history tracking
3. Enhance inventory schema with hardware fields
4. Add event viewer to UI
5. Improve event tracking (more event types)

### Should Have (High Value)
1. Port/service tracking
2. New device alerts
3. Enhanced device details view
4. Maintenance log
5. Tags system

### Nice to Have (Future)
1. Network topology visualization
2. Bandwidth monitoring
3. Vulnerability scanning
4. Scheduled reports
5. Mobile responsive UI

---

## Next Steps

1. **User Validation:** Review this document and confirm:
   - Which features are most important?
   - What does "usage" mean in your context?
   - What security features are needed?
   - What maintenance tracking is needed?

2. **Create Implementation Plan:** Based on feedback, create detailed implementation plan

3. **Implement in Phases:** Start with Phase 1 (foundation) and iterate

4. **User Feedback:** Test after each phase and adjust

---

## Technical Considerations

### Backward Compatibility
- Migration script needed for existing data
- Preserve existing snapshot.json and inventory.json
- Convert to new schema gracefully

### Performance
- Current JSON file storage works for ~100 devices
- Beyond that, consider SQLite or similar
- Event querying may need indexing

### Docker & Deployment
- No major changes needed to Docker setup
- May need additional capabilities for advanced scanning
- Volume mounts remain the same

---

## Conclusion

The current NetWatch architecture is a solid foundation for basic network monitoring. The proposed improvements will transform it into a comprehensive network documentation and management system suitable for home/small office use.

**Key recommendations:**
1. Start with data model improvements (Phase 1)
2. Clarify "usage" requirements before implementing
3. Implement security features incrementally
4. Maintain simplicity - avoid over-engineering

**Estimated effort:**
- Phase 1: 8-12 hours
- Phase 2: 6-8 hours  
- Phase 3: 8-10 hours
- Phase 4: 6-8 hours
- Phase 5: 10-15 hours

**Total:** 38-53 hours of development time

---

## Appendix: Current File Structure

```
netwatch/
├── server.js              # Main server (241 lines)
├── config.json            # Configuration
├── package.json           # Dependencies
├── Dockerfile             # Docker build
├── docker-compose.yml     # Docker orchestration
├── lib/
│   ├── store.js          # Data persistence (42 lines)
│   ├── normalize.js      # Data normalization (43 lines)
│   ├── diff.js           # Change detection (36 lines)
│   ├── runner.js         # Script execution (36 lines)
│   └── parse-nmap.js     # Nmap XML parser (63 lines)
├── scripts/
│   ├── scan-nmap.sh      # Network discovery
│   ├── scan-arp.sh       # ARP scanning
│   └── enrich-nmap.sh    # Device enrichment
├── ui/
│   └── index.html        # Web interface (376 lines)
└── data/
    ├── snapshot.json     # Current state
    ├── inventory.json    # User metadata
    └── events.jsonl      # Event log
```

**Code quality:** Good
- Clean separation of concerns
- Modular design
- Good error handling
- Consistent style

**Documentation:** Basic
- README covers installation and usage
- Code comments are minimal but adequate
- No API documentation
