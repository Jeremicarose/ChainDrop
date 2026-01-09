const hre = require("hardhat");

async function main() {
  const accountFactoryAddress = "0x3aeEe71fE66734c33C17208556ce066E5e16E527";
  
  console.log("Checking contract at:", accountFactoryAddress);
  
  const code = await hre.ethers.provider.getCode(accountFactoryAddress);
  console.log("Contract code length:", code.length);
  console.log("Contract exists:", code !== "0x");
  
  if (code === "0x") {
    console.log("❌ Contract not deployed at this address!");
  } else {
    console.log("✅ Contract is deployed");
    
    // Try to call computeAccountAddress
    const AccountFactory = await hre.ethers.getContractFactory("AccountFactory");
    const factory = AccountFactory.attach(accountFactoryAddress);
    
    try {
      const testAddress = await factory.computeAccountAddress(
        "0x1da9c1016a03f9154720E0691162B43219F2c436",
        hre.ethers.id("test@example.com")
      );
      console.log("✅ computeAccountAddress works:", testAddress);
    } catch (error) {
      console.log("❌ computeAccountAddress failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
