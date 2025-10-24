#!/bin/bash
# Clean EC2 and Deploy with Docker - Fresh Start

set -e

echo "=========================================="
echo "🧹 Cleaning EC2 Instance"
echo "=========================================="
echo ""

# Stop and remove old systemd services
echo "📦 Removing old services..."
sudo systemctl stop petamini-backend 2>/dev/null || true
sudo systemctl disable petamini-backend 2>/dev/null || true
sudo rm -f /etc/systemd/system/petamini-backend.service
sudo systemctl daemon-reload

# Stop nginx if running
sudo systemctl stop nginx 2>/dev/null || true

# Remove old application files
echo "🗑️  Removing old application files..."
rm -rf ~/petamini
rm -rf ~/deploy.sh

# Clean nginx html directory
sudo rm -rf /usr/share/nginx/html/*
sudo rm -rf /var/www/html/*
sudo rm -f /etc/nginx/conf.d/petamini.conf
sudo rm -f /etc/nginx/sites-enabled/petamini
sudo rm -f /etc/nginx/sites-available/petamini

echo "✅ Cleanup complete!"
echo ""

echo "=========================================="
echo "🐳 Installing Docker & Docker Compose"
echo "=========================================="
echo ""

# Update system
echo "📦 Updating system..."
sudo yum update -y

# Install Docker
echo "📦 Installing Docker..."
sudo yum install -y docker git

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
echo "📦 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo "✅ Docker installed successfully!"
echo ""

echo "=========================================="
echo "📥 Cloning Application"
echo "=========================================="
echo ""

# Clone fresh repository
git clone https://github.com/Aswin123as/petamini.git
cd petamini

echo "✅ Repository cloned!"
echo ""

echo "=========================================="
echo "⚠️  IMPORTANT NEXT STEPS"
echo "=========================================="
echo ""
echo "1. Logout from EC2:"
echo "   exit"
echo ""
echo "2. SSH back into EC2"
echo ""
echo "3. Navigate to project and start Docker:"
echo "   cd petamini"
echo "   docker-compose up -d --build"
echo ""
echo "4. Check status:"
echo "   docker-compose ps"
echo "   docker-compose logs -f"
echo ""
echo "5. Access your app:"
echo "   Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "   Backend:  http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8080/api"
echo ""
