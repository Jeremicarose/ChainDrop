# Getting Started with ChainDrop

Welcome to ChainDrop! This guide will help you get up and running quickly, whether you're a developer integrating ChainDrop or a user sending your first transfer.

**Network:** Cronos Testnet (Chain ID: 338)
**Hackathon:** Cronos x402 - Agentic Finance

---

## Table of Contents

- [For Users](#for-users)
- [For Developers](#for-developers)
- [Local Development Setup](#local-development-setup)
- [Your First Transfer](#your-first-transfer)
- [Common Use Cases](#common-use-cases)
- [Troubleshooting](#troubleshooting)

---

## For Users

### What You Need

- **An email address** - That's it! ChainDrop creates a Privy embedded wallet for you automatically
- Some CRO to send (on Cronos Testnet)
- Recipient's email address, phone number, or social handle

### Sending Your First Transfer

**Step 1: Sign In**
- Visit ChainDrop and click "Sign In"
- Enter your email address
- A Privy embedded wallet is automatically created for you

**Step 2: Fund Your Wallet**
- Go to the Wallet page to see your address
- Get testnet CRO from the [Cronos Faucet](https://cronos.org/faucet)
- Or transfer CRO from another wallet

**Step 3: Go to Send Page**
- Click "Send" in the navigation
- You'll see a USD-first amount input

**Step 4: Enter Payment Details**
- Enter amount in USD (e.g., `$5`)
- CRO amount is automatically calculated
- Enter recipient's email: `alice@example.com`

**Step 5: Confirm Transaction**
- Review the payment details
- Click "Send" to confirm
- Your Privy wallet signs the transaction

**Done!** Recipient receives an email with a claim link.

### Using AI Chat (Recommended)

The easiest way to send payments is with natural language:

1. Go to **Agents** page
2. Click the **AI Chat** tab
3. Type: `"Send $5 to alice@company.com for lunch"`
4. AI extracts: recipient, amount, and converts to CRO
5. Confirm with "yes" to send

### Claiming Funds

**Step 1: Click Claim Link**
- Recipient gets an email with a claim link
- Link format: `https://chaindrop.app/claim/abc123...`

**Step 2: Sign In**
- Sign in with email (same as sender experience)
- Privy creates an embedded wallet automatically

**Step 3: Claim**
- Click "Claim Funds"
- Funds are transferred to your Privy wallet
- No gas fees required!

**Done!** Funds are in your wallet, visible on the Wallet page.

---

## For Developers

### Prerequisites

- **Node.js:** v18 or higher
- **npm or yarn:** Latest version
- **Git:** For cloning the repository
- **CRO:** Cronos Testnet CRO for gas fees

### Quick Install

```bash
# Clone the repository
git clone https://github.com/Jeremicarose/chaindrop-mvp.git
cd chaindrop-mvp

# Install all dependencies
# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install

# Contracts (optional - already deployed)
cd ../contracts && npm install
```

---

## Local Development Setup

### 1. Smart Contracts (Already Deployed)

Contracts are already deployed on Cronos Testnet:

| Contract | Address |
|----------|---------|
| EntryPoint | `0x216e29695D99cEfE8009B7486AD99aC0f5DA2ddd` |
| AccountFactory | `0xD1F80bcFe28F36a66aFcc6eBd0BDD522cD25158C` |
| ChainDropPaymaster | `0x4C6d079F051CfcFB48f32C858E937e51Bb17095c` |
| ClaimVerifier | `0xC40A98006023B7A74e789e3EFc9E82f191eCB619` |

**If you need to redeploy:**

```bash
cd contracts

# Copy environment template
cp .env.example .env

# Edit .env with your values
# Required:
# - CRONOS_RPC_URL (https://evm-t3.cronos.org)
# - PRIVATE_KEY (deployer wallet private key)
```

**.env example:**
```bash
CRONOS_RPC_URL=https://evm-t3.cronos.org
CHAIN_ID=338
PRIVATE_KEY=0xYourPrivateKey
```

**Compile contracts:**
```bash
npx hardhat compile
```

**Deploy to Cronos Testnet:**
```bash
npx hardhat run scripts/deploy.js --network cronosTestnet
```

### 2. Backend Setup

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
```

**.env example:**
```bash
# Server
PORT=3000
NODE_ENV=development

# Blockchain - Cronos Testnet
RPC_URL=https://evm-t3.cronos.org
CHAIN_ID=338

# Deployed Contracts (already on Cronos Testnet)
ACCOUNT_FACTORY_ADDRESS=0xD1F80bcFe28F36a66aFcc6eBd0BDD522cD25158C
PAYMASTER_ADDRESS=0x4C6d079F051CfcFB48f32C858E937e51Bb17095c
CLAIM_VERIFIER_ADDRESS=0xC40A98006023B7A74e789e3EFc9E82f191eCB619
ENTRY_POINT_ADDRESS=0x216e29695D99cEfE8009B7486AD99aC0f5DA2ddd

# Admin Wallet (for sending transactions)
ADMIN_PRIVATE_KEY=0xYourPrivateKey

# Claim Link Base URL
CLAIM_LINK_BASE_URL=http://localhost:5173/claim

# Email Configuration (Resend)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=ChainDrop <onboarding@chaindrop.app>

# Explorer URL
EXPLORER_URL=https://explorer.cronos.org/testnet

# AI Configuration
ANTHROPIC_API_KEY=your-anthropic-api-key

# JWT Secret
JWT_SECRET=your-secure-jwt-secret
```

**Start development server:**
```bash
npm run dev
# or
node src/index.js
```

**Expected output:**
```
ChainDrop API Server
✓ Blockchain connected (Cronos Testnet - 338)
✓ Contracts initialized
  - AccountFactory: 0xD1F80bc...
  - Paymaster: 0x4C6d079...
  - ClaimVerifier: 0xC40A980...

🚀 Server running on http://localhost:3000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:3000/api" > .env
echo "VITE_PRIVY_APP_ID=your-privy-app-id" >> .env
echo "VITE_CHAIN=cronos-testnet" >> .env

# Start development server
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 3. Test API

**Health check:**
```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "blockchain": "connected",
  "database": "connected"
}
```

---

## Your First Transfer

### Using the Web App (Recommended)

1. Visit `http://localhost:5173`
2. Sign in with your email (Privy creates a wallet automatically)
3. Fund your wallet with testnet CRO from [Cronos Faucet](https://cronos.org/faucet)
4. Go to `/send` and enter:
   - Amount: `$5` (auto-converts to CRO)
   - Recipient: `test@example.com`
5. Click Send - recipient receives email with claim link

### Using cURL (API)

**Step 1: Get testnet CRO**
- Cronos Faucet: [https://cronos.org/faucet](https://cronos.org/faucet)

**Step 2: Prepare transfer**
```bash
curl -X POST http://localhost:3000/api/transfer/prepare \
  -H "Content-Type: application/json" \
  -d '{
    "senderAddress": "0xYourWalletAddress",
    "recipientIdentifier": "test@example.com",
    "amount": "10"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ghostVaultAddress": "0x9f8b7c6d...",
    "recipientIdentifier": "test@example.com",
    "amount": "10",
    "amountWei": "10000000000000000000"
  }
}
```

**Step 3: Send CRO to Ghost Vault**

Using ethers.js or your wallet:
```javascript
// Transfer CRO to Ghost Vault address
const tx = await signer.sendTransaction({
  to: "0x9f8b7c6d...", // ghostVaultAddress from response
  value: ethers.parseEther("10") // 10 CRO
});
await tx.wait();
```

**Step 4: Record the transfer**
```bash
curl -X POST http://localhost:3000/api/transfer/record \
  -H "Content-Type: application/json" \
  -d '{
    "senderAddress": "0xYourAddress",
    "recipientIdentifier": "test@example.com",
    "amount": "10",
    "transactionHash": "0xYourTxHash"
  }'
```

**Step 5: Claim transfer (recipient)**
```bash
curl -X POST http://localhost:3000/api/transfer/claim \
  -H "Content-Type: application/json" \
  -d '{
    "claimToken": "abc123...",
    "recipientWalletAddress": "0xRecipientAddress"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionHash": "0xdef456...",
    "claimedAmount": "10",
    "currency": "CRO"
  }
}
```

### Using JavaScript SDK (Coming Soon)

```javascript
import { ChainDrop } from '@chaindrop/sdk';

const chaindrop = new ChainDrop({
  network: 'base-sepolia',
  apiKey: 'YOUR_API_KEY'
});

// Send transfer
const transfer = await chaindrop.send({
  senderAddress: '0xYourAddress',
  recipientIdentifier: 'alice@example.com',
  amount: '10',
  token: 'USDC'
});

console.log('Claim link:', transfer.claimLink);

// Monitor claim
chaindrop.on('transfer.claimed', (event) => {
  console.log('Transfer claimed!', event);
});
```

---

## Common Use Cases

### 1. AI-Powered Payments

Use natural language to send payments via the AI Chat:

```
"Send $25 to alice@company.com for the design work"
"Pay @bob 50 CRO for coffee"
"Transfer 100 CRO to john@gmail.com"
```

The AI extracts:
- Amount (converts USD to CRO automatically)
- Recipient identifier (email, phone, @handle)
- Optional memo/reason

### 2. Scheduled/Recurring Payments

Set up programmable payments via API agents:

```javascript
// Create an API agent
const agent = await fetch('http://localhost:3000/api/agent/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ownerAddress: '0xYourAddress',
    name: 'Payroll Bot',
    policies: {
      dailyLimit: '1000',
      allowedRecipients: '*@company.com'
    }
  })
});

// Schedule weekly payment
await fetch('http://localhost:3000/api/agent/schedule/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentKeyId: agent.data.id,
    ownerAddress: '0xYourAddress',
    name: 'Weekly Allowance',
    recipientIdentifier: 'kid@family.com',
    amount: '10',
    scheduleType: 'weekly'
  })
});
```

### 3. Payroll for DAO/Team

```javascript
// Pay multiple contributors
const contributors = [
  { identifier: 'alice@example.com', amount: '100' },
  { identifier: 'bob@example.com', amount: '150' },
];

for (const contributor of contributors) {
  // Use AI parsing for natural language
  await fetch('http://localhost:3000/api/ai/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Send ${contributor.amount} CRO to ${contributor.identifier}`,
      walletAddress: daoTreasuryAddress,
      autoExecute: true
    })
  });

  console.log(`Sent ${contributor.amount} CRO to ${contributor.identifier}`);
}
```

### 4. Onboarding New Users

Send crypto to anyone by email - they don't need a wallet:

```javascript
// Onboard new users with a small amount of CRO
const newUsers = ['newuser1@gmail.com', 'newuser2@gmail.com'];

for (const email of newUsers) {
  await fetch('http://localhost:3000/api/transfer/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderAddress: '0xYourAddress',
      recipientIdentifier: email,
      amount: '5' // 5 CRO welcome bonus
    })
  });
}
// Recipients receive email, sign in with Privy, and claim with 1 click
```

---

## Troubleshooting

### Wallet Issues

**Error: "No wallet found"**
```bash
# Solution: Make sure you're signed in with Privy
# The app uses Privy embedded wallets, not external wallets like MetaMask
1. Click "Sign In" in the navigation
2. Enter your email address
3. Privy automatically creates a wallet for you
```

**Error: External wallet showing instead of Privy wallet**
```bash
# Solution: ChainDrop is designed to use Privy embedded wallets only
# If you have Rabby or MetaMask, their addresses may appear in some contexts
# but transactions are sent from your Privy wallet
```

### Backend Issues

**Error: Endpoint not found**
```bash
# Solution: Make sure backend is running from correct directory
cd /Users/yourpath/chaindrop-mvp/backend
node src/index.js
```

**Error: Contract not found at address**
```bash
# Solution: Verify contract addresses in .env match deployed contracts
ACCOUNT_FACTORY_ADDRESS=0xD1F80bcFe28F36a66aFcc6eBd0BDD522cD25158C
PAYMASTER_ADDRESS=0x4C6d079F051CfcFB48f32C858E937e51Bb17095c
CLAIM_VERIFIER_ADDRESS=0xC40A98006023B7A74e789e3EFc9E82f191eCB619
ENTRY_POINT_ADDRESS=0x216e29695D99cEfE8009B7486AD99aC0f5DA2ddd
```

**Error: Transaction underpriced**
```bash
# Solution: Cronos testnet sometimes needs higher gas
# Check backend/src/services/blockchainService.js for gas settings
```

### Frontend Issues

**Error: CORS blocked**
```bash
# Solution: Ensure backend CORS allows frontend URL
# In backend/.env:
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Error: "Buffer is not defined"**
```bash
# Solution: Buffer polyfill should be in frontend/src/main.jsx
# Make sure this is at the top:
import { Buffer } from 'buffer';
window.Buffer = window.Buffer || Buffer;
```

### AI Chat Issues

**Error: AI not parsing messages**
```bash
# Solution: Verify ANTHROPIC_API_KEY is set in backend/.env
ANTHROPIC_API_KEY=sk-ant-...
```

**Error: Claim link not working**
```bash
# Solution: Check CLAIM_LINK_BASE_URL in backend/.env
CLAIM_LINK_BASE_URL=http://localhost:5173/claim
```

---

## Next Steps

### Learn More
- [API Documentation](./API.md)
- [Smart Contract Details](./CONTRACTS.md)
- [System Architecture](./ARCHITECTURE.md)
- [Contributing Guide](../CONTRIBUTING.md)

### Build Something
- Integrate ChainDrop into your app
- Create a custom identity verifier
- Build a frontend interface
- Add new token support

### Get Help
- [GitHub Issues](https://github.com/Jeremicarose/ChainDrop/issues)
- [Discord Community](https://discord.gg/chaindrop) *(coming soon)*
- [Email Support](mailto:hello@chaindrop.app)

---

**Happy building with ChainDrop!** 🚀

---

*Last updated: January 2026*
