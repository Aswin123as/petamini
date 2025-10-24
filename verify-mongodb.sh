#!/bin/bash

# MongoDB Connection Verification Script
# Checks if backend can connect to MongoDB Atlas

set -e

echo "=================================="
echo "MongoDB Connection Check"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if backend container is running
echo -e "${BLUE}Step 1: Checking backend container status...${NC}"
BACKEND_STATUS=$(docker-compose ps backend | grep -c "Up" || echo "0")

if [ "$BACKEND_STATUS" -eq "0" ]; then
    echo -e "${RED}✗ Backend container is not running!${NC}"
    echo ""
    echo "Starting backend container..."
    docker-compose up -d backend
    sleep 3
else
    echo -e "${GREEN}✓ Backend container is running${NC}"
fi
echo ""

# Step 2: Check backend logs for MongoDB errors
echo -e "${BLUE}Step 2: Checking backend logs for MongoDB connection...${NC}"
echo ""
echo "Recent backend logs:"
echo "-----------------------------------"
docker-compose logs --tail=30 backend
echo "-----------------------------------"
echo ""

# Step 3: Look for specific MongoDB errors
MONGO_ERRORS=$(docker-compose logs --tail=50 backend | grep -i "mongo\|error\|failed\|tls" || echo "")

if [ -z "$MONGO_ERRORS" ]; then
    echo -e "${GREEN}✓ No MongoDB errors found in recent logs${NC}"
else
    echo -e "${YELLOW}MongoDB-related messages found:${NC}"
    echo "$MONGO_ERRORS"
fi
echo ""

# Step 4: Test MongoDB connection directly
echo -e "${BLUE}Step 3: Testing MongoDB connection from container...${NC}"
docker-compose exec -T backend sh -c 'curl -s http://localhost:8080/health' || echo -e "${RED}Health endpoint not responding${NC}"
echo ""

# Step 5: Check environment variables
echo -e "${BLUE}Step 4: Checking MongoDB configuration...${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
    echo ""
    echo "MongoDB URI (masked):"
    grep MONGODB_URI .env | sed 's/mongodb+srv:\/\/[^@]*@/mongodb+srv:\/\/*****@/' || echo -e "${RED}MONGODB_URI not found in .env${NC}"
else
    echo -e "${RED}✗ .env file not found!${NC}"
fi
echo ""

# Step 6: Get EC2 public IP
echo -e "${BLUE}Step 5: Checking EC2 public IP (for MongoDB whitelist)...${NC}"
EC2_IP=$(curl -s http://checkip.amazonaws.com)
echo -e "${GREEN}Your EC2 Public IP: $EC2_IP${NC}"
echo ""

# Step 7: Summary and recommendations
echo "=================================="
echo -e "${BLUE}Summary & Next Steps:${NC}"
echo "=================================="
echo ""

if echo "$MONGO_ERRORS" | grep -qi "tls\|timeout\|connection refused"; then
    echo -e "${YELLOW}⚠ MongoDB Connection Issues Detected!${NC}"
    echo ""
    echo "Common issues and solutions:"
    echo ""
    echo "1. IP Whitelist Issue:"
    echo "   - Go to MongoDB Atlas → Network Access"
    echo "   - Add IP: $EC2_IP"
    echo "   - OR add 0.0.0.0/0 (allow from anywhere)"
    echo ""
    echo "2. Invalid Connection String:"
    echo "   - Check MONGODB_URI in .env file"
    echo "   - Ensure username/password are correct"
    echo ""
    echo "3. Database User Permissions:"
    echo "   - Go to MongoDB Atlas → Database Access"
    echo "   - Ensure user has 'readWrite' permissions"
    echo ""
    echo "After fixing, restart backend:"
    echo "   docker-compose restart backend"
else
    echo -e "${GREEN}✓ MongoDB connection appears healthy!${NC}"
fi

echo ""
echo "To view live backend logs:"
echo "   docker-compose logs -f backend"
