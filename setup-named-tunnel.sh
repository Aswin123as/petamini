#!/bin/bash
# Automated Named Cloudflare Tunnel Setup for PetaMini
# Run this on your EC2 instance

set -e

echo "🚀 Setting up Named Cloudflare Tunnel for PetaMini"
echo "=================================================="
echo ""

# Configuration
TUNNEL_NAME="petamini"
SERVICE_PORT="80"
APP_DIR="$HOME/petamini"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}❌ cloudflared is not installed${NC}"
    echo "Installing cloudflared..."
    
    # Download and install cloudflared
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    sudo dpkg -i cloudflared-linux-amd64.deb
    rm cloudflared-linux-amd64.deb
    
    echo -e "${GREEN}✅ cloudflared installed${NC}"
fi

echo ""
echo -e "${BLUE}📋 Step 1: Login to Cloudflare${NC}"
echo "=================================================="
echo "A browser window will open (or you'll get a URL)"
echo "Please login and authorize cloudflared"
echo ""
read -p "Press Enter to continue..."

cloudflared tunnel login

if [ ! -f ~/.cloudflared/cert.pem ]; then
    echo -e "${RED}❌ Login failed - cert.pem not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Successfully logged in to Cloudflare${NC}"
echo ""

echo -e "${BLUE}📋 Step 2: Create Named Tunnel${NC}"
echo "=================================================="

# Check if tunnel already exists
if cloudflared tunnel list | grep -q "$TUNNEL_NAME"; then
    echo -e "${YELLOW}⚠️  Tunnel '$TUNNEL_NAME' already exists${NC}"
    read -p "Do you want to delete and recreate it? (y/N): " recreate
    if [[ $recreate =~ ^[Yy]$ ]]; then
        cloudflared tunnel delete $TUNNEL_NAME
        echo -e "${GREEN}✅ Old tunnel deleted${NC}"
    else
        echo "Using existing tunnel..."
    fi
fi

# Create tunnel if it doesn't exist
if ! cloudflared tunnel list | grep -q "$TUNNEL_NAME"; then
    cloudflared tunnel create $TUNNEL_NAME
    echo -e "${GREEN}✅ Tunnel '$TUNNEL_NAME' created${NC}"
fi

# Get tunnel ID
TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')
echo -e "${GREEN}Tunnel ID: $TUNNEL_ID${NC}"
echo ""

echo -e "${BLUE}📋 Step 3: Configure Tunnel${NC}"
echo "=================================================="

# Create config directory
mkdir -p ~/.cloudflared

# Create config file
cat > ~/.cloudflared/config.yml << EOF
tunnel: $TUNNEL_ID
credentials-file: /home/$(whoami)/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: petamini-$TUNNEL_ID.trycloudflare.com
    service: http://localhost:$SERVICE_PORT
  - service: http_status:404
EOF

echo -e "${GREEN}✅ Configuration file created${NC}"
cat ~/.cloudflared/config.yml
echo ""

echo -e "${BLUE}📋 Step 4: Create DNS Route${NC}"
echo "=================================================="

# Ask user for subdomain choice
echo "Choose your subdomain option:"
echo "1) Auto-generated: petamini-$TUNNEL_ID.trycloudflare.com (recommended)"
echo "2) Simple: petamini.trycloudflare.com"
echo "3) Custom domain (requires domain on Cloudflare)"
echo ""
read -p "Enter choice (1-3) [default: 1]: " dns_choice
dns_choice=${dns_choice:-1}

case $dns_choice in
    1)
        TUNNEL_URL="petamini-$TUNNEL_ID.trycloudflare.com"
        cloudflared tunnel route dns $TUNNEL_NAME $TUNNEL_URL || echo "Route may already exist"
        ;;
    2)
        TUNNEL_URL="petamini.trycloudflare.com"
        # Update config with simple subdomain
        sed -i "s|petamini-$TUNNEL_ID.trycloudflare.com|$TUNNEL_URL|" ~/.cloudflared/config.yml
        cloudflared tunnel route dns $TUNNEL_NAME $TUNNEL_URL || echo "Route may already exist"
        ;;
    3)
        read -p "Enter your custom domain (e.g., app.yourdomain.com): " TUNNEL_URL
        # Update config with custom domain
        sed -i "s|petamini-$TUNNEL_ID.trycloudflare.com|$TUNNEL_URL|" ~/.cloudflared/config.yml
        cloudflared tunnel route dns $TUNNEL_NAME $TUNNEL_URL || echo "Route may already exist"
        ;;
esac

echo -e "${GREEN}✅ DNS route configured${NC}"
echo ""

echo -e "${BLUE}📋 Step 5: Install as System Service${NC}"
echo "=================================================="

# Stop existing service if running
sudo systemctl stop cloudflared 2>/dev/null || true

# Install service
sudo cloudflared service install

# Start and enable service
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

echo -e "${GREEN}✅ Tunnel service installed and started${NC}"
echo ""

# Wait a moment for tunnel to start
sleep 5

echo -e "${BLUE}📋 Step 6: Verify Tunnel Status${NC}"
echo "=================================================="
sudo systemctl status cloudflared --no-pager || true
echo ""

echo -e "${BLUE}📋 Step 7: Update Application${NC}"
echo "=================================================="

if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    
    # Update backend .env
    if [ -f "backend/.env" ]; then
        echo "Updating backend/.env..."
        
        # Backup existing .env
        cp backend/.env backend/.env.backup
        
        # Update FRONTEND_URL
        if grep -q "FRONTEND_URL=" backend/.env; then
            sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=http://localhost:5173,https://$TUNNEL_URL|" backend/.env
        else
            echo "FRONTEND_URL=http://localhost:5173,https://$TUNNEL_URL" >> backend/.env
        fi
        
        echo -e "${GREEN}✅ backend/.env updated${NC}"
        
        # Restart Docker containers
        read -p "Do you want to restart Docker containers now? (Y/n): " restart_docker
        restart_docker=${restart_docker:-Y}
        
        if [[ $restart_docker =~ ^[Yy]$ ]]; then
            echo "Restarting Docker containers..."
            docker-compose down
            docker-compose up -d --build
            echo -e "${GREEN}✅ Docker containers restarted${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  App directory not found at $APP_DIR${NC}"
fi

echo ""
echo -e "${GREEN}=================================================="
echo "🎉 Setup Complete!"
echo "==================================================${NC}"
echo ""
echo -e "${BLUE}Your permanent tunnel URL:${NC}"
echo -e "${GREEN}https://$TUNNEL_URL${NC}"
echo ""
echo -e "${BLUE}Test your tunnel:${NC}"
echo "  curl https://$TUNNEL_URL/health"
echo "  curl https://$TUNNEL_URL/api/linkers"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  sudo systemctl status cloudflared  # Check status"
echo "  sudo systemctl restart cloudflared # Restart tunnel"
echo "  cloudflared tunnel list            # List tunnels"
echo "  sudo journalctl -u cloudflared -f  # View logs"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Update your local .env.local with:"
echo "   VITE_API_BASE_URL=https://$TUNNEL_URL/api"
echo ""
echo "2. Test your app at: https://$TUNNEL_URL"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "- Save your tunnel ID: $TUNNEL_ID"
echo "- Backup your credentials: ~/.cloudflared/$TUNNEL_ID.json"
echo "- This tunnel will auto-start on system reboot"
echo ""
