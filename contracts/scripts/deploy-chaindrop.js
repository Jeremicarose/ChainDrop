const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying ChainDrop Contracts to Base Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  if (balance === 0n) {
    console.error("❌ Error: Deployer account has no funds!");
    console.error("Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet");
    process.exit(1);
  }

  // 1. Deploy EntryPoint (or use existing one)
  console.log("1️⃣ Deploying EntryPoint...");
  const EntryPoint = await hre.ethers.getContractFactory("EntryPoint");
  const entryPoint = await EntryPoint.deploy();
  await entryPoint.waitForDeployment();
  const entryPointAddress = await entryPoint.getAddress();
  console.log("✅ EntryPoint deployed:", entryPointAddress, "\n");

  // 2. Deploy ClaimVerifier
  console.log("2️⃣ Deploying ClaimVerifier...");
  const ClaimVerifier = await hre.ethers.getContractFactory("ClaimVerifier");
  const claimVerifier = await ClaimVerifier.deploy();
  await claimVerifier.waitForDeployment();
  const claimVerifierAddress = await claimVerifier.getAddress();
  console.log("✅ ClaimVerifier deployed:", claimVerifierAddress, "\n");

  // 3. Deploy AccountFactory
  console.log("3️⃣ Deploying AccountFactory...");
  const AccountFactory = await hre.ethers.getContractFactory("AccountFactory");
  const accountFactory = await AccountFactory.deploy(entryPointAddress);
  await accountFactory.waitForDeployment();
  const accountFactoryAddress = await accountFactory.getAddress();
  console.log("✅ AccountFactory deployed:", accountFactoryAddress, "\n");

  // 4. Deploy ChainDropPaymaster
  console.log("4️⃣ Deploying ChainDropPaymaster...");
  const ChainDropPaymaster = await hre.ethers.getContractFactory("ChainDropPaymaster");
  const paymaster = await ChainDropPaymaster.deploy(
    entryPointAddress,
    deployer.address // Fee collector
  );
  await paymaster.waitForDeployment();
  const paymasterAddress = await paymaster.getAddress();
  console.log("✅ ChainDropPaymaster deployed:", paymasterAddress, "\n");

  // 5. Fund paymaster
  console.log("5️⃣ Funding Paymaster with 0.01 ETH...");
  const fundTx = await deployer.sendTransaction({
    to: paymasterAddress,
    value: hre.ethers.parseEther("0.01")
  });
  await fundTx.wait();
  console.log("✅ Paymaster funded\n");

  // Save deployment addresses
  const deployment = {
    network: "base-sepolia",
    chainId: 84532,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      entryPoint: entryPointAddress,
      accountFactory: accountFactoryAddress,
      paymaster: paymasterAddress,
      claimVerifier: claimVerifierAddress
    }
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentFile = path.join(deploymentsDir, "base-sepolia.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));

  console.log("📋 Deployment Summary:");
  console.log("═══════════════════════════════════════════════════════");
  console.log("Network:         Base Sepolia (Chain ID: 84532)");
  console.log("Deployer:       ", deployer.address);
  console.log("");
  console.log("EntryPoint:     ", entryPointAddress);
  console.log("AccountFactory: ", accountFactoryAddress);
  console.log("Paymaster:      ", paymasterAddress);
  console.log("ClaimVerifier:  ", claimVerifierAddress);
  console.log("═══════════════════════════════════════════════════════\n");

  console.log("📝 Deployment saved to:", deploymentFile, "\n");

  console.log("🔧 Next Steps:");
  console.log("1. Update backend/.env with these addresses:");
  console.log("");
  console.log("ACCOUNT_FACTORY_ADDRESS=" + accountFactoryAddress);
  console.log("PAYMASTER_ADDRESS=" + paymasterAddress);
  console.log("CLAIM_VERIFIER_ADDRESS=" + claimVerifierAddress);
  console.log("");
  console.log("2. Verify contracts on BaseScan:");
  console.log("npx hardhat verify --network baseSepolia " + accountFactoryAddress + " " + entryPointAddress);
  console.log("");

  console.log("✅ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
