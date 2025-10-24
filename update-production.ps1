# Update Production with New Cloudflare Tunnel
# Run this script to update your EC2 instance with the new tunnel URL

$NEW_TUNNEL_URL = "https://measures-plastics-oval-trainer.trycloudflare.com"
$EC2_IP = "3.26.150.79"
$EC2_USER = "ubuntu"  # or "ec2-user" depending on your AMI
$KEY_PATH = "path/to/your/key.pem"  # Update this with your actual key path

Write-Host "🔧 Updating production environment on EC2..." -ForegroundColor Cyan

# Commands to run on EC2
$commands = @"
cd ~/petamini || cd /home/ubuntu/petamini || cd /opt/petamini

# Update backend .env with new tunnel URL
if grep -q 'FRONTEND_URL=' backend/.env; then
    sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=http://localhost:5173,${NEW_TUNNEL_URL}|' backend/.env
else
    echo 'FRONTEND_URL=http://localhost:5173,${NEW_TUNNEL_URL}' >> backend/.env
fi

# Restart containers
docker-compose down
docker-compose up -d --build

# Wait for services
sleep 10

# Test
echo '✅ Testing endpoints...'
curl -f http://localhost/health
curl -f http://localhost/api/linkers
"@

Write-Host "📋 Commands to run on EC2:" -ForegroundColor Yellow
Write-Host $commands -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 To apply these changes, SSH to your EC2 and run:" -ForegroundColor Green
Write-Host "ssh -i $KEY_PATH $EC2_USER@$EC2_IP" -ForegroundColor White
Write-Host ""
Write-Host "Then copy and paste the commands above." -ForegroundColor Green
Write-Host ""
Write-Host "Or run this one-liner:" -ForegroundColor Yellow
Write-Host "ssh -i $KEY_PATH $EC2_USER@$EC2_IP 'cd ~/petamini && sed -i ""s|FRONTEND_URL=.*|FRONTEND_URL=http://localhost:5173,$NEW_TUNNEL_URL|"" backend/.env && docker-compose down && docker-compose up -d --build'" -ForegroundColor White
