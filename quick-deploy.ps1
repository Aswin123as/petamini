# Quick deployment script for code changes
Write-Host "🚀 Quick deployment starting..." -ForegroundColor Cyan

$EC2_HOST = "ubuntu@3.26.150.79"
$SSH_KEY = "D:\telegram-mini-app\New folder\TMA\petamini\sydney.pem"

Write-Host "`n📤 Uploading backend files..." -ForegroundColor Yellow
scp -i $SSH_KEY backend/handlers/linker_handler.go ${EC2_HOST}:/home/ubuntu/backend/handlers/
scp -i $SSH_KEY backend/main.go ${EC2_HOST}:/home/ubuntu/backend/

Write-Host "`n🔨 Rebuilding backend on EC2..." -ForegroundColor Yellow
ssh -i $SSH_KEY $EC2_HOST "cd /home/ubuntu && docker-compose up -d --build backend"

Write-Host "`n✅ Backend deployed with duplicate link detection!" -ForegroundColor Green
Write-Host "📝 Changes:" -ForegroundColor White
Write-Host "  • Added duplicate link checking before post submission" -ForegroundColor White
Write-Host "  • Backend validates if URL already exists" -ForegroundColor White
Write-Host "  • User gets warning toast if link already posted" -ForegroundColor White
