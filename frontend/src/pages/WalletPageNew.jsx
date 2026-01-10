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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cronos-50/30">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="card text-center">
            <div className="text-6xl mb-6">💼</div>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cronos-50/30">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="card text-center">
            <div className="animate-spin w-16 h-16 border-4 border-cronos-500 border-t-transparent rounded-full mx-auto mb-6"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cronos-50/30">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
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
                onClick={copyAddress}
                className="card hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1 p-6 text-center"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900">Receive</p>
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
      </div>
    </div>
  );
}
