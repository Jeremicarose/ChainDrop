# ChainDrop AI Agent Examples

This directory contains example scripts demonstrating how AI agents can use ChainDrop for automated crypto payments.

## 🤖 What are AI Agents?

AI agents are automated programs that can make payments on your behalf based on predefined policies. Unlike giving an AI your private key (dangerous!), ChainDrop lets you set rules that keep your money safe:

- ✅ Daily spending limits
- ✅ Recipient whitelists
- ✅ Approval requirements for large amounts
- ✅ Token restrictions

## 📁 Files

### `payroll_bot.py` (Python)
Automated payroll system that pays employees via email.

**Requirements:**
```bash
pip install requests
```

**Usage:**
```bash
python3 payroll_bot.py
```

### `payroll_bot.js` (Node.js)
Same functionality as Python version, for Node.js environments.

**Requirements:**
```bash
npm install axios
```

**Usage:**
```bash
node payroll_bot.js
```

### `test_agent_api.sh` (Bash)
Quick API test script using curl.

**Requirements:**
- `curl`
- `jq` (for JSON parsing)

**Usage:**
```bash
./test_agent_api.sh
```

## 🚀 Quick Start

1. **Start the ChainDrop backend:**
   ```bash
   cd ../backend
   npm run dev
   ```

2. **Run a demo:**
   ```bash
   # Node.js version
   node payroll_bot.js

   # OR Python version
   python3 payroll_bot.py

   # OR test script
   ./test_agent_api.sh
   ```

## 📚 API Reference

### Create Agent
```bash
POST /api/agent/create
Content-Type: application/json

{
  "ownerAddress": "0x...",
  "name": "My Bot",
  "policies": {
    "dailyLimit": "10",
    "allowedRecipients": "*@company.com",
    "requireApproval": "5",
    "allowedTokens": "CRO"
  }
}
```

### Make Payment
```bash
POST /api/agent/pay
X-API-Key: cd_agent_xxx
Content-Type: application/json

{
  "recipientIdentifier": "alice@company.com",
  "identifierType": "email",
  "amount": "0.5",
  "metadata": {
    "type": "salary",
    "month": "January"
  }
}
```

### Get Statistics
```bash
GET /api/agent/stats
X-API-Key: cd_agent_xxx
```

## 🎯 Policy Types

| Policy | Description | Example |
|--------|-------------|---------|
| `dailyLimit` | Max CRO per day | `"10"` = 10 CRO/day |
| `allowedRecipients` | Whitelist patterns | `"*@company.com"` |
| `requireApproval` | Large amount threshold | `"5"` = amounts >5 CRO need approval |
| `allowedTokens` | Token whitelist | `"CRO,USDC"` |

## 💡 Use Cases

### 1. DAO Treasury Manager
Automate contributor payments based on governance votes.

### 2. Payroll System
Pay employees automatically without manual wallet management.

### 3. Gaming Rewards
Distribute prizes/rewards to players via Discord/Twitter handles.

### 4. Customer Refunds
AI processes refund requests and sends payments automatically.

### 5. Subscription Payments
Recurring payments to service providers.

## 🔒 Security Features

- ✅ API keys can be revoked instantly
- ✅ All transactions logged for audit
- ✅ Policy violations are blocked automatically
- ✅ No access to private keys
- ✅ Spending limits prevent abuse

## 🐛 Troubleshooting

**Error: "Invalid API key"**
- Make sure backend is running
- Check that agent was created successfully
- API key format: `cd_agent_xxx...`

**Error: "Policy violation"**
- Check daily spending limit
- Verify recipient is whitelisted
- Ensure amount is below approval threshold

**Error: "Connection refused"**
- Start backend: `cd backend && npm run dev`
- Check port 3000 is available

## 📖 Learn More

- [ChainDrop Documentation](../README.md)
- [API Reference](../backend/README.md)
- [Frontend Guide](../frontend/README.md)
