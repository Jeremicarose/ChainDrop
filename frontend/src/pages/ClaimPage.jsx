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
  const [croPrice, setCroPrice] = useState(0.09); // Default price

  // Fetch CRO price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch(`${API_URL}/price/cro`);
        const data = await response.json();
        if (data.success && data.price) {
          setCroPrice(data.price);
        }
      } catch (err) {
        console.error('Error fetching CRO price:', err);
      }
    };
    fetchPrice();
  }, []);

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
      setError('Please sign in first');
      return;
    }

    if (!wallets || wallets.length === 0) {
      setError('Wallet is being created... Try again in a moment.');
      return;
    }

    if (!user) {
      setError('User info not available. Please sign in again.');
      return;
    }

    setClaiming(true);
    setError(null);

    try {
      const wallet = wallets[0];
      const walletAddress = wallet.address;

      // Extract verified identity
      let verifiedIdentity = null;
      if (user.email?.address) {
        verifiedIdentity = user.email.address;
      } else if (user.phone?.number) {
        verifiedIdentity = user.phone.number;
      } else if (user.twitter?.username) {
        verifiedIdentity = user.twitter.username;
      }

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
        setError(data.error || 'Failed to claim');
      }
    } catch (err) {
      setError('Failed to claim');
      console.error('Claim error:', err);
    } finally {
      setClaiming(false);
    }
  };

  // Calculate amounts
  const amountInCRO = transfer?.amount ? parseFloat(transfer.amount) / 1e18 : 0;
  const amountInUSD = amountInCRO * croPrice;
  const croDisplay = amountInCRO.toFixed(4);
  const usdDisplay = `$${amountInUSD.toFixed(2)}`;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbfc]">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 border-4 border-[#1de4c6] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-gray-600 text-lg">Loading your payment...</p>
        </div>
      </div>
    );
  }

  // Error state (no transfer found)
  if (error && !transfer) {
    return (
      <div className="min-h-screen bg-[#fafbfc]">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Payment Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Success state - CELEBRATION!
  if (claimSuccess) {
    const explorerUrl = `${import.meta.env.VITE_EXPLORER_URL || 'https://explorer.cronos.org/testnet'}/tx/${claimSuccess.transactionHash}`;

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1de4c6]/10 via-[#fafbfc] to-[#3b82f6]/10">
        <Navigation />
        <div className="max-w-xl mx-auto px-4 py-12">
          {/* Celebration header */}
          <div className="text-center mb-8">
            <div className="text-7xl mb-6 animate-bounce">🎉</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">You Got Paid!</h1>
            <p className="text-xl text-gray-600">
              The crypto is now in your wallet
            </p>
          </div>

          {/* Amount received */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6 text-center shadow-lg">
            <p className="text-gray-500 text-sm mb-2">You received</p>
            <p className="text-5xl font-bold text-[#00a28e] mb-1 tabular-nums">
              ${(parseFloat(claimSuccess.claimedAmount) * croPrice).toFixed(2)}
            </p>
            <p className="text-lg text-gray-500 mb-3">
              ({claimSuccess.claimedAmount} CRO)
            </p>
            {claimSuccess.gasCost && parseFloat(claimSuccess.gasCost) > 0 && (
              <p className="text-sm text-gray-400">
                Gas fee: {claimSuccess.gasCost} CRO (auto-deducted)
              </p>
            )}
          </div>

          {/* Your new wallet */}
          <div className="bg-gradient-to-br from-[#1de4c6]/10 to-[#3b82f6]/10 rounded-2xl p-6 mb-6 border border-[#1de4c6]/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-5 h-5 text-[#00a28e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 mb-1">Your Wallet</p>
                <p className="text-sm font-mono text-gray-600 break-all">
                  {wallets[0]?.address}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  This wallet was created automatically. You own it completely.
                </p>
              </div>
            </div>
          </div>

          {/* Transaction link */}
          <div className="text-center mb-8">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#00a28e] hover:underline font-medium"
            >
              View transaction on Explorer
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Off-ramp Options - What to do with your money */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-xl">💡</span>
              What would you like to do?
            </h3>
            <div className="space-y-3">
              {/* Cash out to bank */}
              <a
                href={`https://www.moonpay.com/sell?defaultCryptoCurrency=cro&walletAddress=${wallets[0]?.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#1de4c6] hover:bg-[#1de4c6]/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🏦</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 group-hover:text-[#00a28e]">Cash out to Bank</p>
                  <p className="text-sm text-gray-500">Convert to USD and withdraw to your bank account</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-[#00a28e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>

              {/* Buy gift cards */}
              <a
                href="https://www.bitrefill.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#1de4c6] hover:bg-[#1de4c6]/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🎁</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 group-hover:text-[#00a28e]">Buy Gift Cards</p>
                  <p className="text-sm text-gray-500">Amazon, Netflix, Uber, and 1000+ more</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-[#00a28e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>

              {/* Send to someone else */}
              <button
                onClick={() => navigate('/agents')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#1de4c6] hover:bg-[#1de4c6]/5 transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💸</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 group-hover:text-[#00a28e]">Send to Someone</p>
                  <p className="text-sm text-gray-500">Pay a friend or family using their email</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-[#00a28e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Keep in wallet */}
              <button
                onClick={() => navigate('/wallet')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#1de4c6] hover:bg-[#1de4c6]/5 transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">👛</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 group-hover:text-[#00a28e]">Keep in Wallet</p>
                  <p className="text-sm text-gray-500">Save it for later or use in DeFi apps</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-[#00a28e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Transaction link - moved below */}
          <div className="text-center">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-[#00a28e] text-sm"
            >
              View transaction on Explorer
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Wallet creating state
  if (authenticated && (!wallets || wallets.length === 0)) {
    return (
      <div className="min-h-screen bg-[#fafbfc]">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 border-4 border-[#1de4c6] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Creating Your Wallet...</h1>
          <p className="text-gray-600">This takes about 5 seconds</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show claim invitation
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1de4c6]/5 via-[#fafbfc] to-[#3b82f6]/5">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 py-12">
          {/* Gift icon */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#1de4c6] to-[#00a28e] flex items-center justify-center shadow-lg shadow-[#1de4c6]/30">
              <span className="text-5xl">💸</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">You've Got Crypto!</h1>
            <p className="text-xl text-gray-600">
              Someone sent you <span className="font-bold text-[#00a28e]">{usdDisplay}</span> <span className="text-gray-500">({croDisplay} CRO)</span>
            </p>
          </div>

          {/* The value prop */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">What happens next:</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#1de4c6]/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#00a28e]">1</div>
                <div>
                  <p className="font-medium text-gray-900">Sign in with your email</p>
                  <p className="text-sm text-gray-500">Verify you own the identity the funds were sent to</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#1de4c6]/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#00a28e]">2</div>
                <div>
                  <p className="font-medium text-gray-900">We create a wallet for you</p>
                  <p className="text-sm text-gray-500">Automatically, instantly, no seed phrase hassle</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#1de4c6]/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#00a28e]">3</div>
                <div>
                  <p className="font-medium text-gray-900">The crypto appears in your wallet</p>
                  <p className="text-sm text-gray-500">Gas is paid from the transfer—you need nothing</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Non-custodial
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Self-funded claim
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              One-time only
            </span>
          </div>

          {/* CTA */}
          <button
            onClick={login}
            className="w-full px-6 py-5 rounded-xl font-bold text-white text-lg transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #1de4c6 0%, #00a28e 100%)',
              boxShadow: '0 8px 30px -5px rgba(29, 228, 198, 0.4)'
            }}
          >
            Sign In to Claim
          </button>
          <p className="text-center text-sm text-gray-500 mt-4">
            You'll need to verify the email/Twitter the payment was sent to
          </p>
        </div>
      </div>
    );
  }

  // Authenticated - ready to claim
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1de4c6]/5 via-[#fafbfc] to-[#3b82f6]/5">
      <Navigation />
      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Gift icon */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#1de4c6] to-[#00a28e] flex items-center justify-center shadow-lg shadow-[#1de4c6]/30">
            <span className="text-5xl">💸</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Ready to Claim!</h1>
        </div>

        {/* Amount */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6 text-center shadow-sm">
          <p className="text-gray-500 text-sm mb-2">You're receiving</p>
          <p className="text-5xl font-bold text-[#00a28e] mb-1 tabular-nums">
            {usdDisplay}
          </p>
          <p className="text-lg text-gray-500 mb-3">
            ({croDisplay} CRO)
          </p>
          <p className="text-sm text-gray-400">
            Gas fee (~0.03 CRO) will be deducted automatically
          </p>
        </div>

        {/* Your wallet info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Claiming to:</span>
            <span className="font-mono text-gray-900">
              {wallets[0]?.address.substring(0, 8)}...{wallets[0]?.address.slice(-6)}
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 mb-6">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700 text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Claim button */}
        <button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full px-6 py-5 rounded-xl font-bold text-white text-lg transition-all hover:scale-[1.02] disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #1de4c6 0%, #00a28e 100%)',
            boxShadow: '0 8px 30px -5px rgba(29, 228, 198, 0.4)'
          }}
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
            'Claim Now'
          )}
        </button>
      </div>
    </div>
  );
}
