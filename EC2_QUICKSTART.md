# Quick EC2 Deployment - Start Here!

## 🚀 Fast Track (30 minutes total)

### Step 1: Install AWS CLI (5 minutes)

**Run in PowerShell as Administrator:**

```powershell
# Download AWS CLI
Start-BitsTransfer -Source "https://awscli.amazonaws.com/AWSCLIV2.msi" -Destination "$env:TEMP\AWSCLIV2.msi"

# Install
Start-Process msiexec.exe -Wait -ArgumentList "/i $env:TEMP\AWSCLIV2.msi /quiet"
```

**Close and reopen PowerShell, then verify:**

```powershell
aws --version
# Should show: aws-cli/2.x.x
```

---

### Step 2: Create IAM User (Recommended - More Secure)

**⚠️ IMPORTANT: Do NOT use root user access keys!**

See detailed guide: **`IAM_USER_SETUP.md`**

**Quick Steps:**

1. Login to AWS: https://console.aws.amazon.com
2. Search for **"IAM"** → Click **"Users"** → **"Create user"**
3. Username: `petamini-deployer`
4. Attach policies:
   - ✅ `AmazonEC2FullAccess`
   - ✅ `AmazonVPCFullAccess`
5. Create user → Go to **"Security credentials"** tab
6. Click **"Create access key"** → Choose **"CLI"**
7. **SAVE BOTH** (you can't see the Secret Key again!):
   - Access Key ID: `AKIA...`
   - Secret Access Key: `wJal...`

---

### Step 3: Configure AWS (2 minutes)

```powershell
aws configure
```

Enter:

- **Access Key ID**: [paste your key]
- **Secret Access Key**: [paste your secret]
- **Region**: `us-east-1`
- **Format**: `json`

**Verify:**

```powershell
aws sts get-caller-identity
```

---

### Step 4: Run Deployment Script (20 minutes)

```powershell
# Navigate to project
cd "d:\telegram-mini-app\New folder\TMA\petamini"

# Run automated deployment
.\deploy-aws-ec2.ps1
```

**The script will:**

1. ✅ Create SSH key pair
2. ✅ Create security group (ports 22, 80, 8080)
3. ✅ Launch t2.micro EC2 instance (FREE)
4. ✅ Give you the instance IP
5. ✅ Create deployment script for SSH

---

### Step 5: Complete Setup via SSH

After the script finishes, you'll see instructions like:

```
Instance IP: 3.123.45.67

To complete deployment:
1. ssh -i petamini-key.pem ec2-user@3.123.45.67
2. Run the deployment commands
```

**Using Git Bash:**

```bash
# Set key permissions (in PowerShell first)
icacls petamini-key.pem /inheritance:r
icacls petamini-key.pem /grant:r "$env:USERNAME:(R)"

# Connect (in Git Bash)
ssh -i petamini-key.pem ec2-user@YOUR_INSTANCE_IP
```

**Once connected, copy and paste this entire script:**

```bash
#!/bin/bash
set -e

echo "📦 Updating system..."
sudo yum update -y

echo "📦 Installing dependencies..."
sudo yum install -y git nginx

# Install Go
echo "🔧 Installing Go..."
wget https://go.dev/dl/go1.23.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.23.0.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
export PATH=$PATH:/usr/local/go/bin

# Install Node.js
echo "🔧 Installing Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Clone repository
echo "📥 Cloning repository..."
git clone https://github.com/Aswin123as/petamini.git
cd petamini

# Setup backend
echo "🏗️ Building backend..."
cd backend
cat > .env << 'EOF'
MONGODB_URI=mongodb+srv://aswinmail12_db_user:N5ijckeY6tF9PAI9@cluster-petamini.brepo4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-petamini&tlsInsecure=true
TELEGRAM_BOT_TOKEN=TELEGRAM_BOT_TOKEN=__YOUR_TELEGRAM_BOT_TOKEN__

PORT=8080
ENVIRONMENT=production
EOF

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
sudo systemctl start petamini-backend

# Build frontend
echo "🏗️ Building frontend..."
cd ..
INSTANCE_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "VITE_API_URL=http://${INSTANCE_IP}:8080/api" > .env
npm install
npm run build

# Deploy frontend
echo "🚀 Deploying frontend..."
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

sudo systemctl start nginx
sudo systemctl enable nginx

echo ""
echo "=========================================="
echo "🎉 Deployment Complete!"
echo "=========================================="
echo "Frontend: http://$INSTANCE_IP"
echo "Backend: http://$INSTANCE_IP:8080/api"
echo "Health: http://$INSTANCE_IP:8080/health"
```

---

## 🎉 Done!

Your app will be live at: `http://YOUR_INSTANCE_IP`

---

## 📊 Quick Commands

```bash
# View backend logs
sudo journalctl -u petamini-backend -f

# Restart backend
sudo systemctl restart petamini-backend

# Check status
sudo systemctl status petamini-backend
sudo systemctl status nginx
```

---

## 💰 Cost

- **t2.micro**: FREE for 12 months
- After 12 months: ~$8/month
- Stop when not using: $0

---

**Need help?** Check `COMPLETE_EC2_DEPLOYMENT.md` for full details.
