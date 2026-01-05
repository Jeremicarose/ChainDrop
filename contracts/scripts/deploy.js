const hre = require("hardhat");

async function main() {
  console.log("Deploying ChainDrop contracts...");

  // Deploy SimpleVerifier
  const Verifier = await hre.ethers.getContractFactory("SimpleVerifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  console.log("✓ Verifier deployed:", await verifier.getAddress());

  // Deploy GhostVaultFactory
  const Factory = await hre.ethers.getContractFactory("GhostVaultFactory");
  const factory = await Factory.deploy(await verifier.getAddress());
  await factory.waitForDeployment();
  console.log("✓ Factory deployed:", await factory.getAddress());

  // Save addresses
  const addresses = {
    verifier: await verifier.getAddress(),
    factory: await factory.getAddress(),
    network: "Base Sepolia"
  };

  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
