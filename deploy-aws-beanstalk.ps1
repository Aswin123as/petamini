# PowerShell script for AWS Elastic Beanstalk deployment
# Deploy PetaMini backend to AWS Elastic Beanstalk

Write-Host "🚀 PetaMini - AWS Elastic Beanstalk Deployment" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# Configuration
$APP_NAME = "petamini-app"
$ENV_NAME = "petamini-env"
$REGION = "us-east-1"

# Check AWS CLI
Write-Host "`n📋 Step 1: Checking AWS CLI..." -ForegroundColor Blue
try {
    $awsVersion = aws --version 2>&1
    Write-Host "✅ AWS CLI installed: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found!" -ForegroundColor Red
    Write-Host "Install from: https://awscli.amazonaws.com/AWSCLIV2.msi" -ForegroundColor Yellow
    exit 1
}

# Check credentials
Write-Host "`n📋 Step 2: Checking AWS credentials..." -ForegroundColor Blue
try {
    $identity = aws sts get-caller-identity 2>&1 | ConvertFrom-Json
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ AWS credentials configured" -ForegroundColor Green
        
        # Check if using root user (security warning)
        if ($identity.Arn -like "*:root") {
            Write-Host ""
            Write-Host "⚠️  WARNING: Using root user credentials!" -ForegroundColor Red
            Write-Host "   This is NOT recommended for security reasons." -ForegroundColor Yellow
            Write-Host "   Consider creating an IAM user instead." -ForegroundColor Yellow
            Write-Host "   See: IAM_USER_SETUP.md for instructions" -ForegroundColor Cyan
            Write-Host ""
            $continue = Read-Host "Continue anyway? (yes/no)"
            if ($continue -ne "yes") {
                Write-Host "Deployment cancelled. Please create an IAM user first." -ForegroundColor Yellow
                exit 1
            }
        } else {
            $userName = $identity.Arn.Split('/')[-1]
            Write-Host "✅ Using IAM user: $userName" -ForegroundColor Green
        }
    } else {
        throw "Not configured"
    }
} catch {
    Write-Host "❌ AWS credentials not configured!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please configure AWS CLI:" -ForegroundColor Yellow
    Write-Host "  1. Create an IAM user (see IAM_USER_SETUP.md)" -ForegroundColor Cyan
    Write-Host "  2. Run: aws configure" -ForegroundColor White
    Write-Host "  3. Enter your IAM user credentials" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Install EB CLI if needed
Write-Host "`n📋 Step 3: Checking Elastic Beanstalk CLI..." -ForegroundColor Blue
try {
    $ebVersion = eb --version 2>&1
    Write-Host "✅ EB CLI installed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  EB CLI not found. Installing..." -ForegroundColor Yellow
    pip install awsebcli --quiet
    Write-Host "✅ EB CLI installed" -ForegroundColor Green
}

# Navigate to backend
Write-Host "`n📋 Step 4: Preparing backend..." -ForegroundColor Blue
Set-Location backend

# Create .ebextensions directory if not exists
if (-not (Test-Path ".ebextensions")) {
    New-Item -ItemType Directory -Path ".ebextensions" | Out-Null
}

# Create Elastic Beanstalk configuration
Write-Host "📝 Creating Elastic Beanstalk configuration..." -ForegroundColor Yellow
@"
option_settings:
  aws:elasticbeanstalk:container:golang:
    ProxyServer: nginx
  aws:elasticbeanstalk:application:environment:
    PORT: 8080
    ENVIRONMENT: production
  aws:autoscaling:launchconfiguration:
    InstanceType: t2.micro
  aws:elasticbeanstalk:environment:
    EnvironmentType: SingleInstance
"@ | Out-File -FilePath ".ebextensions/01_options.config" -Encoding UTF8

# Create Buildfile for Go
@"
make: go build -o application main.go
"@ | Out-File -FilePath "Buildfile" -Encoding UTF8

# Create Procfile
@"
web: ./application
"@ | Out-File -FilePath "Procfile" -Encoding UTF8

Write-Host "✅ Configuration files created" -ForegroundColor Green

# Initialize EB (if not already initialized)
Write-Host "`n📋 Step 5: Initializing Elastic Beanstalk..." -ForegroundColor Blue
if (-not (Test-Path ".elasticbeanstalk")) {
    eb init -p go $APP_NAME --region $REGION
    Write-Host "✅ Elastic Beanstalk initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Already initialized" -ForegroundColor Green
}

# Create environment (if not exists)
Write-Host "`n📋 Step 6: Creating environment..." -ForegroundColor Blue
$envExists = eb list 2>&1 | Select-String $ENV_NAME
if (-not $envExists) {
    Write-Host "⚙️  Creating environment (this may take 5-10 minutes)..." -ForegroundColor Yellow
    eb create $ENV_NAME --instance-type t2.micro --single
    Write-Host "✅ Environment created" -ForegroundColor Green
} else {
    Write-Host "✅ Environment already exists" -ForegroundColor Green
}

# Set environment variables
Write-Host "`n📋 Step 7: Setting environment variables..." -ForegroundColor Blue
eb setenv `
    MONGODB_URI="mongodb+srv://aswinmail12_db_user:N5ijckeY6tF9PAI9@cluster-petamini.brepo4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-petamini&tlsInsecure=true" `
    TELEGRAM_BOT_TOKEN="TELEGRAM_BOT_TOKEN=__YOUR_TELEGRAM_BOT_TOKEN__" `
    PORT="8080"
Write-Host "✅ Environment variables set" -ForegroundColor Green

# Deploy application
Write-Host "`n📋 Step 8: Deploying application..." -ForegroundColor Blue
Write-Host "⚙️  Building and deploying (this may take 3-5 minutes)..." -ForegroundColor Yellow
eb deploy
Write-Host "✅ Application deployed" -ForegroundColor Green

# Get application URL
Write-Host "`n📋 Step 9: Getting application URL..." -ForegroundColor Blue
$url = eb status | Select-String "CNAME:" | ForEach-Object { $_.ToString().Split(":")[1].Trim() }

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your backend is live at:" -ForegroundColor Cyan
Write-Host "   http://$url" -ForegroundColor Yellow
Write-Host "   Health: http://$url/health" -ForegroundColor Yellow
Write-Host "   API: http://$url/api" -ForegroundColor Yellow
Write-Host ""
Write-Host "📊 Useful Commands:" -ForegroundColor Cyan
Write-Host "   View logs:    eb logs" -ForegroundColor White
Write-Host "   Open app:     eb open" -ForegroundColor White
Write-Host "   Check status: eb status" -ForegroundColor White
Write-Host "   Redeploy:     eb deploy" -ForegroundColor White
Write-Host "   Terminate:    eb terminate" -ForegroundColor White
Write-Host ""
Write-Host "💰 Cost: ~$15-30/month (FREE for first 12 months with t2.micro)" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Update frontend API URL to: http://$url/api" -ForegroundColor White
Write-Host "   2. Deploy frontend to S3 (optional)" -ForegroundColor White
Write-Host "   3. Set up custom domain (optional)" -ForegroundColor White
Write-Host ""

# Go back to project root
Set-Location ..
