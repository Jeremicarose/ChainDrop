# Contributing to ChainDrop

Thank you for your interest in contributing to ChainDrop! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Create a new branch for your feature: `git checkout -b feature/your-feature-name`

## Development Workflow

### Setting Up Your Environment

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test
```

### Code Standards

- Follow Solidity style guide
- Write comprehensive tests for new features
- Ensure all tests pass before submitting
- Add NatSpec comments to public functions
- Keep gas optimization in mind

### Testing

All new features must include tests:

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test contracts/test/YourTest.test.js

# Check coverage
npx hardhat coverage
```

### Commit Messages

Write clear, descriptive commit messages:

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues and pull requests when relevant

Examples:
```
Add ERC20 token support to ChainDropPaymaster

Fix CREATE2 address calculation in AccountFactory

Update deployment scripts for Base Sepolia
```

## Pull Request Process

1. Update documentation for any changed functionality
2. Add tests that prove your fix or feature works
3. Ensure the test suite passes
4. Update the README.md if needed
5. Submit your pull request

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added and passing
- [ ] Documentation updated
- [ ] No compilation warnings
- [ ] Gas optimization considered
- [ ] Security implications reviewed

## Reporting Bugs

### Before Submitting

- Check existing issues to avoid duplicates
- Verify the bug in the latest version
- Collect relevant information (error messages, steps to reproduce)

### Bug Report Template

```
**Description**
A clear description of the bug

**Steps to Reproduce**
1. Step one
2. Step two
3. ...

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- Node version:
- Hardhat version:
- Network:
```

## Feature Requests

We welcome feature suggestions! Please:

- Clearly describe the feature and its benefits
- Explain the use case
- Consider backwards compatibility
- Be open to discussion and feedback

## Code Review Process

- All submissions require review
- Maintainers will review PRs regularly
- Address review feedback promptly
- Be patient and respectful

## Security

**Do not open issues for security vulnerabilities.**

Please email security concerns directly to the maintainers.

## Questions?

Feel free to open an issue for any questions about contributing.

Thank you for contributing to ChainDrop!
