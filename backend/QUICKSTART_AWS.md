# Quick Start - AWS Deployment

Choose your preferred method and follow the steps:

## 🟢 Method 1: Elastic Beanstalk (Easiest - Recommended for Beginners)

```bash
# Install EB CLI
pip install awsebcli

# Deploy
cd backend
./deploy-aws.sh eb

# Or manually:
eb init -p go petamini-backend --region us-east-1
eb create petamini-backend-env
eb setenv MONGODB_URI="your-uri" TELEGRAM_BOT_TOKEN="your-token"
eb deploy
```

**Cost**: ~$15-30/month
**Time**: 10-15 minutes

---

## 🔵 Method 2: ECS Fargate (Docker - Recommended for Production)

```bash
# Install Docker and AWS CLI
# Deploy
cd backend
./deploy-aws.sh ecs
```

**Cost**: ~$10-20/month
**Time**: 20-30 minutes

---

## 🟡 Method 3: EC2 (Traditional Server)

```bash
# Launch EC2 instance from AWS Console (t2.micro for free tier)
# SSH into it and run:
cd backend
./deploy-aws.sh ec2
# Follow the printed instructions
```

**Cost**: Free tier eligible, then ~$8/month
**Time**: 15-20 minutes

---

## 🟣 Method 4: Lambda (Serverless)

```bash
# Install SAM CLI
pip install aws-sam-cli

# Deploy
cd backend
./deploy-aws.sh lambda
```

**Cost**: Almost free for low traffic
**Time**: 10-15 minutes

---

## After Deployment

### 1. Get Your Backend URL

**Elastic Beanstalk:**

```bash
eb status
# Look for "CNAME"
```

**ECS:**
Get Load Balancer DNS from AWS Console

**EC2:**
Your EC2 public IP + :8080

**Lambda:**
From SAM deployment output

### 2. Update Frontend

In `frontend/.env`:

```
VITE_API_URL=https://your-backend-url.com/api
```

### 3. Test

```bash
curl https://your-backend-url.com/health
curl https://your-backend-url.com/api/linkers
```

---

## Troubleshooting

```bash
# View logs
eb logs                          # Elastic Beanstalk
aws logs tail /ecs/petamini      # ECS
sudo journalctl -u petamini      # EC2
sam logs                         # Lambda
```

---

## Full Documentation

See [AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md) for complete instructions.
