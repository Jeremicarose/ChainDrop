import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import Navigation from '../components/Navigation';

const API_URL = import.meta.env.VITE_API_URL;

export default function WalletPage() {
  const navigate = useNavigate();
  const { login, authenticated, user, exportWallet, ready } = usePrivy();
  const { wallets } = useWallets();

  const [balance, setBalance] = useState('0');
  const [pendingClaims, setPendingClaims] = useState([]);
  const [copied, setCopied] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setIsLoading(false);
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

        // Check native CRO transfers by scanning recent blocks
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
      <div className="min-h-screen bg-[#fafbfc]">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Wallet Icon */}
            <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-[#1de4c6] to-[#00a28e] flex items-center justify-center shadow-xl shadow-[#1de4c6]/20">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Clash Display', sans-serif" }}>
              Your Wallet
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-sm mx-auto">
              Sign in to view your balance, claim pending funds, and manage your crypto.
            </p>

            <button
              onClick={login}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-white text-lg transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #1de4c6 0%, #00a28e 100%)',
                boxShadow: '0 8px 30px -5px rgba(29, 228, 198, 0.5)'
              }}
            >
              <span>Sign In to Continue</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Wallet loading state
  if (!wallets || wallets.length === 0) {
    return (
      <div className="min-h-screen bg-[#fafbfc]">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#1de4c6]/20 to-[#00a28e]/20 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-[#1de4c6] border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Clash Display', sans-serif" }}>
              Creating Your Wallet
            </h2>
            <p className="text-gray-600">
              Setting up your embedded wallet...
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
    <div className="min-h-screen bg-[#fafbfc]">
      <Navigation />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Card - Hero */}
        <div
          className="rounded-3xl p-8 mb-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          }}
        >
          {/* Subtle gradient orb */}
          <div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, #1de4c6 0%, transparent 70%)' }}
          />

          <div className="relative">
            {/* User greeting */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-gray-400">{userIdentity}</span>
            </div>

            {/* Balance */}
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-1">Total Balance</p>
              {isLoading ? (
                <div className="h-12 w-48 bg-white/10 rounded-lg animate-pulse" />
              ) : (
                <>
                  <h1
                    className="text-5xl font-bold text-white mb-1 tabular-nums"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    {balanceFloat.toFixed(4)} <span className="text-2xl text-gray-400">CRO</span>
                  </h1>
                  <p className="text-gray-400 text-lg">${estimatedUSD.toFixed(2)} USD</p>
                </>
              )}
            </div>

            {/* Wallet Address */}
            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">Wallet Address</p>
                <p className="font-mono text-sm text-gray-300 truncate">{wallet.address}</p>
              </div>
              <button
                onClick={copyAddress}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all flex items-center gap-2 flex-shrink-0"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Primary Action */}
        <button
          onClick={() => navigate('/send')}
          className="w-full mb-4 py-4 rounded-2xl font-semibold text-white text-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-3"
          style={{
            background: 'linear-gradient(135deg, #1de4c6 0%, #00a28e 100%)',
            boxShadow: '0 8px 30px -5px rgba(29, 228, 198, 0.4)'
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Send Payment
        </button>

        {/* Secondary Actions */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <button
            onClick={() => setShowReceiveModal(true)}
            className="bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl p-4 text-center transition-all group"
          >
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">Receive</p>
          </button>

          <button
            onClick={handleExportWallet}
            className="bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl p-4 text-center transition-all group"
          >
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">Export Key</p>
          </button>

          <button
            onClick={() => {
              const explorerUrl = import.meta.env.VITE_EXPLORER_URL || 'https://explorer.cronos.org/testnet';
              window.open(`${explorerUrl}/address/${wallet.address}`, '_blank');
            }}
            className="bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl p-4 text-center transition-all group"
          >
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">Explorer</p>
          </button>
        </div>

        {/* Pending Claims - High Priority */}
        {pendingClaims.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <h2 className="font-semibold text-gray-900">Pending Claims</h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                {pendingClaims.length}
              </span>
            </div>

            <div className="space-y-3">
              {pendingClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xl">
                        🎁
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {(parseInt(claim.amount) / 1e18).toFixed(4)} CRO
                        </p>
                        <p className="text-sm text-gray-500">
                          Waiting for you
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/claim/${claim.claim_token}`)}
                      className="px-4 py-2 rounded-xl font-semibold text-white text-sm transition-all hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      }}
                    >
                      Claim Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-900 font-medium mb-1">No transactions yet</p>
              <p className="text-sm text-gray-500 mb-4">
                Your activity will appear here after your first transaction
              </p>
              <button
                onClick={() => navigate('/send')}
                className="text-sm font-medium text-[#00a28e] hover:text-[#008f7d]"
              >
                Send your first payment →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentTransactions.map((tx, idx) => {
                const isSent = tx.from?.toLowerCase() === wallet.address.toLowerCase();
                const amount = ethers.formatEther(tx.value);
                const explorerUrl = `${import.meta.env.VITE_EXPLORER_URL || 'https://explorer.cronos.org/testnet'}/tx/${tx.hash}`;
                const timeAgo = tx.timestamp
                  ? `${Math.floor((Date.now() / 1000 - tx.timestamp) / 60)}m ago`
                  : 'Recent';

                return (
                  <div
                    key={idx}
                    className="px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => window.open(explorerUrl, '_blank')}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isSent ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          {isSent ? (
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {isSent ? 'Sent' : 'Received'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {timeAgo}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold tabular-nums ${isSent ? 'text-red-600' : 'text-green-600'}`}>
                          {isSent ? '-' : '+'}{Number(amount).toFixed(4)} CRO
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          {isSent
                            ? `To ${tx.to?.substring(0, 6)}...${tx.to?.slice(-4)}`
                            : `From ${tx.from?.substring(0, 6)}...${tx.from?.slice(-4)}`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="px-5 py-3 bg-gray-50">
                <a
                  href={`${import.meta.env.VITE_EXPLORER_URL || 'https://explorer.cronos.org/testnet'}/address/${wallet.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[#00a28e] hover:text-[#008f7d] flex items-center justify-center gap-1"
                >
                  View all on Explorer
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Network Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400">
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <span>Cronos Testnet</span>
          <span className="text-gray-300">•</span>
          <span>Chain ID 338</span>
        </div>
      </div>

      {/* Receive Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                Receive CRO
              </h2>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Share this address to receive CRO on Cronos network:
            </p>

            <div className="bg-gray-50 rounded-2xl p-4 mb-4 border-2 border-gray-200">
              <p className="font-mono text-sm text-gray-900 break-all leading-relaxed">
                {wallet.address}
              </p>
            </div>

            <button
              onClick={() => {
                copyAddress();
                setTimeout(() => setShowReceiveModal(false), 1000);
              }}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #1de4c6 0%, #00a28e 100%)',
              }}
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied to Clipboard!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Address
                </>
              )}
            </button>

            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> Only send CRO or Cronos-compatible tokens. Sending other tokens may result in permanent loss.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
