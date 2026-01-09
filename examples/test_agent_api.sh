#!/bin/bash
# ChainDrop Agent API Test Script

API_URL="http://localhost:3000/api"
OWNER_ADDRESS="0x1da9c1016a03f9154720E0691162B43219F2c436"

echo "🧪 Testing ChainDrop Agent API"
echo "================================"

# Test 1: Create Agent
echo ""
echo "1️⃣ Creating agent..."
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/agent/create" \
  -H "Content-Type: application/json" \
  -d '{
    "ownerAddress": "'$OWNER_ADDRESS'",
    "name": "Test Payroll Bot",
    "policies": {
      "dailyLimit": "10",
      "allowedRecipients": "*",
      "requireApproval": "5",
      "allowedTokens": "CRO"
    }
  }')

echo "$CREATE_RESPONSE" | jq '.'

# Extract API key
API_KEY=$(echo "$CREATE_RESPONSE" | jq -r '.data.apiKey')

if [ "$API_KEY" == "null" ] || [ -z "$API_KEY" ]; then
  echo "❌ Failed to create agent"
  exit 1
fi

echo "✅ Agent created with API key: ${API_KEY:0:30}..."

# Test 2: Make a payment
echo ""
echo "2️⃣ Making test payment..."
PAY_RESPONSE=$(curl -s -X POST "$API_URL/agent/pay" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "recipientIdentifier": "test@example.com",
    "identifierType": "email",
    "amount": "0.001",
    "metadata": {
      "test": true
    }
  }')

echo "$PAY_RESPONSE" | jq '.'

# Check if payment succeeded
TRANSFER_ID=$(echo "$PAY_RESPONSE" | jq -r '.data.transferId')

if [ "$TRANSFER_ID" == "null" ] || [ -z "$TRANSFER_ID" ]; then
  echo "❌ Payment failed"
else
  echo "✅ Payment successful! Transfer ID: $TRANSFER_ID"
fi

# Test 3: Get agent stats
echo ""
echo "3️⃣ Getting agent statistics..."
STATS_RESPONSE=$(curl -s -X GET "$API_URL/agent/stats" \
  -H "X-API-Key: $API_KEY")

echo "$STATS_RESPONSE" | jq '.'

echo ""
echo "✅ All tests completed!"
echo ""
echo "💡 Next steps:"
echo "   1. Try running: node payroll_bot.js"
echo "   2. Try running: python3 payroll_bot.py"
echo "   3. View logs: tail -f /tmp/claude/-Users-jeremicarose-Projects-chaindrop-mvp/tasks/*.output"
