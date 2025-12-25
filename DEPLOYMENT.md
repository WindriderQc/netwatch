# Deployment & Update Guide

## After Pulling New Code

When you pull new code from GitHub, you need to rebuild and restart the Docker container:

```bash
# Navigate to the project directory
cd c:\Users\Yanik\codes\networkX\netwatch

# Pull latest changes
git pull origin main

# Rebuild and restart the container
docker compose up --build -d

# Verify it's running
docker compose ps
docker compose logs netwatch --tail 20
```

## Quick Commands

### View Logs
```bash
docker compose logs netwatch -f
```

### Restart Without Rebuild
```bash
docker compose restart netwatch
```

### Stop Container
```bash
docker compose down
```

### Rebuild from Scratch
```bash
docker compose down
docker compose up --build -d
```

## What Requires a Rebuild?

**Rebuild Required** (`docker compose up --build -d`):
- Changes to server-side code (`server.js`, `lib/*.js`, `scripts/*.sh`)
- Changes to `package.json` (new dependencies)
- Changes to `Dockerfile`

**Restart Only** (`docker compose restart`):
- Changes to `config.json` (after restart)

**No Action Required** (just refresh browser):
- Changes to `ui/index.html` or other UI files (if you're not using Docker volumes)
- Note: Since UI files are copied during build, you'll need a rebuild for UI changes too

## Development Workflow

1. Make code changes
2. Commit to git: `git add . && git commit -m "Description"`
3. Push to GitHub: `git push origin main`
4. On deployment machine: `git pull && docker compose up --build -d`

## Data Persistence

The `./data` directory is mounted as a volume, so your device inventory and scan history persist across container rebuilds.
