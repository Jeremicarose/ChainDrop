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

### 1. Smart Contracts Setup

```bash
cd contracts

# Copy environment template
cp .env.example .env

# Edit .env with your values
# Required:
# - BASE_SEPOLIA_RPC_URL (get from Alchemy/Infura)
# - PRIVATE_KEY (deployer wallet private key)
# - BASESCAN_API_KEY (for contract verification)
```

**.env example:**
```bash
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=0xYourPrivateKey
BASESCAN_API_KEY=YourBasescanApiKey
```

**Compile contracts:**
```bash
npx hardhat compile
```

**Run tests:**
```bash
npx hardhat test
```

**Deploy to Base Sepolia:**
```bash
npx hardhat run scripts/deploy.js --network baseSepolia
```

**Expected output:**
```
Deploying contracts...
EntryPoint deployed to: 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
AccountFactory deployed to: 0x1234...
ChainDropPaymaster deployed to: 0x5678...
ClaimVerifier deployed to: 0x9abc...

Deployment complete!
```

### 2. Backend Setup

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with deployed contract addresses
```

**.env example:**
```bash
# Server
PORT=3000
NODE_ENV=development

# Blockchain
RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
CHAIN_ID=84532

# Deployed Contracts (from previous step)
ACCOUNT_FACTORY_ADDRESS=0x1234...
PAYMASTER_ADDRESS=0x5678...
CLAIM_VERIFIER_ADDRESS=0x9abc...
ENTRY_POINT_ADDRESS=0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789

# Admin Wallet (for sending transactions)
ADMIN_PRIVATE_KEY=0xYourPrivateKey

# Database
DATABASE_URL=./data/chaindrop.db

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-secure-jwt-secret-here

# Optional: External Services
SENDGRID_API_KEY=your-sendgrid-key
PRIVY_API_KEY=your-privy-key
```

**Initialize database:**
```bash
npm run db:push
```

**Start development server:**
```bash
npm run dev
```

**Expected output:**
```
ChainDrop API Server
✓ Database connected
✓ Blockchain connected (Base Sepolia)
✓ Contracts initialized
  - AccountFactory: 0x1234...
  - Paymaster: 0x5678...
  - ClaimVerifier: 0x9abc...

🚀 Server running on http://localhost:3000
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

### Using cURL

**Step 1: Get testnet tokens**
- Base Sepolia ETH: [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
- Test USDC: Use contract `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

**Step 2: Create transfer**
```bash
curl -X POST http://localhost:3000/api/transfer/send \
  -H "Content-Type: application/json" \
  -d '{
    "senderAddress": "0xYourWalletAddress",
    "recipientIdentifier": "test@example.com",
    "amount": "10",
    "token": "USDC"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transferId": "xfr_abc123",
    "claimToken": "eyJhbGc...",
    "claimLink": "http://localhost:3000/claim/eyJhbGc...",
    "ghostVaultAddress": "0x9f8b7c6d...",
    "amount": "10",
    "token": "USDC",
    "estimatedGas": "0.05",
    "platformFee": "0.10",
    "netToRecipient": "9.85",
    "expiresAt": "2026-01-07T08:00:00Z"
  }
}
```

**Step 3: Send funds to Ghost Vault**

Using MetaMask or your wallet:
```javascript
// Transfer USDC to Ghost Vault address
await usdcContract.transfer(
  "0x9f8b7c6d...", // ghostVaultAddress from response
  10 * 10**6      // 10 USDC (6 decimals)
);
```

**Step 4: Claim transfer**
```bash
curl -X POST http://localhost:3000/api/transfer/claim \
  -H "Content-Type: application/json" \
  -d '{
    "claimToken": "eyJhbGc...",
    "recipientWalletAddress": "0xRecipientAddress"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transferId": "xfr_abc123",
    "transactionHash": "0xdef456...",
    "deployedAccountAddress": "0x9f8b7c6d...",
    "claimedAmount": "9.85",
    "token": "USDC",
    "gasCostDeducted": "0.05",
    "platformFee": "0.10"
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

### 1. Remittance Service

```javascript
// Send money internationally
const transfer = await fetch('http://localhost:3000/api/transfer/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    senderAddress: '0xYourAddress',
    recipientIdentifier: '+1234567890', // Phone number
    amount: '100',
    token: 'USDC',
    message: 'Rent payment for January'
  })
});

// Email the claim link to recipient
await sendEmail({
  to: 'recipient@email.com',
  subject: 'You\'ve received $100 USDC',
  body: `Click to claim: ${transfer.claimLink}`
});
```

### 2. Payroll for DAO

```javascript
// Pay 10 contributors
const contributors = [
  { identifier: 'alice@example.com', amount: '1000' },
  { identifier: 'bob@example.com', amount: '1500' },
  // ... more contributors
];

for (const contributor of contributors) {
  const transfer = await fetch('http://localhost:3000/api/transfer/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderAddress: daoTreasuryAddress,
      recipientIdentifier: contributor.identifier,
      amount: contributor.amount,
      token: 'USDC'
    })
  });

  console.log(`Sent ${contributor.amount} USDC to ${contributor.identifier}`);
}
```

### 3. Airdrop Campaign

```javascript
// Airdrop to Twitter followers
const followers = ['@alice', '@bob', '@charlie'];

for (const handle of followers) {
  await fetch('http://localhost:3000/api/transfer/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderAddress: '0xYourAddress',
      recipientIdentifier: handle,
      amount: '10',
      token: 'USDC',
      message: 'Thanks for following! 🎉'
    })
  });
}
```

---

## Troubleshooting

### Contract Deployment Issues

**Error: Insufficient funds**
```bash
# Solution: Get testnet ETH
Visit: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
```

**Error: Invalid RPC URL**
```bash
# Solution: Get free RPC from Alchemy
1. Sign up at https://www.alchemy.com/
2. Create new app (Base Sepolia)
3. Copy HTTP URL to .env
```

### Backend Issues

**Error: Cannot connect to database**
```bash
# Solution: Initialize database
npm run db:push
```

**Error: Contract not found at address**
```bash
# Solution: Redeploy contracts or update .env
cd contracts
npx hardhat run scripts/deploy.js --network baseSepolia

# Copy new addresses to backend/.env
```

**Error: Transaction underpriced**
```bash
# Solution: Increase gas price in blockchain service
# Edit backend/src/services/blockchainService.js:
maxFeePerGas: ethers.parseUnits('20', 'gwei'), // Increase from 2
```

### API Issues

**Error: CORS blocked**
```bash
# Solution: Add your frontend URL to CORS whitelist
# Edit backend/src/index.js:
app.use(cors({
  origin: ['http://localhost:3001', 'https://yourapp.com']
}));
```

**Error: Invalid claim token**
```bash
# Solution: Check JWT_SECRET matches in .env
# Regenerate claim token:
curl -X GET http://localhost:3000/api/transfer/:oldClaimToken
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
