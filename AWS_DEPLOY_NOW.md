# 🚀 Deploy PetaMini to AWS - Quick Start

## Prerequisites Setup (5 minutes)

### 1. Install AWS CLI (if not already installed)

**Windows PowerShell:**

```powershell
# Download installer
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Or use Chocolatey
choco install awscli
```

**Verify installation:**

```powershell
aws --version
# Should show: aws-cli/2.x.x
```

### 2. Configure AWS Credentials

**⚠️ SECURITY BEST PRACTICE: Create IAM User (NOT Root User!)**

See detailed guide: **`IAM_USER_SETUP.md`**

**Quick IAM User Setup:**

1. Go to: https://console.aws.amazon.com
2. Search **"IAM"** → **"Users"** → **"Create user"**
3. Username: `petamini-deployer`
4. Attach policies: `AmazonEC2FullAccess`, `AmazonVPCFullAccess`
5. **"Security credentials"** → **"Create access key"** → Choose **"CLI"**
6. Save both: Access Key ID and Secret Access Key

**Configure AWS CLI:**

```powershell
aws configure

# Enter IAM user credentials (NOT root):
AWS Access Key ID [None]: YOUR_IAM_ACCESS_KEY
AWS Secret Access Key [None]: YOUR_IAM_SECRET_KEY
Default region name [None]: us-east-1
Default output format [None]: json
```

**Verify (should show IAM user, not root):**

```powershell
aws sts get-caller-identity
# Should show: "arn:aws:iam::xxxxx:user/petamini-deployer"
```

---

## 🎯 Deployment Options

### Option 1: Elastic Beanstalk (Recommended - Easiest) ⭐⭐⭐

**Best for:** Quick deployment, automatic scaling, managed infrastructure  
**Cost:** ~$15-30/month (t2.micro free tier eligible)

```powershell
# Navigate to project
cd "d:\telegram-mini-app\New folder\TMA\petamini"

# Run deployment script
bash deploy-aws-beanstalk.sh
```

---

### Option 2: EC2 Instance (Full Control) ⭐⭐

**Best for:** Custom configuration, learning AWS  
**Cost:** ~$8-15/month (t2.micro free tier eligible)

```powershell
# Run deployment script
bash deploy-aws-ec2.sh
```

---

### Option 3: ECS Fargate (Serverless Containers) ⭐

**Best for:** Containerized apps, auto-scaling  
**Cost:** ~$10-20/month

```powershell
# Run deployment script
bash deploy-aws-ecs.sh
```

---

## 📋 Quick Deployment Scripts

I'll create automated deployment scripts for each option. Choose the one you prefer!

---

## 🔧 Manual AWS Elastic Beanstalk Deployment

If you prefer step-by-step:

### Step 1: Install EB CLI

```powershell
pip install awsebcli
```

### Step 2: Initialize Elastic Beanstalk

```powershell
cd backend
eb init -p go petamini-app --region us-east-1
```

### Step 3: Create environment

```powershell
eb create petamini-env
```

### Step 4: Set environment variables

```powershell
eb setenv MONGODB_URI="mongodb+srv://aswinmail12_db_user:N5ijckeY6tF9PAI9@cluster-petamini.brepo4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-petamini&tlsInsecure=true" TELEGRAM_BOT_TOKEN="TELEGRAM_BOT_TOKEN=__YOUR_TELEGRAM_BOT_TOKEN__"
```

### Step 5: Deploy

```powershell
eb deploy
```

### Step 6: Open app

```powershell
eb open
```

---

## 🔧 Manual EC2 Deployment

### Step 1: Create EC2 Instance

```powershell
# Create key pair
aws ec2 create-key-pair --key-name petamini-key --query 'KeyMaterial' --output text > petamini-key.pem

# Create instance (t2.micro - FREE tier)
aws ec2 run-instances `
  --image-id ami-0c55b159cbfafe1f0 `
  --instance-type t2.micro `
  --key-name petamini-key `
  --security-group-ids sg-xxxxx `
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=petamini-server}]'
```

### Step 2: Configure Security Group

```powershell
# Create security group
aws ec2 create-security-group --group-name petamini-sg --description "PetaMini Security Group"

# Allow SSH
aws ec2 authorize-security-group-ingress --group-name petamini-sg --protocol tcp --port 22 --cidr 0.0.0.0/0

# Allow HTTP
aws ec2 authorize-security-group-ingress --group-name petamini-sg --protocol tcp --port 80 --cidr 0.0.0.0/0

# Allow backend port
aws ec2 authorize-security-group-ingress --group-name petamini-sg --protocol tcp --port 8080 --cidr 0.0.0.0/0
```

### Step 3: Connect and Setup

```powershell
# Get instance IP
$INSTANCE_IP = aws ec2 describe-instances --filters "Name=tag:Name,Values=petamini-server" --query "Reservations[0].Instances[0].PublicIpAddress" --output text

# SSH into instance (use Git Bash or WSL)
ssh -i petamini-key.pem ec2-user@$INSTANCE_IP

# Inside EC2:
sudo yum update -y
sudo yum install git -y

# Install Go
wget https://go.dev/dl/go1.23.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.23.0.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Clone repository
git clone https://github.com/Aswin123as/petamini.git
cd petamini

# Setup backend
cd backend
cat > .env << 'EOF'
MONGODB_URI=mongodb+srv://aswinmail12_db_user:N5ijckeY6tF9PAI9@cluster-petamini.brepo4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-petamini&tlsInsecure=true
TELEGRAM_BOT_TOKEN=TELEGRAM_BOT_TOKEN=__YOUR_TELEGRAM_BOT_TOKEN__

PORT=8080
EOF

go build -o server main.go
nohup ./server > server.log 2>&1 &

# Setup frontend
cd ..
npm install
npm run build
sudo yum install nginx -y
sudo cp -r dist/* /usr/share/nginx/html/
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 🚀 Automated Deployment (Recommended)

I'll create three automated scripts for you:

1. **`deploy-aws-beanstalk.sh`** - Easiest, fully managed
2. **`deploy-aws-ec2.sh`** - Full control, single instance
3. **`deploy-aws-ecs.sh`** - Containerized, auto-scaling

Choose your preferred method and I'll create the script!

---

## 💰 Cost Estimates

| Method               | Monthly Cost | Free Tier                | Complexity |
| -------------------- | ------------ | ------------------------ | ---------- |
| Elastic Beanstalk    | $15-30       | ✅ t2.micro 750hrs/month | Low        |
| EC2 t2.micro         | $8-15        | ✅ 750hrs/month          | Medium     |
| ECS Fargate          | $10-20       | ❌ No free tier          | Medium     |
| Lambda + API Gateway | $5-10        | ✅ 1M requests/month     | High       |

**Note:** Free tier valid for 12 months for new AWS accounts

---

## 📊 What to Deploy?

Your app has two parts:

1. **Backend (Go API)** → Deploy to AWS
2. **Frontend (React)** → Options:
   - Host on EC2 with Nginx
   - Host on S3 + CloudFront (cheaper, faster)
   - Include in same EC2/Beanstalk instance

---

## ✅ Recommended Path for Your App

**Best Option: Elastic Beanstalk for Backend + S3 for Frontend**

1. Deploy backend to Elastic Beanstalk (auto-scaling, managed)
2. Deploy frontend to S3 + CloudFront (CDN, cheap, fast)
3. Total cost: ~$10-20/month (mostly free tier)

---

## 🎯 Next Steps

1. **Install AWS CLI** (if not done)
2. **Configure credentials**: `aws configure`
3. **Choose deployment method**:
   - Type "beanstalk" for managed deployment
   - Type "ec2" for full control
   - Type "ecs" for containers

Which deployment method do you prefer? I'll create the automated script for you!
