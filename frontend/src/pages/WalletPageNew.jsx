import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import Navigation from '../components/Navigation';

const API_URL = import.meta.env.VITE_API_URL;

export default function WalletPage() {
  const navigate = useNavigate();
  const { login, authenticated, user, exportWallet } = usePrivy();
  const { wallets } = useWallets();

  const [balance, setBalance] = useState('0');
  const [pendingClaims, setPendingClaims] = useState([]);
  const [copied, setCopied] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Fetch balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!wallets || wallets.length === 0) return;

      try {
        const rpcUrl = import.meta.env.VITE_RPC_URL || 'https://evm-t3.cronos.org';
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const balanceWei = await provider.getBalance(wallets[0].address);
        const balanceEth = ethers.formatEther(balanceWei);
        setBalance(balanceEth);
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    if (authenticated && wallets.length > 0) {
      fetchBalance();
      const interval = setInterval(fetchBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [authenticated, wallets]);

  // Fetch pending claims
  useEffect(() => {
    const fetchPendingClaims = async () => {
      if (!user?.email?.address && !user?.phone?.number && !user?.twitter?.username) {
        return;
      }

      try {
        const identity = user.email?.address || user.phone?.number || user.twitter?.username;
        const response = await fetch(`${API_URL}/transfer/recipient/${encodeURIComponent(identity)}`);

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPendingClaims(data.data.filter(t => t.status === 'pending'));
          }
        }
      } catch (error) {
        console.error('Error fetching pending claims:', error);
      }
    };

    if (authenticated && user) {
      fetchPendingClaims();
    }
  }, [authenticated, user]);

  // Fetch recent transaction history
  useEffect(() => {
    const fetchTransactionHistory = async () => {
      if (!wallets || wallets.length === 0) return;

      try {
        const rpcUrl = import.meta.env.VITE_RPC_URL || 'https://evm-t3.cronos.org';
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const address = wallets[0].address;

        // Get current block
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 1000); // Last ~1000 blocks

        // Fetch sent transactions
        const sentLogs = await provider.getLogs({
          fromBlock,
          toBlock: 'latest',
          topics: [
            ethers.id('Transfer(address,address,uint256)'),
            ethers.zeroPadValue(address, 32)
          ]
        });

        // Fetch received transactions
        const receivedLogs = await provider.getLogs({
          fromBlock,
          toBlock: 'latest',
          topics: [
            ethers.id('Transfer(address,address,uint256)'),
            null,
            ethers.zeroPadValue(address, 32)
          ]
        });

        // Also check native CRO transfers by scanning recent blocks
        const nativeTransfers = [];
        for (let i = currentBlock; i > Math.max(0, currentBlock - 50); i--) {
          try {
            const block = await provider.getBlock(i, true);
            if (block && block.transactions) {
              for (const tx of block.transactions) {
                if (tx.to?.toLowerCase() === address.toLowerCase() ||
                    tx.from?.toLowerCase() === address.toLowerCase()) {
                  nativeTransfers.push({
                    hash: tx.hash,
                    from: tx.from,
                    to: tx.to,
                    value: typeof tx.value === 'object' ? tx.value.toString() : String(tx.value),
                    blockNumber: tx.blockNumber,
                    timestamp: block.timestamp,
                    type: 'native'
                  });
                }
              }
            }
          } catch (e) {
            // Skip if block fetch fails
            continue;
          }
        }

        // Sort by block number descending and take most recent 10
        const allTxs = nativeTransfers
          .sort((a, b) => b.blockNumber - a.blockNumber)
          .slice(0, 10);

        setRecentTransactions(allTxs);
      } catch (error) {
        console.error('Error fetching transaction history:', error);
      }
    };

    if (authenticated && wallets.length > 0) {
      fetchTransactionHistory();
    }
  }, [authenticated, wallets]);

  const copyAddress = () => {
    if (wallets && wallets.length > 0) {
      navigator.clipboard.writeText(wallets[0].address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportWallet = async () => {
    try {
      await exportWallet();
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export wallet: ' + error.message);
    }
  };

  // Not authenticated state
  if (!authenticated) {
    return (
      <div className="min-h-screen gradient-mesh relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cronos-400/20 to-blue-400/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>

        <Navigation />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="card text-center animate-slide-up">
            <div className="text-6xl mb-6 animate-float">💼</div>
            <h2 className="text-3xl font-bold mb-4">My Wallet</h2>
            <p className="text-xl text-gray-600 mb-8">
              Sign in to view your wallet and manage your crypto
            </p>
            <button onClick={login} className="btn-primary text-lg px-8 py-4">
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Wallet loading state
  if (!wallets || wallets.length === 0) {
    return (
      <div className="min-h-screen gradient-mesh relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cronos-400/20 to-blue-400/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>

        <Navigation />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="card text-center animate-slide-up">
            <div className="spinner mx-auto mb-6"></div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Setting Up Your Wallet...</h2>
            <p className="text-lg text-gray-600">
              Please wait while we initialize your embedded wallet
            </p>
          </div>
        </div>
      </div>
    );
  }

  const wallet = wallets[0];
  const userIdentity = user?.email?.address || user?.phone?.number || user?.twitter?.username || 'User';
  const balanceFloat = parseFloat(balance);
  const estimatedUSD = balanceFloat * 0.07; // CRO price estimate

  return (
    <div className="min-h-screen gradient-mesh relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cronos-400/20 to-blue-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-cronos-300/10 to-blue-300/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <Navigation />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Wallet</h1>
          <p className="text-lg text-gray-600">Manage your crypto assets and transactions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Card */}
            <div className="card" style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)', color: 'white' }}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Total Balance</p>
                  <h2 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'white' }}>
                    {balanceFloat.toFixed(4)} CRO
                  </h2>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.125rem' }}>
                    ≈ ${estimatedUSD.toFixed(2)} USD
                  </p>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', borderRadius: '0.75rem', padding: '0.5rem 1rem' }}>
                  <div style={{ width: '0.5rem', height: '0.5rem', background: '#4ade80', borderRadius: '9999px', margin: '0 auto 0.25rem', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.9)' }}>Live</p>
                </div>
              </div>

              {/* Wallet Address */}
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', borderRadius: '0.75rem', padding: '1rem' }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Wallet Address</p>
                    <p className="font-mono truncate" style={{ fontSize: '0.875rem', color: 'white' }}>{wallet.address}</p>
                  </div>
                  <button
                    onClick={copyAddress}
                    className="px-4 py-2 rounded-lg transition-all flex items-center gap-2 flex-shrink-0"
                    style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/send')}
                className="card hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1 p-6 text-center cursor-pointer"
                style={{ cursor: 'pointer' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)' }}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <p className="font-semibold" style={{ color: '#111827' }}>Send</p>
              </button>

              <button
                onClick={() => setShowReceiveModal(true)}
                className="card hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1 p-6 text-center cursor-pointer"
                style={{ cursor: 'pointer' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                </div>
                <p className="font-semibold" style={{ color: '#111827' }}>Receive</p>
              </button>

              <button
                onClick={handleExportWallet}
                className="card hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1 p-6 text-center cursor-pointer"
                style={{ cursor: 'pointer' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'linear-gradient(135deg, #a855f7, #9333ea)' }}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <p className="font-semibold" style={{ color: '#111827' }}>Export</p>
              </button>

              <button
                onClick={() => {
                  const explorerUrl = import.meta.env.VITE_EXPLORER_URL || 'https://explorer.cronos.org/testnet';
                  window.open(`${explorerUrl}/address/${wallet.address}`, '_blank');
                }}
                className="card hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1 p-6 text-center cursor-pointer"
                style={{ cursor: 'pointer' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="font-semibold" style={{ color: '#111827' }}>Explorer</p>
              </button>
            </div>

            {/* Pending Claims */}
            {pendingClaims.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                      <span className="text-xl">🎁</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Pending Claims</h3>
                      <p className="text-sm text-gray-500">{pendingClaims.length} unclaimed transfer{pendingClaims.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {pendingClaims.map((claim) => (
                    <div
                      key={claim.id}
                      className="bg-gradient-to-r from-cronos-50 to-yellow-50 rounded-xl p-4 border-2 border-cronos-200 hover:border-cronos-400 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl font-bold text-cronos-600">
                              {(parseInt(claim.amount) / 1e18).toFixed(4)} CRO
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            From{' '}
                            <span className="font-mono font-medium">
                              {claim.sender_address?.substring(0, 10)}...{claim.sender_address?.slice(-8)}
                            </span>
                          </p>
                        </div>
                        <button
                          onClick={() => navigate(`/claim/${claim.claim_token}`)}
                          className="btn-primary"
                        >
                          Claim Now →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* User Info Card */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cronos-500 to-cronos-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {userIdentity.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Logged in as</p>
                  <p className="font-medium text-gray-900 truncate">{userIdentity}</p>
                </div>
              </div>
            </div>

            {/* What You Can Do */}
            <div className="card bg-gradient-to-br from-cronos-50 to-blue-50 border-2 border-cronos-200">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>💡</span>
                <span>What You Can Do</span>
              </h4>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-cronos-500 mt-0.5 flex-shrink-0">✓</span>
                  <span>Send CRO to any Cronos address instantly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cronos-500 mt-0.5 flex-shrink-0">✓</span>
                  <span>Export wallet and import into MetaMask</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cronos-500 mt-0.5 flex-shrink-0">✓</span>
                  <span>Use your wallet on other dApps</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cronos-500 mt-0.5 flex-shrink-0">✓</span>
                  <span>Send to exchanges to convert to fiat</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cronos-500 mt-0.5 flex-shrink-0">✓</span>
                  <span>Claim funds sent to your verified identity</span>
                </li>
              </ul>
            </div>

            {/* Network Info */}
            <div className="card bg-gray-50">
              <h4 className="font-bold text-gray-900 mb-3 text-sm">Network Info</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Network</span>
                  <span className="font-medium text-gray-900">Cronos Testnet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chain ID</span>
                  <span className="font-medium text-gray-900">338</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Currency</span>
                  <span className="font-medium text-gray-900">CRO</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Receive Modal */}
        {showReceiveModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card max-w-md w-full">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Receive CRO</h2>
                <button
                  onClick={() => setShowReceiveModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600">Share your wallet address to receive CRO:</p>

                <div className="bg-gradient-to-br from-cronos-50 to-blue-50 rounded-xl p-4 border-2 border-cronos-200">
                  <p className="text-xs text-gray-600 mb-2">Your Wallet Address</p>
                  <p className="font-mono text-sm break-all text-gray-900">{wallet.address}</p>
                </div>

                <button
                  onClick={() => {
                    copyAddress();
                    setTimeout(() => setShowReceiveModal(false), 1000);
                  }}
                  className="w-full btn-primary"
                >
                  {copied ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Address
                    </span>
                  )}
                </button>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <span className="text-xl">⚠️</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-900 mb-1">Important</p>
                      <p className="text-xs text-yellow-800">
                        Only send CRO or Cronos-compatible tokens to this address.
                        Sending other tokens may result in permanent loss.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
