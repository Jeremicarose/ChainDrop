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
        // Return a module that exports a Proxy for any named import
        return `
          const noop = () => ({});
          const handler = {
            get(target, prop) {
              if (prop === '__esModule') return true;
              if (prop === 'default') return new Proxy(noop, handler);
              return noop;
            }
          };
          export default new Proxy(noop, handler);
          // Known named exports used by Privy, x402, and Solana sub-packages
          const f = () => ({});
          const s = '';
          export { f as getTransferSolInstruction, f as getStructEncoder, f as getOptionEncoder, f as getAddressEncoder, f as getU32Encoder, f as getU64Encoder, f as getU8Encoder, f as getBooleanEncoder, f as getEnumEncoder, f as getArrayEncoder, f as getStructDecoder, f as getOptionDecoder, f as getAddressDecoder, f as getU32Decoder, f as getU64Decoder, f as getU8Decoder, f as getBooleanDecoder, f as getEnumDecoder, f as getArrayDecoder, f as combineCodec, f as transformEncoder, f as transformDecoder, f as createEncoder, f as createDecoder, f as addCodecSentinel, f as addCodecSizePrefix, f as addEncoderSizePrefix, f as addDecoderSizePrefix, f as fixEncoderSize, f as fixDecoderSize, f as fixCodecSize, f as getBase58Decoder, f as getBase58Encoder, f as getBase64Decoder, f as getBase64Encoder, f as getUtf8Decoder, f as getUtf8Encoder };
          export { f as address, f as isAddress, f as assertIsAddress, f as getAddressFromPublicKey };
          export { f as createSolanaRpc, f as createSolanaRpcSubscriptions, f as devnet, f as mainnet, f as testnet };
          export { f as pipe, f as createTransactionMessage, f as setTransactionMessageFeePayer, f as setTransactionMessageLifetimeUsingBlockhash, f as appendTransactionMessageInstruction, f as signTransaction, f as getSignatureFromTransaction, f as sendAndConfirmTransaction, f as lamports, f as getComputeUnitEstimateForTransactionMessageFactory, f as prependTransactionMessageInstruction };
          export { s as TOKEN_PROGRAM_ADDRESS, s as ASSOCIATED_TOKEN_PROGRAM_ADDRESS, f as findAssociatedTokenPda, f as getTransferInstruction, f as getCreateAssociatedTokenInstructionAsync, f as fetchMint, f as fetchToken, f as getTransferCheckedInstruction, f as getInitializeMintInstruction, f as getCreateAccountInstruction, f as getMintToInstruction };
          export { f as getAssociatedTokenAddressSync, f as createAssociatedTokenAccountInstruction, f as createTransferInstruction };
          export { f as generateKeyPair, f as createSignerFromKeyPair, f as getSignatureFromBytes, f as signBytes };
          export { f as getComputeUnitPriceInstruction, f as getSetComputeUnitLimitInstruction };
          export { f as isSolanaError, f as SolanaError };
          export { f as getU16Encoder, f as getU16Decoder, f as getU128Encoder, f as getU128Decoder, f as getBytesEncoder, f as getBytesDecoder, f as getDataEnumEncoder, f as getDataEnumDecoder, f as getTupleEncoder, f as getTupleDecoder, f as getUnionEncoder, f as getUnionDecoder, f as getMapEncoder, f as getMapDecoder, f as getSetEncoder, f as getSetDecoder, f as getConstantEncoder, f as getConstantDecoder, f as getDiscriminatedUnionEncoder, f as getDiscriminatedUnionDecoder, f as getHiddenPrefixEncoder, f as getHiddenPrefixDecoder, f as getHiddenSuffixEncoder, f as getHiddenSuffixDecoder, f as getZeroableOptionEncoder, f as getZeroableOptionDecoder, f as padLeftEncoder, f as padRightEncoder };
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
