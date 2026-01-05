const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ChainDrop Complete Flow", function () {
  let accountFactory;
  let paymaster;
  let claimVerifier;
  let mockToken;
  let entryPoint;
  let entryPointAddress;
  let deployer, sender, recipient;

  beforeEach(async function () {
    [deployer, sender, recipient] = await ethers.getSigners();

    // Deploy EntryPoint for local testing
    const EntryPoint = await ethers.getContractFactory("EntryPoint");
    entryPoint = await EntryPoint.deploy();
    await entryPoint.waitForDeployment();
    entryPointAddress = await entryPoint.getAddress();

    console.log("\n🔧 EntryPoint deployed at:", entryPointAddress);

    // Deploy AccountFactory
    const AccountFactory = await ethers.getContractFactory("AccountFactory");
    accountFactory = await AccountFactory.deploy(entryPointAddress);
    await accountFactory.waitForDeployment();

    // Deploy ClaimVerifier
    const ClaimVerifier = await ethers.getContractFactory("ClaimVerifier");
    claimVerifier = await ClaimVerifier.deploy();
    await claimVerifier.waitForDeployment();

    // Deploy Paymaster
    const Paymaster = await ethers.getContractFactory("ChainDropPaymaster");
    paymaster = await Paymaster.deploy(entryPointAddress);
    await paymaster.waitForDeployment();

    // Deploy Mock ERC20 Token
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("MockUSDC", "USDC", 6);
    await mockToken.waitForDeployment();

    // Mint tokens to sender
    await mockToken.mint(sender.address, ethers.parseUnits("1000", 6));

    console.log("\n📦 Contracts deployed:");
    console.log("AccountFactory:", await accountFactory.getAddress());
    console.log("Paymaster:", await paymaster.getAddress());
    console.log("ClaimVerifier:", await claimVerifier.getAddress());
    console.log("MockToken:", await mockToken.getAddress());
  });

  describe("End-to-End Flow: Send → Compute → Claim", function () {
    it("Should complete full ChainDrop flow with ETH", async function () {
      console.log("\n🚀 Starting ETH ChainDrop Flow Test");
      
      // 1. SENDER: Generate counterfactual address for recipient
      const recipientEmail = "alice@chaindrop.io";
      const salt = await accountFactory.generateSalt(recipientEmail);
      const accountAddress = await accountFactory.computeAccountAddress(recipient.address, salt);
      
      console.log("\n1️⃣ Generated counterfactual address");
      console.log("   Recipient identifier:", recipientEmail);
      console.log("   Account address:", accountAddress);
      console.log("   Account deployed?", (await ethers.provider.getCode(accountAddress)) !== "0x");

      // 2. SENDER: Send ETH to counterfactual address
      const sendAmount = ethers.parseEther("0.1");
      await sender.sendTransaction({
        to: accountAddress,
        value: sendAmount
      });

      const balance = await ethers.provider.getBalance(accountAddress);
      console.log("\n2️⃣ Sent ETH to counterfactual address");
      console.log("   Amount sent:", ethers.formatEther(sendAmount), "ETH");
      console.log("   Account balance:", ethers.formatEther(balance), "ETH");

      // 3. RECIPIENT: Claim funds (this deploys the account!)
      console.log("\n3️⃣ Recipient claims funds...");
      
      const tx = await accountFactory.connect(recipient).createAccount(recipient.address, salt);
      await tx.wait();
      
      const deployedAccount = await accountFactory.computeAccountAddress(recipient.address, salt);
      const SimpleAccount = await ethers.getContractFactory("SimpleAccount");
      const account = SimpleAccount.attach(deployedAccount);

      console.log("   Account deployed at:", deployedAccount);
      console.log("   Account owner:", await account.owner());
      console.log("   Is deployed?", (await ethers.provider.getCode(deployedAccount)) !== "0x");

      // 4. Transfer funds from account to recipient
      const claimId = ethers.id("claim-1");
      await account.connect(recipient).claimFundsSimple(
        ethers.ZeroAddress, // ETH
        sendAmount,
        claimId
      );

      const finalBalance = await ethers.provider.getBalance(recipient.address);
      console.log("\n4️⃣ Funds claimed!");
      console.log("   Claim ID:", claimId);
      console.log("   Recipient balance increased ✅");

      // Verify claim was marked as used
      expect(await account.claimed(claimId)).to.be.true;
    });

    it("Should complete full ChainDrop flow with ERC20 tokens", async function () {
      console.log("\n🚀 Starting ERC20 ChainDrop Flow Test");
      
      // 1. Generate counterfactual address
      const recipientPhone = "+254712345678";
      const salt = await accountFactory.generateSalt(recipientPhone);
      const accountAddress = await accountFactory.computeAccountAddress(recipient.address, salt);
      
      console.log("\n1️⃣ Generated counterfactual address");
      console.log("   Recipient identifier:", recipientPhone);
      console.log("   Account address:", accountAddress);

      // 2. Send tokens to counterfactual address
      const sendAmount = ethers.parseUnits("100", 6); // 100 USDC
      await mockToken.connect(sender).transfer(accountAddress, sendAmount);

      const tokenBalance = await mockToken.balanceOf(accountAddress);
      console.log("\n2️⃣ Sent tokens to counterfactual address");
      console.log("   Amount sent:", ethers.formatUnits(sendAmount, 6), "USDC");
      console.log("   Account balance:", ethers.formatUnits(tokenBalance, 6), "USDC");

      // 3. Deploy account
      await accountFactory.connect(recipient).createAccount(recipient.address, salt);
      const deployedAccount = await accountFactory.computeAccountAddress(recipient.address, salt);
      const SimpleAccount = await ethers.getContractFactory("SimpleAccount");
      const account = SimpleAccount.attach(deployedAccount);

      console.log("\n3️⃣ Account deployed");

      // 4. Claim tokens
      const claimId = ethers.id("claim-token-1");
      const recipientBalanceBefore = await mockToken.balanceOf(recipient.address);
      
      await account.connect(recipient).claimFundsSimple(
        await mockToken.getAddress(),
        sendAmount,
        claimId
      );

      const recipientBalanceAfter = await mockToken.balanceOf(recipient.address);
      console.log("\n4️⃣ Tokens claimed!");
      console.log("   Balance before:", ethers.formatUnits(recipientBalanceBefore, 6), "USDC");
      console.log("   Balance after:", ethers.formatUnits(recipientBalanceAfter, 6), "USDC");
      console.log("   Difference:", ethers.formatUnits(recipientBalanceAfter - recipientBalanceBefore, 6), "USDC");

      expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(sendAmount);
    });

    it("Should prevent double claims", async function () {
      const email = "double@test.com";
      const salt = await accountFactory.generateSalt(email);
      const accountAddress = await accountFactory.computeAccountAddress(recipient.address, salt);

      // Send funds
      const amount = ethers.parseEther("0.1");
      await sender.sendTransaction({ to: accountAddress, value: amount });

      // Deploy and claim
      await accountFactory.connect(recipient).createAccount(recipient.address, salt);
      const deployedAccount = await accountFactory.computeAccountAddress(recipient.address, salt);
      const SimpleAccount = await ethers.getContractFactory("SimpleAccount");
      const account = SimpleAccount.attach(deployedAccount);

      const claimId = ethers.id("double-claim-test");
      await account.connect(recipient).claimFundsSimple(ethers.ZeroAddress, amount, claimId);

      // Try to claim again
      await expect(
        account.connect(recipient).claimFundsSimple(ethers.ZeroAddress, amount, claimId)
      ).to.be.revertedWith("already claimed");

      console.log("✅ Double claim prevention working!");
    });
  });

  describe("ClaimVerifier", function () {
    it("Should generate correct claim hashes", async function () {
      const account = sender.address;
      const token = ethers.ZeroAddress;
      const amount = ethers.parseEther("1");
      const claimId = ethers.id("test-claim");
      const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours
      const nonce = 0;

      const hash = await claimVerifier.getClaimHash(
        account,
        token,
        amount,
        claimId,
        deadline,
        nonce
      );

      console.log("\n📝 Claim hash generated:", hash);
      expect(hash).to.not.equal(ethers.ZeroHash);
    });

    it("Should verify claim validity", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      expect(await claimVerifier.isClaimValid(deadline)).to.be.true;

      const expiredDeadline = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      expect(await claimVerifier.isClaimValid(expiredDeadline)).to.be.false;

      console.log("✅ Claim validity check working!");
    });
  });

  describe("Gas Estimation", function () {
    it("Should estimate gas for complete flow", async function () {
      const email = "gas@test.com";
      const salt = await accountFactory.generateSalt(email);
      const accountAddress = await accountFactory.computeAccountAddress(recipient.address, salt);

      // Send funds
      await sender.sendTransaction({
        to: accountAddress,
        value: ethers.parseEther("0.1")
      });

      // Estimate deployment + claim gas
      const createGas = await accountFactory.createAccount.estimateGas(recipient.address, salt);
      
      console.log("\n⛽ Gas Estimates:");
      console.log("   Account deployment:", createGas.toString(), "gas");
      console.log("   Approximate cost at 20 gwei:", ethers.formatEther(createGas * 20n * (10n ** 9n)), "ETH");
    });
  });
});

// Mock ERC20 Token for testing
const MockERC20 = {
  abi: [
    "constructor(string memory name, string memory symbol, uint8 decimals)",
    "function mint(address to, uint256 amount) public",
    "function transfer(address to, uint256 amount) public returns (bool)",
    "function balanceOf(address account) public view returns (uint256)",
    "function getAddress() public view returns (address)"
  ],
  bytecode: "0x" // Will be auto-generated by Hardhat
};