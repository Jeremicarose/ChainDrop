import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import { baseSepolia } from './chains';
import './index.css';
import App from './App.jsx';

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID;

createRoot(document.getElementById('root')).render(
  <StrictMode>
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
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: baseSepolia,
        supportedChains: [baseSepolia],
      }}
    >
      <App />
    </PrivyProvider>
  </StrictMode>
)
