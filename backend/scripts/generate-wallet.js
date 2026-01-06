#!/usr/bin/env node

/**
 * Generate a new Ethereum wallet for development
 * IMPORTANT: Never use this for production or real funds!
 */

const { ethers } = require('ethers');

// Generate random wallet
const wallet = ethers.Wallet.createRandom();

console.log('\n🔐 New Development Wallet Generated');
console.log('=====================================\n');
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
console.log('\n⚠️  IMPORTANT:');
console.log('1. This is for TESTNET ONLY!');
console.log('2. Never share your private key');
console.log('3. Never use this wallet for real funds\n');
console.log('📝 Add to backend/.env:');
console.log(`ADMIN_PRIVATE_KEY=${wallet.privateKey}\n`);
console.log('💰 Get testnet funds:');
console.log('https://www.coinbase.com/faucets/base-ethereum-goerli-faucet\n');
