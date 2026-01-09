import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import '../styles/WalletPage.css';

const API_URL = import.meta.env.VITE_API_URL;

function WalletPage() {
  const navigate = useNavigate();
  const { login, logout, authenticated, user, exportWallet } = usePrivy();
  const { wallets } = useWallets();

  const [balance, setBalance] = useState('0');
  const [pendingClaims, setPendingClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendAmount, setSendAmount] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  // Fetch balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!wallets || wallets.length === 0) return;

      try {
        const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
        const balanceWei = await provider.getBalance(wallets[0].address);
        const balanceEth = ethers.formatEther(balanceWei);
        setBalance(balanceEth);
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    if (authenticated && wallets.length > 0) {
      fetchBalance();
      // Refresh every 10 seconds
      const interval = setInterval(fetchBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [authenticated, wallets]);

  // Fetch pending claims for this user
  useEffect(() => {
    const fetchPendingClaims = async () => {
      if (!user?.email?.address && !user?.phone?.number && !user?.twitter?.username) {
        setLoading(false);
        return;
      }

      try {
        const identity = user.email?.address || user.phone?.number || user.twitter?.username;

        // Get all transfers sent to this identity
        const response = await fetch(`${API_URL}/transfer/recipient/${encodeURIComponent(identity)}`);

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPendingClaims(data.data.filter(t => t.status === 'pending'));
          }
        }
      } catch (error) {
        console.error('Error fetching pending claims:', error);
      } finally {
        setLoading(false);
      }
    };

    if (authenticated && user) {
      fetchPendingClaims();
    }
  }, [authenticated, user]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!wallets || wallets.length === 0) return;

    setSending(true);
    setSendResult(null);

    try {
      const wallet = wallets[0];
      await wallet.switchChain(84532); // Base Sepolia

      const provider = await wallet.getEthersProvider();
      const signer = await provider.getSigner();

      const tx = await signer.sendTransaction({
        to: sendTo,
        value: ethers.parseEther(sendAmount),
      });

      console.log('Transaction sent:', tx.hash);
      await tx.wait();

      setSendResult({
        success: true,
        txHash: tx.hash,
      });

      // Refresh balance
      const balanceWei = await provider.getBalance(wallet.address);
      setBalance(ethers.formatEther(balanceWei));

      // Clear form
      setSendAmount('');
      setSendTo('');
    } catch (error) {
      console.error('Send error:', error);
      setSendResult({
        success: false,
        error: error.message,
      });
    } finally {
      setSending(false);
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

  if (!authenticated) {
    return (
      <div className="wallet-page">
        <div className="wallet-container">
          <h1>💼 My Wallet</h1>
          <p className="subtitle">Please sign in to view your wallet</p>
          <button onClick={login} className="login-btn">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!wallets || wallets.length === 0) {
    return (
      <div className="wallet-page">
        <div className="wallet-container">
          <div className="spinner"></div>
          <p>Setting up your wallet...</p>
        </div>
      </div>
    );
  }

  const wallet = wallets[0];
  const userIdentity = user?.email?.address || user?.phone?.number || user?.twitter?.username || 'Unknown';

  return (
    <div className="wallet-page">
      <div className="wallet-container">
        <div className="wallet-header">
          <button onClick={() => navigate('/')} className="back-btn">
            ← Back to Home
          </button>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>

        <h1>💼 My Wallet</h1>
        <p className="user-identity">Logged in as: {userIdentity}</p>

        {/* Balance Card */}
        <div className="balance-card">
          <p className="balance-label">Total Balance</p>
          <h2 className="balance-amount">{parseFloat(balance).toFixed(6)} ETH</h2>
          <p className="balance-usd">≈ ${(parseFloat(balance) * 3500).toFixed(2)} USD</p>
          <div className="wallet-address">
            <span className="label">Address:</span>
            <code>{wallet.address}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(wallet.address);
                alert('Address copied!');
              }}
              className="copy-btn"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Pending Claims */}
        {pendingClaims.length > 0 && (
          <div className="pending-claims">
            <h3>🎁 Pending Claims ({pendingClaims.length})</h3>
            {pendingClaims.map((claim) => (
              <div key={claim.id} className="claim-item">
                <div className="claim-info">
                  <span className="claim-amount">
                    {(parseInt(claim.amount) / 1e18).toFixed(4)} ETH
                  </span>
                  <span className="claim-from">
                    From {claim.senderAddress?.substring(0, 6)}...
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/claim/${claim.claimToken}`)}
                  className="claim-btn-small"
                >
                  Claim
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Send Money */}
        <div className="send-section">
          <h3>💸 Send Money</h3>
          <form onSubmit={handleSend}>
            <div className="form-group">
              <label>Recipient Address</label>
              <input
                type="text"
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                placeholder="0x..."
                required
              />
            </div>
            <div className="form-group">
              <label>Amount (ETH)</label>
              <input
                type="number"
                step="0.0001"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="0.001"
                required
              />
            </div>

            {sendResult && (
              <div className={sendResult.success ? 'success-message' : 'error-message'}>
                {sendResult.success ? (
                  <>
                    ✅ Sent successfully!{' '}
                    <a
                      href={`https://sepolia.basescan.org/tx/${sendResult.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View TX
                    </a>
                  </>
                ) : (
                  `❌ ${sendResult.error}`
                )}
              </div>
            )}

            <button type="submit" disabled={sending} className="send-btn">
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>

        {/* Wallet Actions */}
        <div className="wallet-actions">
          <button onClick={handleExportWallet} className="export-btn">
            📤 Export Wallet
          </button>
          <button
            onClick={() => window.open(`https://sepolia.basescan.org/address/${wallet.address}`, '_blank')}
            className="explorer-btn"
          >
            🔍 View on Explorer
          </button>
        </div>

        <div className="help-section">
          <h4>💡 What can you do?</h4>
          <ul>
            <li>Send ETH to any Ethereum address</li>
            <li>Use your wallet on other dApps</li>
            <li>Export and import into MetaMask/Rabby</li>
            <li>Send to exchanges (Coinbase, Binance) to convert to USD</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default WalletPage;
