import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import '../styles/HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const { login, logout, authenticated, user } = usePrivy();

  return (
    <div className="home-page">
      <div className="hero">
        <div className="hero-badge">AI-Native Payments on Cronos</div>
        <h1>💧 ChainDrop</h1>
        <p className="tagline">The only crypto payment system built for AI agents</p>
        <p className="subtitle">
          Send value <strong>before</strong> asking for addresses. Claim with <strong>email, not wallets</strong>.
        </p>

        <div className="value-prop">
          <div className="prop-item">
            <span className="prop-icon">🎯</span>
            <span className="prop-text">Send to @alice, not 0x742d...</span>
          </div>
          <div className="prop-item">
            <span className="prop-icon">👻</span>
            <span className="prop-text">Ghost Vaults hold funds before claim</span>
          </div>
          <div className="prop-item">
            <span className="prop-icon">🤖</span>
            <span className="prop-text">AI issues intent, not transactions</span>
          </div>
        </div>

        <div className="cta-buttons">
          <button onClick={() => navigate('/send')} className="btn-primary">
            Send Payment →
          </button>
          {!authenticated ? (
            <button onClick={login} className="btn-secondary">
              Sign In to Receive
            </button>
          ) : (
            <button onClick={logout} className="btn-secondary">
              Sign Out
            </button>
          )}
        </div>

        {authenticated && user && (
          <div className="user-info">
            <p>✅ Signed in as:</p>
            <p className="user-email">
              {user.email?.address || user.phone?.number || user.twitter?.username || 'User'}
            </p>
          </div>
        )}
      </div>

      <div className="unique-selling-points">
        <h2>Why ChainDrop is Different</h2>

        <div className="usp-grid">
          <div className="usp-card highlight">
            <h3>🧠 Built for AI Agents</h3>
            <p className="usp-desc">
              AI agents issue <strong>intent</strong>, not transactions.
              No private key custody. No wallet hacks. Just policy-enforced payments.
            </p>
            <div className="code-example">
              agent.pay("alice@email.com", "$100")
            </div>
          </div>

          <div className="usp-card highlight">
            <h3>👻 Ghost Vault Technology</h3>
            <p className="usp-desc">
              Funds sent to <strong>counterfactual addresses</strong> via CREATE2.
              Recipient gets value <em>before</em> having an account.
            </p>
            <div className="flow-diagram">
              Send → Ghost Vault → Email Link → Claim → Wallet Created
            </div>
          </div>

          <div className="usp-card">
            <h3>📧 Human-Readable Recipients</h3>
            <p className="usp-desc">
              Send to email, phone, or Twitter. No more "paste your wallet address" friction.
            </p>
          </div>

          <div className="usp-card">
            <h3>🔐 Reverse Onboarding</h3>
            <p className="usp-desc">
              Value first, account later. Users claim with 1-click email login.
              Wallet created automatically.
            </p>
          </div>

          <div className="usp-card">
            <h3>⚡ Cronos-Native</h3>
            <p className="usp-desc">
              Built on Cronos EVM with <strong>ERC-4337</strong> account abstraction.
              Fast, cheap, scalable.
            </p>
          </div>

          <div className="usp-card">
            <h3>🛡️ Policy Enforcement</h3>
            <p className="usp-desc">
              AI agents operate within <strong>configurable limits</strong>.
              Daily caps, recipient whitelists, approval thresholds.
            </p>
          </div>
        </div>
      </div>

      <div className="use-cases">
        <h2>Perfect For</h2>
        <div className="use-case-grid">
          <div className="use-case">
            <strong>💼 Treasury Agents</strong>
            <p>Automate employee payments, contractor invoices, expense reimbursements</p>
          </div>
          <div className="use-case">
            <strong>🎁 Airdrops</strong>
            <p>Send tokens to email lists. No pre-existing wallets required</p>
          </div>
          <div className="use-case">
            <strong>💰 Payroll Automation</strong>
            <p>AI-driven payroll that doesn't require manual wallet management</p>
          </div>
          <div className="use-case">
            <strong>🌐 Global Remittances</strong>
            <p>Send CRO to anyone, anywhere. They claim with just email</p>
          </div>
        </div>
      </div>

      <div className="tech-stack">
        <h3>Powered By</h3>
        <div className="tech-badges">
          <span className="badge">Cronos EVM</span>
          <span className="badge">ERC-4337</span>
          <span className="badge">CREATE2</span>
          <span className="badge">Privy</span>
          <span className="badge">Claude AI</span>
        </div>
      </div>

      <div className="footer">
        <p>ChainDrop • AI-Native Payments on Cronos</p>
        <p className="small">Built for the x402 Hackathon</p>
      </div>
    </div>
  );
}

export default HomePage;
