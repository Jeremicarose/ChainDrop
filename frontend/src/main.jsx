import { Buffer } from 'buffer';
// Polyfill Buffer for browser (needed for ethers.js + Privy)
window.Buffer = window.Buffer || Buffer;

import { createRoot } from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import { getDefaultChain, getSupportedChains } from './chains';
import './index.css';
import App from './App.jsx';
import { initSentry } from './sentry';

// Initialize Sentry error tracking
initSentry();

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID;
const defaultChain = getDefaultChain();
const supportedChains = getSupportedChains();

createRoot(document.getElementById('root')).render(
  <PrivyProvider
    appId={PRIVY_APP_ID}
    config={{
      // Support email, phone, Twitter, and external wallets
      loginMethods: ['email', 'sms', 'twitter', 'wallet'],
      appearance: {
        theme: 'light',
        accentColor: '#667eea',
      },
      embeddedWallets: {
        createOnLogin: 'all-users',
        requireUserPasswordOnCreate: false,
      },
      defaultChain: defaultChain,
      supportedChains: supportedChains,
    }}
  >
    <App />
  </PrivyProvider>
)
