# ChainDrop API Documentation

**Version:** 1.0
**Base URL:** `https://api.chaindrop.app` (Production - TBD)
**Testnet URL:** `http://localhost:3000` (Local Development)

---

## Table of Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [Create Transfer](#1-create-transfer)
  - [Claim Transfer](#2-claim-transfer)
  - [Estimate Transfer](#3-estimate-transfer)
  - [Get Transfer Details](#4-get-transfer-details)
  - [List Sender Transfers](#5-list-sender-transfers)
  - [Get Platform Statistics](#6-get-platform-statistics)
- [Webhooks](#webhooks)
- [SDK Examples](#sdk-examples)
- [Testing](#testing)

---

## Authentication

### API Keys (Coming Soon)

For production usage, requests must include an API key in the header:

```http
Authorization: Bearer YOUR_API_KEY
```

### Public Endpoints

During testnet/MVP phase, most endpoints are public for testing purposes.

---

## Rate Limiting

| Tier | Requests/Minute | Requests/Day |
|------|----------------|--------------|
| Free (Testnet) | 100 | Unlimited |
| Starter | 1,000 | 50,000 |
| Pro | 10,000 | 500,000 |
| Enterprise | Custom | Custom |

**Rate limit headers:**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1641916800
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "INVALID_AMOUNT",
    "message": "Amount must be greater than minimum transfer (0.01 USDC)",
    "details": {
      "provided": "0.001",
      "minimum": "0.01"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_ADDRESS` | 400 | Invalid Ethereum address format |
| `INVALID_AMOUNT` | 400 | Amount below minimum or invalid |
| `INVALID_TOKEN` | 400 | Unsupported token |
| `INVALID_IDENTIFIER` | 400 | Invalid email/phone format |
| `INSUFFICIENT_BALANCE` | 400 | Sender has insufficient balance |
| `TRANSFER_NOT_FOUND` | 404 | Claim token not found |
| `ALREADY_CLAIMED` | 409 | Transfer already claimed |
| `EXPIRED_TRANSFER` | 410 | Transfer expired (>24 hours) |
| `CLAIM_NOT_READY` | 425 | Funds not yet confirmed on-chain |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `BLOCKCHAIN_ERROR` | 503 | Blockchain RPC unavailable |

---

## Endpoints

### 1. Create Transfer

Send crypto to a recipient identifier (email, phone, social handle).

**Endpoint:** `POST /api/transfer/send`

#### Request

```http
POST /api/transfer/send
Content-Type: application/json

{
  "senderAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "recipientIdentifier": "alice@example.com",
  "amount": "50",
  "token": "USDC",
  "message": "Happy Birthday! 🎉",
  "expiryHours": 24
}
```

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `senderAddress` | string | Yes | Sender's Ethereum address |
| `recipientIdentifier` | string | Yes | Email, phone (+1234567890), or @handle |
| `amount` | string | Yes | Amount to send (in token units) |
| `token` | string | Yes | Token symbol (ETH, USDC, USDT, DAI) |
| `message` | string | No | Optional message to recipient (max 280 chars) |
| `expiryHours` | number | No | Hours until expiry (default: 24, max: 168) |

#### Response

```json
{
  "success": true,
  "data": {
    "transferId": "xfr_1a2b3c4d5e6f",
    "claimToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "claimLink": "https://chaindrop.app/claim/eyJhbGc...",
    "ghostVaultAddress": "0x9f8b7c6d5e4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c",
    "amount": "50",
    "token": "USDC",
    "estimatedGas": "0.15",
    "platformFee": "0.50",
    "netToRecipient": "49.35",
    "expiresAt": "2026-01-07T08:00:00Z",
    "createdAt": "2026-01-06T08:00:00Z"
  }
}
```

#### cURL Example

```bash
curl -X POST https://api.chaindrop.app/api/transfer/send \
  -H "Content-Type: application/json" \
  -d '{
    "senderAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "recipientIdentifier": "alice@example.com",
    "amount": "50",
    "token": "USDC"
  }'
```

---

### 2. Claim Transfer

Claim funds from a Ghost Vault to a wallet address.

**Endpoint:** `POST /api/transfer/claim`

#### Request

```http
POST /api/transfer/claim
Content-Type: application/json

{
  "claimToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "recipientWalletAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "claimProof": "0xabcdef1234567890..."
}
```

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `claimToken` | string | Yes | JWT token from claim link |
| `recipientWalletAddress` | string | Yes | Destination wallet address |
| `claimProof` | string | No | Verification signature (auto-generated if using OAuth) |

#### Response

```json
{
  "success": true,
  "data": {
    "transferId": "xfr_1a2b3c4d5e6f",
    "transactionHash": "0xabc123def456...",
    "deployedAccountAddress": "0x9f8b7c6d5e4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c",
    "claimedAmount": "49.35",
    "token": "USDC",
    "gasCostDeducted": "0.15",
    "platformFee": "0.50",
    "claimedAt": "2026-01-06T09:30:00Z",
    "blockNumber": 12345678
  }
}
```

#### cURL Example

```bash
curl -X POST https://api.chaindrop.app/api/transfer/claim \
  -H "Content-Type: application/json" \
  -d '{
    "claimToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "recipientWalletAddress": "0x1234567890abcdef1234567890abcdef12345678"
  }'
```

---

### 3. Estimate Transfer

Get Ghost Vault address and gas estimate before sending funds.

**Endpoint:** `POST /api/transfer/estimate`

#### Request

```http
POST /api/transfer/estimate
Content-Type: application/json

{
  "recipientIdentifier": "alice@example.com",
  "amount": "50",
  "token": "USDC"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "ghostVaultAddress": "0x9f8b7c6d5e4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c",
    "amount": "50",
    "token": "USDC",
    "estimatedGas": "0.15",
    "platformFee": "0.50",
    "netToRecipient": "49.35",
    "feePercentage": 1.0,
    "currentGasPrice": "15 gwei",
    "estimatedClaimTime": "30 seconds"
  }
}
```

---

### 4. Get Transfer Details

Retrieve transfer information by claim token or transfer ID.

**Endpoint:** `GET /api/transfer/:claimToken`

#### Request

```http
GET /api/transfer/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response

```json
{
  "success": true,
  "data": {
    "transferId": "xfr_1a2b3c4d5e6f",
    "status": "pending",
    "ghostVaultAddress": "0x9f8b7c6d5e4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c",
    "amount": "50",
    "token": "USDC",
    "message": "Happy Birthday! 🎉",
    "senderAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "recipientIdentifierHash": "0x1234...",
    "createdAt": "2026-01-06T08:00:00Z",
    "expiresAt": "2026-01-07T08:00:00Z",
    "claimedAt": null,
    "claimTransactionHash": null,
    "fundsConfirmed": true,
    "currentBalance": "50 USDC"
  }
}
```

#### Status Values

- `pending` - Waiting for recipient to claim
- `claimed` - Successfully claimed
- `expired` - Passed expiry time (can be reclaimed by sender)
- `cancelled` - Cancelled by sender

---

### 5. List Sender Transfers

Get all transfers from a specific sender address.

**Endpoint:** `GET /api/transfer/sender/:address`

#### Request

```http
GET /api/transfer/sender/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb?status=pending&limit=20&offset=0
```

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | all | Filter by status (pending, claimed, expired, cancelled) |
| `limit` | number | 50 | Results per page (max 100) |
| `offset` | number | 0 | Pagination offset |
| `sortBy` | string | createdAt | Sort field (createdAt, amount, expiresAt) |
| `order` | string | desc | Sort order (asc, desc) |

#### Response

```json
{
  "success": true,
  "data": {
    "transfers": [
      {
        "transferId": "xfr_1a2b3c4d5e6f",
        "recipientIdentifierHash": "0x1234...",
        "amount": "50",
        "token": "USDC",
        "status": "pending",
        "createdAt": "2026-01-06T08:00:00Z",
        "expiresAt": "2026-01-07T08:00:00Z"
      },
      // ... more transfers
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    },
    "summary": {
      "totalSent": "2450.00",
      "totalClaimed": "1820.50",
      "totalPending": "629.50",
      "transferCount": 45,
      "claimRate": 74.3
    }
  }
}
```

---

### 6. Get Platform Statistics

Retrieve aggregate platform statistics.

**Endpoint:** `GET /api/transfer/stats`

#### Request

```http
GET /api/transfer/stats?timeframe=30d
```

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `timeframe` | string | all | Time period (24h, 7d, 30d, 90d, all) |

#### Response

```json
{
  "success": true,
  "data": {
    "timeframe": "30d",
    "transfers": {
      "total": 12470,
      "claimed": 8924,
      "pending": 2156,
      "expired": 1390,
      "claimRate": 71.5
    },
    "volume": {
      "totalUSD": "1245000.50",
      "claimedUSD": "892400.30",
      "pendingUSD": "215600.20",
      "byToken": {
        "USDC": "980000.00",
        "USDT": "200000.00",
        "ETH": "65000.50"
      }
    },
    "fees": {
      "platformFeesUSD": "12450.00",
      "gasFeesUSD": "3240.50",
      "totalFeesUSD": "15690.50"
    },
    "users": {
      "totalSenders": 3456,
      "totalRecipients": 8921,
      "newUsers24h": 234
    },
    "performance": {
      "averageClaimTimeHours": 2.3,
      "medianClaimTimeHours": 0.8,
      "fastestClaimSeconds": 42
    }
  }
}
```

---

## Webhooks

Subscribe to real-time events.

### Available Events

| Event | Description |
|-------|-------------|
| `transfer.created` | New transfer initiated |
| `transfer.funded` | Funds confirmed in Ghost Vault |
| `transfer.claimed` | Recipient claimed funds |
| `transfer.expired` | Transfer expired without claim |
| `transfer.cancelled` | Sender cancelled transfer |

### Webhook Payload Example

```json
{
  "event": "transfer.claimed",
  "timestamp": "2026-01-06T09:30:00Z",
  "data": {
    "transferId": "xfr_1a2b3c4d5e6f",
    "amount": "50",
    "token": "USDC",
    "claimTransactionHash": "0xabc123..."
  }
}
```

### Webhook Configuration

```bash
POST /api/webhooks/subscribe
{
  "url": "https://yourapp.com/webhooks/chaindrop",
  "events": ["transfer.created", "transfer.claimed"],
  "secret": "your_webhook_secret"
}
```

---

## SDK Examples

### JavaScript/TypeScript

```javascript
import { ChainDrop } from '@chaindrop/sdk';

const chaindrop = new ChainDrop({
  apiKey: 'YOUR_API_KEY',
  network: 'base-sepolia' // or 'base-mainnet'
});

// Send transfer
const transfer = await chaindrop.send({
  senderAddress: '0x742d35...',
  recipientIdentifier: 'alice@example.com',
  amount: '50',
  token: 'USDC',
  message: 'Happy Birthday!'
});

console.log('Claim link:', transfer.claimLink);

// Check transfer status
const status = await chaindrop.getTransfer(transfer.claimToken);
console.log('Status:', status.status);

// Listen for claims
chaindrop.on('transfer.claimed', (event) => {
  console.log('Transfer claimed!', event);
});
```

### Python

```python
from chaindrop import ChainDrop

chaindrop = ChainDrop(
    api_key='YOUR_API_KEY',
    network='base-sepolia'
)

# Send transfer
transfer = chaindrop.send(
    sender_address='0x742d35...',
    recipient_identifier='alice@example.com',
    amount='50',
    token='USDC',
    message='Happy Birthday!'
)

print(f'Claim link: {transfer.claim_link}')

# Get transfer status
status = chaindrop.get_transfer(transfer.claim_token)
print(f'Status: {status.status}')
```

### cURL

```bash
#!/bin/bash

# Send transfer
RESPONSE=$(curl -s -X POST https://api.chaindrop.app/api/transfer/send \
  -H "Content-Type: application/json" \
  -d '{
    "senderAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "recipientIdentifier": "alice@example.com",
    "amount": "50",
    "token": "USDC"
  }')

CLAIM_TOKEN=$(echo $RESPONSE | jq -r '.data.claimToken')
CLAIM_LINK=$(echo $RESPONSE | jq -r '.data.claimLink')

echo "Claim link: $CLAIM_LINK"

# Share link via email (example with SendGrid)
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"personalizations\": [{\"to\": [{\"email\": \"alice@example.com\"}]}],
    \"from\": {\"email\": \"no-reply@yourapp.com\"},
    \"subject\": \"You've received 50 USDC!\",
    \"content\": [{
      \"type\": \"text/html\",
      \"value\": \"<p>Click to claim: <a href='$CLAIM_LINK'>$CLAIM_LINK</a></p>\"
    }]
  }"
```

---

## Testing

### Testnet Tokens

Get testnet tokens for testing:

1. **Base Sepolia ETH:** [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
2. **Test USDC:** Contract `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (Base Sepolia)

### Test Scenarios

#### Scenario 1: Successful Claim

```bash
# 1. Send transfer
curl -X POST http://localhost:3000/api/transfer/send \
  -H "Content-Type: application/json" \
  -d '{
    "senderAddress": "0xYourTestAddress",
    "recipientIdentifier": "test@example.com",
    "amount": "10",
    "token": "USDC"
  }'

# 2. Copy claimToken from response

# 3. Claim transfer
curl -X POST http://localhost:3000/api/transfer/claim \
  -H "Content-Type: application/json" \
  -d '{
    "claimToken": "<CLAIM_TOKEN>",
    "recipientWalletAddress": "0xRecipientTestAddress"
  }'
```

#### Scenario 2: Expired Transfer

```bash
# 1. Send transfer with 1-hour expiry
curl -X POST http://localhost:3000/api/transfer/send \
  -H "Content-Type: application/json" \
  -d '{
    "senderAddress": "0xYourTestAddress",
    "recipientIdentifier": "test@example.com",
    "amount": "10",
    "token": "USDC",
    "expiryHours": 1
  }'

# 2. Wait 1+ hours

# 3. Attempt claim (should fail with EXPIRED_TRANSFER)
curl -X POST http://localhost:3000/api/transfer/claim \
  -H "Content-Type: application/json" \
  -d '{
    "claimToken": "<CLAIM_TOKEN>",
    "recipientWalletAddress": "0xRecipientTestAddress"
  }'
```

---

## Best Practices

### 1. Validate Inputs Client-Side

```javascript
function validateTransfer(data) {
  if (!ethers.utils.isAddress(data.senderAddress)) {
    throw new Error('Invalid sender address');
  }
  if (!isValidEmail(data.recipientIdentifier) &&
      !isValidPhone(data.recipientIdentifier)) {
    throw new Error('Invalid recipient identifier');
  }
  if (parseFloat(data.amount) <= 0) {
    throw new Error('Amount must be positive');
  }
  return true;
}
```

### 2. Handle Errors Gracefully

```javascript
try {
  const transfer = await chaindrop.send(data);
  showSuccess(transfer.claimLink);
} catch (error) {
  if (error.code === 'INSUFFICIENT_BALANCE') {
    showError('You don't have enough tokens to send');
  } else if (error.code === 'INVALID_AMOUNT') {
    showError(`Minimum transfer: ${error.details.minimum}`);
  } else {
    showError('Transfer failed. Please try again.');
    logError(error); // Log to monitoring service
  }
}
```

### 3. Implement Idempotency

Use idempotency keys for critical operations:

```javascript
const transfer = await chaindrop.send({
  ...transferData,
  idempotencyKey: `user-${userId}-${Date.now()}`
});
```

### 4. Monitor Claim Status

```javascript
async function monitorClaim(claimToken) {
  const maxAttempts = 60; // 5 minutes (5s intervals)
  for (let i = 0; i < maxAttempts; i++) {
    const status = await chaindrop.getTransfer(claimToken);
    if (status.status === 'claimed') {
      return status;
    }
    await sleep(5000);
  }
  throw new Error('Claim timeout');
}
```

---

## Support

- **Documentation:** [docs.chaindrop.app](https://docs.chaindrop.app)
- **GitHub Issues:** [github.com/Jeremicarose/ChainDrop/issues](https://github.com/Jeremicarose/ChainDrop/issues)
- **Discord:** [discord.gg/chaindrop](https://discord.gg/chaindrop) *(coming soon)*
- **Email:** [developers@chaindrop.app](mailto:developers@chaindrop.app)

---

*Last updated: January 2026*
