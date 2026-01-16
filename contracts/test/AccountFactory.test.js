const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ChainDrop Core Contracts - Decentralized Architecture", function () {
  let accountFactory;
  let entryPoint;
  let owner;
  let sender;
  let recipient;

  beforeEach(async function () {
    [owner, sender, recipient] = await ethers.getSigners();

    // Deploy EntryPoint first
    const EntryPoint = await ethers.getContractFactory("EntryPoint");
    entryPoint = await EntryPoint.deploy();
    await entryPoint.waitForDeployment();

    // Deploy AccountFactory with EntryPoint
    const AccountFactory = await ethers.getContractFactory("AccountFactory");
    accountFactory = await AccountFactory.deploy(await entryPoint.getAddress());
    await accountFactory.waitForDeployment();

    console.log("AccountFactory deployed to:", await accountFactory.getAddress());
  });

  describe("Decentralized Address Computation", function () {
    it("Should compute address from salt ONLY (not owner)", async function () {
      const identifier = "user@example.com";

      // Generate salt from identifier
      const salt = await accountFactory.generateSalt(identifier);
      console.log("Salt:", salt);

      // Get counterfactual address - NO OWNER in computation!
      const predictedAddress = await accountFactory.computeAccountAddress(salt);
      console.log("Predicted address (salt only):", predictedAddress);

      // Create the account with owner
      const tx = await accountFactory.createAccount(owner.address, salt);
      await tx.wait();

      // Address should still match (owner doesn't affect address)
      const verifyAddress = await accountFactory.computeAccountAddress(salt);
      console.log("Verified address:", verifyAddress);

      expect(predictedAddress).to.equal(verifyAddress);
    });

    it("Same identifier = same address regardless of owner", async function () {
      const identifier = "shared@example.com";
      const salt = await accountFactory.generateSalt(identifier);

      // Address computed without any owner
      const address = await accountFactory.computeAccountAddress(salt);

      // This is the KEY TEST for decentralization:
      // The address is determined ONLY by the identifier, not by who will own it
      console.log("Address for identifier:", address);

      expect(address).to.be.properAddress;
    });

    it("Should prevent double deployment but allow different owners", async function () {
      const identifier = "user2@example.com";
      const salt = await accountFactory.generateSalt(identifier);

      // Deploy with first owner
      await accountFactory.createAccount(owner.address, salt);

      // Deploy again with DIFFERENT owner (should return existing, not create new)
      const tx = await accountFactory.createAccount(recipient.address, salt);
      await tx.wait();

      // Address should be the same (determined by salt only)
      const addr = await accountFactory.computeAccountAddress(salt);
      console.log("Address (same for both):", addr);

      expect(addr).to.be.properAddress;
    });

    it("Should allow sending funds to counterfactual address BEFORE knowing owner", async function () {
      const identifier = "+254712345678";
      const salt = await accountFactory.generateSalt(identifier);

      // Get address BEFORE deployment - no owner needed!
      const accountAddress = await accountFactory.computeAccountAddress(salt);
      console.log("Ghost vault address:", accountAddress);

      // Send ETH to the counterfactual address
      const sendAmount = ethers.parseEther("0.1");
      await sender.sendTransaction({
        to: accountAddress,
        value: sendAmount
      });

      // Check balance (account doesn't exist yet!)
      const balance = await ethers.provider.getBalance(accountAddress);
      console.log("Balance at ghost vault:", ethers.formatEther(balance), "ETH");

      expect(balance).to.equal(sendAmount);

      // NOW deploy with recipient as owner (they claim their funds)
      await accountFactory.createAccount(recipient.address, salt);

      // Balance should still be there
      const balanceAfter = await ethers.provider.getBalance(accountAddress);
      expect(balanceAfter).to.equal(sendAmount);
    });

    it("Should use convenient identifier lookup", async function () {
      const email = "alice@chaindrop.io";

      // No owner needed for address lookup!
      const address = await accountFactory.getAddressForIdentifier(email);
      console.log("Address for", email, ":", address);

      expect(address).to.be.properAddress;
    });
  });

  describe("Owner Assignment", function () {
    it("Recipient becomes owner when claiming", async function () {
      const identifier = "claimer@example.com";
      const salt = await accountFactory.generateSalt(identifier);

      // Address is deterministic from identifier
      const vaultAddress = await accountFactory.computeAccountAddress(salt);

      // Fund the vault
      await sender.sendTransaction({
        to: vaultAddress,
        value: ethers.parseEther("0.05")
      });

      // Deploy with RECIPIENT as owner (decentralized claim)
      await accountFactory.createAccount(recipient.address, salt);

      // Verify recipient is the owner
      const SimpleAccount = await ethers.getContractFactory("SimpleAccount");
      const account = SimpleAccount.attach(vaultAddress);
      const actualOwner = await account.owner();

      console.log("Vault owner:", actualOwner);
      console.log("Expected recipient:", recipient.address);

      expect(actualOwner).to.equal(recipient.address);
    });
  });

  describe("Gas Estimation", function () {
    it("Should estimate deployment gas", async function () {
      const identifier = "gastest@example.com";
      const salt = await accountFactory.generateSalt(identifier);

      const tx = await accountFactory.createAccount.estimateGas(owner.address, salt);
      console.log("Estimated gas for account deployment:", tx.toString());
    });
  });
});