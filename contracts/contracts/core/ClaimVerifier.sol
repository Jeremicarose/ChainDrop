// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title ClaimVerifier
 * @notice Helper contract for generating and verifying claim signatures
 * @dev Used off-chain to validate claims before submission
 */
contract ClaimVerifier {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /**
     * @notice Generate a claim hash
     * @param account Account address that will claim
     * @param token Token address
     * @param amount Amount to claim
     * @param claimId Unique claim identifier
     * @param deadline Claim expiration timestamp
     * @param nonce Account nonce
     */
    function getClaimHash(
        address account,
        address token,
        uint256 amount,
        bytes32 claimId,
        uint256 deadline,
        uint256 nonce
    ) public pure returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                account,
                token,
                amount,
                claimId,
                deadline,
                nonce
            )
        );
    }

    /**
     * @notice Get the Ethereum signed message hash
     * @param claimHash The claim hash from getClaimHash
     */
    function getEthSignedMessageHash(bytes32 claimHash) public pure returns (bytes32) {
        return claimHash.toEthSignedMessageHash();
    }

    /**
     * @notice Verify a claim signature
     * @param account Account address
     * @param token Token address
     * @param amount Amount to claim
     * @param claimId Claim identifier
     * @param deadline Expiration timestamp
     * @param nonce Account nonce
     * @param signature The signature to verify
     * @param expectedSigner Expected signer address
     */
    function verifyClaim(
        address account,
        address token,
        uint256 amount,
        bytes32 claimId,
        uint256 deadline,
        uint256 nonce,
        bytes memory signature,
        address expectedSigner
    ) public pure returns (bool) {
        bytes32 claimHash = getClaimHash(
            account,
            token,
            amount,
            claimId,
            deadline,
            nonce
        );
        
        bytes32 ethSignedHash = getEthSignedMessageHash(claimHash);
        address signer = ethSignedHash.recover(signature);
        
        return signer == expectedSigner;
    }

    /**
     * @notice Recover signer from claim signature
     * @param account Account address
     * @param token Token address
     * @param amount Amount
     * @param claimId Claim ID
     * @param deadline Deadline
     * @param nonce Nonce
     * @param signature Signature
     */
    function recoverSigner(
        address account,
        address token,
        uint256 amount,
        bytes32 claimId,
        uint256 deadline,
        uint256 nonce,
        bytes memory signature
    ) public pure returns (address) {
        bytes32 claimHash = getClaimHash(
            account,
            token,
            amount,
            claimId,
            deadline,
            nonce
        );
        
        bytes32 ethSignedHash = getEthSignedMessageHash(claimHash);
        return ethSignedHash.recover(signature);
    }

    /**
     * @notice Generate identifier hash (for CREATE2 salt)
     * @param identifier String identifier (email, phone, etc.)
     */
    function hashIdentifier(string memory identifier) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(identifier));
    }

    /**
     * @notice Verify claim is not expired
     * @param deadline The claim deadline timestamp
     */
    function isClaimValid(uint256 deadline) public view returns (bool) {
        return block.timestamp <= deadline;
    }
}    