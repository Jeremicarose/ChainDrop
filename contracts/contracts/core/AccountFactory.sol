// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./SimpleAccount.sol";

/**
 * @title AccountFactory
 * @notice Factory for creating ChainDrop accounts using CREATE2
 * @dev DECENTRALIZED: Address is computed from salt ONLY, not owner
 *      This allows anyone to receive funds before they have a wallet,
 *      then claim with their own wallet as owner (no admin in the middle)
 */
contract AccountFactory {
    SimpleAccount public immutable accountImplementation;

    event AccountCreated(address indexed account, address indexed owner, bytes32 indexed salt);

    constructor(IEntryPoint _entryPoint) {
        accountImplementation = new SimpleAccount(_entryPoint);
    }

    /**
     * @notice Compute the deterministic address for a ghost vault
     * @dev Address depends ONLY on salt (identifier hash), NOT on owner
     *      This is critical for decentralization - we can send funds before
     *      knowing who will claim them
     * @param salt Unique salt (hash of identifier like email/phone)
     * @return The deterministic ghost vault address
     */
    function computeAccountAddress(bytes32 salt) public view returns (address) {
        // Create a placeholder init code that doesn't include owner
        // We use address(0) as a placeholder - the real owner is set at deploy time
        bytes memory initCode = abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            abi.encode(
                address(accountImplementation),
                abi.encodeWithSelector(SimpleAccount.initialize.selector, address(0))
            )
        );

        bytes32 initCodeHash = keccak256(initCode);

        return Create2.computeAddress(salt, initCodeHash);
    }

    /**
     * @notice Create/deploy an account with a specific owner
     * @dev The owner is set at deploy time, but doesn't affect the address
     *      This allows recipients to become owners of their own ghost vaults
     * @param owner The owner of the new account (recipient's wallet)
     * @param salt Unique salt (hash of identifier)
     * @return ret The deployed SimpleAccount
     */
    function createAccount(address owner, bytes32 salt) public returns (SimpleAccount ret) {
        address expectedAddr = computeAccountAddress(salt);

        // If already deployed, return existing account
        if (expectedAddr.code.length > 0) {
            return SimpleAccount(payable(expectedAddr));
        }

        // Deploy with placeholder init (address(0)) to match the computed address
        // Then initialize with the real owner
        bytes memory placeholderInit = abi.encodeWithSelector(
            SimpleAccount.initialize.selector,
            address(0)
        );

        // Deploy the proxy - this creates it at the deterministic address
        ret = SimpleAccount(
            payable(
                new ERC1967Proxy{salt: salt}(
                    address(accountImplementation),
                    placeholderInit
                )
            )
        );

        // Now set the real owner (this is the key - owner is set AFTER address computation)
        // Note: SimpleAccount.initialize checks if owner == address(0) and allows re-init
        ret.setOwner(owner);

        emit AccountCreated(address(ret), owner, salt);

        require(address(ret) == expectedAddr, "CREATE2 address mismatch");
    }

    /**
     * @notice Generate salt from identifier string
     * @param identifier The identifier (email, phone, twitter handle, etc.)
     * @return bytes32 salt for CREATE2
     */
    function generateSalt(string memory identifier) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(identifier));
    }

    /**
     * @notice Convenience: get ghost vault address from identifier
     * @param identifier String identifier (email/phone/twitter)
     * @return The deterministic ghost vault address
     */
    function getAddressForIdentifier(string memory identifier) public view returns (address) {
        bytes32 salt = generateSalt(identifier);
        return computeAccountAddress(salt);
    }

    /**
     * @notice Allow factory to receive ETH (for gas station patterns)
     */
    receive() external payable {}
}
