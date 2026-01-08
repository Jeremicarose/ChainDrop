import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import { getDefaultChain, getSupportedChains } from './chains';
import './index.css';
import App from './App.jsx';

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
