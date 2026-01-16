const { ethers } = require('ethers');
require('dotenv').config()

// Contract ABIs - Updated for decentralized architecture
// Address is computed from salt ONLY (not owner), allowing anyone to receive funds
// before they have a wallet, then claim with their own wallet as owner
const ACCOUNT_FACTORY_ABI = [
    "function computeAccountAddress(bytes32 salt) public view returns (address)",
    "function createAccount(address owner, bytes32 salt) public returns (address)",
    "function generateSalt(string memory identifier) public pure returns (bytes32)",
    "function getAddressForIdentifier(string memory identifier) public view returns (address)"
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
        console.log(' AccountFactory:', process.env.ACCOUNT_FACTORY_ADDRESS);
    }

    /**
     * Generate counterfactual address for recipient
     * @dev Address depends ONLY on identifier (salt), NOT on owner
     *      This is the key to decentralization - we can send funds before
     *      knowing who will claim them
     */
    async getCounterfactualAddress(identifier) {
        try {
            // Hash the identifier to create a salt
            const salt = ethers.id(identifier); // keccak256 hash of identifier

            // Address is computed from salt ONLY - no owner in the computation
            const address = await this.accountFactory.computeAccountAddress(salt);
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
     * Deploy account and claim funds (DECENTRALIZED ADDRESS, ADMIN-FACILITATED CLAIM)
     * @dev Address is computed from salt ONLY (decentralized)
     *      But admin deploys & withdraws to facilitate the claim process
     *      Funds are then sent to recipient's wallet
     * @param recipientWalletAddress The wallet address to send funds to
     * @param identifier The identifier used to compute the ghost vault address
     * @param tokenAddress Token address (null for native token)
     * @param amount Amount to claim
     * @param claimId Unique claim ID
     */
    async deployAndClaim(recipientWalletAddress, identifier, tokenAddress, amount, claimId) {
        try {
            const salt = this.generateSalt(identifier);

            // Get the deterministic address (computed from salt ONLY - decentralized!)
            const accountAddress = await this.accountFactory.computeAccountAddress(salt);
            console.log(`🏦 Ghost vault address: ${accountAddress}`);

            // Check balance in ghost vault
            const balance = await this.getBalance(accountAddress, tokenAddress);
            console.log(`💰 Ghost vault balance: ${ethers.formatEther(balance)}`);

            if (balance === 0n) {
                throw new Error('Ghost vault has no funds to claim');
            }

            // Check if already deployed
            const isDeployed = await this.isAccountDeployed(accountAddress);
            let deployTxHash = null;

            if (!isDeployed) {
                // Deploy with ADMIN as owner (to facilitate withdrawal)
                // Note: Address is still deterministic from salt only!
                console.log(`📦 Deploying ghost vault with admin as owner for claim facilitation`);
                const deployTx = await this.accountFactory.createAccount(this.wallet.address, salt);
                const deployReceipt = await deployTx.wait();
                deployTxHash = deployReceipt.hash;
                console.log(`✅ Ghost vault deployed at: ${accountAddress}`);
            } else {
                console.log(`✅ Ghost vault already deployed at: ${accountAddress}`);
            }

            // Create contract instance
            const account = new ethers.Contract(
                accountAddress,
                SIMPLE_ACCOUNT_ABI,
                this.wallet
            );

            // Generate claim ID bytes32
            const claimIdBytes32 = ethers.id(claimId);

            // Withdraw from ghost vault to admin
            console.log(`💸 Withdrawing ${ethers.formatEther(balance)} from ghost vault...`);
            const claimTx = await account.claimFundsSimple(
                tokenAddress || ethers.ZeroAddress,
                balance,
                claimIdBytes32
            );
            const claimReceipt = await claimTx.wait();
            console.log(`✅ Withdrawal complete: ${claimReceipt.hash}`);

            // Now send from admin to recipient's wallet
            console.log(`📤 Sending ${ethers.formatEther(balance)} to recipient ${recipientWalletAddress}...`);
            const transferTx = await this.wallet.sendTransaction({
                to: recipientWalletAddress,
                value: balance
            });
            await transferTx.wait();
            console.log(`✅ Transfer to recipient complete: ${transferTx.hash}`);

            return {
                deployTxHash: deployTxHash || 'already-deployed',
                claimTxHash: claimReceipt.hash,
                transferTxHash: transferTx.hash,
                accountAddress,
                recipientAddress: recipientWalletAddress,
                amount: balance.toString()
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

    /**
     * Withdraw funds from ghost vault (for refunds)
     * Deploys the ghost vault with ADMIN as owner (for refunds), then withdraws to admin,
     * then sends to destination (original sender)
     * @param identifier The recipient identifier used to compute ghost vault address
     * @param destinationAddress Where to send the funds (original sender for refunds)
     * @param tokenAddress Token address (null for native CRO)
     * @param claimId Unique claim ID for this withdrawal
     */
    async withdrawFromGhostVault(identifier, destinationAddress, tokenAddress, claimId) {
        try {
            const salt = this.generateSalt(identifier);
            // Address is computed from salt ONLY (decentralized)
            const accountAddress = await this.accountFactory.computeAccountAddress(salt);

            console.log(`🏦 Ghost vault address: ${accountAddress}`);

            // Check balance in ghost vault
            const balance = await this.getBalance(accountAddress, tokenAddress);
            console.log(`💰 Ghost vault balance: ${ethers.formatEther(balance)} CRO`);

            if (balance === 0n) {
                throw new Error('Ghost vault has no funds to withdraw');
            }

            // Check if already deployed
            const isDeployed = await this.isAccountDeployed(accountAddress);
            let deployTxHash = null;

            if (!isDeployed) {
                // Deploy the ghost vault with admin as owner
                console.log(`📦 Deploying ghost vault with admin as owner...`);
                const deployTx = await this.accountFactory.createAccount(this.wallet.address, salt);
                const deployReceipt = await deployTx.wait();
                deployTxHash = deployReceipt.hash;
                console.log(`✅ Ghost vault deployed: ${deployTxHash}`);
            } else {
                console.log(`✅ Ghost vault already deployed`);
            }

            // Create contract instance
            const account = new ethers.Contract(
                accountAddress,
                SIMPLE_ACCOUNT_ABI,
                this.wallet
            );

            // Generate unique claim ID for this refund
            const claimIdBytes32 = ethers.id(claimId);

            // Check if this claim was already used
            try {
                const alreadyClaimed = await account.isClaimUsed(claimIdBytes32);
                if (alreadyClaimed) {
                    throw new Error('This withdrawal was already processed');
                }
            } catch (e) {
                // If contract just deployed, isClaimUsed might fail, continue anyway
                if (!e.message.includes('already processed')) {
                    console.log(`⚠️ Could not check claim status: ${e.message}`);
                } else {
                    throw e;
                }
            }

            // Withdraw from ghost vault to admin (claimFundsSimple sends to owner = admin)
            console.log(`💸 Withdrawing ${ethers.formatEther(balance)} CRO from ghost vault to admin...`);
            const claimTx = await account.claimFundsSimple(
                tokenAddress || ethers.ZeroAddress,
                balance,
                claimIdBytes32
            );
            const claimReceipt = await claimTx.wait();
            console.log(`✅ Withdrawal to admin complete: ${claimReceipt.hash}`);

            // Now send from admin to destination (original sender for refunds)
            console.log(`📤 Sending ${ethers.formatEther(balance)} CRO from admin to ${destinationAddress}...`);
            const transferTx = await this.wallet.sendTransaction({
                to: destinationAddress,
                value: balance
            });
            await transferTx.wait();
            console.log(`✅ Transfer to destination complete: ${transferTx.hash}`);

            return {
                success: true,
                ghostVaultAddress: accountAddress,
                deployTxHash,
                withdrawTxHash: claimReceipt.hash,
                transferTxHash: transferTx.hash,
                amount: balance.toString()
            };
        } catch (error) {
            console.error('Error withdrawing from ghost vault:', error);
            throw error;
        }
    }
}

module.exports = new BlockchainService();