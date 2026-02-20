import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Stub out Solana dependencies that Privy optionally imports but we don't use
      '@solana-program/system': '/dev/null',
      '@solana/kit': '/dev/null',
      '@solana/web3.js': '/dev/null',
    },
  },
  build: {
    rollupOptions: {
      // Treat Solana packages as external to avoid build errors
      external: [],
      onwarn(warning, warn) {
        // Suppress Solana-related warnings
        if (warning.message?.includes('solana')) return;
        warn(warning);
      },
    },
  },
})
