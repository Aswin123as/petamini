#!/bin/bash

# AWS Deployment Script for PetaMini Backend
# Usage: ./deploy-aws.sh [method]
# Methods: eb | ecs | ec2 | lambda

set -e

METHOD=${1:-eb}
REGION="us-east-1"
APP_NAME="petamini-backend"

echo "🚀 Deploying PetaMini Backend to AWS using $METHOD method..."

case $METHOD in
  eb)
    echo "📦 Deploying to Elastic Beanstalk..."
    
    # Check if EB CLI is installed
    if ! command -v eb &> /dev/null; then
        echo "❌ EB CLI not found. Installing..."
        pip install awsebcli
    fi
    
    # Initialize EB if not already initialized
    if [ ! -d ".elasticbeanstalk" ]; then
        echo "🔧 Initializing Elastic Beanstalk..."
        eb init -p go $APP_NAME --region $REGION
    fi
    
    # Check if environment exists
    if ! eb list | grep -q "petamini-backend-env"; then
        echo "🌍 Creating environment..."
        eb create petamini-backend-env --instance-type t2.small
    fi
    
    # Set environment variables (you should update these)
    echo "⚙️  Setting environment variables..."
    echo "⚠️  Make sure to set your MONGODB_URI and TELEGRAM_BOT_TOKEN"
    # eb setenv MONGODB_URI="your-mongodb-uri" TELEGRAM_BOT_TOKEN="your-token"
    
    # Deploy
    echo "🚢 Deploying application..."
    eb deploy
    
    echo "✅ Deployment complete!"
    eb open
    ;;
    
  ecs)
    echo "🐳 Deploying to ECS with Fargate..."
    
    # Get AWS Account ID
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    
    # Create ECR repository if it doesn't exist
    aws ecr describe-repositories --repository-names $APP_NAME --region $REGION 2>/dev/null || \
    aws ecr create-repository --repository-name $APP_NAME --region $REGION
    
    # Login to ECR
    echo "🔐 Logging in to ECR..."
    aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
    
    # Build Docker image
    echo "🏗️  Building Docker image..."
    docker build -t $APP_NAME .
    
    # Tag and push
    echo "📤 Pushing to ECR..."
    docker tag $APP_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$APP_NAME:latest
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$APP_NAME:latest
    
    # Create ECS cluster if it doesn't exist
    aws ecs describe-clusters --clusters petamini-cluster --region $REGION 2>/dev/null || \
    aws ecs create-cluster --cluster-name petamini-cluster --region $REGION
    
    # Update task definition with actual account ID
    sed "s/YOUR_AWS_ACCOUNT_ID/$AWS_ACCOUNT_ID/g" ecs-task-definition.json > ecs-task-definition-updated.json
    
    # Register task definition
    echo "📝 Registering task definition..."
    aws ecs register-task-definition --cli-input-json file://ecs-task-definition-updated.json --region $REGION
    
    echo "✅ Docker image pushed to ECR!"
    echo "ℹ️  Next steps:"
    echo "  1. Create an ECS service in AWS Console"
    echo "  2. Configure VPC, subnets, and security groups"
    echo "  3. Set up Application Load Balancer (optional)"
    ;;
    
  ec2)
    echo "🖥️  EC2 deployment requires manual steps:"
    echo ""
    echo "1. Launch EC2 instance (Amazon Linux 2)"
    echo "2. SSH into instance: ssh -i your-key.pem ec2-user@your-ip"
    echo "3. Run these commands:"
    echo ""
    echo "   # Install Go"
    echo "   wget https://go.dev/dl/go1.23.0.linux-amd64.tar.gz"
    echo "   sudo tar -C /usr/local -xzf go1.23.0.linux-amd64.tar.gz"
    echo "   echo 'export PATH=\$PATH:/usr/local/go/bin' >> ~/.bashrc"
    echo "   source ~/.bashrc"
    echo ""
    echo "   # Clone and build"
    echo "   git clone your-repo-url"
    echo "   cd petamini/backend"
    echo "   go build -o petamini-server main.go"
    echo ""
    echo "   # Create .env file with your secrets"
    echo "   # Run: ./petamini-server"
    echo ""
    echo "See AWS_DEPLOYMENT_GUIDE.md for complete instructions"
    ;;
    
  lambda)
    echo "⚡ Deploying to AWS Lambda..."
    
    # Check if SAM CLI is installed
    if ! command -v sam &> /dev/null; then
        echo "❌ SAM CLI not found. Installing..."
        pip install aws-sam-cli
    fi
    
    # Build
    echo "🏗️  Building SAM application..."
    sam build
    
    # Deploy
    echo "🚢 Deploying to Lambda..."
    sam deploy --guided
    
    echo "✅ Deployment complete!"
    ;;
    
  *)
    echo "❌ Unknown deployment method: $METHOD"
    echo "Usage: ./deploy-aws.sh [eb|ecs|ec2|lambda]"
    exit 1
    ;;
esac

echo ""
echo "🎉 Deployment process completed!"
echo "📚 See AWS_DEPLOYMENT_GUIDE.md for more details"
