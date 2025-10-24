#!/bin/bash
# Update production environment with new Cloudflare tunnel URL

set -e

echo "🔧 Updating production environment with new Cloudflare tunnel..."

# New tunnel URL
NEW_TUNNEL_URL="https://measures-plastics-oval-trainer.trycloudflare.com"

# Update backend .env to allow the new tunnel URL in CORS
echo "📝 Updating backend/.env with new tunnel URL for CORS..."
cd backend

# Check if FRONTEND_URL exists and update it, or add it
if grep -q "FRONTEND_URL=" .env; then
    # Update existing FRONTEND_URL to include the new tunnel
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=http://localhost:5173,${NEW_TUNNEL_URL}|" .env
else
    # Add FRONTEND_URL if it doesn't exist
    echo "FRONTEND_URL=http://localhost:5173,${NEW_TUNNEL_URL}" >> .env
fi

cd ..

echo "🐳 Restarting Docker containers..."
docker-compose down
docker-compose up -d --build

echo "⏳ Waiting for services to start..."
sleep 10

echo "✅ Testing health endpoint..."
curl -f http://localhost/health || echo "❌ Health check failed"

echo "✅ Testing API endpoint..."
curl -f http://localhost/api/linkers || echo "❌ API check failed"

echo ""
echo "🎉 Production environment updated!"
echo "📍 Your app is now accessible at:"
echo "   ${NEW_TUNNEL_URL}"
echo ""
echo "⚠️  Note: This is a temporary Cloudflare tunnel. For production, consider:"
echo "   1. Setting up a named Cloudflare tunnel"
echo "   2. Using a custom domain"
echo "   3. Or using AWS Certificate Manager with an Application Load Balancer"
