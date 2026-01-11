import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import Navigation from '../components/Navigation';

export default function HomePage() {
  const navigate = useNavigate();
  const { authenticated, login } = usePrivy();

  return (
    <div className="min-h-screen gradient-mesh relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cronos-400/20 to-blue-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-cronos-300/10 to-blue-300/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <Navigation />

      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="text-center space-y-10 animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-6 py-3 rounded-full text-sm font-semibold backdrop-blur-lg bg-white/80 border border-cronos-200/50 shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <span className="text-2xl animate-float">🤖</span>
            <span className="bg-gradient-to-r from-cronos-700 to-blue-600 bg-clip-text text-transparent font-bold">Powered by AI Agents</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              Send Crypto to
            </span>
            <br />
            <span className="bg-gradient-to-r from-cronos-600 to-cronos-500 bg-clip-text text-transparent">
              Email, Twitter or Phone
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            No wallet addresses. No complex setup. Just send crypto to anyone using their email, Twitter handle, or phone number.
          </p>

          {/* CTA Buttons - ONE DOMINANT ACTION */}
          <div className="flex flex-col items-center justify-center gap-4 pt-4">
            {!authenticated ? (
              <>
                {/* PRIMARY: Massive, can't miss */}
                <button onClick={login} className="btn-primary text-2xl px-16 py-6 shadow-2xl">
                  Get Started Free →
                </button>
                {/* SECONDARY: Subtle, demoted */}
                <button
                  onClick={() => navigate('/agents')}
                  className="text-gray-600 hover:text-cronos-600 font-medium text-sm transition-colors"
                >
                  Learn about AI Agents
                </button>
              </>
            ) : (
              <>
                {/* PRIMARY: Massive send action */}
                <button
                  onClick={() => navigate('/send')}
                  className="btn-primary text-2xl px-16 py-6 shadow-2xl"
                >
                  Send Payment Now →
                </button>
                {/* SECONDARY: Small text links */}
                <div className="flex gap-6 text-sm">
                  <button
                    onClick={() => navigate('/wallet')}
                    className="text-gray-600 hover:text-cronos-600 font-medium transition-colors"
                  >
                    View Wallet
                  </button>
                  <button
                    onClick={() => navigate('/agents')}
                    className="text-gray-600 hover:text-cronos-600 font-medium transition-colors"
                  >
                    AI Agents
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-8 pt-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-cronos-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Built on Cronos</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-cronos-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>AI-Native Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-cronos-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No Wallet Required</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1: Ghost Vaults */}
          <div className="card group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="text-3xl">👻</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Ghost Vaults</h3>
            <p className="text-gray-600 leading-relaxed">
              Send to emails, Twitter handles, or phone numbers. We create a secure vault that only the recipient can claim.
            </p>
            <div className="mt-6 flex items-center text-cronos-600 font-semibold group-hover:translate-x-2 transition-transform">
              <span>Learn more</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Feature 2: AI Agents */}
          <div className="card group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 border-cronos-200">
            <div className="w-14 h-14 bg-gradient-to-br from-cronos-500 to-cronos-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="text-3xl">🤖</span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-2xl font-bold text-gray-900">AI Agents</h3>
              <span className="badge badge-info">NEW</span>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              Let AI automate your payments with policy-based spending limits, whitelists, and approval thresholds.
            </p>
            <div className="bg-cronos-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-4 h-4 text-cronos-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Automated payroll</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-4 h-4 text-cronos-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Spending policies</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-4 h-4 text-cronos-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Secure API keys</span>
              </div>
            </div>
            <div className="mt-6 flex items-center text-cronos-600 font-semibold group-hover:translate-x-2 transition-transform cursor-pointer" onClick={() => navigate('/agents')}>
              <span>Create AI Agent</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Feature 3: One-Click Claim */}
          <div className="card group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="text-3xl">⚡</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">One-Click Claim</h3>
            <p className="text-gray-600 leading-relaxed">
              Recipients claim their funds instantly with email, Twitter, or phone login. We create their wallet automatically.
            </p>
            <div className="mt-6 flex items-center text-cronos-600 font-semibold group-hover:translate-x-2 transition-transform">
              <span>See how it works</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="bg-gradient-to-br from-cronos-600 to-cronos-700 text-black py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Perfect For</h2>
            <p className="text-xl text-cronos-100">
              From individuals to enterprises, ChainDrop makes crypto payments simple
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/15 transition-all">
              <div className="text-4xl mb-4">💼</div>
              <h3 className="text-xl font-bold mb-2">DAO Treasuries</h3>
              <p className="text-cronos-100">Automate contributor payments with AI agents</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/15 transition-all">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-xl font-bold mb-2">Gaming Platforms</h3>
              <p className="text-cronos-100">Distribute prizes to Discord/Twitter handles</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/15 transition-all">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold mb-2">Payroll Systems</h3>
              <p className="text-cronos-100">Pay global contractors without wallet hassles</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/15 transition-all">
              <div className="text-4xl mb-4">🛒</div>
              <h3 className="text-xl font-bold mb-2">E-Commerce</h3>
              <p className="text-cronos-100">Process refunds automatically with AI</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="card text-center">
          <h2 className="text-4xl font-bold mb-6 text-gray-900">
            Ready to Send Crypto the Easy Way?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join the future of AI-native payments on Cronos
          </p>
          <button onClick={!authenticated ? login : () => navigate('/send')} className="btn-primary text-lg px-10 py-4">
            {!authenticated ? 'Get Started Free' : 'Send Your First Payment'} →
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-600 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">ChainDrop</span>
              <span>·</span>
              <span>Built for Cronos Hackathon</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-cronos-600 transition-colors">Documentation</a>
              <a href="#" className="hover:text-cronos-600 transition-colors">GitHub</a>
              <a href="#" className="hover:text-cronos-600 transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
