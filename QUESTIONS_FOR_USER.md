# NetWatch Architecture Review - Questions for @WindriderQc

## Context
You requested an architecture review focused on:
- Real-time active network monitoring
- Journalizing variations
- IP as base with usage and hardware linked to IP mapping
- Reference documentation for security and maintenance

I've analyzed the codebase and created a detailed analysis (see ARCHITECTURE_ANALYSIS.md). Before making changes, I need clarification on several key points.

---

## Critical Questions (Please Answer)

### 1. What does "usage" mean in your context?

When you mention "intent is usage and hardware in the house to be linked with this IP mapping," what specifically do you mean by "usage"?

**Option A:** Network bandwidth usage
- Track how much data each device uses
- Requires packet capture and analysis
- More complex to implement

**Option B:** Connection history
- Track when device is online/offline
- Track connection frequency
- Already partially implemented

**Option C:** Service/port usage
- Track which services (HTTP, SSH, etc.) are running
- Track which ports are open
- Moderate complexity

**Option D:** Application/purpose documentation
- Manual entry: "This printer is used for tax documents"
- "This laptop is used by John for work"
- Simple metadata field

**Option E:** Combination of the above

👉 **Please specify:** Which option(s) do you want?

---

### 2. Hardware Documentation - What info matters to you?

For each device, what hardware information do you want to track?

**Currently supported:**
- ✅ Alias (custom name)
- ✅ Type (printer, laptop, etc.)
- ✅ Location (office, living room, etc.)
- ✅ Notes (free text)

**Proposed additions - which do you need?**
- [ ] Manufacturer/Brand
- [ ] Model number
- [ ] Serial number
- [ ] Purchase date
- [ ] Purchase price
- [ ] Warranty expiration
- [ ] Technical specs (RAM, CPU, storage, etc.)
- [ ] Documentation links (manual, support site)
- [ ] Custom fields (your own categories)

👉 **Please check** which ones you need.

---

### 3. Security Features - What's important?

What security-related information do you want to track?

**Proposed features:**
- [ ] Track open ports per device
- [ ] Alert when new device joins network
- [ ] Alert when ports change on existing device
- [ ] Track service versions
- [ ] Flag unknown/unidentified devices
- [ ] Network baseline with anomaly detection
- [ ] Integration with vulnerability databases

👉 **Please check** which ones you need.

---

### 4. Maintenance Tracking - What do you need?

For maintenance and support, what should be tracked?

**Proposed features:**
- [ ] Maintenance history log (date, issue, resolution)
- [ ] Scheduled maintenance reminders
- [ ] Support contact information
- [ ] Warranty tracking with expiration alerts
- [ ] Documentation links (manuals, guides)
- [ ] Service provider information
- [ ] Cost tracking for repairs/service

👉 **Please check** which ones you need.

---

### 5. IP Address Tracking Strategy

Your devices may get different IP addresses over time (DHCP). How should this be handled?

**Current behavior:**
- When IP changes, old IP is overwritten
- No history of previous IPs

**Proposed behavior:**
- Track full IP history per device
- Show IP change events
- Alert on IP changes (optional)

👉 **Do you want:** Full IP history tracking? (Yes/No)

---

### 6. Event History Visibility

Events are being tracked (device join/leave/change) but not visible in the UI.

**Should the UI show:**
- [ ] Recent events (last 24 hours)
- [ ] Full event history with search/filter
- [ ] Event timeline per device
- [ ] Event notifications/alerts

👉 **Please check** which ones you need.

---

### 7. Primary Identifier Strategy

Some devices have MAC addresses, others might not. How should devices be identified?

**Option A:** MAC address as primary key
- Most devices have MAC
- MAC is stable across reboots/DHCP
- Recommended approach

**Option B:** Support both MAC and IP-only devices
- Accommodate devices without MAC
- More complex logic

**Option C:** IP address as primary key
- Simpler but problematic with DHCP
- Not recommended

👉 **Preferred option:** A, B, or C?

---

## Priority Question

Of all the proposed features/improvements, which are **MOST IMPORTANT** to you? Please rank top 3:

1. _________________
2. _________________
3. _________________

---

## Implementation Approach

Once you answer these questions, I'll:

1. **Quick wins** - Implement non-controversial improvements first
2. **Core features** - Build the features you prioritized
3. **Iterate** - Show you results, get feedback, refine
4. **Test** - Ensure everything works before finalizing

---

## What Can Be Done Immediately (No Clarification Needed)

While you review these questions, I can implement these non-controversial improvements:

- ✅ Fix code organization and add documentation
- ✅ Add migration support for future schema changes
- ✅ Improve error handling and logging
- ✅ Add API documentation
- ✅ Improve UI responsiveness
- ✅ Add keyboard shortcuts
- ✅ Better sorting/filtering in device list

👉 **Should I proceed with these while you consider the questions?** (Yes/No)

---

## How to Respond

Please respond with:

1. Your answers to questions 1-7
2. Your top 3 priorities
3. Whether I should proceed with immediate improvements

You can respond in any format - just number your answers or quote the questions.

---

**Thank you!** Your clarification will ensure I build exactly what you need.
