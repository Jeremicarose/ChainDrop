# Contributing to ChainDrop

Thank you for your interest in contributing to ChainDrop! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Convention](#commit-message-convention)
- [Community](#community)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of:
- Experience level
- Gender identity and expression
- Sexual orientation
- Disability
- Personal appearance
- Race or ethnicity
- Age
- Religion

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what's best for the community
- Showing empathy towards others

**Unacceptable behavior includes:**
- Harassment of any kind
- Trolling or insulting comments
- Public or private harassment
- Publishing others' private information
- Other conduct inappropriate in a professional setting

### Enforcement

Violations can be reported to [conduct@chaindrop.app](mailto:conduct@chaindrop.app). All complaints will be reviewed and investigated promptly and fairly.

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:
- Node.js v18+ installed
- Git installed and configured
- A GitHub account
- Basic knowledge of:
  - Solidity (for smart contracts)
  - JavaScript/TypeScript (for backend)
  - React (for frontend, coming soon)

### First-Time Contributors

New to open source? Here are some good first issues:
- Documentation improvements
- Test coverage additions
- Bug fixes labeled `good-first-issue`
- UI/UX enhancements

---

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/<YOUR_USERNAME>/ChainDrop.git
cd ChainDrop

# Add upstream remote
git remote add upstream https://github.com/Jeremicarose/ChainDrop.git
```

### 2. Install Dependencies

```bash
# Install contract dependencies
cd contracts
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 3. Environment Setup

```bash
# Contracts
cd contracts
cp .env.example .env
# Edit .env with your Base Sepolia RPC URL and private key

# Backend
cd ../backend
cp .env.example .env
# Edit .env with contract addresses and configuration
```

### 4. Run Tests

```bash
# Smart contracts
cd contracts
npx hardhat test

# Backend
cd ../backend
npm test
```

### 5. Start Development Server

```bash
# Backend
cd backend
npm run dev
```

---

## How to Contribute

### Reporting Bugs

**Before submitting a bug report:**
1. Check existing issues to avoid duplicates
2. Collect relevant information:
   - Operating system
   - Node.js version
   - Contract/backend version
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages/stack traces

**Submit via GitHub Issues:**
```markdown
**Bug Description:**
Clear description of the bug

**Steps to Reproduce:**
1. Step one
2. Step two
3. ...

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- OS: macOS 14.0
- Node: v18.16.0
- Network: Base Sepolia

**Additional Context:**
Screenshots, logs, etc.
```

### Suggesting Features

**Feature request template:**
```markdown
**Problem:**
What problem does this solve?

**Proposed Solution:**
How should it work?

**Alternatives Considered:**
Other approaches you've thought about

**Additional Context:**
Mockups, examples, etc.
```

### Improving Documentation

Documentation improvements are always welcome:
- Fix typos or unclear explanations
- Add code examples
- Translate to other languages
- Create tutorials or guides

---

## Pull Request Process

### 1. Create a Branch

```bash
# Update your fork
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `test/` - Test additions/improvements
- `refactor/` - Code refactoring
- `chore/` - Maintenance tasks

### 2. Make Changes

- Follow [coding standards](#coding-standards)
- Write/update tests
- Update documentation
- Ensure all tests pass

### 3. Commit Changes

```bash
git add .
git commit -m "feat: add new claim verification method"
```

See [commit message convention](#commit-message-convention).

### 4. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 5. Create Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill out the PR template:

```markdown
**Description:**
Brief description of changes

**Related Issue:**
Fixes #123

**Type of Change:**
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

**Testing:**
- [ ] All tests pass
- [ ] Added new tests
- [ ] Manual testing completed

**Checklist:**
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

### 6. Code Review

- Address reviewer feedback
- Update PR as needed
- Be patient and respectful

### 7. Merge

Once approved:
- Maintainer will merge your PR
- Delete your branch
- Celebrate! 🎉

---

## Coding Standards

### Solidity (Smart Contracts)

**Style Guide:**
- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use NatSpec comments for all functions

```solidity
/// @notice Creates a new smart account at a deterministic address
/// @param owner Initial owner of the account
/// @param salt Unique value for CREATE2
/// @return account The deployed SimpleAccount instance
function createAccount(address owner, uint256 salt)
    public
    returns (SimpleAccount account)
{
    // Implementation
}
```

**Best Practices:**
- Use OpenZeppelin contracts when possible
- Minimize gas costs
- Add checks-effects-interactions pattern
- Use SafeMath for arithmetic (or Solidity 0.8+)
- Emit events for state changes

### JavaScript/TypeScript (Backend)

**Style Guide:**
- Use ESLint with provided config
- 2-space indentation
- Single quotes for strings
- Semicolons required

```javascript
// Good
const transfer = await transferService.create({
  senderAddress: '0x742d35...',
  recipientIdentifier: 'alice@example.com',
  amount: '50',
  token: 'USDC'
});

// Bad
var transfer = await transferService.create({
    senderAddress: "0x742d35...",
    recipientIdentifier: "alice@example.com",
    amount: "50",
    token: "USDC"
})
```

**Best Practices:**
- Use async/await over callbacks
- Handle errors explicitly
- Use descriptive variable names
- Add JSDoc comments for functions

```javascript
/**
 * Creates a new transfer to a recipient identifier
 * @param {Object} data - Transfer data
 * @param {string} data.senderAddress - Sender's wallet address
 * @param {string} data.recipientIdentifier - Email, phone, or handle
 * @param {string} data.amount - Amount to send
 * @param {string} data.token - Token symbol
 * @returns {Promise<Transfer>} Created transfer object
 */
async function createTransfer(data) {
  // Implementation
}
```

---

## Testing Guidelines

### Smart Contracts

**Requirements:**
- Minimum 80% coverage
- Test all public/external functions
- Test edge cases and failure modes
- Use descriptive test names

```javascript
describe("AccountFactory", function () {
  describe("createAccount", function () {
    it("should deploy account at deterministic address", async function () {
      // Test implementation
    });

    it("should revert if account already exists", async function () {
      // Test implementation
    });

    it("should emit AccountCreated event", async function () {
      // Test implementation
    });
  });
});
```

### Backend

**Testing Stack:**
- Unit tests: Mocha + Chai
- Integration tests: Supertest
- Mocking: Sinon

```javascript
describe("Transfer Service", function () {
  describe("createTransfer", function () {
    it("should create transfer with valid data", async function () {
      const transfer = await transferService.create({
        senderAddress: SENDER_ADDRESS,
        recipientIdentifier: "test@example.com",
        amount: "10",
        token: "USDC"
      });

      expect(transfer).to.have.property("claimToken");
      expect(transfer).to.have.property("ghostVaultAddress");
    });

    it("should reject invalid email", async function () {
      await expect(
        transferService.create({
          senderAddress: SENDER_ADDRESS,
          recipientIdentifier: "invalid-email",
          amount: "10",
          token: "USDC"
        })
      ).to.be.rejectedWith("Invalid identifier");
    });
  });
});
```

**Run Tests:**
```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

---

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear commit history.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks
- `perf:` - Performance improvements

### Examples

```bash
# Feature
git commit -m "feat(api): add batch transfer endpoint"

# Bug fix
git commit -m "fix(contracts): prevent double-claiming vulnerability"

# Documentation
git commit -m "docs(readme): update installation instructions"

# With body and footer
git commit -m "feat(paymaster): add dynamic fee calculation

Implements variable fee structure based on:
- Transfer amount
- Gas price at claim time
- Token type

Closes #42"
```

---

## Community

### Communication Channels

- **GitHub Issues:** Bug reports and feature requests
- **GitHub Discussions:** General questions and ideas
- **Discord:** [discord.gg/chaindrop](https://discord.gg/chaindrop) *(coming soon)*
- **Twitter:** [@ChainDrop](https://twitter.com/ChainDrop) *(coming soon)*
- **Email:** [hello@chaindrop.app](mailto:hello@chaindrop.app)

### Weekly Sync

We hold weekly community calls:
- **When:** Thursdays at 3 PM UTC
- **Where:** Discord voice channel
- **What:** Project updates, Q&A, roadmap discussions

---

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Invited to private contributor Discord channel
- Eligible for contributor NFTs (planned)

---

## Questions?

Don't hesitate to ask! We're here to help:
- Open a GitHub Discussion
- Join Discord
- Email [contributors@chaindrop.app](mailto:contributors@chaindrop.app)

---

**Thank you for contributing to ChainDrop! Together we're making crypto accessible to everyone.** 🚀

---

*Last updated: January 2026*
