#!/bin/bash
# Docker Production Deployment on EC2

set -e

echo "🚀 Installing Docker and Docker Compose..."

# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo "✅ Docker installed successfully"
echo ""
echo "⚠️  IMPORTANT: You need to logout and login again for docker group to take effect"
echo ""
echo "After logging back in, run these commands:"
echo ""
echo "  cd petamini"
echo "  docker-compose up -d --build"
echo ""
echo "To logout, type: exit"
