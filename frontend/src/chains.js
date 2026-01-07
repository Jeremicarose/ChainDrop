// Cronos EVM - PRIMARY CHAIN FOR HACKATHON
export const cronosEvm = {
  id: 338,
  name: 'Cronos EVM',
  network: 'cronos',
  nativeCurrency: {
    decimals: 18,
    name: 'Cronos',
    symbol: 'CRO',
  },
  rpcUrls: {
    default: {
      http: ['https://evm.cronos.org'],
    },
    public: {
      http: ['https://evm.cronos.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Cronos Explorer',
      url: 'https://explorer.cronos.org',
    },
  },
  testnet: false,
};

// Cronos Testnet - For testing before mainnet
export const cronosTestnet = {
  id: 338,
  name: 'Cronos Testnet',
  network: 'cronos-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'TCRO',
    symbol: 'TCRO',
  },
  rpcUrls: {
    default: {
      http: ['https://evm-t3.cronos.org'],
    },
    public: {
      http: ['https://evm-t3.cronos.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Cronos Testnet Explorer',
      url: 'https://explorer.cronos.org/testnet',
    },
  },
  testnet: true,
};

// Base Sepolia - DEV ONLY (hidden from UI)
export const baseSepolia = {
  id: 84532,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia.base.org'],
    },
    public: {
      http: ['https://sepolia.base.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BaseScan',
      url: 'https://sepolia.basescan.org',
    },
  },
  testnet: true,
};

// Export default chain based on environment
export const getDefaultChain = () => {
  const env = import.meta.env.VITE_CHAIN || 'cronos';

  switch (env) {
    case 'cronos':
      return cronosEvm;
    case 'cronos-testnet':
      return cronosTestnet;
    case 'sepolia':
      return baseSepolia;
    default:
      return cronosEvm; // Always default to Cronos for production
  }
};

// Supported chains (Sepolia only included in dev mode)
export const getSupportedChains = () => {
  const isDev = import.meta.env.MODE === 'development';

  if (isDev) {
    return [cronosEvm, cronosTestnet, baseSepolia];
  }

  return [cronosEvm, cronosTestnet];
};
