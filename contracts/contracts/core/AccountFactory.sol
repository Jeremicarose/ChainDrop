// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./SimpleAccount.sol";

/**
 * @title AccountFactory
 * @notice Factory for creating ChainDrop accounts using CREATE2
 * @dev Generates deterministic addresses for accounts based on identifier hash
 */
contract AccountFactory {
    SimpleAccount public immutable accountImplementation;

    event AccountCreated(address indexed account, address indexed owner, bytes32 indexed salt);
    event Debug(string message, bytes32 value);
    event DebugAddress(string message, address value);

    constructor(IEntryPoint _entryPoint) {
        accountImplementation = new SimpleAccount(_entryPoint);
    }

    /**
     * @dev Internal helper to construct init code for proxy deployment
     * @param owner The owner address for initialization
     * @return bytes The complete init code for CREATE2 deployment
     */
    function _getInitCode(address owner) internal view returns (bytes memory) {
        bytes memory initData = abi.encodeWithSelector(
            SimpleAccount.initialize.selector,
            owner
        );

        return abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            abi.encode(address(accountImplementation), initData)
        );
    }

    /**
     * @notice Create an account and return its address
     * @param owner The owner of the new account
     * @param salt Unique salt for CREATE2 (typically hash of identifier)
     * @return ret The address of the created account
     */
    function createAccount(address owner, bytes32 salt) public returns (SimpleAccount ret) {
        // Compute the address where the proxy will be deployed
        address expectedAddr = computeAccountAddress(owner, salt);
        uint256 codeSize = expectedAddr.code.length;

        // If already deployed, return existing account
        if (codeSize > 0) {
            return SimpleAccount(payable(expectedAddr));
        }

        // Use the same init data construction as getAddress
        bytes memory initData = abi.encodeWithSelector(
            SimpleAccount.initialize.selector,
            owner
        );

        // Deploy new proxy using CREATE2
        ret = SimpleAccount(
            payable(
                new ERC1967Proxy{salt: salt}(
                    address(accountImplementation),
                    initData
                )
            )
        );

        emit AccountCreated(address(ret), owner, salt);

        // Verify the deployment address matches our prediction
        require(address(ret) == expectedAddr, "CREATE2 address mismatch");
    }

    /**
     * @notice Calculate the counterfactual address of an account
     * @dev This is the address where the account WILL BE deployed
     * @param owner The future owner of the account
     * @param salt Unique salt (hash of identifier like phone/email)
     * @return The deterministic address
     */
    function computeAccountAddress(address owner, bytes32 salt) public view returns (address) {
        bytes memory initCode = _getInitCode(owner);
        bytes32 initCodeHash = keccak256(initCode);

        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                initCodeHash
            )
        );

        return address(uint160(uint256(hash)));
    }

    /**
     * @notice Generate salt from identifier string
     * @param identifier The identifier (email, phone, etc.)
     * @return bytes32 salt for CREATE2
     */
    function generateSalt(string memory identifier) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(identifier));
    }

    /**
     * @notice Convenience function: get address from identifier
     * @param owner Future owner address
     * @param identifier String identifier (email/phone)
     */
    function getAddressForIdentifier(
        address owner,
        string memory identifier
    ) public view returns (address) {
        bytes32 salt = generateSalt(identifier);
        return computeAccountAddress(owner, salt);
    }

    /**
     * @notice Allow factory to receive ETH
     */
    receive() external payable {}
}



