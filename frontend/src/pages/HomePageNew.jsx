import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import Navigation from '../components/Navigation';

export default function HomePage() {
  const navigate = useNavigate();
  const { authenticated, login } = usePrivy();

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section - Clean & Spacious */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-teal-50 text-teal-700 border border-teal-100">
            <span>🤖</span>
            <span>Powered by AI Agents</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 tracking-tight leading-tight">
            Send Crypto to Anyone
            <br />
            <span className="text-teal-600">Without Wallet Addresses</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            No wallet setup required. Just send crypto using email, Twitter, or phone number. Recipients claim with one click.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {!authenticated ? (
              <>
                <button onClick={login} className="btn-primary text-lg px-8 py-4">
                  Get Started Free
                </button>
                <button onClick={() => navigate('/agents')} className="btn-ghost">
                  Learn More
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/send')} className="btn-primary text-lg px-8 py-4">
                  Send Payment
                </button>
                <button onClick={() => navigate('/wallet')} className="btn-secondary">
                  View Wallet
                </button>
              </>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Self-funded claiming</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Non-custodial</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Built on Cronos</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-20 sm:py-28">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three simple steps to send crypto to anyone, anywhere
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">👻</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Ghost Vaults</h3>
              <p className="text-gray-600 leading-relaxed">
                Send to any email, Twitter, or phone. We create a secure vault that only the recipient can access.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI Agents</h3>
              <p className="text-gray-600 leading-relaxed">
                Automate payments with policy-based AI agents. Set limits, whitelists, and approval rules.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">One-Click Claim</h3>
              <p className="text-gray-600 leading-relaxed">
                Recipients claim instantly with their identity. No crypto knowledge needed—wallet created automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 sm:py-28">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Built For
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card text-center py-8">
            <div className="text-4xl mb-4">🏛️</div>
            <h3 className="font-bold text-gray-900 mb-2">DAOs</h3>
            <p className="text-sm text-gray-600">Automate contributor payments</p>
          </div>

          <div className="card text-center py-8">
            <div className="text-4xl mb-4">🎮</div>
            <h3 className="font-bold text-gray-900 mb-2">Gaming</h3>
            <p className="text-sm text-gray-600">Distribute prizes to Discord/Twitter</p>
          </div>

          <div className="card text-center py-8">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="font-bold text-gray-900 mb-2">Payroll</h3>
            <p className="text-sm text-gray-600">Pay global contractors easily</p>
          </div>

          <div className="card text-center py-8">
            <div className="text-4xl mb-4">🛒</div>
            <h3 className="font-bold text-gray-900 mb-2">E-Commerce</h3>
            <p className="text-sm text-gray-600">Process refunds automatically</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-20 sm:py-28 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Send Crypto the Easy Way?
          </h2>
          <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto">
            Join the future of frictionless payments on Cronos
          </p>
          <button
            onClick={!authenticated ? login : () => navigate('/send')}
            className="bg-teal-500 hover:bg-teal-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
          >
            {authenticated ? 'Send Payment' : 'Get Started Free'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">ChainDrop</span>
              <span>·</span>
              <span>Built for Cronos Hackathon</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-gray-900 transition-colors">Docs</a>
              <a href="#" className="hover:text-gray-900 transition-colors">GitHub</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
