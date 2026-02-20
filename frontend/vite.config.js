import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin to stub all Solana packages - we only use EVM chains
function solanaStubPlugin() {
  return {
    name: 'solana-stub',
    enforce: 'pre',
    resolveId(source, importer) {
      if (
        (source.startsWith('@solana') || source.startsWith('@solana-program')) &&
        importer &&
        !importer.includes('node_modules/@solana') &&
        !importer.includes('node_modules/@solana-program')
      ) {
        return { id: '\0solana-stub:' + source, moduleSideEffects: false }
      }
    },
    load(id) {
      if (id.startsWith('\0solana-stub:')) {
        // Complete stub with ALL named imports used by @privy-io and x402
        return `
          const f = () => ({});
          const s = '';
          export default f;

          // @solana-program/compute-budget
          export { s as COMPUTE_BUDGET_PROGRAM_ADDRESS };
          export { f as estimateComputeUnitLimitFactory, f as getSetComputeUnitLimitInstruction };
          export { f as parseSetComputeUnitLimitInstruction, f as parseSetComputeUnitPriceInstruction };
          export { f as setTransactionMessageComputeUnitPrice };

          // @solana-program/memo
          export { f as getAddMemoInstruction };

          // @solana-program/system
          export { f as getTransferSolInstruction };

          // @solana-program/token
          export { f as findAssociatedTokenPda, f as getCreateAssociatedTokenIdempotentInstruction };
          export { f as getTransferInstruction, f as identifyTokenInstruction, f as parseTransferCheckedInstruction };
          export { s as TOKEN_PROGRAM_ADDRESS, f as TokenInstruction };

          // @solana-program/token-2022
          export { f as fetchMint, f as getTransferCheckedInstruction };
          export { f as identifyToken2022Instruction, f as Token2022Instruction };
          export { s as TOKEN_2022_PROGRAM_ADDRESS };

          // @solana/kit
          export { f as address, f as appendTransactionMessageInstruction, f as appendTransactionMessageInstructions };
          export { f as assertIsInstructionWithAccounts, f as assertIsInstructionWithData };
          export { f as assertIsTransactionMessageWithBlockhashLifetime, f as blockhash };
          export { f as compileTransaction, f as createKeyPairSignerFromBytes, f as createKeyPairSignerFromPrivateKeyBytes };
          export { f as createSolanaRpc, f as createSolanaRpcSubscriptions, f as createTransactionMessage };
          export { f as decompileTransactionMessage, f as decompileTransactionMessageFetchingLookupTables };
          export { f as devnet, f as fetchAddressesForLookupTables, f as fetchEncodedAccounts };
          export { f as getBase58Decoder, f as getBase58Encoder, f as getBase64Decoder };
          export { f as getBase64EncodedWireTransaction, f as getBase64Encoder };
          export { f as getCompiledTransactionMessageDecoder, f as getSignatureFromTransaction };
          export { f as getTransactionDecoder, f as getTransactionEncoder };
          export { f as isSolanaError, f as isTransactionModifyingSigner };
          export { f as isTransactionPartialSigner, f as isTransactionSigner };
          export { f as mainnet, f as partiallySignTransactionMessageWithSigners };
          export { f as pipe, f as prependTransactionMessageInstruction };
          export { f as setTransactionMessageFeePayer, f as setTransactionMessageFeePayerSigner };
          export { f as setTransactionMessageLifetimeUsingBlockhash };
          export { f as SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED, f as SolanaError };

          // @solana/transaction-confirmation
          export { f as createBlockHeightExceedencePromiseFactory };
          export { f as createRecentSignatureConfirmationPromiseFactory };
          export { f as waitForRecentTransactionConfirmation };
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
