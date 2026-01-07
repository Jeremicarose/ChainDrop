const { ethers } = require('ethers');
require('dotenv').config()

// Contract ABIs
const ACCOUNT_FACTORY_ABI = [
    "function computeAccountAddress(address owner, bytes32 salt) public view returns (address)",
    "function createAccount(address owner, bytes32 salt) public returns (address)"
];

const SIMPLE_ACCOUNT_ABI = [
    "function owner() public view returns (address)",
    "function claimFundsSimple(address token, uint256 amount, bytes32 claimId) external",
    "function getBalance(address token) external view returns (uint256)",
    "function isClaimUsed(bytes32 claimId) external view returns (bool)"
];

const ERC20_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function decimals() external view returns (uint8)"
];

class BlockchainService {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        this.wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, this.provider);

        this.accountFactory = new ethers.Contract(
            process.env.ACCOUNT_FACTORY_ADDRESS,
            ACCOUNT_FACTORY_ABI,
            this.wallet
        );

        console.log(' Blockchain service initialized');
        console.log(' Network:', process.env.RPC_URL);
        console.log(' Deployer:', this.wallet.address);
    }

    /**
     * Generate counterFactual address for recipient
     */
    async getCounterfactualAddress(identifier, ownerAddress = null) {
        try {
            const owner = ownerAddress || this.wallet.address;
            // Hash the identifier to create a salt
            const salt = ethers.id(identifier); // keccak256 hash of identifier
            const address = await this.accountFactory.computeAccountAddress(
                owner,
                salt
            );
            return address;
        } catch (error) {
            console.error('Error getting counterfactual address:', error);
            throw error;
        }
    }

    /**
     * Generate salt from identifier
     */
    generateSalt(identifier) {
        // Generate keccak256 hash of identifier as salt
        return ethers.id(identifier);
    } 

    /**
     * Check if account is deployed
     */
    async isAccountDeployed(address) {
        const code = await this.provider.getCode(address);
        return code !== '0x';
    }

    /**
     * Get balance of address (ETH or token)
     */
    async getBalance(address, tokenAddress = null) {
        if (!tokenAddress || tokenAddress === ethers.ZeroAddress) {
            // Get ETH balance
            return await this.provider.getBalance(address);
        } else {
            // Get token balance
            const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
            return await token.balanceOf(address);
        }
    }

    /**
     * send funds to counterfactual address
     */
    async sendFunds(toAddress, amount, tokenAddress = null) {
      try {
        if (!tokenAddress || tokenAddress === ethers.ZeroAddress) {
            // send ETH
            const tx = await this.wallet.sendTransaction({
                to: toAddress,
                value: amount
            });
            await tx.wait();
            return tx.hash;
        } else {
            // send ERC20
            const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.wallet);
            const tx = await token.transfer(toAddress, amount);
            await tx.wait();
            return tx.hash;
        }
      } catch (error) {
        console.error('Error sending funds:', error);
        throw error;
      }
    }

    /**
     * Deploy account and claim funds
     */
    async deployAndClaim(recipientAddress, identifier, tokenAddress, amount, claimId) {
        try {
            const salt = this.generateSalt(identifier);

            // Deploy account
            const deployTx = await this.accountFactory.createAccount(recipientAddress, salt);
            const deployReceipt = await deployTx.wait();

            const accountAddress = await this.accountFactory.computeAccountAddress(recipientAddress, salt);

            // Now claim funds
            const account = new ethers.Contract(
                accountAddress,
                SIMPLE_ACCOUNT_ABI,
                this.wallet
            );

            // Generate claim ID
            const claimIdBytes32 = ethers.id(claimId);

            // Execute claim )this would normally be done through bundler)
            const claimTx = await account.claimFundsSimple(
                tokenAddress || ethers.ZeroAddress,
                amount,
                claimIdBytes32
            );

            const claimReceipt = await claimTx.wait();

            return {
                deployTxHash: deployReceipt.hash,
                claimTxHash: claimReceipt.hash,
                accountAddress
            };
        } catch (error) {
            console.error('Error deploying and claiming:', error);
            throw error;
        }
    }

    /**
     * Check if claim has been used
     */
    async isClaimUsed(accountAddress, claimId) {
        try {
            const account = new ethers.Contract(
                accountAddress,
                SIMPLE_ACCOUNT_ABI,
                this.provider
            );
            const claimIdBytes32 = ethers.id(claimId);
            return await account.isClaimUsed(claimIdBytes32);
        } catch (error) {
            console.error('Error checking claim status:', error);
            return false;
        }
    }

    /**
     * Format amaount based on token decimals
     */
    async formatAmount(amount, tokenAddress = null) {
        if (!tokenAddress || tokenAddress === ethers.ZeroAddress) {
            return ethers.parseEther(amount.toString());
        } else {
            const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
            const decimals = await token.decimals();
            return ethers.parseUnits(amount.toString(), decimals);
        }
    }

    /**
     * Get current gas price
     */
    async getGasPrice() {
        const feeData = await this.provider.getFeeData();
        return feeData.gasPrice;
    }
}

module.exports = new BlockchainService();