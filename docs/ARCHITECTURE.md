# ChainDrop System Architecture

**Version:** 1.0
**Last Updated:** January 2026

---

## Table of Contents

- [Overview](#overview)
- [High-Level Architecture](#high-level-architecture)
- [Component Details](#component-details)
- [Data Flow](#data-flow)
- [Database Schema](#database-schema)
- [Security Architecture](#security-architecture)
- [Scalability Design](#scalability-design)
- [Deployment Architecture](#deployment-architecture)

---

## Overview

ChainDrop is a three-tier system consisting of:
1. **Smart Contract Layer** (on-chain)
2. **Backend API Layer** (off-chain)
3. **Frontend Application Layer** (user-facing)

The architecture enables gasless, counterfactual value delivery through deterministic address generation, account abstraction, and atomic reimbursement mechanisms.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACES                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  Web App (React)  │  Mobile App (React Native)  │  API Integrations    │
└──────────┬──────────────────────┬─────────────────────────┬─────────────┘
           │                      │                         │
           └──────────────────────┼─────────────────────────┘
                                  │
┌─────────────────────────────────┼─────────────────────────────────────┐
│                          BACKEND API LAYER                               │
├─────────────────────────────────┼─────────────────────────────────────┤
│                                  │                                       │
│  ┌──────────────┐    ┌──────────┴─────────┐    ┌──────────────────┐   │
│  │   Express.js │    │  Service Layer     │    │  External APIs   │   │
│  │   REST API   │◄──►│  - Transfer        │◄──►│  - Privy (Auth)  │   │
│  │              │    │  - Blockchain      │    │  - SendGrid      │   │
│  └──────┬───────┘    │  - Identity        │    │  - Alchemy RPC   │   │
│         │            └────────────────────┘    └──────────────────┘   │
│         │                                                              │
│  ┌──────┴────────────────────────────┐                                │
│  │      Database (SQLite/Postgres)    │                                │
│  │  - Transfers    - Wallets          │                                │
│  │  - Claims       - Identifiers      │                                │
│  └────────────────────────────────────┘                                │
└─────────────────────────────────┬─────────────────────────────────────┘
                                  │
                                  │ ethers.js
                                  │
┌─────────────────────────────────┼─────────────────────────────────────┐
│                        BLOCKCHAIN LAYER (Base)                           │
├─────────────────────────────────┼─────────────────────────────────────┤
│                                  │                                       │
│  ┌────────────────┐    ┌────────┴──────────┐    ┌─────────────────┐   │
│  │ AccountFactory │◄──►│  SimpleAccount    │◄──►│  ERC-20 Tokens  │   │
│  │  (CREATE2)     │    │  (Ghost Vaults)   │    │  (USDC, USDT)   │   │
│  └────────────────┘    └───────────────────┘    └─────────────────┘   │
│                                  │                                       │
│  ┌────────────────┐    ┌────────┴──────────┐    ┌─────────────────┐   │
│  │ ChainDrop      │    │  ClaimVerifier    │    │  EntryPoint     │   │
│  │ Paymaster      │    │                   │    │  (ERC-4337)     │   │
│  └────────────────┘    └───────────────────┘    └─────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Smart Contract Layer

#### AccountFactory
- **Purpose:** Creates deterministic smart accounts using CREATE2
- **Key Functions:**
  - `getAddress()` - Computes counterfactual addresses
  - `createAccount()` - Deploys accounts at deterministic addresses
- **Storage:**
  - `accountImplementation` - Immutable reference to account template
  - `entryPoint` - Immutable EntryPoint address

#### SimpleAccount
- **Purpose:** ERC-4337 compliant smart account that serves as Ghost Vault
- **Key Functions:**
  - `validateUserOp()` - Validates ERC-4337 UserOperations
  - `claimFundsSimple()` - Transfers funds to recipient
  - `execute()` - Executes arbitrary transactions
- **Storage:**
  - `owner` - Account owner address
  - `claimedIdentifiers` - Mapping of claimed identifier hashes

#### ChainDropPaymaster
- **Purpose:** Sponsors gas for claim transactions
- **Key Functions:**
  - `validatePaymasterUserOp()` - Pre-execution validation
  - `postOp()` - Post-execution fee collection
- **Storage:**
  - `defaultFeePercentage` - Platform fee (0.5-5%)
  - `feeCollector` - Address receiving collected fees

#### ClaimVerifier
- **Purpose:** Cryptographic verification utilities
- **Key Functions:**
  - `hashIdentifier()` - Hashes identifiers for privacy
  - `verifyClaimSignature()` - Validates claim proofs
- **Stateless:** No storage, pure functions only

### 2. Backend API Layer

#### Technology Stack
```javascript
{
  "runtime": "Node.js 18+",
  "framework": "Express.js 5.2.1",
  "database": "SQLite (dev) / PostgreSQL (prod)",
  "orm": "Drizzle ORM 0.45.1",
  "blockchain": "ethers.js 6.16.0",
  "auth": "JWT (jsonwebtoken 9.0.3)",
  "encryption": "bcrypt 6.0.0"
}
```

#### Service Architecture

##### TransferService
**Responsibilities:**
- Transfer lifecycle management (create, claim, expire)
- Business logic validation
- Identifier hashing and privacy
- Claim eligibility checks

**Key Methods:**
```javascript
class TransferService {
  async createTransfer(data) {
    // 1. Validate sender address and amount
    // 2. Compute Ghost Vault address
    // 3. Store transfer in database
    // 4. Generate claim token
    // 5. Return claim link
  }

  async processClaim(claimToken, recipientAddress) {
    // 1. Validate claim token
    // 2. Check expiration (24 hours)
    // 3. Verify not already claimed
    // 4. Call blockchain service to deploy + claim
    // 5. Update database with claim info
    // 6. Return transaction hash
  }

  async isClaimable(transferId) {
    // 1. Check if transfer exists
    // 2. Verify not claimed
    // 3. Verify not expired
    // 4. Check Ghost Vault has funds
    // 5. Return boolean + reason
  }

  hashIdentifier(identifier) {
    // 1. Normalize identifier (lowercase email, format phone)
    // 2. Hash with keccak256
    // 3. Return hash for CREATE2 salt
  }
}
```

##### BlockchainService
**Responsibilities:**
- Smart contract interactions
- Transaction construction and submission
- Event monitoring
- Gas estimation

**Key Methods:**
```javascript
class BlockchainService {
  async getCounterfactualAddress(identifier) {
    // 1. Hash identifier
    // 2. Call AccountFactory.getAddress()
    // 3. Return Ghost Vault address
  }

  async sendFunds(token, amount, ghostVaultAddress) {
    // 1. Get token contract (or use ETH)
    // 2. Approve (if ERC-20)
    // 3. Transfer to Ghost Vault
    // 4. Wait for confirmation
    // 5. Return transaction hash
  }

  async deployAndClaim(ghostVaultAddress, recipient, token, amount) {
    // 1. Construct UserOperation with:
    //    - initCode (for account deployment)
    //    - callData (for claim execution)
    //    - paymasterAndData (for gas sponsorship)
    // 2. Sign UserOperation
    // 3. Submit to bundler (e.g., Pimlico)
    // 4. Wait for transaction
    // 5. Return deployment address + tx hash
  }

  async estimateGas(operation) {
    // 1. Simulate UserOperation
    // 2. Calculate gas costs
    // 3. Add platform fee
    // 4. Return estimate
  }
}
```

#### Controller Layer

```javascript
// transferController.js
class TransferController {
  async send(req, res) {
    // POST /api/transfer/send
    const { senderAddress, recipientIdentifier, amount, token } = req.body;

    try {
      const transfer = await transferService.createTransfer({
        senderAddress,
        recipientIdentifier,
        amount,
        token
      });

      res.json({ success: true, data: transfer });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async claim(req, res) {
    // POST /api/transfer/claim
    const { claimToken, recipientWalletAddress } = req.body;

    try {
      const result = await transferService.processClaim(
        claimToken,
        recipientWalletAddress
      );

      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ... other endpoints
}
```

### 3. Frontend Layer (Planned)

```
src/
├── components/
│   ├── SendForm.tsx          # Transfer creation UI
│   ├── ClaimPage.tsx         # Claim flow
│   ├── WalletConnect.tsx     # Web3 wallet integration
│   └── TransferList.tsx      # Transfer history
├── hooks/
│   ├── useTransfer.ts        # Transfer operations
│   ├── useWallet.ts          # Wallet connection
│   └── useClaim.ts           # Claim flow
├── services/
│   ├── api.ts                # Backend API client
│   └── blockchain.ts         # Direct contract calls
└── utils/
    ├── validation.ts         # Input validation
    └── formatting.ts         # Amount/address formatting
```

---

## Data Flow

### Send Flow (Detailed)

```
┌─────────┐
│  Sender │
└────┬────┘
     │ 1. Enter recipient identifier, amount, token
     ↓
┌────────────────┐
│  Frontend      │
│  (Validation)  │
└────┬───────────┘
     │ 2. POST /api/transfer/send
     ↓
┌────────────────────────────────────────────────────────────┐
│  Backend API                                                │
│                                                             │
│  TransferService:                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. Validate inputs                                    │  │
│  │ 2. hashIdentifier("alice@example.com")                │  │
│  │    → 0x1234...abcd                                    │  │
│  │ 3. Call BlockchainService.getCounterfactualAddress()  │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                         │
│  BlockchainService:                                         │
│  ┌────────────────┴─────────────────────────────────────┐  │
│  │ 4. accountFactory.getAddress(0x0, salt)               │  │
│  │    → 0x9f8b7c6d... (Ghost Vault address)              │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                         │
│  TransferService:                                           │
│  ┌────────────────┴─────────────────────────────────────┐  │
│  │ 5. Save to database:                                  │  │
│  │    - transferId: "xfr_abc123"                         │  │
│  │    - ghostVaultAddress: 0x9f8b7c6d...                 │  │
│  │    - amount: 50                                       │  │
│  │    - token: USDC                                      │  │
│  │    - expiresAt: now + 24h                             │  │
│  │ 6. Generate JWT claim token                           │  │
│  │ 7. Create claim link                                  │  │
│  └────────────────┬─────────────────────────────────────┘  │
└────────────────────┼─────────────────────────────────────┘
                     │ 8. Return { claimToken, claimLink, ghostVaultAddress }
                     ↓
┌────────────────────┐
│  Sender's Wallet   │
│                    │
│  9. User approves  │
│     USDC transfer  │
│  10. Send 50 USDC  │
│      to Ghost Vault│
└─────────┬──────────┘
          │ 11. Transaction broadcast
          ↓
┌───────────────────────────────────────┐
│  Blockchain (Base)                     │
│                                        │
│  12. USDC transferred to 0x9f8b7c6d...│
│      (No code deployed at address yet!)│
└───────────────────────────────────────┘
```

### Claim Flow (Detailed)

```
┌───────────┐
│ Recipient │
└─────┬─────┘
      │ 1. Clicks claim link (contains claimToken)
      ↓
┌─────────────────┐
│  Frontend       │
│  (Claim Page)   │
└─────┬───────────┘
      │ 2. GET /api/transfer/:claimToken
      ↓
┌───────────────────────────────────────────────────────────┐
│  Backend API                                               │
│                                                            │
│  3. Validate claim token (JWT)                             │
│  4. Fetch transfer from database                           │
│  5. Return transfer details + ghostVaultAddress            │
└─────┬──────────────────────────────────────────────────────┘
      │ 6. { amount, token, ghostVaultAddress, expiresAt }
      ↓
┌─────────────────┐
│  Frontend       │
│  7. User enters │
│     wallet addr │
│  8. Clicks claim│
└─────┬───────────┘
      │ 9. POST /api/transfer/claim { claimToken, recipientAddress }
      ↓
┌──────────────────────────────────────────────────────────┐
│  Backend API                                              │
│                                                           │
│  TransferService:                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 10. Validate not claimed                            │ │
│  │ 11. Validate not expired                            │ │
│  │ 12. Generate claim signature                        │ │
│  └─────────────┬───────────────────────────────────────┘ │
│                │                                          │
│  BlockchainService:                                       │
│  ┌─────────────┴───────────────────────────────────────┐ │
│  │ 13. Construct UserOperation:                        │ │
│  │     - sender: ghostVaultAddress                     │ │
│  │     - initCode: accountFactory.createAccount(...)   │ │
│  │     - callData: simpleAccount.claimFundsSimple(...) │ │
│  │     - paymasterAndData: paymaster + fee             │ │
│  │     - signature: claim proof                        │ │
│  │ 14. Submit to bundler                               │ │
│  └─────────────┬───────────────────────────────────────┘ │
└────────────────┼─────────────────────────────────────────┘
                 │ 15. UserOp submitted
                 ↓
┌────────────────────────────────────────────────────────────┐
│  ERC-4337 Bundler (e.g., Pimlico)                          │
│                                                             │
│  16. Validate UserOperation                                 │
│  17. Submit to EntryPoint.handleOps()                       │
└────────┬────────────────────────────────────────────────────┘
         │ 18. Transaction broadcast
         ↓
┌─────────────────────────────────────────────────────────────┐
│  Blockchain (Base) - ATOMIC EXECUTION                        │
│                                                              │
│  EntryPoint Contract:                                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 19. Validate with Paymaster                            │ │
│  │ 20. Execute initCode → Deploy SimpleAccount            │ │
│  │     at ghostVaultAddress (0x9f8b7c6d...)               │ │
│  │ 21. Execute callData → simpleAccount.claimFundsSimple()│ │
│  │     → Transfer 50 USDC to recipient                    │ │
│  │ 22. Call Paymaster.postOp()                            │ │
│  │     → Deduct 0.50 USDC fee                             │ │
│  │     → Reimburse bundler for gas                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Result:                                                     │
│  ✓ SimpleAccount deployed at 0x9f8b7c6d...                  │
│  ✓ 49.50 USDC in recipient's wallet                         │
│  ✓ 0.50 USDC fee collected                                  │
│  ✓ Gas reimbursed to bundler                                │
└──────────────────────────────────────────────────────────────┘
         │ 23. Transaction confirmed
         ↓
┌────────────────────────────────────────────────────────────┐
│  Backend API                                                │
│                                                             │
│  24. Update database:                                       │
│      - status: "claimed"                                    │
│      - claimedAt: timestamp                                 │
│      - claimTransactionHash: 0xabc...                       │
│  25. Return { transactionHash, deployedAccountAddress }     │
└─────┬───────────────────────────────────────────────────────┘
      │
      ↓
┌───────────┐
│ Recipient │
│           │
│ ✓ Funds   │
│   received│
└───────────┘
```

---

## Database Schema

### Tables

#### transfers
```sql
CREATE TABLE transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transfer_id TEXT UNIQUE NOT NULL,          -- e.g., "xfr_abc123"
  sender_address TEXT NOT NULL,              -- 0x742d35...
  recipient_identifier_hash TEXT NOT NULL,   -- keccak256(identifier)
  ghost_vault_address TEXT NOT NULL,         -- 0x9f8b7c6d...
  amount TEXT NOT NULL,                      -- "50" (stored as string for precision)
  token TEXT NOT NULL,                       -- "USDC", "ETH", etc.
  message TEXT,                              -- Optional message
  claim_token TEXT UNIQUE NOT NULL,          -- JWT token
  status TEXT DEFAULT 'pending',             -- pending|claimed|expired|cancelled
  created_at INTEGER NOT NULL,               -- Unix timestamp
  expires_at INTEGER NOT NULL,               -- Unix timestamp
  claimed_at INTEGER,                        -- Unix timestamp (null if not claimed)
  claim_transaction_hash TEXT,               -- 0xabc123...
  deployed_account_address TEXT             -- Same as ghost_vault_address after deployment
);

CREATE INDEX idx_sender ON transfers(sender_address);
CREATE INDEX idx_status ON transfers(status);
CREATE INDEX idx_claim_token ON transfers(claim_token);
```

#### claims
```sql
CREATE TABLE claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transfer_id TEXT NOT NULL,
  recipient_address TEXT NOT NULL,           -- Claiming wallet address
  claim_proof TEXT,                          -- Signature/proof
  claimed_at INTEGER NOT NULL,
  transaction_hash TEXT NOT NULL,
  block_number INTEGER,
  gas_used TEXT,
  FOREIGN KEY (transfer_id) REFERENCES transfers(transfer_id)
);
```

#### wallets
```sql
CREATE TABLE wallets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT UNIQUE NOT NULL,              -- Smart account address
  owner_address TEXT NOT NULL,               -- EOA owner address
  deployed_at INTEGER NOT NULL,
  deployment_transaction_hash TEXT NOT NULL,
  deployment_type TEXT DEFAULT 'claim',      -- claim|manual
  total_received_usd REAL DEFAULT 0,
  claim_count INTEGER DEFAULT 0
);
```

#### identifiers (for tracking claim history)
```sql
CREATE TABLE identifiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identifier_hash TEXT UNIQUE NOT NULL,      -- keccak256(identifier)
  identifier_type TEXT NOT NULL,             -- email|phone|handle
  first_transfer_at INTEGER NOT NULL,
  last_transfer_at INTEGER NOT NULL,
  total_transfers INTEGER DEFAULT 0,
  total_claimed INTEGER DEFAULT 0,
  total_volume_usd REAL DEFAULT 0
);
```

---

## Security Architecture

### Authentication & Authorization

```
┌──────────────────────────────────────────────────────┐
│  Identity Verification Flow                          │
├──────────────────────────────────────────────────────┤
│                                                       │
│  1. User initiates claim                             │
│     ↓                                                 │
│  2. Redirect to identity provider (Privy/OAuth)       │
│     ↓                                                 │
│  3. User authenticates (email OTP, social login)      │
│     ↓                                                 │
│  4. Provider returns signed JWT                       │
│     ↓                                                 │
│  5. Backend verifies JWT signature                    │
│     ↓                                                 │
│  6. Extract identifier from JWT claims                │
│     ↓                                                 │
│  7. Hash identifier → compare with transfer record    │
│     ↓                                                 │
│  8. If match → generate claim proof                   │
│     ↓                                                 │
│  9. Submit UserOperation with proof                   │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### Threat Mitigation

| Threat | Mitigation |
|--------|-----------|
| **Replay Attacks** | Nonce-based signatures, one-time claim tokens |
| **Address Squatting** | Unpredictable salts (include timestamp + sender nonce) |
| **Unauthorized Claims** | Cryptographic proof verification |
| **Double Claiming** | On-chain mapping of claimed identifiers |
| **Phishing** | HTTPS only, domain verification, email from trusted sender |
| **DoS Attacks** | Rate limiting (100 req/min), gas limits, circuit breakers |
| **SQL Injection** | Parameterized queries (Drizzle ORM) |
| **XSS** | Input sanitization, CSP headers |
| **CSRF** | CSRF tokens, SameSite cookies |
| **Private Key Exposure** | Hardware wallet integration, never store private keys |

---

## Scalability Design

### Horizontal Scaling

```
                       ┌──────────────┐
                       │ Load Balancer│
                       │  (Nginx)     │
                       └──────┬───────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
         ┌────▼────┐     ┌────▼────┐     ┌───▼─────┐
         │ API     │     │ API     │     │ API     │
         │ Server 1│     │ Server 2│     │ Server 3│
         └────┬────┘     └────┬────┘     └────┬────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
                     ┌────────▼────────┐
                     │   PostgreSQL    │
                     │  (Primary +     │
                     │   Read Replicas)│
                     └─────────────────┘
```

### Caching Strategy

```javascript
// Redis cache for frequently accessed data
const cache = {
  // Ghost Vault address lookup (1 hour TTL)
  ghostVault: async (identifier) => {
    const key = `gv:${identifier}`;
    let address = await redis.get(key);

    if (!address) {
      address = await blockchainService.getCounterfactualAddress(identifier);
      await redis.setex(key, 3600, address); // Cache 1 hour
    }

    return address;
  },

  // Transfer details (5 min TTL)
  transfer: async (claimToken) => {
    const key = `tr:${claimToken}`;
    let transfer = await redis.get(key);

    if (!transfer) {
      transfer = await db.getTransfer(claimToken);
      await redis.setex(key, 300, JSON.stringify(transfer));
    }

    return JSON.parse(transfer);
  }
};
```

### Database Optimization

- **Indexes:** On frequently queried fields (sender_address, status, claim_token)
- **Partitioning:** Partition transfers by month for historical data
- **Archiving:** Move claimed transfers older than 90 days to archive table
- **Connection Pooling:** Max 20 connections per API instance

### Blockchain Optimization

- **Batching:** Group multiple UserOps in single bundler submission
- **Gas Estimation Cache:** Cache gas prices (update every 30s)
- **RPC Failover:** Multiple RPC providers (Alchemy + Infura + QuickNode)
- **Event Indexing:** Use The Graph for historical event queries

---

## Deployment Architecture

### Infrastructure (AWS/GCP)

```
┌─────────────────────────────────────────────────────────┐
│  Production Environment (AWS)                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  CloudFront (CDN)                                 │   │
│  │  - Frontend static assets                         │   │
│  │  - Global distribution                            │   │
│  └────────────────────┬─────────────────────────────┘   │
│                       │                                  │
│  ┌────────────────────▼─────────────────────────────┐   │
│  │  Application Load Balancer                        │   │
│  │  - SSL termination                                │   │
│  │  - Health checks                                  │   │
│  └────────────────────┬─────────────────────────────┘   │
│                       │                                  │
│  ┌────────────────────┴─────────────────────────────┐   │
│  │  ECS (Elastic Container Service)                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │   │
│  │  │ API      │  │ API      │  │ API      │        │   │
│  │  │ Container│  │ Container│  │ Container│        │   │
│  │  │ (Node.js)│  │ (Node.js)│  │ (Node.js)│        │   │
│  │  └──────────┘  └──────────┘  └──────────┘        │   │
│  └────────────────────┬─────────────────────────────┘   │
│                       │                                  │
│  ┌────────────────────┴─────────────────────────────┐   │
│  │  RDS (PostgreSQL)                                 │   │
│  │  - Primary instance (Multi-AZ)                    │   │
│  │  - Read replicas (2x)                             │   │
│  │  - Automated backups                              │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
│  ┌───────────────────────────────────────────────────┐   │
│  │  ElastiCache (Redis)                              │   │
│  │  - Caching layer                                  │   │
│  │  - Session storage                                │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
│  ┌───────────────────────────────────────────────────┐   │
│  │  CloudWatch                                       │   │
│  │  - Logging                                        │   │
│  │  - Monitoring                                     │   │
│  │  - Alerts                                         │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Monitoring & Observability

```javascript
// Datadog/New Relic instrumentation
const metrics = {
  // Business metrics
  transferCreated: () => statsd.increment('transfer.created'),
  transferClaimed: () => statsd.increment('transfer.claimed'),
  transferExpired: () => statsd.increment('transfer.expired'),

  // Performance metrics
  apiLatency: (endpoint, duration) => {
    statsd.timing(`api.${endpoint}.latency`, duration);
  },

  blockchainLatency: (operation, duration) => {
    statsd.timing(`blockchain.${operation}.latency`, duration);
  },

  // Error tracking
  error: (type, error) => {
    statsd.increment(`error.${type}`);
    logger.error(type, { error, stack: error.stack });
  }
};
```

---

## Future Enhancements

### Phase 2
- Multi-chain support (Optimism, Arbitrum, Polygon)
- Batch transfers (send to 100+ recipients at once)
- Recurring transfers (monthly payroll)
- Mobile SDK

### Phase 3
- Zero-knowledge claim proofs (privacy-preserving)
- Decentralized bundler network
- Cross-chain bridging
- On-chain governance

---

*Last updated: January 2026*
