# ChainDrop Smart Contracts

A decentralized gasless payment protocol enabling users to send crypto to recipients via email, phone, or social handles - even before they have a wallet.

## Overview

ChainDrop leverages ERC-4337 Account Abstraction to create a seamless crypto onboarding experience. Recipients can claim funds sent to their identifier (email/phone) without needing prior blockchain knowledge or paying gas fees.

### Key Features

- **Counterfactual Addresses**: Generate deterministic addresses before wallet creation
- **Gasless Claims**: Paymaster-sponsored transactions for zero-friction onboarding
- **Multi-Asset Support**: Send ETH and ERC20 tokens
- **Secure Claims**: Cryptographic verification prevents unauthorized access
- **ERC-4337 Compatible**: Built on the Account Abstraction standard

## Architecture

### Core Contracts

- **AccountFactory**: Deploys smart contract wallets using CREATE2 for deterministic addresses
- **SimpleAccount**: ERC-4337 compliant account with claim functionality
- **ChainDropPaymaster**: Sponsors gas fees for claim transactions
- **ClaimVerifier**: Validates cryptographic proofs for secure fund claiming

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm or yarn
- Hardhat

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file in the contracts directory:

```env
DEPLOYER_PRIVATE_KEY=your_private_key_here
BASE_SEPOLIA_RPC=your_rpc_url
BASESCAN_API_KEY=your_basescan_api_key
```

### Compilation

```bash
npx hardhat compile
```

### Testing

Run the complete test suite:

```bash
npx hardhat test
```

Run specific tests:

```bash
npx hardhat test contracts/test/CompleteFlow.test.js
```

### Deployment

Deploy to Base Sepolia testnet:

```bash
npx hardhat run scripts/deploy.js --network baseSepolia
```

## How It Works

### 1. Send Phase

The sender generates a counterfactual address for the recipient:

```javascript
const salt = await factory.generateSalt("alice@example.com");
const accountAddress = await factory.computeAccountAddress(recipient, salt);
// Send ETH or tokens to accountAddress
```

### 2. Claim Phase

The recipient claims funds by deploying their account:

```javascript
const tx = await factory.createAccount(owner, salt);
// Account is deployed and funds are accessible
```

### 3. Gasless Execution

The paymaster sponsors the claim transaction:

- No ETH required in recipient's wallet
- Seamless onboarding experience
- Configurable sponsorship policies

## Contract Addresses

### Base Sepolia Testnet

- **EntryPoint**: `0x...` (ERC-4337 EntryPoint)
- **AccountFactory**: `0x...`
- **ChainDropPaymaster**: `0x...`
- **ClaimVerifier**: `0x...`

## Security

- All contracts audited and tested
- ERC-4337 standard compliance
- OpenZeppelin library dependencies
- Comprehensive test coverage

## Gas Optimization

- Optimized for 1,000,000 runs
- Cancun EVM compatibility
- Efficient CREATE2 deployment
- Minimal storage operations

## Development

### Project Structure

```
contracts/
├── core/                  # Core protocol contracts
│   ├── AccountFactory.sol
│   ├── SimpleAccount.sol
│   └── ChainDropPaymaster.sol
├── test/                  # Test contracts
│   ├── ClaimVerifier.sol
│   ├── CompleteFlow.test.js
│   └── MockToken.sol
└── scripts/               # Deployment scripts
```

### Testing Strategy

- Unit tests for individual contracts
- Integration tests for complete flows
- Gas estimation tests
- Security scenario tests

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Contact

For questions or support, please open an issue on GitHub.

## Acknowledgments

Built with:
- [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts)
- [Account Abstraction](https://github.com/eth-infinitism/account-abstraction)
- [Hardhat](https://hardhat.org)
