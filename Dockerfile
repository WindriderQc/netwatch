FROM node:20-slim

# Install network discovery tools
RUN apt-get update && apt-get install -y \
    arp-scan \
    nmap \
    iproute2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package info
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create data directory
RUN mkdir -p data

# Expose web UI port
EXPOSE 8787

# Start the application
CMD ["node", "server.js"]
