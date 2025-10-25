#!/bin/bash
# PetaMini EC2 Manual Deployment Script
# Run this script on your EC2 instance after SSH connection

set -e

echo "=========================================="
echo "🚀 PetaMini Deployment Script"
echo "=========================================="
echo ""

# Update system
echo "📦 Step 1: Updating system..."
sudo yum update -y 2>/dev/null || sudo apt update -y

# Install Git
echo "📦 Step 2: Installing Git..."
sudo yum install -y git 2>/dev/null || sudo apt install -y git

# Install Go
echo "🔧 Step 3: Installing Go 1.23..."
if ! command -v go &> /dev/null; then
    wget -q https://go.dev/dl/go1.23.0.linux-amd64.tar.gz
    sudo tar -C /usr/local -xzf go1.23.0.linux-amd64.tar.gz
    echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
    export PATH=$PATH:/usr/local/go/bin
    rm go1.23.0.linux-amd64.tar.gz
    echo "✅ Go installed"
else
    echo "✅ Go already installed"
fi

# Install Node.js
echo "🔧 Step 4: Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x 2>/dev/null | sudo bash - || \
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
    sudo yum install -y nodejs 2>/dev/null || sudo apt install -y nodejs
    echo "✅ Node.js installed"
else
    echo "✅ Node.js already installed ($(node -v))"
fi

# Install Nginx
echo "🔧 Step 5: Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo yum install -y nginx 2>/dev/null || sudo apt install -y nginx
    echo "✅ Nginx installed"
else
    echo "✅ Nginx already installed"
fi

# Clone or update repository
echo "📥 Step 6: Getting application code..."
if [ -d "petamini" ]; then
    echo "Repository exists, updating..."
    cd petamini
    git pull
    cd ..
else
    echo "Cloning repository..."
    git clone https://github.com/Aswin123as/petamini.git
fi

cd petamini

# Build backend
echo "🏗️  Step 7: Building backend..."
cd backend

# Create .env file
cat > .env << 'EOF'
MONGODB_URI=mongodb+srv://aswinmail12_db_user:N5ijckeY6tF9PAI9@cluster-petamini.brepo4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-petamini&tlsInsecure=true
TELEGRAM_BOT_TOKEN=__YOUR_TELEGRAM_BOT_TOKEN__
PORT=8080
ENVIRONMENT=production
EOF

# Build Go application
export PATH=$PATH:/usr/local/go/bin
go build -o petamini-server main.go
echo "✅ Backend built successfully"

# Create systemd service
echo "⚙️  Step 8: Setting up backend service..."
sudo tee /etc/systemd/system/petamini-backend.service > /dev/null <<EOSERVICE
[Unit]
Description=PetaMini Backend Service
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$HOME/petamini/backend
EnvironmentFile=$HOME/petamini/backend/.env
ExecStart=$HOME/petamini/backend/petamini-server
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOSERVICE

# Start backend service
sudo systemctl daemon-reload
sudo systemctl enable petamini-backend
sudo systemctl restart petamini-backend

echo "✅ Backend service started"
sleep 2

# Check backend status
if sudo systemctl is-active --quiet petamini-backend; then
    echo "✅ Backend is running"
else
    echo "❌ Backend failed to start. Check logs with: sudo journalctl -u petamini-backend -n 50"
fi

# Build frontend
echo "🏗️  Step 9: Building frontend..."
cd ..

# Get instance public IP
INSTANCE_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || curl -s http://checkip.amazonaws.com)
echo "Instance IP: $INSTANCE_IP"

# Create frontend .env
echo "VITE_API_URL=http://${INSTANCE_IP}:8080/api" > .env

# Install dependencies and build
npm install --silent
npm run build

echo "✅ Frontend built successfully"

# Deploy frontend to Nginx
echo "🚀 Step 10: Deploying frontend..."
sudo rm -rf /usr/share/nginx/html/* 2>/dev/null || sudo rm -rf /var/www/html/*
sudo cp -r dist/* /usr/share/nginx/html/ 2>/dev/null || sudo cp -r dist/* /var/www/html/

# Configure Nginx
NGINX_CONF="/etc/nginx/conf.d/petamini.conf"
if [ -d "/etc/nginx/conf.d" ]; then
    NGINX_CONF="/etc/nginx/conf.d/petamini.conf"
elif [ -d "/etc/nginx/sites-available" ]; then
    NGINX_CONF="/etc/nginx/sites-available/petamini"
fi

sudo tee $NGINX_CONF > /dev/null <<'EONGINX'
server {
    listen 80;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EONGINX

# Enable site for Ubuntu/Debian
if [ -d "/etc/nginx/sites-enabled" ]; then
    sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
fi

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "✅ Nginx configured and started"

echo ""
echo "=========================================="
echo "🎉 Deployment Complete!"
echo "=========================================="
echo ""
echo "🌐 Your application is live:"
echo "   Frontend:  http://$INSTANCE_IP"
echo "   Backend:   http://$INSTANCE_IP:8080/api"
echo "   Health:    http://$INSTANCE_IP:8080/health"
echo ""
echo "📊 Check status:"
echo "   Backend: sudo systemctl status petamini-backend"
echo "   Nginx:   sudo systemctl status nginx"
echo ""
echo "📝 View logs:"
echo "   Backend: sudo journalctl -u petamini-backend -f"
echo "   Nginx:   sudo tail -f /var/log/nginx/access.log"
echo ""
echo "🔄 Restart services:"
echo "   Backend: sudo systemctl restart petamini-backend"
echo "   Nginx:   sudo systemctl restart nginx"
echo ""
