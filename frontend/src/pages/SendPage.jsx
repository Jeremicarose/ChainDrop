import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import Navigation from '../components/Navigation';

const API_URL = import.meta.env.VITE_API_URL;

// Minimum amount to cover gas costs (~0.03 CRO) plus margin
const MIN_AMOUNT_CRO = 0.05;

export default function SendPage() {
  const navigate = useNavigate();
  const { login, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();

  const [formData, setFormData] = useState({
    senderAddress: '',
    recipientIdentifier: '',
    identifierType: 'email',
    amount: '',
    tokenAddress: null,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Auto-fill sender address from Privy wallet or external wallet
  useEffect(() => {
    const getWalletAddress = async () => {
      // First try Privy wallets
      if (wallets?.length > 0) {
        setFormData((prev) => ({
          ...prev,
          senderAddress: wallets[0].address,
        }));
        return;
      }

      // Fallback: try external wallet (Rabby, MetaMask, etc.)
      if (window.ethereum && authenticated && ready) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            setFormData((prev) => ({
              ...prev,
              senderAddress: accounts[0],
            }));
          }
        } catch (err) {
          console.error('Error getting external wallet:', err);
        }
      }
    };

    if (authenticated && ready) {
      getWalletAddress();
    }
  }, [authenticated, ready, wallets]);

  // Auto-detect identifier type
  const detectIdentifierType = (value) => {
    if (value.includes('@') && value.includes('.')) return 'email';
    if (value.startsWith('@') || value.startsWith('twitter:')) return 'twitter';
    if (value.startsWith('+') || /^\d{10,}$/.test(value)) return 'phone';
    return 'email';
  };

  const handleRecipientChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      recipientIdentifier: value,
      identifierType: detectIdentifierType(value),
    }));
  };

  const [sendStep, setSendStep] = useState(''); // '', 'preparing', 'signing', 'confirming', 'recording'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Check if wallet is available
      if (!window.ethereum) {
        throw new Error('No wallet found. Please install Rabby or MetaMask.');
      }

      // Step 1: Prepare - get recipient address and claim token from backend
      setSendStep('preparing');
      console.log('📋 Step 1: Preparing transfer...');

      const prepareResponse = await fetch(`${API_URL}/transfer/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientIdentifier: formData.recipientIdentifier,
          identifierType: formData.identifierType,
          amount: formData.amount,
        }),
      });

      const prepareData = await prepareResponse.json();

      if (!prepareData.success) {
        throw new Error(prepareData.error || 'Failed to prepare transfer');
      }

      const { recipientAddress, claimToken } = prepareData.data;
      console.log(`✅ Recipient ghost vault: ${recipientAddress}`);

      // Step 2: Send - user's wallet signs and sends transaction
      setSendStep('signing');
      console.log('✍️ Step 2: Requesting wallet signature...');

      // Use ethers.js with the browser wallet
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Convert amount to wei
      const amountWei = ethers.parseEther(formData.amount);

      console.log(`💸 Sending ${formData.amount} CRO to ${recipientAddress}...`);

      const tx = await signer.sendTransaction({
        to: recipientAddress,
        value: amountWei,
      });

      console.log(`📤 Transaction submitted: ${tx.hash}`);

      // Step 3: Wait for confirmation
      setSendStep('confirming');
      console.log('⏳ Step 3: Waiting for confirmation...');

      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

      // Step 4: Record - save to database and send email notification
      setSendStep('recording');
      console.log('📝 Step 4: Recording transfer...');

      const recordResponse = await fetch(`${API_URL}/transfer/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderAddress: formData.senderAddress,
          recipientIdentifier: formData.recipientIdentifier,
          identifierType: formData.identifierType,
          amount: formData.amount,
          txHash: tx.hash,
          claimToken,
        }),
      });

      const recordData = await recordResponse.json();

      if (!recordData.success) {
        // Transaction succeeded but recording failed - still show success
        console.warn('Warning: Transfer succeeded but recording failed:', recordData.error);
        setResult({
          recipientAddress,
          txHash: tx.hash,
          claimToken,
          claimLink: `${window.location.origin}/claim/${claimToken}`,
        });
      } else {
        console.log(`✅ Transfer recorded: ${recordData.data.transferId}`);
        setResult(recordData.data);
      }

    } catch (err) {
      console.error('Send error:', err);

      // Handle user rejection
      if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
        setError('Transaction rejected. Please try again.');
      } else if (err.message?.includes('insufficient funds')) {
        setError('Insufficient CRO balance. Please add funds to your wallet.');
      } else {
        setError(err.message || 'Failed to send transfer');
      }
    } finally {
      setLoading(false);
      setSendStep('');
    }
  };

  const claimLink = result ? `${window.location.origin}/claim/${result.claimToken}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(claimLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#fafbfc]">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 py-20">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#1de4c6] to-[#00a28e] flex items-center justify-center shadow-lg shadow-[#1de4c6]/20">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Send Crypto</h1>
            <p className="text-lg text-gray-600">
              Sign in to send payments to anyone—even if they don't have a wallet yet.
            </p>
            <button
              onClick={login}
              className="px-8 py-4 rounded-xl font-semibold text-white text-lg transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #1de4c6 0%, #00a28e 100%)',
                boxShadow: '0 8px 30px -5px rgba(29, 228, 198, 0.4)'
              }}
            >
              Sign In to Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (result) {
    return (
      <div className="min-h-screen bg-[#fafbfc]">
        <Navigation />
        <div className="max-w-xl mx-auto px-4 py-12">
          {/* Success header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Sent!</h1>
            <p className="text-gray-600">
              <span className="font-semibold text-[#00a28e]">{formData.amount} CRO</span> is waiting for{' '}
              <span className="font-semibold">{formData.recipientIdentifier}</span>
            </p>
          </div>

          {/* The magic explanation */}
          <div className="bg-gradient-to-br from-[#1de4c6]/10 to-[#3b82f6]/10 rounded-2xl p-6 mb-6 border border-[#1de4c6]/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-xl">✨</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">They don't need a wallet yet</p>
                <p className="text-sm text-gray-600">
                  A Ghost Vault is holding their funds. When they verify their {formData.identifierType}, the money appears instantly in their new wallet.
                </p>
              </div>
            </div>
          </div>

          {/* Claim link */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
            <label className="text-sm font-semibold text-gray-700 mb-3 block">Share this link:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={claimLink}
                readOnly
                className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 font-mono text-sm text-gray-700"
              />
              <button
                onClick={handleCopy}
                className={`px-5 py-3 rounded-xl font-semibold transition-all ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            {formData.identifierType === 'email' && (
              <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Email notification sent automatically
              </p>
            )}
          </div>

          {/* Transaction details - collapsed */}
          <details className="bg-white rounded-2xl border border-gray-200 mb-6 shadow-sm">
            <summary className="px-6 py-4 cursor-pointer font-medium text-gray-700 hover:bg-gray-50 rounded-2xl">
              Transaction Details
            </summary>
            <div className="px-6 pb-4 space-y-3 text-sm border-t border-gray-100 pt-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Ghost Vault</span>
                <span className="font-mono text-gray-700">
                  {result.recipientAddress.substring(0, 8)}...{result.recipientAddress.slice(-6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Transaction</span>
                <a
                  href={`${import.meta.env.VITE_EXPLORER_URL || 'https://explorer.cronos.org/testnet'}/tx/${result.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00a28e] hover:underline font-mono flex items-center gap-1"
                >
                  {result.txHash.substring(0, 8)}...{result.txHash.slice(-6)}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </details>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setResult(null);
                setFormData({ ...formData, recipientIdentifier: '', amount: '' });
              }}
              className="flex-1 px-6 py-4 rounded-xl font-semibold text-white transition-all hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #1de4c6 0%, #00a28e 100%)',
              }}
            >
              Send Another
            </button>
            <button
              onClick={() => navigate('/wallet')}
              className="flex-1 px-6 py-4 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
            >
              View Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Send form
  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <Navigation />
      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Send Payment</h1>
          <p className="text-lg text-gray-600">
            They don't need a wallet. Just enter their email or @twitter.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipient - ONE input, auto-detect type */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Send to
            </label>
            <input
              type="text"
              value={formData.recipientIdentifier}
              onChange={handleRecipientChange}
              placeholder="alice@company.com or @alice"
              className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 text-lg focus:border-[#1de4c6] focus:ring-0 outline-none transition-colors"
              required
            />
            <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
              <span>Sending to:</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                formData.identifierType === 'email' ? 'bg-blue-100 text-blue-700' :
                formData.identifierType === 'twitter' ? 'bg-sky-100 text-sky-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {formData.identifierType === 'email' ? 'Email' :
                 formData.identifierType === 'twitter' ? 'Twitter' : 'Phone'}
              </span>
              <span className="text-gray-400">• No wallet needed</span>
            </div>
          </div>

          {/* Amount */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                step="0.001"
                min={MIN_AMOUNT_CRO}
                className={`w-full px-5 py-4 rounded-xl border-2 text-3xl font-bold pr-20 focus:ring-0 outline-none transition-colors tabular-nums ${
                  formData.amount && parseFloat(formData.amount) < MIN_AMOUNT_CRO
                    ? 'border-amber-400 focus:border-amber-500'
                    : 'border-gray-200 focus:border-[#1de4c6]'
                }`}
                required
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-lg">
                CRO
              </span>
            </div>
            {formData.amount && parseFloat(formData.amount) < MIN_AMOUNT_CRO ? (
              <div className="flex items-center gap-2 mt-3 text-amber-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">
                  Minimum {MIN_AMOUNT_CRO} CRO required (gas costs ~0.03 CRO)
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-3">
                Gas fee (~0.03 CRO) is deducted from amount when they claim
              </p>
            )}
          </div>

          {/* No wallet warning */}
          {!formData.senderAddress && authenticated && ready && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <span className="text-amber-800 text-sm font-medium block">No wallet detected</span>
                <span className="text-amber-700 text-xs">Please connect a wallet or sign in with email to get an embedded wallet.</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700 text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !formData.senderAddress || !formData.recipientIdentifier || !formData.amount || parseFloat(formData.amount) < MIN_AMOUNT_CRO}
            className="w-full px-6 py-5 rounded-xl font-bold text-white text-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            style={{
              background: 'linear-gradient(135deg, #1de4c6 0%, #00a28e 100%)',
              boxShadow: '0 8px 30px -5px rgba(29, 228, 198, 0.4)'
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>
                  {sendStep === 'preparing' && 'Preparing transfer...'}
                  {sendStep === 'signing' && 'Please sign in wallet...'}
                  {sendStep === 'confirming' && 'Confirming transaction...'}
                  {sendStep === 'recording' && 'Recording transfer...'}
                  {!sendStep && 'Processing...'}
                </span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>Send Payment</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            )}
          </button>
        </form>

        {/* How it works */}
        <div className="mt-8 p-5 rounded-xl bg-gray-50 border border-gray-100">
          <div className="flex items-start gap-3">
            <span className="text-lg">💡</span>
            <div className="text-sm text-gray-600">
              <p className="font-semibold text-gray-900 mb-1">Value first, wallet later</p>
              <p>
                We create a Ghost Vault—a secure address derived from their identity.
                They verify ownership and claim instantly.
                <span className="text-[#00a28e] font-medium"> No wallet needed upfront.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
