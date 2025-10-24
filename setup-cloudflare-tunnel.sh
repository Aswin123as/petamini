#!/bin/bash

# Cloudflare Tunnel Setup Script for EC2
# This script installs and configures Cloudflare Tunnel for HTTPS access

set -e

echo "=================================="
echo "Cloudflare Tunnel Setup"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if Docker containers are running
echo -e "${BLUE}Step 1: Checking Docker containers...${NC}"
if ! docker-compose ps | grep -q "Up"; then
    echo -e "${RED}Error: Docker containers are not running!${NC}"
    echo "Please start your containers first with: docker-compose up -d"
    exit 1
fi
echo -e "${GREEN}✓ Docker containers are running${NC}"
echo ""

# Step 2: Download cloudflared
echo -e "${BLUE}Step 2: Downloading cloudflared...${NC}"
if [ -f "/usr/local/bin/cloudflared" ]; then
    echo -e "${YELLOW}cloudflared already installed, skipping download${NC}"
else
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
    sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
    sudo chmod +x /usr/local/bin/cloudflared
    echo -e "${GREEN}✓ cloudflared downloaded and installed${NC}"
fi
echo ""

# Step 3: Verify installation
echo -e "${BLUE}Step 3: Verifying installation...${NC}"
CLOUDFLARED_VERSION=$(cloudflared --version)
echo -e "${GREEN}✓ Installed: $CLOUDFLARED_VERSION${NC}"
echo ""

# Step 4: Create systemd service
echo -e "${BLUE}Step 4: Creating systemd service...${NC}"
sudo tee /etc/systemd/system/cloudflared.service > /dev/null <<EOF
[Unit]
Description=Cloudflare Tunnel
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=ec2-user
ExecStart=/usr/local/bin/cloudflared tunnel --url http://localhost:80
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}✓ Systemd service created${NC}"
echo ""

# Step 5: Enable and start the service
echo -e "${BLUE}Step 5: Starting Cloudflare Tunnel...${NC}"
sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

# Wait a few seconds for the tunnel to establish
echo "Waiting for tunnel to establish..."
sleep 5
echo ""

# Step 6: Get the tunnel URL
echo -e "${BLUE}Step 6: Retrieving your HTTPS URL...${NC}"
echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Your HTTPS URL:${NC}"
echo ""

# Extract URL from logs
TUNNEL_URL=$(sudo journalctl -u cloudflared -n 50 --no-pager | grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -1)

if [ -z "$TUNNEL_URL" ]; then
    echo -e "${RED}Could not automatically retrieve URL.${NC}"
    echo "Please check the logs manually:"
    echo "  sudo journalctl -u cloudflared -f"
    echo ""
else
    echo -e "${GREEN}$TUNNEL_URL${NC}"
    echo ""
    echo -e "${YELLOW}========================================${NC}"
    echo ""
fi

# Step 7: Display status and next steps
echo -e "${GREEN}✓ Cloudflare Tunnel is now running!${NC}"
echo ""
echo -e "${BLUE}Service Status:${NC}"
sudo systemctl status cloudflared --no-pager -l
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Next Steps:${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "1. Test your HTTPS URL in browser:"
if [ ! -z "$TUNNEL_URL" ]; then
    echo "   $TUNNEL_URL"
fi
echo ""
echo "2. Update your Telegram Bot Mini App URL to this HTTPS URL"
echo ""
echo "3. Useful commands:"
echo "   - View live logs:    sudo journalctl -u cloudflared -f"
echo "   - Stop tunnel:       sudo systemctl stop cloudflared"
echo "   - Start tunnel:      sudo systemctl start cloudflared"
echo "   - Restart tunnel:    sudo systemctl restart cloudflared"
echo "   - Service status:    sudo systemctl status cloudflared"
echo ""
echo -e "${GREEN}Setup Complete! 🚀${NC}"
