// Empty stub for Solana packages - Privy optionally imports these but we only use EVM chains
export default {};
// Export a Proxy that returns empty functions/objects for any property access
const handler = {
  get: () => new Proxy(() => {}, handler),
  apply: () => new Proxy(() => {}, handler),
};
const stub = new Proxy(() => {}, handler);
export { stub as getTransferSolInstruction };
// Re-export everything as the stub
const keys = ['getStructEncoder','getOptionEncoder','getAddressEncoder','getU32Encoder','getU64Encoder','getU8Encoder','getBooleanEncoder','getEnumEncoder','getArrayEncoder','getStructDecoder','getOptionDecoder','getAddressDecoder','getU32Decoder','getU64Decoder','getU8Decoder','getBooleanDecoder','getEnumDecoder','getArrayDecoder','getStructCodec','getOptionCodec','getAddressCodec','getU32Codec','getU64Codec','getU8Codec','getBooleanCodec','getEnumCodec','getArrayCodec','combineCodec','addCodecSentinel','addCodecSizePrefix','transformEncoder','addEncoderSizePrefix','addDecoderSizePrefix','fixEncoderSize','fixDecoderSize','fixCodecSize','getBase58Decoder','getBase58Encoder','getBase64Decoder','getBase64Encoder','getUtf8Decoder','getUtf8Encoder','address','getAddressFromPublicKey','createSolanaRpc','createSolanaRpcSubscriptions','pipe','createTransactionMessage','setTransactionMessageFeePayer','setTransactionMessageLifetimeUsingBlockhash','appendTransactionMessageInstruction','signTransaction','getSignatureFromTransaction','sendAndConfirmTransaction','lamports','TOKEN_PROGRAM_ADDRESS','findAssociatedTokenPda','getTransferInstruction','getCreateAssociatedTokenInstructionAsync','fetchMint','fetchToken','getTransferCheckedInstruction','getInitializeMintInstruction','getCreateAccountInstruction','getMintToInstruction','ASSOCIATED_TOKEN_PROGRAM_ADDRESS','getAssociatedTokenAddressSync','createAssociatedTokenAccountInstruction','createTransferInstruction'];
for (const key of keys) {
  Object.defineProperty(module.exports || exports, key, { get: () => stub, enumerable: true });
}
