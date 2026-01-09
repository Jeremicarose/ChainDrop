const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying ChainDrop Contracts to Cronos Testnet...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "TCRO\n");

  if (balance === 0n) {
    console.error("❌ Error: Deployer account has no funds!");
    console.error("Get testnet TCRO from: https://cronos.org/faucet");
    console.error("Send TCRO to:", deployer.address);
    process.exit(1);
  }

  // 1. Deploy EntryPoint
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
  const paymaster = await ChainDropPaymaster.deploy(entryPointAddress);
  await paymaster.waitForDeployment();
  const paymasterAddress = await paymaster.getAddress();
  console.log("✅ ChainDropPaymaster deployed:", paymasterAddress, "\n");

  // 5. Fund paymaster
  console.log("5️⃣ Funding Paymaster with 0.5 TCRO...");
  const fundTx = await deployer.sendTransaction({
    to: paymasterAddress,
    value: hre.ethers.parseEther("0.5")
  });
  await fundTx.wait();
  console.log("✅ Paymaster funded\n");

  // Save deployment addresses
  const deployment = {
    network: "cronos-testnet",
    chainId: 338,
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

  const deploymentFile = path.join(deploymentsDir, "cronos-testnet.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));

  console.log("📋 Deployment Summary:");
  console.log("═══════════════════════════════════════════════════════");
  console.log("Network:         Cronos Testnet (Chain ID: 338)");
  console.log("Deployer:       ", deployer.address);
  console.log("");
  console.log("EntryPoint:     ", entryPointAddress);
  console.log("AccountFactory: ", accountFactoryAddress);
  console.log("Paymaster:      ", paymasterAddress);
  console.log("ClaimVerifier:  ", claimVerifierAddress);
  console.log("═══════════════════════════════════════════════════════\n");

  console.log("📝 Deployment saved to:", deploymentFile, "\n");

  console.log("🔧 Update backend/.env with:");
  console.log("ACCOUNT_FACTORY_ADDRESS=" + accountFactoryAddress);
  console.log("PAYMASTER_ADDRESS=" + paymasterAddress);
  console.log("CLAIM_VERIFIER_ADDRESS=" + claimVerifierAddress);
  console.log("ENTRY_POINT_ADDRESS=" + entryPointAddress);
  console.log("");

  console.log("✅ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
