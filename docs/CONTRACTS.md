# ChainDrop Smart Contracts Documentation

**Version:** 1.0
**Solidity:** 0.8.28
**Network:** Base Sepolia (Testnet)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Core Contracts](#core-contracts)
  - [AccountFactory](#accountfactory)
  - [SimpleAccount](#simpleaccount)
  - [ChainDropPaymaster](#chaindropaymaster)
  - [ClaimVerifier](#claimverifier)
- [Contract Interactions](#contract-interactions)
- [Security Model](#security-model)
- [Deployment Guide](#deployment-guide)
- [Testing](#testing)

---

## Overview

ChainDrop's smart contract system enables **gasless, counterfactual value delivery** using ERC-4337 Account Abstraction. The architecture consists of four core contracts that work together to create Ghost Vaults, accept funds, and enable recipients to claim without gas fees.

### Key Technologies

- **ERC-4337:** Account Abstraction standard for UserOperations
- **CREATE2 (EIP-1014):** Deterministic address generation
- **ERC-1967:** Proxy pattern for upgradeable accounts
- **OpenZeppelin Contracts v5.4.0:** Battle-tested base contracts

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ChainDrop System                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  AccountFactory  │  Creates deterministic Ghost Vaults
└────────┬─────────┘
         │ deploys
         ↓
┌──────────────────┐
│  SimpleAccount   │  ERC-4337 smart account (Ghost Vault)
│  (Proxy)         │  • Receives funds before deployment
└────────┬─────────┘  • Claims funds with verification
         │            • Transforms to full smart account
         │
         ↓
┌──────────────────┐
│ ChainDropPaymaster│ Sponsors gas for claim transactions
└────────┬─────────┘  • Validates UserOperations
         │            • Charges platform fee
         │            • Reimburses bundlers
         ↓
┌──────────────────┐
│  ClaimVerifier   │  Generates and validates claim proofs
└──────────────────┘  • ECDSA signature verification
                      • Identifier hashing
                      • Deadline validation
```

---

## Core Contracts

### AccountFactory

**Purpose:** Creates deterministic smart contract wallets (Ghost Vaults) using CREATE2.

**Location:** `/contracts/contracts/core/AccountFactory.sol`

#### Key Functions

##### `createAccount(address owner, uint256 salt)`

Creates a new smart account at a deterministic address.

```solidity
function createAccount(
    address owner,
    uint256 salt
) public returns (SimpleAccount account)
```

**Parameters:**
- `owner` - Initial owner of the account (recipient's wallet after claim)
- `salt` - Unique value derived from recipient identifier hash

**Returns:**
- `account` - The deployed SimpleAccount instance

**Example:**
```solidity
// Generate salt from identifier
bytes32 identifierHash = keccak256(abi.encodePacked("alice@example.com"));
uint256 salt = uint256(identifierHash);

// Create account
SimpleAccount ghostVault = accountFactory.createAccount(
    recipientAddress,
    salt
);
```

##### `getAddress(address owner, uint256 salt)`

Computes the counterfactual address without deploying.

```solidity
function getAddress(
    address owner,
    uint256 salt
) public view returns (address)
```

**Parameters:**
- `owner` - Intended owner address
- `salt` - Salt for CREATE2

**Returns:**
- Counterfactual address where the account will be deployed

**Example:**
```solidity
// Get Ghost Vault address before deployment
address ghostVault = accountFactory.getAddress(
    recipientAddress,
    salt
);

// Funds can be sent to this address even though no code is deployed yet
```

#### Implementation Details

```solidity
contract AccountFactory {
    SimpleAccount public immutable accountImplementation;
    IEntryPoint public immutable entryPoint;

    constructor(IEntryPoint _entryPoint) {
        entryPoint = _entryPoint;
        accountImplementation = new SimpleAccount(_entryPoint);
    }

    function createAccount(address owner, uint256 salt)
        public
        returns (SimpleAccount ret)
    {
        address addr = getAddress(owner, salt);
        uint256 codeSize = addr.code.length;

        if (codeSize > 0) {
            return SimpleAccount(payable(addr));
        }

        ret = SimpleAccount(payable(
            new ERC1967Proxy{salt: bytes32(salt)}(
                address(accountImplementation),
                abi.encodeCall(SimpleAccount.initialize, (owner))
            )
        ));
    }

    function getAddress(address owner, uint256 salt)
        public
        view
        returns (address)
    {
        return Create2.computeAddress(
            bytes32(salt),
            keccak256(abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(
                    address(accountImplementation),
                    abi.encodeCall(SimpleAccount.initialize, (owner))
                )
            ))
        );
    }
}
```

---

### SimpleAccount

**Purpose:** ERC-4337 compliant smart account that serves as a Ghost Vault before claim and full smart account after.

**Location:** `/contracts/contracts/core/SimpleAccount.sol`

#### Key Features

- **Pre-Deployment Funding:** Can receive ETH and ERC-20 tokens before code is deployed
- **One-Time Claims:** Prevents double-claiming with claim tracking
- **Gas Abstraction:** Integrates with Paymaster for gasless transactions
- **Signature Verification:** Validates claim proofs before fund release
- **Owner-Based Access Control:** Only owner can execute transactions post-claim

#### Key Functions

##### `claimFundsSimple(address token, uint256 amount, address recipient)`

Claim funds from the Ghost Vault (simplified version).

```solidity
function claimFundsSimple(
    address token,
    uint256 amount,
    address recipient
) external onlyOwner
```

**Parameters:**
- `token` - Token address (address(0) for ETH)
- `amount` - Amount to claim
- `recipient` - Destination address

**Access:** Only callable by account owner

**Example:**
```solidity
// Claim 50 USDC
simpleAccount.claimFundsSimple(
    USDC_ADDRESS,
    50 * 10**6, // 50 USDC (6 decimals)
    recipientWallet
);
```

##### `validateUserOp(UserOperation calldata userOp, bytes32 userOpHash, uint256 missingAccountFunds)`

Validates UserOperations for ERC-4337 compatibility.

```solidity
function validateUserOp(
    UserOperation calldata userOp,
    bytes32 userOpHash,
    uint256 missingAccountFunds
) external override returns (uint256 validationData)
```

**Parameters:**
- `userOp` - The UserOperation being executed
- `userOpHash` - Hash of the UserOperation
- `missingAccountFunds` - Funds needed to pay for gas

**Returns:**
- `validationData` - 0 for valid, 1 for invalid

**Access:** Only callable by EntryPoint

##### `execute(address dest, uint256 value, bytes calldata func)`

Execute arbitrary transaction from the account.

```solidity
function execute(
    address dest,
    uint256 value,
    bytes calldata func
) external onlyOwner
```

**Parameters:**
- `dest` - Destination address
- `value` - ETH value to send
- `func` - Encoded function call data

#### Implementation Highlights

```solidity
contract SimpleAccount is Initializable, IERC4337Account {
    address public owner;
    IEntryPoint private immutable _entryPoint;

    mapping(bytes32 => bool) public claimedIdentifiers;

    function initialize(address _owner) public virtual initializer {
        _initialize(_owner);
    }

    function claimFundsSimple(
        address token,
        uint256 amount,
        address recipient
    ) external onlyOwner {
        require(!claimedIdentifiers[tokenIdentifier], "Already claimed");

        claimedIdentifiers[tokenIdentifier] = true;

        if (token == address(0)) {
            // Transfer ETH
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            // Transfer ERC-20
            IERC20(token).transfer(recipient, amount);
        }

        emit FundsClaimed(token, amount, recipient);
    }

    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external virtual override returns (uint256 validationData) {
        _requireFromEntryPoint();
        validationData = _validateSignature(userOp, userOpHash);
        _payPrefund(missingAccountFunds);
    }

    function _validateSignature(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual returns (uint256 validationData) {
        bytes32 hash = userOpHash.toEthSignedMessageHash();
        address recovered = hash.recover(userOp.signature);
        if (owner != recovered) {
            return SIG_VALIDATION_FAILED;
        }
        return 0;
    }
}
```

---

### ChainDropPaymaster

**Purpose:** Sponsors gas fees for claim transactions and collects platform fees.

**Location:** `/contracts/contracts/core/ChainDropPaymaster.sol`

#### Key Features

- **Gas Sponsorship:** Fronts gas costs for recipient claims
- **Atomic Reimbursement:** Recovered from claim amount in same transaction
- **Fee Collection:** Charges configurable platform fee (0.5-5%)
- **ERC-4337 Compliant:** Implements IPaymaster interface
- **Deposit Management:** Maintains ETH deposit in EntryPoint for gas

#### Key Functions

##### `validatePaymasterUserOp(UserOperation calldata userOp, bytes32 userOpHash, uint256 maxCost)`

Validates UserOperation before sponsoring gas.

```solidity
function validatePaymasterUserOp(
    UserOperation calldata userOp,
    bytes32 userOpHash,
    uint256 maxCost
) external override returns (bytes memory context, uint256 validationData)
```

**Parameters:**
- `userOp` - UserOperation to validate
- `userOpHash` - Hash for signature verification
- `maxCost` - Maximum gas cost in wei

**Returns:**
- `context` - Data passed to postOp (encoded fee info)
- `validationData` - 0 for valid, packed data for time-bound validation

**Logic:**
1. Verify caller is EntryPoint
2. Decode fee parameters from paymasterAndData
3. Validate fee percentage (max 5%)
4. Return context for postOp

##### `postOp(PostOpMode mode, bytes calldata context, uint256 actualGasCost)`

Called after UserOp execution to collect fees.

```solidity
function postOp(
    PostOpMode mode,
    bytes calldata context,
    uint256 actualGasCost
) external override
```

**Parameters:**
- `mode` - Execution mode (opSucceeded, opReverted, postOpReverted)
- `context` - Context from validatePaymasterUserOp
- `actualGasCost` - Actual gas spent

**Logic:**
1. Decode account address and fee from context
2. Calculate platform fee from transaction
3. Transfer fees to paymaster
4. Emit FeeCollected event

#### Fee Configuration

```solidity
contract ChainDropPaymaster is BasePaymaster {
    uint256 public constant MAX_FEE_PERCENTAGE = 500; // 5%
    uint256 public defaultFeePercentage = 50; // 0.5%

    address public feeCollector;

    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= MAX_FEE_PERCENTAGE, "Fee too high");
        defaultFeePercentage = _feePercentage;
    }

    function withdrawFees() external onlyOwner {
        (bool success, ) = feeCollector.call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
}
```

---

### ClaimVerifier

**Purpose:** Generates and verifies cryptographic claim proofs.

**Location:** `/contracts/contracts/core/ClaimVerifier.sol`

#### Key Functions

##### `hashIdentifier(string memory identifier)`

Hashes recipient identifier for privacy.

```solidity
function hashIdentifier(string memory identifier)
    public
    pure
    returns (bytes32)
```

**Parameters:**
- `identifier` - Email, phone, or social handle

**Returns:**
- `bytes32` hash suitable for CREATE2 salt

**Example:**
```solidity
bytes32 hash = claimVerifier.hashIdentifier("alice@example.com");
// Returns: 0x1234...abcd
```

##### `generateClaimSignature(bytes32 identifierHash, address recipient, uint256 deadline)`

Generates signature for claim verification.

```solidity
function generateClaimSignature(
    bytes32 identifierHash,
    address recipient,
    uint256 deadline,
    uint256 privateKey
) public pure returns (bytes memory signature)
```

**Parameters:**
- `identifierHash` - Hashed identifier
- `recipient` - Claiming wallet address
- `deadline` - Claim expiry timestamp
- `privateKey` - Signer private key (off-chain only!)

**Returns:**
- ECDSA signature bytes

##### `verifyClaimSignature(bytes32 identifierHash, address recipient, uint256 deadline, bytes memory signature)`

Verifies claim signature validity.

```solidity
function verifyClaimSignature(
    bytes32 identifierHash,
    address recipient,
    uint256 deadline,
    bytes memory signature
) public view returns (bool)
```

**Parameters:**
- `identifierHash` - Hashed identifier
- `recipient` - Claiming wallet
- `deadline` - Claim deadline
- `signature` - Signature to verify

**Returns:**
- `true` if signature is valid and not expired

**Example:**
```solidity
bool isValid = claimVerifier.verifyClaimSignature(
    identifierHash,
    recipientAddress,
    block.timestamp + 24 hours,
    signature
);
require(isValid, "Invalid claim proof");
```

#### Implementation

```solidity
contract ClaimVerifier {
    using ECDSA for bytes32;

    function hashIdentifier(string memory identifier)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(identifier));
    }

    function verifyClaimSignature(
        bytes32 identifierHash,
        address recipient,
        uint256 deadline,
        bytes memory signature
    ) public view returns (bool) {
        require(block.timestamp <= deadline, "Claim expired");

        bytes32 message = keccak256(abi.encodePacked(
            identifierHash,
            recipient,
            deadline
        ));

        bytes32 ethSignedMessageHash = message.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);

        return signer == authorizedSigner;
    }
}
```

---

## Contract Interactions

### Complete Flow: Send → Claim

```solidity
// ========================================
// STEP 1: Compute Ghost Vault Address
// ========================================

// Hash recipient identifier
bytes32 identifierHash = claimVerifier.hashIdentifier("alice@example.com");
uint256 salt = uint256(identifierHash);

// Get counterfactual address (no deployment yet!)
address ghostVault = accountFactory.getAddress(ZERO_ADDRESS, salt);

// ========================================
// STEP 2: Send Funds to Ghost Vault
// ========================================

// Transfer USDC to Ghost Vault (address with no code)
USDC.transfer(ghostVault, 50 * 10**6); // 50 USDC

// ========================================
// STEP 3: Recipient Claims (via UserOp)
// ========================================

// Generate claim signature (off-chain)
bytes memory signature = claimVerifier.generateClaimSignature(
    identifierHash,
    recipientWallet,
    block.timestamp + 24 hours,
    signerPrivateKey // Off-chain only!
);

// Construct UserOperation
UserOperation memory userOp = UserOperation({
    sender: ghostVault, // Ghost Vault address
    nonce: 0,
    initCode: abi.encodePacked(
        address(accountFactory),
        abi.encodeCall(
            accountFactory.createAccount,
            (recipientWallet, salt)
        )
    ), // Deploys account on first use
    callData: abi.encodeCall(
        SimpleAccount.claimFundsSimple,
        (address(USDC), 50 * 10**6, recipientWallet)
    ),
    callGasLimit: 100000,
    verificationGasLimit: 200000,
    preVerificationGas: 21000,
    maxFeePerGas: 2 gwei,
    maxPriorityFeePerGas: 1 gwei,
    paymasterAndData: abi.encodePacked(
        address(paymaster),
        uint256(50) // 0.5% fee
    ),
    signature: signature
});

// Submit to bundler (e.g., Pimlico)
entryPoint.handleOps([userOp], beneficiary);

// ========================================
// RESULT
// ========================================
// 1. SimpleAccount deployed at ghostVault address
// 2. 50 USDC claimed to recipientWallet
// 3. Gas costs reimbursed from claim amount
// 4. Platform fee (0.5%) collected by paymaster
```

---

## Security Model

### Claim Authorization

**Problem:** How do we ensure only the rightful owner of an identifier can claim funds?

**Solution:** Multi-layer verification

1. **Off-Chain Verifier** (e.g., Privy, Worldcoin)
   - User authenticates with email/social account
   - Verifier issues signed proof

2. **On-Chain Validation**
   - ClaimVerifier checks signature
   - Validates deadline hasn't passed
   - Confirms signer is authorized

3. **Smart Account Ownership**
   - SimpleAccount checks `claimedIdentifiers` mapping
   - Prevents double-claiming
   - Enforces owner-only access

### Replay Protection

```solidity
// Each identifier can only be claimed once per token
mapping(bytes32 => bool) public claimedIdentifiers;

function claimFundsSimple(...) external {
    bytes32 claimId = keccak256(abi.encodePacked(token, identifierHash));
    require(!claimedIdentifiers[claimId], "Already claimed");

    claimedIdentifiers[claimId] = true; // Mark as claimed
    // ... transfer funds
}
```

### Address Squatting Prevention

**Problem:** Can someone deploy code at the Ghost Vault address before the recipient?

**Solution:** Factory-controlled deployment

```solidity
// Only AccountFactory can deploy at the CREATE2 address
// Salt includes unpredictable elements:
uint256 salt = uint256(keccak256(abi.encodePacked(
    identifierHash,
    senderNonce,
    block.timestamp
)));
```

### Reentrancy Protection

All fund transfers use OpenZeppelin's ReentrancyGuard:

```solidity
function claimFundsSimple(...)
    external
    onlyOwner
    nonReentrant
{
    // Safe from reentrancy attacks
}
```

### Gas Limit Enforcement

```solidity
// Paymaster caps gas to prevent DoS
function validatePaymasterUserOp(...)
    external
    override
    returns (bytes memory context, uint256 validationData)
{
    require(userOp.callGasLimit <= MAX_GAS_LIMIT, "Gas too high");
    require(userOp.verificationGasLimit <= MAX_VERIFICATION_GAS, "Verification gas too high");
    // ...
}
```

---

## Deployment Guide

### Prerequisites

```bash
npm install
cp .env.example .env
# Edit .env with:
# - PRIVATE_KEY (deployer wallet)
# - BASE_SEPOLIA_RPC_URL
# - BASESCAN_API_KEY (for verification)
```

### Compile Contracts

```bash
npx hardhat compile
```

### Deploy to Base Sepolia

```bash
npx hardhat run scripts/deploy.js --network baseSepolia
```

### Deployment Script

```javascript
// scripts/deploy.js
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // 1. Deploy EntryPoint (or use existing)
  const EntryPoint = await ethers.getContractFactory("EntryPoint");
  const entryPoint = await EntryPoint.deploy();
  await entryPoint.deployed();
  console.log("EntryPoint:", entryPoint.address);

  // 2. Deploy AccountFactory
  const AccountFactory = await ethers.getContractFactory("AccountFactory");
  const factory = await AccountFactory.deploy(entryPoint.address);
  await factory.deployed();
  console.log("AccountFactory:", factory.address);

  // 3. Deploy Paymaster
  const ChainDropPaymaster = await ethers.getContractFactory("ChainDropPaymaster");
  const paymaster = await ChainDropPaymaster.deploy(
    entryPoint.address,
    deployer.address // Fee collector
  );
  await paymaster.deployed();
  console.log("ChainDropPaymaster:", paymaster.address);

  // 4. Fund paymaster
  await paymaster.deposit({ value: ethers.utils.parseEther("1.0") });

  // 5. Deploy ClaimVerifier
  const ClaimVerifier = await ethers.getContractFactory("ClaimVerifier");
  const verifier = await ClaimVerifier.deploy();
  await verifier.deployed();
  console.log("ClaimVerifier:", verifier.address);

  // Save addresses
  const addresses = {
    entryPoint: entryPoint.address,
    accountFactory: factory.address,
    paymaster: paymaster.address,
    claimVerifier: verifier.address
  };

  fs.writeFileSync(
    "deployed-addresses.json",
    JSON.stringify(addresses, null, 2)
  );
}
```

### Verify Contracts

```bash
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

---

## Testing

### Run Tests

```bash
npx hardhat test
```

### Test Coverage

```bash
npx hardhat coverage
```

### Example Test

```javascript
describe("AccountFactory", function () {
  it("Should create account at deterministic address", async function () {
    const [owner] = await ethers.getSigners();
    const salt = 123;

    // Get counterfactual address
    const predictedAddress = await factory.getAddress(owner.address, salt);

    // Create account
    await factory.createAccount(owner.address, salt);

    // Verify account deployed at predicted address
    const code = await ethers.provider.getCode(predictedAddress);
    expect(code).to.not.equal("0x");
  });

  it("Should allow funds to be sent before deployment", async function () {
    const [owner, sender] = await ethers.getSigners();
    const salt = 456;

    // Get Ghost Vault address
    const ghostVault = await factory.getAddress(owner.address, salt);

    // Send ETH to Ghost Vault (not deployed yet!)
    await sender.sendTransaction({
      to: ghostVault,
      value: ethers.utils.parseEther("1.0")
    });

    // Check balance
    const balance = await ethers.provider.getBalance(ghostVault);
    expect(balance).to.equal(ethers.utils.parseEther("1.0"));

    // Deploy account
    await factory.createAccount(owner.address, salt);

    // Balance should remain
    const balanceAfter = await ethers.provider.getBalance(ghostVault);
    expect(balanceAfter).to.equal(ethers.utils.parseEther("1.0"));
  });
});
```

---

## Gas Optimization

### Optimizations Implemented

1. **Immutable Variables:** Factory and EntryPoint addresses
2. **Minimal Proxy (ERC-1967):** Reduces deployment gas
3. **Batched Operations:** Single UserOp for deploy + claim
4. **Storage Minimization:** Only essential state variables
5. **Compiler Settings:** 1,000,000 optimization runs

### Gas Costs (Estimated)

| Operation | Gas Cost | Cost (15 gwei) |
|-----------|----------|----------------|
| Create Ghost Vault (first time) | ~200,000 | ~$0.10 |
| Send to Ghost Vault | 21,000 | ~$0.01 |
| Claim + Deploy | ~350,000 | ~$0.18 |
| Claim (already deployed) | ~150,000 | ~$0.08 |

---

## Auditing Checklist

Before mainnet deployment:

- [ ] External security audit (OpenZeppelin, Consensys Diligence)
- [ ] Formal verification of critical functions
- [ ] Fuzz testing with Echidna/Foundry
- [ ] Economic attack simulation
- [ ] Upgrade path documented
- [ ] Emergency pause mechanism tested
- [ ] Multi-sig for admin functions
- [ ] Time-locked upgrades

---

## References

- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
- [CREATE2 (EIP-1014)](https://eips.ethereum.org/EIPS/eip-1014)
- [ERC-1967 Proxy Standard](https://eips.ethereum.org/EIPS/eip-1967)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Account Abstraction GitHub](https://github.com/eth-infinitism/account-abstraction)

---

*Last updated: January 2026*
