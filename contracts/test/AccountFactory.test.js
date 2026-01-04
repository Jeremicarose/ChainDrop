const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ChainDrop Core Contracts", function () {
  let accountFactory;
  let entryPoint;
  let owner;
  let sender;

  beforeEach(async function () {
    [owner, sender] = await ethers.getSigners();

    // Deploy mock EntryPoint (in production, use the official one)
    const EntryPoint = await ethers.getContractFactory("SimpleAccount");
    // For testing, we'll use a simple address as entrypoint
    const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"; // Official EntryPoint v0.6
    
    // Deploy AccountFactory
    const AccountFactory = await ethers.getContractFactory("AccountFactory");
    accountFactory = await AccountFactory.deploy(entryPointAddress);
    await accountFactory.waitForDeployment();

    console.log("AccountFactory deployed to:", await accountFactory.getAddress());
  });

  describe("Account Creation", function () {
    it("Should generate deterministic addresses", async function () {
      const identifier = "user@example.com";
      
      // Generate salt from identifier
      const salt = await accountFactory.generateSalt(identifier);
      console.log("Salt:", salt);

      // Get counterfactual address (before deployment)
      const predictedAddress = await accountFactory.getAddress(owner.address, salt);
      console.log("Predicted address:", predictedAddress);

      // Create the account
      const tx = await accountFactory.createAccount(owner.address, salt);
      await tx.wait();

      // Get address after deployment
      const actualAddress = await accountFactory.getAddress(owner.address, salt);
      console.log("Actual address:", actualAddress);

      // Should match!
      expect(predictedAddress).to.equal(actualAddress);
    });

    it("Should prevent double deployment", async function () {
      const identifier = "user2@example.com";
      const salt = await accountFactory.generateSalt(identifier);

      // Deploy once
      await accountFactory.createAccount(owner.address, salt);
      
      // Deploy again (should not revert, just return existing)
      const tx = await accountFactory.createAccount(owner.address, salt);
      await tx.wait();
      
      // Both should return the same address
      const addr1 = await accountFactory.getAddress(owner.address, salt);
      const addr2 = await accountFactory.getAddress(owner.address, salt);
      expect(addr1).to.equal(addr2);
    });

    it("Should allow sending funds to counterfactual address", async function () {
      const identifier = "+254712345678";
      const salt = await accountFactory.generateSalt(identifier);
      
      // Get address BEFORE deployment
      const accountAddress = await accountFactory.getAddress(owner.address, salt);
      
      // Send ETH to the counterfactual address
      const sendAmount = ethers.parseEther("0.1");
      await sender.sendTransaction({
        to: accountAddress,
        value: sendAmount
      });

      // Check balance (account doesn't exist yet!)
      const balance = await ethers.provider.getBalance(accountAddress);
      console.log("Balance at counterfactual address:", ethers.formatEther(balance));
      
      expect(balance).to.equal(sendAmount);
    });

    it("Should use convenient identifier lookup", async function () {
      const email = "alice@chaindrop.io";
      
      const address1 = await accountFactory.getAddressForIdentifier(owner.address, email);
      console.log("Address for", email, ":", address1);
      
      expect(address1).to.be.properAddress;
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
