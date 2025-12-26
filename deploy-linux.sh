#!/bin/bash
# Deployment script for NetWatch on Linux server

set -e

SERVER="yb@192.168.2.33"
APP_DIR="/home/yb/netwatch"
APP_NAME="netwatch"

echo "🚀 Deploying NetWatch to $SERVER..."

# SSH and deploy
ssh $SERVER << 'ENDSSH'
    # Navigate to app directory or clone if doesn't exist
    if [ ! -d "/home/yb/netwatch" ]; then
        echo "📦 Cloning repository..."
        cd /home/yb
        git clone https://github.com/WindriderQc/netwatch.git
        cd netwatch
    else
        echo "📥 Pulling latest changes..."
        cd /home/yb/netwatch
        git pull origin main
    fi
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install
    
    # Update config for Linux (use nmap scanner)
    echo "⚙️  Updating configuration..."
    cat > config.json << 'EOF'
{
    "intervalSeconds": 15,
    "nmapIntervalSeconds": 900,
    "targets": [
        {
            "name": "home",
            "iface": "eth0",
            "cidr": "192.168.2.0/24",
            "scanner": "nmap"
        }
    ]
}
EOF
    
    # Create data directory
    mkdir -p data
    
    # Stop existing PM2 process if running
    echo "🔄 Restarting with PM2..."
    pm2 delete netwatch 2>/dev/null || true
    
    # Start with PM2
    pm2 start server.js --name netwatch
    pm2 save
    
    echo "✅ Deployment complete!"
    echo "📊 NetWatch is running at http://192.168.2.33:8787"
    
ENDSSH

echo ""
echo "✨ Deployment successful!"
echo "🌐 Access NetWatch at: http://192.168.2.33:8787"
echo ""
echo "Useful commands:"
echo "  ssh yb@192.168.2.33 'pm2 logs netwatch'     # View logs"
echo "  ssh yb@192.168.2.33 'pm2 restart netwatch'  # Restart"
echo "  ssh yb@192.168.2.33 'pm2 stop netwatch'     # Stop"
