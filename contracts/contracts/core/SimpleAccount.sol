// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@account-abstraction/contracts/core/BaseAccount.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";

/**
 * @title SimpleAccount
 * @notice Minimal ERC-4337 account implementation for ChainDrop
 * @dev This account can receive funds before deployment and execute claims
 */
contract SimpleAccount is BaseAccount {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    using SafeERC20 for IERC20;

    IEntryPoint private immutable _entryPoint;
    address public owner;
    
    // Claimed status to prevent double claims
    mapping(bytes32 => bool) public claimed;

    // Nonce for replay protection
    uint256 private _nonce;

    event AccountInitialized(IEntryPoint indexed entryPoint, address indexed owner);
    event FundsClaimed(address indexed token, uint256 amount, bytes32 indexed claimId);
    event FundsReceived(address indexed from, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    constructor(IEntryPoint anEntryPoint) {
        _entryPoint = anEntryPoint;
    }

    /**
     * @notice Initialize the account with an owner
     * @param anOwner The address that will own this account
     */
    function initialize(address anOwner) public virtual {
        require(owner == address(0), "already initialized");
        owner = anOwner;
        emit AccountInitialized(_entryPoint, anOwner);
    }

    /**
     * @notice Return the EntryPoint address
     * @dev Required by BaseAccount
     */
    function entryPoint() public view override returns (IEntryPoint) {
        return _entryPoint;
    }

    /**
     * @notice Execute a transaction from this account
     * @param dest Destination address
     * @param value ETH value to send
     * @param func Calldata to execute
     */
    function execute(address dest, uint256 value, bytes calldata func) external override {
        _requireFromEntryPointOrOwner();
        _call(dest, value, func);
    }

    /**
     * @notice Execute a batch of transactions
     * @param dest Array of destination addresses
     * @param value Array of ETH values
     * @param func Array of calldata
     */
    function executeBatch(
        address[] calldata dest,
        uint256[] calldata value,
        bytes[] calldata func
    ) external {
        _requireFromEntryPointOrOwner();
        require(dest.length == func.length && dest.length == value.length, "wrong array lengths");
        for (uint256 i = 0; i < dest.length; i++) {
            _call(dest[i], value[i], func[i]);
        }
    }

    /**
     * @notice Claim funds that were sent to this account
     * @param token Token address (address(0) for ETH)
     * @param amount Amount to claim
     * @param claimId Unique identifier for this claim
     * @param deadline Expiration timestamp for the claim
     * @param signature Signature from authorized claimer
     */
    function claimFunds(
        address token,
        uint256 amount,
        bytes32 claimId,
        uint256 deadline,
        bytes calldata signature
    ) external {
        _requireFromEntryPointOrOwner();
        require(!claimed[claimId], "already claimed");
        require(block.timestamp <= deadline, "claim expired");

        // Verify signature if not called by owner
        if (msg.sender != owner) {
            bytes32 messageHash = keccak256(
                abi.encodePacked(
                    address(this),
                    token,
                    amount,
                    claimId,
                    _nonce
                )
            );
            bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
            address signer = ethSignedHash.recover(signature);
            require(signer == owner, "invalid signature");
        }
        
        claimed[claimId] = true;
        _nonce++;

        if (token == address(0)) {
            // Claim ETH
            require(address(this).balance >= amount, "insufficient balance");
            payable(owner).transfer(amount);
        } else {
            // Claim ERC20
            IERC20(token).safeTransfer(owner, amount);
        }

        emit FundsClaimed(token, amount, claimId);
    }

     /**
     * @notice Simple claim without signature (only callable by owner or EntryPoint)
     * @param token Token address
     * @param amount Amount to claim
     * @param claimId Unique claim identifier
     */
    function claimFundsSimple(
        address token,
        uint256 amount,
        bytes32 claimId
    ) external {
        _requireFromEntryPointOrOwner();
        require(!claimed[claimId], "already claimed");
        
        claimed[claimId] = true;

        if (token == address(0)) {
            require(address(this).balance >= amount, "insufficient balance");
            payable(owner).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner, amount);
        }

        emit FundsClaimed(token, amount, claimId);
    }

    /**
     * @notice Get the current nonce
     */
    function getNonce() public view override returns (uint256) {
        return _nonce;
    }

    /**
     * @notice Validate signature for UserOperation
     * @dev This is called by EntryPoint to verify the signature
     */
    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (uint256 validationData) {
        bytes32 hash = userOpHash.toEthSignedMessageHash();
        address recovered = hash.recover(userOp.signature);

        if (recovered != owner) {
            return 1; // SIG_VALIDATION_FAILED
        }
        return 0;
    }

    /**
     * @notice Internal call helper
     */
    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    /**
     * @notice Require the function is called by EntryPoint or owner
     */
    function _requireFromEntryPointOrOwner() internal view {
        require(
            msg.sender == address(entryPoint()) || msg.sender == owner,
            "account: not Owner or EntryPoint"
        );
    }

    /**
     * @notice Get account balance for a token
     * @param token Token address (address(0) for ETH)
     */
    function getBalance(address token) external view returns (uint256) {
        if (token == address(0)) {
            return address(this).balance;
        }
        return IERC20(token).balanceOf(address(this));
    }
 
    /**
     * @notice Allow this account to receive ETH
     */
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }
}