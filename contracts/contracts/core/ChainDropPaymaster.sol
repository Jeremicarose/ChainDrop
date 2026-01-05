// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@account-abstraction/contracts/core/BasePaymaster.sol";
import "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ChainDropPaymaster
 * @notice Paymaster that deducts gas costs from the transferred funds
 * @dev Supports both ETH and ERC20 token payments for gas
 */
contract ChainDropPaymaster is BasePaymaster {
    using SafeERC20 for IERC20;

    uint256 public constant COST_OF_POST = 50000; // gas cost of postOp
    uint256 public feePercentage = 50; // 0.5% fee (50 basis points)
    
    // Mapping to track authorized tokens for gas payment
    mapping(address => bool) public authorizedTokens;
    
    // Events
    event TokenAuthorized(address indexed token);
    event TokenDeauthorized(address indexed token);
    event GasPaid(address indexed sender, uint256 gasCost, address token);
    event FeeUpdated(uint256 newFee);

    constructor(IEntryPoint _entryPoint) BasePaymaster(_entryPoint) {
        // Authorize ETH (address(0)) by default
        authorizedTokens[address(0)] = true;
    }

    /**
     * @notice Authorize a token for gas payments
     * @param token Token address to authorize
     */
    function authorizeToken(address token) external onlyOwner {
        authorizedTokens[token] = true;
        emit TokenAuthorized(token);
    }

    /**
     * @notice Deauthorize a token for gas payments
     * @param token Token address to deauthorize
     */
    function deauthorizeToken(address token) external onlyOwner {
        authorizedTokens[token] = false;
        emit TokenDeauthorized(token);
    }

    /**
     * @notice Update the fee percentage
     * @param _feePercentage New fee in basis points (e.g., 50 = 0.5%)
     */
    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 500, "Fee too high"); // Max 5%
        feePercentage = _feePercentage;
        emit FeeUpdated(_feePercentage);
    }

    /**
     * @notice Validate paymaster user operation
     * @dev Called by EntryPoint to validate if paymaster will sponsor the op
     */
    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) internal view override returns (bytes memory context, uint256 validationData) {
        // Decode paymasterAndData to get token address
        // Format: paymasterAddress (20 bytes) + token (20 bytes)
        require(userOp.paymasterAndData.length >= 40, "Invalid paymasterAndData");
        
        address token = address(bytes20(userOp.paymasterAndData[20:40]));
        require(authorizedTokens[token], "Token not authorized");

        // Check if account has enough balance to cover gas + fee
        uint256 requiredAmount = maxCost + (maxCost * feePercentage / 10000);
        
        if (token == address(0)) {
            // ETH payment
            require(userOp.sender.balance >= requiredAmount, "Insufficient ETH balance");
        } else {
            // ERC20 payment
            require(
                IERC20(token).balanceOf(userOp.sender) >= requiredAmount,
                "Insufficient token balance"
            );
        }

        // Pack context with sender and token info
        context = abi.encode(userOp.sender, token, maxCost);
        validationData = 0; // Accept the operation
    }

    /**
     * @notice Post-operation handler - collects payment after execution
     * @dev Called by EntryPoint after the user operation is executed
     */
    function _postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) internal override {
        if (mode == PostOpMode.postOpReverted) {
            return; // Don't charge on revert
        }

        (address sender, address token, uint256 maxCost) = abi.decode(
            context,
            (address, address, uint256)
        );

        // Calculate total cost including fee
        uint256 totalCost = actualGasCost + (actualGasCost * feePercentage / 10000);

        if (token == address(0)) {
            // Collect ETH
            (bool success, ) = payable(address(this)).call{value: totalCost}("");
            require(success, "ETH collection failed");
        } else {
            // Collect ERC20
            IERC20(token).safeTransferFrom(sender, address(this), totalCost);
        }

        emit GasPaid(sender, totalCost, token);
    }

    /**
     * @notice Withdraw collected fees
     * @param token Token to withdraw (address(0) for ETH)
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function withdrawFees(
        address token,
        address payable to,
        uint256 amount
    ) external onlyOwner {
        if (token == address(0)) {
            require(address(this).balance >= amount, "Insufficient ETH");
            to.transfer(amount);
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    /**
     * @notice Allow contract to receive ETH
     */
    receive() external payable {
        entryPoint.depositTo{value: msg.value}(address(this));
    }
}