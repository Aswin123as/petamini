# AWS Deployment Guide for PetaMini Backend

This guide covers deploying the Go backend to AWS using different methods.

## Table of Contents

1. [AWS Elastic Beanstalk (Easiest)](#method-1-aws-elastic-beanstalk)
2. [AWS ECS with Fargate (Docker)](#method-2-aws-ecs-with-fargate)
3. [AWS EC2 (Manual)](#method-3-aws-ec2)
4. [AWS Lambda (Serverless)](#method-4-aws-lambda)

---

## Prerequisites

- AWS Account
- AWS CLI installed and configured
- Docker installed (for containerized deployments)
- MongoDB Atlas connection string

---

## Method 1: AWS Elastic Beanstalk (Recommended for Beginners)

### Step 1: Install EB CLI

```bash
pip install awsebcli
```

### Step 2: Initialize Elastic Beanstalk

```bash
cd backend
eb init -p go petamini-backend --region us-east-1
```

### Step 3: Create `.ebextensions` Configuration

Already created in this directory. See `.ebextensions/` folder.

### Step 4: Create Environment

```bash
eb create petamini-backend-env
```

### Step 5: Set Environment Variables

```bash
eb setenv MONGODB_URI="your-mongodb-connection-string"
eb setenv PORT=8080
eb setenv TELEGRAM_BOT_TOKEN="your-bot-token"
```

### Step 6: Deploy

```bash
eb deploy
```

### Step 7: Open Application

```bash
eb open
```

### Step 8: View Logs

```bash
eb logs
```

---

## Method 2: AWS ECS with Fargate (Docker - Recommended for Production)

### Step 1: Build and Push Docker Image to ECR

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Create ECR repository
aws ecr create-repository --repository-name petamini-backend --region us-east-1

# Build Docker image
docker build -t petamini-backend .

# Tag image
docker tag petamini-backend:latest YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/petamini-backend:latest

# Push to ECR
docker push YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/petamini-backend:latest
```

### Step 2: Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name petamini-cluster --region us-east-1
```

### Step 3: Create Task Definition

Use the `ecs-task-definition.json` file in this directory:

```bash
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json
```

### Step 4: Create ECS Service

```bash
aws ecs create-service \
  --cluster petamini-cluster \
  --service-name petamini-backend-service \
  --task-definition petamini-backend-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}"
```

### Step 5: Setup Application Load Balancer (Optional but Recommended)

1. Go to AWS Console → EC2 → Load Balancers
2. Create Application Load Balancer
3. Configure target group pointing to ECS service
4. Update ECS service to use load balancer

---

## Method 3: AWS EC2 (Manual Deployment)

### Step 1: Launch EC2 Instance

```bash
# Use Amazon Linux 2 AMI
# t2.micro is fine for testing (free tier eligible)
# t3.small recommended for production
```

### Step 2: Connect to EC2

```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### Step 3: Install Go on EC2

```bash
wget https://go.dev/dl/go1.23.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.23.0.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc
```

### Step 4: Clone Your Repository

```bash
git clone https://github.com/your-username/petamini.git
cd petamini/backend
```

### Step 5: Create .env File

```bash
nano .env
```

Add your environment variables:

```
MONGODB_URI=your-mongodb-connection-string
PORT=8080
TELEGRAM_BOT_TOKEN=your-bot-token
```

### Step 6: Build and Run

```bash
go build -o petamini-server main.go
sudo ./petamini-server
```

### Step 7: Setup as System Service

Create `/etc/systemd/system/petamini.service`:

```ini
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

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable petamini
sudo systemctl start petamini
sudo systemctl status petamini
```

### Step 8: Configure Security Group

- Allow inbound traffic on port 8080
- Allow SSH (port 22) from your IP

---

## Method 4: AWS Lambda with API Gateway (Serverless)

### Step 1: Install AWS SAM CLI

```bash
pip install aws-sam-cli
```

### Step 2: Create SAM Template

Use the `template.yaml` in this directory.

### Step 3: Build

```bash
sam build
```

### Step 4: Deploy

```bash
sam deploy --guided
```

---

## Environment Variables Setup

All methods require these environment variables:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
PORT=8080
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

### Setting Environment Variables by Method:

**Elastic Beanstalk:**

```bash
eb setenv KEY=VALUE
```

**ECS:**
Add to task definition JSON under `environment` array

**EC2:**
Add to `.env` file or systemd service file

**Lambda:**
Add in AWS Console → Lambda → Configuration → Environment variables

---

## Connecting Frontend to Deployed Backend

After deployment, update your frontend API URL:

### Option 1: Update `src/services/linkerService.ts`

```typescript
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
```

### Option 2: Create `.env` in frontend root

```
VITE_API_URL=https://your-backend-url.com/api
```

---

## Cost Estimation (Monthly)

- **Elastic Beanstalk**: ~$15-30 (t2.small instance)
- **ECS Fargate**: ~$10-20 (0.25 vCPU, 0.5 GB RAM)
- **EC2 t2.micro**: Free tier eligible, then ~$8/month
- **Lambda**: $0 for low traffic (free tier: 1M requests/month)

---

## Monitoring & Logs

### CloudWatch Logs

```bash
# View logs
aws logs tail /aws/elasticbeanstalk/petamini-backend-env/var/log/eb-engine.log --follow
```

### Health Checks

All methods support health check endpoint:

```
GET /health
```

---

## SSL/HTTPS Setup

### Using AWS Certificate Manager (ACM)

1. Request certificate in ACM
2. Add to Load Balancer
3. Update frontend to use HTTPS URL

---

## Scaling

### Auto Scaling (ECS)

```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/petamini-cluster/petamini-backend-service \
  --min-capacity 1 \
  --max-capacity 10
```

---

## Troubleshooting

### Check Application Logs

```bash
# Elastic Beanstalk
eb logs

# ECS
aws logs tail /ecs/petamini-backend --follow

# EC2
sudo journalctl -u petamini -f
```

### Test Endpoint

```bash
curl https://your-backend-url.com/health
curl https://your-backend-url.com/api/linkers
```

---

## Recommended Approach for Your Project

**For Testing/Development:**
→ AWS Elastic Beanstalk (easiest to set up)

**For Production:**
→ AWS ECS with Fargate + Application Load Balancer (scalable, reliable)

---

## Next Steps

1. Choose deployment method above
2. Deploy backend
3. Update frontend `VITE_API_URL`
4. Deploy frontend to Vercel/Netlify
5. Configure custom domain (optional)
6. Setup monitoring and alerts

---

## Support

For issues, check:

- CloudWatch Logs
- AWS Support Center
- Backend logs via `eb logs` or CloudWatch
