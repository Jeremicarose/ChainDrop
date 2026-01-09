#!/usr/bin/env node
/**
 * ChainDrop AI Agent Demo: Payroll Bot (Node.js)
 *
 * This script demonstrates how an AI agent can automatically process
 * payroll payments using ChainDrop's agent API.
 *
 * Usage:
 *     node payroll_bot.js
 */

const axios = require('axios');

// Configuration
const CHAINDROP_API = process.env.CHAINDROP_API || 'http://localhost:3000/api';

class ChainDropAgent {
  constructor(apiKey = null, apiUrl = CHAINDROP_API) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  async createAgent(ownerAddress, name, policies) {
    try {
      const response = await axios.post(`${this.apiUrl}/agent/create`, {
        ownerAddress,
        name,
        policies
      });

      this.apiKey = response.data.data.apiKey;
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to create agent: ${error.response?.data?.message || error.message}`);
    }
  }

  async pay(recipient, identifierType, amount, metadata = {}) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/agent/pay`,
        {
          recipientIdentifier: recipient,
          identifierType: identifierType,
          amount: amount,
          metadata: metadata
        },
        {
          headers: {
            'X-API-Key': this.apiKey
          }
        }
      );

      return response.data.data;
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error(`Policy violation: ${error.response.data.message}`);
      }
      throw new Error(`Payment failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getStats() {
    try {
      const response = await axios.get(`${this.apiUrl}/agent/stats`, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });

      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to get stats: ${error.response?.data?.message || error.message}`);
    }
  }
}

async function main() {
  console.log('🤖 ChainDrop AI Agent Demo: Payroll Bot');
  console.log('='.repeat(60));

  // Step 1: Create agent with policies
  console.log('\n1️⃣ Creating AI Agent with spending policies...');

  const agent = new ChainDropAgent();
  const ownerAddress = '0x1da9c1016a03f9154720E0691162B43219F2c436';

  const agentInfo = await agent.createAgent(
    ownerAddress,
    'Payroll Bot',
    {
      dailyLimit: '5',  // 5 CRO per day max
      allowedRecipients: '*@company.com,@trusted_contractors',  // Whitelist patterns
      requireApproval: '2',  // Amounts over 2 CRO need manual approval
      allowedTokens: 'CRO'  // Only allow CRO payments
    }
  );

  console.log(`✅ Agent created: ${agentInfo.name}`);
  console.log(`   API Key: ${agentInfo.apiKey.substring(0, 20)}...`);
  console.log(`   Policies:`);
  console.log(`   - Daily Limit: ${agentInfo.policies.dailyLimit} CRO`);
  console.log(`   - Approval Required: >${agentInfo.policies.requireApproval} CRO`);
  console.log(`   - Allowed Recipients: ${agentInfo.policies.allowedRecipients}`);

  // Step 2: Process payroll
  console.log('\n2️⃣ Processing automated payroll...');

  const employees = [
    { email: 'alice@company.com', amount: '0.5', role: 'Engineer' },
    { email: 'bob@company.com', amount: '0.3', role: 'Designer' },
    { email: 'carol@company.com', amount: '0.2', role: 'Marketing' },
  ];

  const successfulPayments = [];
  const failedPayments = [];

  for (const employee of employees) {
    try {
      console.log(`\n   💸 Paying ${employee.email}...`);

      const result = await agent.pay(
        employee.email,
        'email',
        employee.amount,
        {
          type: 'payroll',
          month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          role: employee.role
        }
      );

      console.log(`   ✅ Success!`);
      console.log(`      Transfer ID: ${result.transferId}`);
      console.log(`      Claim Link: ${result.claimLink}`);

      successfulPayments.push(employee);

    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      failedPayments.push({ employee, error: error.message });
    }
  }

  // Step 3: Show statistics
  console.log('\n3️⃣ Agent Statistics:');

  const stats = await agent.getStats();
  console.log(`   Agent Name: ${stats.agentName}`);
  console.log(`   Total Transactions: ${stats.totalTransactions}`);
  console.log(`   Successful: ${stats.successfulTransactions}`);
  console.log(`   Spent Today: ${stats.spentToday} CRO`);

  // Step 4: Summary
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Payroll Complete!`);
  console.log(`   Successful: ${successfulPayments.length}/${employees.length}`);
  console.log(`   Failed: ${failedPayments.length}/${employees.length}`);

  if (failedPayments.length > 0) {
    console.log('\n⚠️  Failed Payments:');
    for (const payment of failedPayments) {
      console.log(`   - ${payment.employee.email}: ${payment.error}`);
    }
  }

  console.log('\n💡 What happened?');
  console.log('   1. AI agent checked policies automatically');
  console.log('   2. Payments sent without manual wallet management');
  console.log('   3. Employees get email notifications with claim links');
  console.log('   4. They can claim with 1-click (no wallet needed)');

  console.log('\n🎯 Try triggering a policy violation:');
  console.log(`   - Send >2 CRO (approval required)`);
  console.log(`   - Send to non-whitelisted email`);
  console.log(`   - Exceed daily limit of 5 CRO`);
}

// Run the demo
main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
