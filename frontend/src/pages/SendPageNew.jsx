import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import Navigation from '../components/Navigation';

const API_URL = import.meta.env.VITE_API_URL;

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

  // Auto-fill sender address from Privy wallet
  useEffect(() => {
    if (authenticated && ready && wallets?.length > 0) {
      setFormData((prev) => ({
        ...prev,
        senderAddress: wallets[0].address,
      }));
    }
  }, [authenticated, ready, wallets]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/transfer/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Failed to send transfer');
      }
    } catch (err) {
      setError('Failed to initiate transfer');
      console.error('Send error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const claimLink = result ? `${window.location.origin}/claim/${result.claimToken}` : '';

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cronos-50/30">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success State */}
        {result ? (
          <div className="space-y-6">
            {/* Success Card */}
            <div className="card bg-gradient-to-r from-green-50 to-cronos-50 border-2 border-green-200">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Sent!</h2>
                  <p className="text-gray-600 text-lg">
                    {formData.amount} CRO sent to <strong>{formData.recipientIdentifier}</strong>
                  </p>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="bg-white rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-bold text-xl text-gray-900">{formData.amount} CRO</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Recipient</span>
                  <span className="font-medium text-gray-900">{formData.recipientIdentifier}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ghost Vault</span>
                  <span className="font-mono text-sm text-gray-700">
                    {result.recipientAddress.substring(0, 10)}...{result.recipientAddress.slice(-8)}
                  </span>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <a
                    href={`${import.meta.env.VITE_EXPLORER_URL || 'https://explorer.cronos.org/testnet'}/tx/${result.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cronos-600 hover:text-cronos-700 font-semibold flex items-center gap-2"
                  >
                    <span>View on Explorer</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Claim Link Card */}
            <div className="card">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Share Claim Link</h3>
              <p className="text-gray-600 mb-4">
                Send this link to the recipient so they can claim their funds
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={claimLink}
                  readOnly
                  className="input-field flex-1 font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(claimLink)}
                  className="btn-primary whitespace-nowrap"
                >
                  Copy Link
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setResult(null);
                  setFormData({
                    ...formData,
                    recipientIdentifier: '',
                    amount: '',
                  });
                }}
                className="btn-primary flex-1"
              >
                Send Another Payment
              </button>
              <button onClick={() => navigate('/wallet')} className="btn-secondary flex-1">
                View Wallet
              </button>
            </div>
          </div>
        ) : (
          /* Send Form */
          <>
            {!authenticated ? (
              <div className="card text-center">
                <div className="text-6xl mb-6">🔐</div>
                <h2 className="text-3xl font-bold mb-4">Sign In to Send Crypto</h2>
                <p className="text-xl text-gray-600 mb-8">
                  Login with email, phone, or Twitter to start sending payments
                </p>
                <button onClick={login} className="btn-primary text-lg px-8 py-4">
                  Sign In
                </button>
              </div>
            ) : (
              <div className="card">
                {/* Header */}
                <div className="mb-8">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">Send Payment</h1>
                  <p className="text-lg text-gray-600">
                    Send crypto to anyone using their email, Twitter, or phone number
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Recipient Type Selection */}
                  <div>
                    <label className="label">Send To</label>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, identifierType: 'email' })}
                        className={`px-4 py-3 rounded-lg font-medium transition-all ${
                          formData.identifierType === 'email'
                            ? 'bg-cronos-500 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        📧 Email
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, identifierType: 'twitter' })}
                        className={`px-4 py-3 rounded-lg font-medium transition-all ${
                          formData.identifierType === 'twitter'
                            ? 'bg-cronos-500 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        🐦 Twitter
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, identifierType: 'phone' })}
                        className={`px-4 py-3 rounded-lg font-medium transition-all ${
                          formData.identifierType === 'phone'
                            ? 'bg-cronos-500 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        📱 Phone
                      </button>
                    </div>
                    <input
                      type="text"
                      name="recipientIdentifier"
                      value={formData.recipientIdentifier}
                      onChange={handleChange}
                      placeholder={
                        formData.identifierType === 'email'
                          ? 'alice@example.com'
                          : formData.identifierType === 'twitter'
                          ? '@alice'
                          : '+1234567890'
                      }
                      className="input-field"
                      required
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="label">Amount (CRO)</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        placeholder="0.001"
                        step="0.001"
                        min="0"
                        className="input-field text-2xl font-bold pr-16"
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                        CRO
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Gas fee: ~0.0003 CRO (deducted from amount)
                    </p>
                  </div>

                  {/* Your Wallet */}
                  <div>
                    <label className="label">From Your Wallet</label>
                    <input
                      type="text"
                      value={formData.senderAddress}
                      readOnly
                      className="input-field bg-gray-50 text-gray-600 font-mono text-sm"
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-red-700 font-medium">{error}</span>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button type="submit" disabled={loading} className="btn-primary w-full text-lg py-4">
                    {loading ? (
                      <span className="flex items-center justify-center gap-3">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Sending Payment...</span>
                      </span>
                    ) : (
                      'Send Payment →'
                    )}
                  </button>
                </form>

                {/* Info Box */}
                <div className="mt-8 bg-cronos-50 rounded-xl p-6">
                  <h4 className="font-bold text-gray-900 mb-3">💡 How it works</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-cronos-500 mt-0.5">•</span>
                      <span>We create a secure Ghost Vault for the recipient</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cronos-500 mt-0.5">•</span>
                      <span>Share the claim link with them via email/DM</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cronos-500 mt-0.5">•</span>
                      <span>They login and claim instantly - wallet created automatically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cronos-500 mt-0.5">•</span>
                      <span>Gas fees are deducted from the received amount</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
