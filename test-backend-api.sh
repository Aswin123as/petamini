#!/bin/bash

# Test MongoDB and Backend API
# This script tests if the backend is actually connected to MongoDB

set -e

echo "=================================="
echo "Backend API & MongoDB Test"
echo "=================================="
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Test 1: Health endpoint
echo -e "${BLUE}Test 1: Health endpoint (backend running)${NC}"
HEALTH_RESPONSE=$(docker-compose exec -T backend wget -q -O - http://localhost:8080/health 2>/dev/null || echo "FAILED")

if [ "$HEALTH_RESPONSE" == "FAILED" ]; then
    echo -e "${RED}✗ Backend health check failed${NC}"
else
    echo -e "${GREEN}✓ Backend is running${NC}"
    echo "Response: $HEALTH_RESPONSE"
fi
echo ""

# Test 2: Try to fetch linkers (requires MongoDB)
echo -e "${BLUE}Test 2: Testing MongoDB connection (fetch linkers)${NC}"
LINKERS_RESPONSE=$(docker-compose exec -T backend wget -q -O - http://localhost:8080/api/linkers 2>/dev/null || echo "FAILED")

if [ "$LINKERS_RESPONSE" == "FAILED" ]; then
    echo -e "${RED}✗ Cannot fetch linkers from MongoDB${NC}"
else
    echo -e "${GREEN}✓ MongoDB connection working!${NC}"
    echo "Sample data (first 200 chars):"
    echo "$LINKERS_RESPONSE" | head -c 200
    echo "..."
fi
echo ""

# Test 3: Check backend container logs for actual errors
echo -e "${BLUE}Test 3: Recent backend logs (last 20 lines)${NC}"
echo "-----------------------------------"
docker-compose logs --tail=20 backend
echo "-----------------------------------"
echo ""

# Test 4: Test from outside (nginx proxy)
echo -e "${BLUE}Test 4: Testing API through nginx (from outside)${NC}"
API_RESPONSE=$(curl -s http://localhost/api/linkers || echo "FAILED")

if [ "$API_RESPONSE" == "FAILED" ]; then
    echo -e "${RED}✗ API not accessible through nginx${NC}"
else
    echo -e "${GREEN}✓ API accessible through nginx!${NC}"
    echo "Response length: ${#API_RESPONSE} characters"
fi
echo ""

# Summary
echo "=================================="
echo -e "${BLUE}Summary${NC}"
echo "=================================="
echo ""
echo "If all tests passed:"
echo "  → MongoDB is connected and working"
echo "  → Backend API is functional"
echo "  → Ready for HTTPS setup"
echo ""
echo "If tests failed:"
echo "  → Check MongoDB Atlas IP whitelist"
echo "  → Verify MONGODB_URI in docker-compose.yml"
echo "  → Run: docker-compose restart backend"
