# Full rebuild and deployment script for PetaMini
# This script rebuilds both frontend and backend and deploys to EC2

Write-Host "🚀 Starting full rebuild and deployment..." -ForegroundColor Cyan

# Configuration
$EC2_HOST = "ubuntu@3.26.150.79"
$SSH_KEY = "D:\telegram-mini-app\New folder\TMA\petamini\sydney.pem"
$REMOTE_DIR = "/home/ubuntu"

Write-Host "`n📦 Step 1: Building frontend locally..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend built successfully" -ForegroundColor Green

Write-Host "`n📤 Step 2: Uploading files to EC2..." -ForegroundColor Yellow

# Upload backend files
Write-Host "Uploading backend..." -ForegroundColor Gray
scp -i $SSH_KEY -r backend/* ${EC2_HOST}:${REMOTE_DIR}/backend/

# Upload docker files
Write-Host "Uploading Docker configuration..." -ForegroundColor Gray
scp -i $SSH_KEY docker-compose.yml ${EC2_HOST}:${REMOTE_DIR}/
scp -i $SSH_KEY Dockerfile ${EC2_HOST}:${REMOTE_DIR}/
scp -i $SSH_KEY backend/Dockerfile ${EC2_HOST}:${REMOTE_DIR}/backend/

# Upload nginx config
Write-Host "Uploading nginx configuration..." -ForegroundColor Gray
scp -i $SSH_KEY nginx.conf ${EC2_HOST}:${REMOTE_DIR}/

# Upload frontend dist
Write-Host "Uploading frontend dist..." -ForegroundColor Gray
ssh -i $SSH_KEY $EC2_HOST "rm -rf ${REMOTE_DIR}/dist"
scp -i $SSH_KEY -r dist ${EC2_HOST}:${REMOTE_DIR}/

Write-Host "✅ Files uploaded successfully" -ForegroundColor Green

Write-Host "`n🔨 Step 3: Rebuilding containers on EC2..." -ForegroundColor Yellow
ssh -i $SSH_KEY $EC2_HOST "cd ${REMOTE_DIR} && docker-compose down && docker-compose up -d --build"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker rebuild failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n⏳ Step 4: Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "`n🔍 Step 5: Checking container status..." -ForegroundColor Yellow
ssh -i $SSH_KEY $EC2_HOST "cd ${REMOTE_DIR} && docker-compose ps"

Write-Host "`n🔍 Step 6: Testing API endpoint..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "https://linkshare.fun/api/health" -UseBasicParsing -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) {
    Write-Host "✅ API is responding correctly" -ForegroundColor Green
} else {
    Write-Host "⚠️ API might not be ready yet, check manually" -ForegroundColor Yellow
}

Write-Host "`n✨ Deployment complete!" -ForegroundColor Cyan
Write-Host "🌐 Frontend: https://linkshare.fun" -ForegroundColor White
Write-Host "🔌 Backend API: https://linkshare.fun/api" -ForegroundColor White
Write-Host "`n📝 Changes deployed:" -ForegroundColor White
Write-Host "  • Removed unused isInitialMount variable" -ForegroundColor White
Write-Host "  • Added async cleanup for memory leak prevention" -ForegroundColor White
Write-Host "  • Optimized getSortedLinks with useMemo" -ForegroundColor White
Write-Host "  • Optimized word/tag count calculations" -ForegroundColor White
Write-Host "  • Fixed promotion to be non-toggleable (one-time only)" -ForegroundColor White
