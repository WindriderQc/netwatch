# NetWatch

A real-time network monitoring and inventory management tool that discovers devices on your network and allows you to track detailed information about each device.

## Features

- **Automatic Network Discovery**: Uses Nmap to scan your network and discover connected devices
- **Real-time Updates**: WebSocket-based live dashboard showing device status
- **Device Inventory**: Add custom metadata (alias, type, location, notes) to each device
- **Status Tracking**: Visual indicators for online/offline devices
- **Persistent Storage**: Device information and history stored locally
- **Docker Support**: Runs seamlessly in Docker on Windows, Linux, and macOS

## Quick Start

### Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Network access to scan (typically your local subnet)

### Running with Docker

1. Clone the repository:
```bash
git clone <your-repo-url>
cd netwatch
```

2. Update `config.json` with your network settings:
```json
{
    "intervalSeconds": 15,
    "nmapIntervalSeconds": 900,
    "targets": [
        {
            "name": "home",
            "iface": "eth0",
            "cidr": "192.168.1.0/24",
            "scanner": "nmap"
        }
    ]
}
```

3. Start the container:
```bash
docker compose up -d
```

4. Open your browser to [http://localhost:8787](http://localhost:8787)

## Usage

### Viewing Devices

The dashboard shows all discovered devices with:
- Device name (hostname, vendor, or IP)
- Network information (IP address, MAC address)
- Status indicator (green = online, grey = offline)
- Last seen timestamp

### Managing Inventory

Click on any device row to:
- Add a custom alias/name
- Set device type (e.g., "Printer", "Laptop")
- Add location or notes

Changes are saved automatically and persist across restarts.

### Filtering

Use the **"Show Offline"** checkbox to toggle visibility of disconnected devices.

## Configuration

Edit `config.json` to customize:

- `intervalSeconds`: How often to scan for devices (default: 15 seconds)
- `nmapIntervalSeconds`: How often to enrich device data (default: 900 seconds)
- `targets`: Array of network segments to scan
  - `name`: Friendly name for this target
  - `cidr`: Network range in CIDR notation (e.g., "192.168.1.0/24")
  - `scanner`: Scanner type ("nmap" recommended for Docker)

## Architecture

- **Backend**: Node.js with Express and WebSocket
- **Scanner**: Nmap for network discovery
- **Storage**: JSON files in `./data` directory
- **Frontend**: Vanilla JavaScript with real-time updates

## Development

### Running Locally (without Docker)

1. Install dependencies:
```bash
npm install
```

2. Ensure `nmap` is installed on your system

3. Start the server:
```bash
node server.js
```

### Project Structure

```
netwatch/
├── server.js           # Main server and WebSocket handler
├── lib/
│   ├── runner.js       # Script execution wrapper
│   ├── normalize.js    # Data normalization
│   ├── diff.js         # State change detection
│   ├── store.js        # Persistent storage
│   └── parse-nmap.js   # Nmap XML parser
├── scripts/
│   ├── scan-nmap.sh    # Network discovery script
│   └── enrich-nmap.sh  # Device enrichment script
├── ui/
│   └── index.html      # Web dashboard
├── data/               # Persistent storage (auto-created)
├── config.json         # Configuration
└── docker-compose.yml  # Docker configuration
```

## Troubleshooting

### No devices showing up

1. Check Docker logs: `docker compose logs netwatch`
2. Verify your CIDR range matches your network
3. Ensure the container has network access

### Connection refused

1. Verify the container is running: `docker compose ps`
2. Check port 8787 is not in use by another application
3. Restart the container: `docker compose restart`

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a pull request.
