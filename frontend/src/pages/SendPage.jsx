import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SendPage.css';

const API_URL = import.meta.env.VITE_API_URL;

function SendPage() {
  const navigate = useNavigate();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/transfer/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

  return (
    <div className="send-page">
      <div className="send-container">
        <button onClick={() => navigate('/')} className="back-btn">
          ← Back to Home
        </button>

        <h1>💧 Send Crypto</h1>
        <p className="subtitle">Send to email, phone, or Twitter - no wallet address needed</p>

        {!result ? (
          <form onSubmit={handleSubmit} className="send-form">
            <div className="form-group">
              <label>Your Wallet Address</label>
              <input
                type="text"
                name="senderAddress"
                value={formData.senderAddress}
                onChange={handleChange}
                placeholder="0x..."
                required
              />
            </div>

            <div className="form-group">
              <label>Recipient Type</label>
              <select
                name="identifierType"
                value={formData.identifierType}
                onChange={handleChange}
                required
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="twitter">Twitter</option>
              </select>
            </div>

            <div className="form-group">
              <label>Recipient {formData.identifierType}</label>
              <input
                type="text"
                name="recipientIdentifier"
                value={formData.recipientIdentifier}
                onChange={handleChange}
                placeholder={
                  formData.identifierType === 'email'
                    ? 'alice@example.com'
                    : formData.identifierType === 'phone'
                    ? '+1234567890'
                    : '@alice'
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Amount (CRO)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.001"
                step="0.001"
                min="0"
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Sending...' : 'Send Transfer'}
            </button>
          </form>
        ) : (
          <div className="result-card">
            <h2>✅ Transfer Created!</h2>
            <div className="result-details">
              <div className="detail-row">
                <span className="label">Transfer ID:</span>
                <span className="value code">{result.transferId}</span>
              </div>
              <div className="detail-row">
                <span className="label">Ghost Vault:</span>
                <span className="value code">{result.recipientAddress}</span>
              </div>
              <div className="detail-row">
                <span className="label">TX Hash:</span>
                <a
                  href={`https://explorer.cronos.org/tx/${result.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="value link"
                >
                  View on Explorer →
                </a>
              </div>
            </div>

            <div className="claim-link-box">
              <p className="label">Share this link with the recipient:</p>
              <div className="link-display">
                <input type="text" value={claimLink} readOnly />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(claimLink);
                    alert('Link copied to clipboard!');
                  }}
                >
                  Copy
                </button>
              </div>
              <p className="claim-token-label">Or share the claim token:</p>
              <div className="claim-token">{result.claimToken}</div>
            </div>

            <button onClick={() => setResult(null)} className="another-btn">
              Send Another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SendPage;
