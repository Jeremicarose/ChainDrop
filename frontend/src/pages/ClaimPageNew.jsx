import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import Navigation from '../components/Navigation';

const API_URL = import.meta.env.VITE_API_URL;

export default function ClaimPage() {
  const { claimToken } = useParams();
  const navigate = useNavigate();
  const { login, authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(null);

  // Fetch transfer details
  useEffect(() => {
    const fetchTransfer = async () => {
      try {
        const response = await fetch(`${API_URL}/transfer/${claimToken}`);
        const data = await response.json();

        if (data.success) {
          setTransfer(data.data);
        } else {
          setError(data.error || 'Transfer not found');
        }
      } catch (err) {
        setError('Failed to load transfer details');
        console.error('Error fetching transfer:', err);
      } finally {
        setLoading(false);
      }
    };

    if (claimToken) {
      fetchTransfer();
    }
  }, [claimToken]);

  const handleClaim = async () => {
    if (!authenticated) {
      setError('Please log in first');
      return;
    }

    if (!wallets || wallets.length === 0) {
      setError('Waiting for wallet to be created... Please try again in a moment.');
      return;
    }

    if (!user) {
      setError('User information not available. Please try logging in again.');
      return;
    }

    setClaiming(true);
    setError(null);

    try {
      const wallet = wallets[0];
      const walletAddress = wallet.address;

      // Extract verified identity from Privy user object
      let verifiedIdentity = null;
      if (user.email?.address) {
        verifiedIdentity = user.email.address;
      } else if (user.phone?.number) {
        verifiedIdentity = user.phone.number;
      } else if (user.twitter?.username) {
        verifiedIdentity = user.twitter.username;
      }

      console.log('Claiming with identity:', verifiedIdentity);

      const response = await fetch(`${API_URL}/transfer/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimToken,
          recipientWalletAddress: walletAddress,
          verifiedIdentity,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setClaimSuccess(data.data);
      } else {
        setError(data.error || 'Failed to claim transfer');
      }
    } catch (err) {
      setError('Failed to claim transfer');
      console.error('Claim error:', err);
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
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
            <p className="text-xl text-gray-600">Loading transfer details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !transfer) {
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
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Transfer Not Found</h2>
            <p className="text-lg text-gray-600 mb-8">{error}</p>
            <button onClick={() => navigate('/')} className="btn-primary">
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success State
  if (claimSuccess) {
    const explorerBaseUrl = import.meta.env.VITE_EXPLORER_URL || 'https://explorer.cronos.org/testnet';
    const explorerUrl = `${explorerBaseUrl}/tx/${claimSuccess.transactionHash}`;

    return (
      <div className="min-h-screen gradient-mesh relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cronos-400/20 to-blue-400/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-cronos-300/10 to-blue-300/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <Navigation />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="card bg-gradient-to-r from-green-50 to-cronos-50 border-2 border-green-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-3">Funds Claimed!</h1>
                <p className="text-xl text-gray-600">
                  The crypto has been transferred to your wallet
                </p>
              </div>
            </div>

            {/* Amount Details */}
            <div className="bg-white rounded-xl p-6 space-y-4 mb-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-600">Amount Received</span>
                <span className="text-3xl font-bold text-cronos-600">
                  {claimSuccess.claimedAmount} {claimSuccess.token}
                </span>
              </div>

              {claimSuccess.gasCost && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center text-gray-500">
                    <span>Original Amount</span>
                    <span>{claimSuccess.originalAmount} {claimSuccess.token}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500">
                    <span>Gas Fee</span>
                    <span>-{claimSuccess.gasCost} {claimSuccess.token}</span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Your Wallet</span>
                  <span className="font-mono text-gray-900">
                    {wallets[0]?.address.substring(0, 10)}...{wallets[0]?.address.slice(-8)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Transaction</span>
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cronos-600 hover:text-cronos-700 font-semibold flex items-center gap-1"
                  >
                    <span>View on Explorer</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button onClick={() => navigate('/wallet')} className="btn-primary flex-1">
                View My Wallet
              </button>
              <button onClick={() => navigate('/')} className="btn-secondary flex-1">
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User authenticated but wallet not created yet
  if (authenticated && (!wallets || wallets.length === 0)) {
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
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Creating Your Wallet...</h2>
            <p className="text-lg text-gray-600 mb-2">
              Please wait while we set up your embedded wallet
            </p>
            <p className="text-sm text-gray-500">This takes about 5-10 seconds</p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated - show login
  if (!authenticated) {
    const amountDisplay = transfer.amount
      ? `${(parseFloat(transfer.amount) / 1e18).toFixed(4)}`
      : '...';

    return (
      <div className="min-h-screen gradient-mesh relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cronos-400/20 to-blue-400/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-cronos-300/10 to-blue-300/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <Navigation />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="card animate-slide-up">
            {/* Gift Icon */}
            <div className="w-24 h-24 bg-gradient-to-br from-cronos-500 to-cronos-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">🎁</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">
              You've Got Crypto!
            </h1>
            <p className="text-xl text-center text-gray-600 mb-8">
              Someone sent you <strong className="text-cronos-600">{amountDisplay} CRO</strong>
            </p>

            {/* Info Box */}
            <div className="bg-cronos-50 rounded-xl p-6 mb-8">
              <h3 className="font-bold text-gray-900 mb-3">What happens next?</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-cronos-500 mt-0.5">•</span>
                  <span>Sign in with your email, phone, or Twitter</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cronos-500 mt-0.5">•</span>
                  <span>We'll create a secure wallet for you automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cronos-500 mt-0.5">•</span>
                  <span>Claim your funds instantly - no crypto knowledge needed</span>
                </li>
              </ul>
            </div>

            {/* Login Button */}
            <button onClick={login} className="btn-primary w-full text-lg py-4">
              Sign In to Claim →
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Secure and easy - your wallet is created automatically
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - show claim button
  return (
    <div className="min-h-screen gradient-mesh relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cronos-400/20 to-blue-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-cronos-300/10 to-blue-300/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <Navigation />
      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="card animate-slide-up">
          {/* Gift Icon */}
          <div className="w-24 h-24 bg-gradient-to-br from-cronos-500 to-cronos-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">🎁</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Ready to Claim!
          </h1>

          {/* Amount Display */}
          <div className="bg-gradient-to-r from-cronos-50 to-blue-50 rounded-xl p-8 mb-8 text-center">
            <p className="text-gray-600 mb-2">You're receiving</p>
            <p className="text-5xl font-bold text-cronos-600 mb-2">
              {transfer.amount ? (parseFloat(transfer.amount) / 1e18).toFixed(4) : '...'} CRO
            </p>
            <p className="text-sm text-gray-500">Gas fee will be deducted (~0.0003 CRO)</p>
          </div>

          {/* Wallet Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Your Wallet</span>
              <span className="font-mono text-gray-900">
                {wallets[0]?.address.substring(0, 10)}...{wallets[0]?.address.slice(-8)}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-700 font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Claim Button */}
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="btn-primary w-full text-lg py-4"
          >
            {claiming ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Claiming...</span>
              </span>
            ) : (
              'Claim Funds →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
