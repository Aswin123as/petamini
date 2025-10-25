# PowerShell script for AWS EC2 deployment
# Deploy PetaMini to a single EC2 instance

Write-Host "🚀 PetaMini - AWS EC2 Deployment" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Configuration
$INSTANCE_NAME = "petamini-server"
$KEY_NAME = "petamini-key"
$SECURITY_GROUP = "petamini-sg"
$REGION = "us-east-1"
$INSTANCE_TYPE = "t2.micro"  # FREE tier eligible
$AMI_ID = "ami-0c55b159cbfafe1f0"  # Amazon Linux 2

# Check AWS CLI
Write-Host "`n📋 Step 1: Checking AWS CLI..." -ForegroundColor Blue
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not installed!" -ForegroundColor Red
    Write-Host "Download from: https://awscli.amazonaws.com/AWSCLIV2.msi" -ForegroundColor Yellow
    exit 1
}

# Check AWS credentials
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

# Create key pair
Write-Host "`n📋 Step 3: Creating SSH key pair..." -ForegroundColor Blue
if (Test-Path "$KEY_NAME.pem") {
    Write-Host "✅ Key pair already exists" -ForegroundColor Green
} else {
    aws ec2 create-key-pair --key-name $KEY_NAME --query 'KeyMaterial' --output text | Out-File -FilePath "$KEY_NAME.pem" -Encoding ASCII
    Write-Host "✅ Key pair created: $KEY_NAME.pem" -ForegroundColor Green
    Write-Host "⚠️  Keep this file safe!" -ForegroundColor Yellow
}

# Create security group
Write-Host "`n📋 Step 4: Creating security group..." -ForegroundColor Blue
$sgExists = aws ec2 describe-security-groups --group-names $SECURITY_GROUP 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Security group already exists" -ForegroundColor Green
} else {
    $vpcId = aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text
    aws ec2 create-security-group --group-name $SECURITY_GROUP --description "PetaMini Security Group" --vpc-id $vpcId
    
    # Allow SSH (port 22)
    aws ec2 authorize-security-group-ingress --group-name $SECURITY_GROUP --protocol tcp --port 22 --cidr 0.0.0.0/0
    
    # Allow HTTP (port 80)
    aws ec2 authorize-security-group-ingress --group-name $SECURITY_GROUP --protocol tcp --port 80 --cidr 0.0.0.0/0
    
    # Allow backend (port 8080)
    aws ec2 authorize-security-group-ingress --group-name $SECURITY_GROUP --protocol tcp --port 8080 --cidr 0.0.0.0/0
    
    Write-Host "✅ Security group created with ports: 22, 80, 8080" -ForegroundColor Green
}

# Create EC2 instance
Write-Host "`n📋 Step 5: Creating EC2 instance..." -ForegroundColor Blue
$instanceExists = aws ec2 describe-instances --filters "Name=tag:Name,Values=$INSTANCE_NAME" "Name=instance-state-name,Values=running,pending" --query "Reservations[0].Instances[0].InstanceId" --output text

if ($instanceExists -and $instanceExists -ne "None") {
    Write-Host "✅ Instance already running" -ForegroundColor Green
    $INSTANCE_ID = $instanceExists
} else {
    Write-Host "⚙️  Launching EC2 instance (t2.micro)..." -ForegroundColor Yellow
    $INSTANCE_ID = aws ec2 run-instances `
        --image-id $AMI_ID `
        --instance-type $INSTANCE_TYPE `
        --key-name $KEY_NAME `
        --security-groups $SECURITY_GROUP `
        --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" `
        --query "Instances[0].InstanceId" `
        --output text
    
    Write-Host "⏳ Waiting for instance to start..." -ForegroundColor Yellow
    aws ec2 wait instance-running --instance-ids $INSTANCE_ID
    Write-Host "✅ Instance created: $INSTANCE_ID" -ForegroundColor Green
}

# Get instance IP
Write-Host "`n📋 Step 6: Getting instance IP..." -ForegroundColor Blue
$INSTANCE_IP = aws ec2 describe-instances --instance-ids $INSTANCE_ID --query "Reservations[0].Instances[0].PublicIpAddress" --output text
Write-Host "✅ Instance IP: $INSTANCE_IP" -ForegroundColor Green

# Create deployment script
Write-Host "`n📋 Step 7: Creating deployment script..." -ForegroundColor Blue
$deployScript = @"
#!/bin/bash
set -e

echo '📦 Updating system...'
sudo yum update -y

echo '📦 Installing Git...'
sudo yum install -y git

echo '🔧 Installing Go...'
if ! command -v go &> /dev/null; then
    wget https://go.dev/dl/go1.23.0.linux-amd64.tar.gz
    sudo tar -C /usr/local -xzf go1.23.0.linux-amd64.tar.gz
    echo 'export PATH=`$PATH:/usr/local/go/bin' >> ~/.bashrc
    export PATH=`$PATH:/usr/local/go/bin
fi

echo '🔧 Installing Node.js...'
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo yum install -y nodejs
fi

echo '🔧 Installing Nginx...'
sudo yum install -y nginx

echo '📥 Cloning repository...'
if [ -d 'petamini' ]; then
    cd petamini
    git pull
else
    git clone https://github.com/Aswin123as/petamini.git
    cd petamini
fi

echo '🏗️  Building backend...'
cd backend
cat > .env << 'EOL'
MONGODB_URI=mongodb+srv://aswinmail12_db_user:N5ijckeY6tF9PAI9@cluster-petamini.brepo4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-petamini&tlsInsecure=true
TELEGRAM_BOT_TOKEN=TELEGRAM_BOT_TOKEN=__YOUR_TELEGRAM_BOT_TOKEN__

PORT=8080
ENVIRONMENT=production
EOL

export PATH=`$PATH:/usr/local/go/bin
go build -o petamini-server main.go

# Create systemd service
sudo tee /etc/systemd/system/petamini-backend.service > /dev/null <<'EOSERVICE'
[Unit]
Description=PetaMini Backend Service
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/petamini/backend
EnvironmentFile=/home/ec2-user/petamini/backend/.env
ExecStart=/home/ec2-user/petamini/backend/petamini-server
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOSERVICE

sudo systemctl daemon-reload
sudo systemctl enable petamini-backend
sudo systemctl restart petamini-backend

echo '🏗️  Building frontend...'
cd ..
echo \"VITE_API_URL=http://$INSTANCE_IP:8080/api\" > .env
npm install --silent
npm run build

echo '🚀 Deploying frontend...'
sudo rm -rf /usr/share/nginx/html/*
sudo cp -r dist/* /usr/share/nginx/html/

# Configure Nginx
sudo tee /etc/nginx/conf.d/petamini.conf > /dev/null <<'EONGINX'
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files `$uri `$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_cache_bypass `$http_upgrade;
    }
}
EONGINX

sudo systemctl start nginx
sudo systemctl enable nginx

echo '✅ Deployment complete!'
"@

$deployScript | Out-File -FilePath "deploy-to-ec2.sh" -Encoding UTF8
Write-Host "✅ Deployment script created" -ForegroundColor Green

# Instructions for manual deployment
Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "🎉 EC2 Instance Ready!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 To complete deployment, run these commands:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Set correct permissions on key file:" -ForegroundColor Yellow
Write-Host "   icacls $KEY_NAME.pem /inheritance:r" -ForegroundColor White
Write-Host "   icacls $KEY_NAME.pem /grant:r `"${env:USERNAME}:(R)`"" -ForegroundColor White
Write-Host ""
Write-Host "2. Connect to EC2 (using Git Bash or WSL):" -ForegroundColor Yellow
Write-Host "   ssh -i $KEY_NAME.pem ec2-user@$INSTANCE_IP" -ForegroundColor White
Write-Host ""
Write-Host "3. On the EC2 instance, run:" -ForegroundColor Yellow
Write-Host "   (copy and paste the deploy-to-ec2.sh content)" -ForegroundColor White
Write-Host ""
Write-Host "OR use SCP to upload and run the script:" -ForegroundColor Yellow
Write-Host "   scp -i $KEY_NAME.pem deploy-to-ec2.sh ec2-user@${INSTANCE_IP}:~/" -ForegroundColor White
Write-Host "   ssh -i $KEY_NAME.pem ec2-user@$INSTANCE_IP 'bash deploy-to-ec2.sh'" -ForegroundColor White
Write-Host ""
Write-Host "🌐 After deployment, your app will be at:" -ForegroundColor Cyan
Write-Host "   Frontend: http://$INSTANCE_IP" -ForegroundColor Yellow
Write-Host "   Backend: http://$INSTANCE_IP:8080/api" -ForegroundColor Yellow
Write-Host "   Health: http://$INSTANCE_IP:8080/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "💰 Cost: ~$8-15/month (FREE for 12 months with t2.micro)" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Manage your instance:" -ForegroundColor Cyan
Write-Host "   View logs: ssh -i $KEY_NAME.pem ec2-user@$INSTANCE_IP 'sudo journalctl -u petamini-backend -f'" -ForegroundColor White
Write-Host "   Stop: aws ec2 stop-instances --instance-ids $INSTANCE_ID" -ForegroundColor White
Write-Host "   Start: aws ec2 start-instances --instance-ids $INSTANCE_ID" -ForegroundColor White
Write-Host "   Terminate: aws ec2 terminate-instances --instance-ids $INSTANCE_ID" -ForegroundColor White
Write-Host ""
