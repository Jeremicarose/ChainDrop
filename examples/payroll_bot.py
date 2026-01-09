#!/usr/bin/env python3
"""
ChainDrop AI Agent Demo: Payroll Bot

This script demonstrates how an AI agent can automatically process
payroll payments using ChainDrop's agent API.

Features:
- Automatic payments to employees
- Policy enforcement (daily limits, whitelists)
- No manual wallet management needed
- Recipients get email/Twitter notifications

Usage:
    python payroll_bot.py
"""

import requests
import json
import csv
from datetime import datetime

# Configuration
CHAINDROP_API = "http://localhost:3000/api"
API_KEY = None  # Will be set after agent creation

class ChainDropAgent:
    def __init__(self, api_key=None, api_url=CHAINDROP_API):
        self.api_key = api_key
        self.api_url = api_url
        self.headers = {
            'Content-Type': 'application/json'
        }
        if api_key:
            self.headers['X-API-Key'] = api_key

    def create_agent(self, owner_address, name, policies):
        """Create a new agent with spending policies"""
        response = requests.post(
            f"{self.api_url}/agent/create",
            headers={'Content-Type': 'application/json'},
            json={
                "ownerAddress": owner_address,
                "name": name,
                "policies": policies
            }
        )

        if response.status_code == 201:
            data = response.json()
            self.api_key = data['data']['apiKey']
            self.headers['X-API-Key'] = self.api_key
            return data['data']
        else:
            raise Exception(f"Failed to create agent: {response.text}")

    def pay(self, recipient, identifier_type, amount, metadata=None):
        """Make a payment to a recipient"""
        response = requests.post(
            f"{self.api_url}/agent/pay",
            headers=self.headers,
            json={
                "recipientIdentifier": recipient,
                "identifierType": identifier_type,
                "amount": amount,
                "metadata": metadata or {}
            }
        )

        if response.status_code == 201:
            return response.json()['data']
        elif response.status_code == 403:
            # Policy violation
            error = response.json()
            raise Exception(f"Policy violation: {error['message']}")
        else:
            raise Exception(f"Payment failed: {response.text}")

    def get_stats(self):
        """Get agent statistics"""
        response = requests.get(
            f"{self.api_url}/agent/stats",
            headers=self.headers
        )

        if response.status_code == 200:
            return response.json()['data']
        else:
            raise Exception(f"Failed to get stats: {response.text}")


def main():
    print("🤖 ChainDrop AI Agent Demo: Payroll Bot")
    print("=" * 60)

    # Step 1: Create agent with policies
    print("\n1️⃣ Creating AI Agent with spending policies...")

    agent = ChainDropAgent()

    # Create agent with security policies
    owner_address = "0x1da9c1016a03f9154720E0691162B43219F2c436"

    agent_info = agent.create_agent(
        owner_address=owner_address,
        name="Payroll Bot",
        policies={
            "dailyLimit": "5",  # 5 CRO per day max
            "allowedRecipients": "*@company.com,@trusted_contractors",  # Whitelist patterns
            "requireApproval": "2",  # Amounts over 2 CRO need manual approval
            "allowedTokens": "CRO"  # Only allow CRO payments
        }
    )

    print(f"✅ Agent created: {agent_info['name']}")
    print(f"   API Key: {agent_info['apiKey'][:20]}...")
    print(f"   Policies:")
    print(f"   - Daily Limit: {agent_info['policies']['dailyLimit']} CRO")
    print(f"   - Approval Required: >{agent_info['policies']['requireApproval']} CRO")
    print(f"   - Allowed Recipients: {agent_info['policies']['allowedRecipients']}")

    # Step 2: Process payroll
    print("\n2️⃣ Processing automated payroll...")

    # Sample employee data (in real scenario, loaded from database/CSV)
    employees = [
        {"email": "alice@company.com", "amount": "0.5", "role": "Engineer"},
        {"email": "bob@company.com", "amount": "0.3", "role": "Designer"},
        {"email": "carol@company.com", "amount": "0.2", "role": "Marketing"},
    ]

    successful_payments = []
    failed_payments = []

    for employee in employees:
        try:
            print(f"\n   💸 Paying {employee['email']}...")

            result = agent.pay(
                recipient=employee['email'],
                identifier_type='email',
                amount=employee['amount'],
                metadata={
                    "type": "payroll",
                    "month": datetime.now().strftime("%B %Y"),
                    "role": employee['role']
                }
            )

            print(f"   ✅ Success!")
            print(f"      Transfer ID: {result['transferId']}")
            print(f"      Claim Link: {result['claimLink']}")

            successful_payments.append(employee)

        except Exception as e:
            print(f"   ❌ Failed: {str(e)}")
            failed_payments.append({"employee": employee, "error": str(e)})

    # Step 3: Show statistics
    print("\n3️⃣ Agent Statistics:")

    stats = agent.get_stats()
    print(f"   Agent Name: {stats['agentName']}")
    print(f"   Total Transactions: {stats['totalTransactions']}")
    print(f"   Successful: {stats['successfulTransactions']}")
    print(f"   Spent Today: {stats['spentToday']} CRO")

    # Step 4: Summary
    print("\n" + "=" * 60)
    print(f"✅ Payroll Complete!")
    print(f"   Successful: {len(successful_payments)}/{len(employees)}")
    print(f"   Failed: {len(failed_payments)}/{len(employees)}")

    if failed_payments:
        print("\n⚠️  Failed Payments:")
        for payment in failed_payments:
            print(f"   - {payment['employee']['email']}: {payment['error']}")

    print("\n💡 What happened?")
    print("   1. AI agent checked policies automatically")
    print("   2. Payments sent without manual wallet management")
    print("   3. Employees get email notifications with claim links")
    print("   4. They can claim with 1-click (no wallet needed)")

    print("\n🎯 Try triggering a policy violation:")
    print(f"   - Send >2 CRO (approval required)")
    print(f"   - Send to non-whitelisted email")
    print(f"   - Exceed daily limit of 5 CRO")


if __name__ == "__main__":
    main()
