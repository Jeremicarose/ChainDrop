import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin to stub all Solana imports - we only use EVM chains
function solanaStubPlugin() {
  const STUB_ID = '\0solana-stub'
  return {
    name: 'solana-stub',
    enforce: 'pre',
    resolveId(source) {
      if (source === STUB_ID) return STUB_ID
      if (source.startsWith('@solana') || source.startsWith('@solana-program')) {
        return STUB_ID
      }
    },
    load(id) {
      if (id === STUB_ID) {
        return `
          const f = () => ({});
          const s = '';
          // x402 @solana/kit imports
          export { f as createKeyPairSignerFromBytes, f as createKeyPairSignerFromPrivateKeyBytes, f as isTransactionSigner };
          export { f as createSolanaRpc, f as devnet, f as mainnet, f as createSolanaRpcSubscriptions };
          export { f as getBase64EncodedWireTransaction, f as getBase64Encoder, f as getTransactionDecoder, f as getCompiledTransactionMessageDecoder, f as isTransactionModifyingSigner, f as isTransactionPartialSigner };
          // x402 @solana-program imports
          export { s as TOKEN_PROGRAM_ADDRESS, s as TOKEN_2022_PROGRAM_ADDRESS };
          export { f as parseTransferCheckedInstruction };
          // Privy @solana-program/system
          export { f as getTransferSolInstruction };
          // Privy @solana/kit type-like imports (used as values)
          export { f as AccountLookupMeta, f as AccountMeta, f as Address, f as BaseTransactionMessage, f as ClusterUrl, f as Instruction, f as KeyPairSigner };
          export { f as RpcDevnet, f as RpcMainnet, f as RpcSubscriptionsFromTransport, f as RpcSubscriptionsTransportFromClusterUrl, f as SendTransactionApi };
          export { f as SolanaRpcApiDevnet, f as SolanaRpcApiMainnet, f as SolanaRpcSubscriptionsApi };
          export { f as Transaction, f as TransactionMessageWithFeePayer, f as TransactionMessageWithLifetime, f as TransactionSigner };
          export { f as SolanaSignAndSendTransactionFeature, f as SolanaSignInFeature, f as SolanaSignMessageFeature, f as SolanaSignTransactionFeature };
          export { f as Rpc, f as Connection, f as RpcSubscriptions, f as SendOptions, f as SolanaRpcApi, f as VersionedTransaction };
          // Codec exports (used by sub-packages)
          export { f as getStructEncoder, f as getOptionEncoder, f as getAddressEncoder, f as getU32Encoder, f as getU64Encoder, f as getU8Encoder, f as getBooleanEncoder, f as getEnumEncoder, f as getArrayEncoder };
          export { f as getStructDecoder, f as getOptionDecoder, f as getAddressDecoder, f as getU32Decoder, f as getU64Decoder, f as getU8Decoder, f as getBooleanDecoder, f as getEnumDecoder, f as getArrayDecoder };
          export { f as combineCodec, f as transformEncoder, f as transformDecoder, f as createEncoder, f as createDecoder };
          export { f as addCodecSentinel, f as addCodecSizePrefix, f as addEncoderSizePrefix, f as addDecoderSizePrefix, f as fixEncoderSize, f as fixDecoderSize, f as fixCodecSize };
          export { f as getBase58Decoder, f as getBase58Encoder, f as getBase64Decoder, f as getUtf8Decoder, f as getUtf8Encoder };
          export { f as address, f as isAddress, f as assertIsAddress, f as getAddressFromPublicKey };
          export { f as pipe, f as createTransactionMessage, f as setTransactionMessageFeePayer, f as setTransactionMessageLifetimeUsingBlockhash, f as appendTransactionMessageInstruction };
          export { f as signTransaction, f as getSignatureFromTransaction, f as sendAndConfirmTransaction, f as lamports };
          export { f as findAssociatedTokenPda, f as getTransferInstruction, f as getCreateAssociatedTokenInstructionAsync, f as fetchMint, f as fetchToken };
          export { f as getTransferCheckedInstruction, f as getInitializeMintInstruction, f as getCreateAccountInstruction, f as getMintToInstruction };
          export { f as getAssociatedTokenAddressSync, f as createAssociatedTokenAccountInstruction, f as createTransferInstruction };
          export { f as generateKeyPair, f as createSignerFromKeyPair, f as getSignatureFromBytes, f as signBytes };
          export { f as getComputeUnitPriceInstruction, f as getSetComputeUnitLimitInstruction };
          export { f as isSolanaError, f as SolanaError };
          export { f as getU16Encoder, f as getU16Decoder, f as getU128Encoder, f as getU128Decoder, f as getBytesEncoder, f as getBytesDecoder };
          export { f as prependTransactionMessageInstruction, f as getComputeUnitEstimateForTransactionMessageFactory };
          export { s as ASSOCIATED_TOKEN_PROGRAM_ADDRESS };
          export default f;
        `
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [solanaStubPlugin(), react()],
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.message?.includes('solana')) return
        warn(warning)
      },
    },
  },
})
