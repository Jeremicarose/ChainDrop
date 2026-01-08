import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import '../styles/ClaimPage.css';

const API_URL = import.meta.env.VITE_API_URL;

function ClaimPage() {
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

  // Removed auto-claim to give users better control over the claim flow

  const handleClaim = async () => {
    console.log('🎯 Claim button clicked!');
    console.log('authenticated:', authenticated);
    console.log('wallets:', wallets);
    console.log('user:', user);

    if (!authenticated) {
      setError('Please log in first');
      console.error('Not authenticated');
      return;
    }

    if (!wallets || wallets.length === 0) {
      setError('Waiting for wallet to be created... Please try again in a moment.');
      console.error('No wallets available');
      return;
    }

    if (!user) {
      setError('User information not available. Please try logging in again.');
      console.error('No user object');
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

      if (!verifiedIdentity) {
        setError('Unable to verify your identity. Please ensure you logged in with email, phone, or Twitter.');
        setClaiming(false);
        console.error('No verified identity found');
        return;
      }

      console.log('✅ Claiming with wallet:', walletAddress);
      console.log('✅ Verified identity:', verifiedIdentity);

      const response = await fetch(`${API_URL}/transfer/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimToken,
          recipientWalletAddress: walletAddress,
          verifiedIdentity,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setClaimSuccess(data.data);
        console.log('Claim successful:', data.data);
      } else {
        setError(data.message || data.error || 'Failed to claim funds');
      }
    } catch (err) {
      setError('Failed to process claim');
      console.error('Claim error:', err);
    } finally {
      setClaiming(false);
    }
  };

  const handleLogin = () => {
    login();
  };

  if (loading) {
    return (
      <div className="claim-page">
        <div className="claim-card">
          <div className="spinner"></div>
          <p>Loading transfer details...</p>
        </div>
      </div>
    );
  }

  if (error && !transfer) {
    return (
      <div className="claim-page">
        <div className="claim-card error">
          <h1>❌ Error</h1>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  if (claimSuccess) {
    const explorerUrl = `https://sepolia.basescan.org/tx/${claimSuccess.transactionHash}`;

    return (
      <div className="claim-page">
        <div className="claim-card success">
          <h1>✅ Funds Claimed!</h1>
          <div className="claim-details">
            <div className="detail-row">
              <span className="label">Amount:</span>
              <span className="value">{claimSuccess.claimedAmount} {claimSuccess.token}</span>
            </div>
            <div className="detail-row">
              <span className="label">Your Wallet:</span>
              <span className="value code">{wallets[0]?.address.substring(0, 10)}...</span>
            </div>
            <div className="detail-row">
              <span className="label">Transaction:</span>
              <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="value link">
                View on Explorer →
              </a>
            </div>
          </div>
          <p className="success-message">
            💰 The funds have been transferred to your wallet!
          </p>
          <button onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    const amountDisplay = transfer.amount
      ? (parseInt(transfer.amount) / 1e18).toFixed(4)
      : '0.00';

    return (
      <div className="claim-page">
        <div className="claim-card">
          <h1>💧 ChainDrop</h1>
          <div className="transfer-preview">
            <p className="amount">{amountDisplay} {transfer.tokenAddress}</p>
            <p className="subtitle">Someone sent you crypto!</p>
          </div>

          {transfer.claimable ? (
            <>
              <p className="info">Sign in to claim your funds. A wallet will be created for you automatically.</p>
              <div className="security-notice">
                <p>🔒 <strong>Security:</strong> You must log in with the same email/phone/Twitter that received this transfer.</p>
              </div>
              <button onClick={handleLogin} className="login-btn">
                Claim with Email / Phone / Twitter
              </button>
              <p className="small-text">
                No wallet? No problem! We'll create one for you.
              </p>
            </>
          ) : (
            <div className="error-message">
              <p>❌ {transfer.reason}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (claiming) {
    return (
      <div className="claim-page">
        <div className="claim-card">
          <div className="spinner"></div>
          <h2>Processing Claim...</h2>
          <p>Deploying your wallet and transferring funds...</p>
          <p className="small-text">This may take a few moments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="claim-page">
      <div className="claim-card">
        <h1>Ready to Claim</h1>
        <p>Your wallet is ready. Click below to claim your funds.</p>
        <button onClick={handleClaim} className="claim-btn">
          Claim Now
        </button>
      </div>
    </div>
  );
}

export default ClaimPage;
