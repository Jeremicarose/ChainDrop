import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import Navigation from '../components/Navigation';

export default function HomePage() {
  const navigate = useNavigate();
  const { authenticated, login } = usePrivy();

  return (
    <div className="min-h-screen">
      {/* ===== DRAMATIC DARK HERO ===== */}
      <div className="hero-dark min-h-[90vh] flex flex-col">
        <div className="hero-grid" />

        {/* Floating orbs */}
        <div className="orb orb-teal w-96 h-96 top-20 -left-48 opacity-30" />
        <div className="orb orb-blue w-80 h-80 top-40 right-0 opacity-20" style={{ animationDelay: '5s' }} />
        <div className="orb orb-purple w-64 h-64 bottom-20 left-1/3 opacity-20" style={{ animationDelay: '10s' }} />

        <Navigation dark />

        <div className="relative flex-1 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left: Headline & CTA */}
              <div className="space-y-8">
                {/* AI Badge - Hero Element */}
                <div className="animate-slide-up">
                  <span className="ai-badge-dark">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    AI-Powered Payments
                  </span>
                </div>

                {/* CLEAR HEADLINE - No cutoff */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight animate-slide-up" style={{ animationDelay: '100ms' }}>
                  <span className="text-white">Send crypto to</span>
                  <br />
                  <span className="bg-gradient-to-r from-[#1de4c6] via-[#00c9ad] to-[#3b82f6] bg-clip-text text-transparent">
                    anyone, anywhere
                  </span>
                </h1>

                {/* SCANNABLE subtitle - not a wall of text */}
                <p className="text-xl text-gray-400 max-w-lg animate-slide-up" style={{ animationDelay: '200ms' }}>
                  No wallet addresses. No seed phrases. Just send to their{' '}
                  <span className="text-white font-medium">email</span>,{' '}
                  <span className="text-white font-medium">Twitter</span>, or{' '}
                  <span className="text-white font-medium">phone</span>.
                </p>

                {/* ONE DOMINANT CTA */}
                <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
                  {!authenticated ? (
                    <button onClick={login} className="btn-hero">
                      Start Sending Free
                      <svg className="inline-block w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  ) : (
                    <button onClick={() => navigate('/send')} className="btn-hero">
                      Send Payment
                      <svg className="inline-block w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => document.getElementById('ai-section').scrollIntoView({ behavior: 'smooth' })}
                    className="btn-dark"
                  >
                    See AI in Action
                  </button>
                </div>

                {/* Trust indicators - compact */}
                <div className="flex flex-wrap gap-4 pt-4 animate-slide-up" style={{ animationDelay: '400ms' }}>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Non-custodial</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Self-funded claiming</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Built on Cronos</span>
                  </div>
                </div>
              </div>

              {/* Right: Live Demo Preview */}
              <div className="hidden lg:block animate-slide-up" style={{ animationDelay: '300ms' }}>
                <div className="card-glass p-6 space-y-4">
                  {/* Simulated AI conversation */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1de4c6] to-[#3b82f6] flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-3 text-white text-sm">
                      Send 50 CRO to alice@company.com
                    </div>
                  </div>

                  <div className="flex items-start gap-3 justify-end">
                    <div className="bg-[#1de4c6]/20 rounded-2xl rounded-tr-sm px-4 py-3 text-[#1de4c6] text-sm max-w-[280px]">
                      <p className="font-medium mb-2">Processing payment...</p>
                      <div className="space-y-1 text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                          <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Ghost vault created</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>50 CRO deposited</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Email sent to alice</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                      You
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-gray-400">Live on Cronos Testnet</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="pb-8 text-center animate-bounce-subtle">
          <button
            onClick={() => document.getElementById('ai-section').scrollIntoView({ behavior: 'smooth' })}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      </div>

      {/* ===== AI AGENTS - HERO FEATURE ===== */}
      <section id="ai-section" className="py-24 bg-gradient-to-b from-[#0a0a0f] to-[#111119]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center mb-16">
            <span className="ai-badge-dark mb-4 inline-flex">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              Featured
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Meet Your AI Payment Agent
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Automate payroll, rewards, and refunds with policy-based AI that works 24/7
            </p>
          </div>

          {/* AI Agent Demo Card - THE HERO */}
          <div className="card-hero max-w-4xl mx-auto mb-12">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left: What it does */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="icon-ai">
                    <svg className="w-6 h-6 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">AI Payment Agent</h3>
                    <span className="badge badge-success text-xs">NEW</span>
                  </div>
                </div>

                <p className="text-gray-400">
                  Create an AI agent with spending rules. It handles payments automatically while you focus on what matters.
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#1de4c6] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-white font-medium">Daily spending limits</p>
                      <p className="text-sm text-gray-500">Set max CRO per day</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#1de4c6] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-white font-medium">Recipient whitelists</p>
                      <p className="text-sm text-gray-500">Only pay approved addresses</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#1de4c6] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-white font-medium">Approval thresholds</p>
                      <p className="text-sm text-gray-500">Large payments need your OK</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => authenticated ? navigate('/agents') : login()}
                  className="btn-hero w-full sm:w-auto"
                >
                  {authenticated ? 'Create Your Agent' : 'Get Started'}
                  <svg className="inline-block w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>

              {/* Right: Code/API preview */}
              <div className="bg-black/50 rounded-xl p-5 font-mono text-sm overflow-hidden">
                <div className="flex items-center gap-2 mb-4 text-gray-500">
                  <span className="w-3 h-3 rounded-full bg-red-500/50" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <span className="w-3 h-3 rounded-full bg-green-500/50" />
                  <span className="ml-2 text-xs">agent-api.js</span>
                </div>
                <pre className="text-gray-400 overflow-x-auto">
                  <code>{`// One API call to pay anyone
fetch('/api/agent/pay', {
  headers: {
    'X-API-Key': 'your_agent_key'
  },
  body: JSON.stringify({
    recipient: 'alice@company.com',
    amount: '50',
    token: 'CRO'
  })
})

// Response
{
  "success": true,
  "claimLink": "chaindrop.app/claim/...",
  "recipientNotified": true
}`}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Secondary features grid */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Ghost Vaults */}
            <div className="card-glass group">
              <div className="flex items-start gap-4">
                <div className="icon-ghost flex-shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <path d="M9 9h.01M15 9h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Ghost Vaults</h3>
                  <p className="text-gray-400 text-sm mb-3">
                    Counterfactual addresses that exist before deployment. Send to anyone - they claim when ready.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 rounded bg-white/5 border border-white/10">CREATE2</span>
                    <span className="px-2 py-1 rounded bg-white/5 border border-white/10">ERC-4337</span>
                  </div>
                </div>
              </div>
            </div>

            {/* One-Click Claim */}
            <div className="card-glass group">
              <div className="flex items-start gap-4">
                <div className="icon-bolt flex-shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">One-Click Claim</h3>
                  <p className="text-gray-400 text-sm mb-3">
                    Recipients need zero crypto to start. Gas is paid from the vault itself - self-funded claiming.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 rounded bg-white/5 border border-white/10">Gasless UX</span>
                    <span className="px-2 py-1 rounded bg-white/5 border border-white/10">Atomic</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== USE CASES - with urgency ===== */}
      <section className="py-24 gradient-mesh">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Built for Real Use Cases
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From DAOs to e-commerce, ChainDrop powers payments that just work
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* DAO Treasuries */}
            <div className="card group ai-glow">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">DAO Treasuries</h3>
              <p className="text-gray-600 text-sm mb-4">
                Automate contributor payments with AI agents. Set limits, get approvals, pay globally.
              </p>
              <span className="text-xs text-purple-600 font-medium">Popular with DAOs</span>
            </div>

            {/* Gaming Platforms */}
            <div className="card group ai-glow">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <path d="M6 12h4M8 10v4M15 11h.01M18 11h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Gaming Platforms</h3>
              <p className="text-gray-600 text-sm mb-4">
                Distribute prizes to Discord handles or Twitter usernames. No wallet setup needed.
              </p>
              <span className="text-xs text-pink-600 font-medium">Instant payouts</span>
            </div>

            {/* Payroll Systems */}
            <div className="card group ai-glow">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" />
                  <path d="M1 10h22" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Global Payroll</h3>
              <p className="text-gray-600 text-sm mb-4">
                Pay contractors worldwide with one API call. They claim with email verification.
              </p>
              <span className="text-xs text-blue-600 font-medium">CSV bulk upload</span>
            </div>

            {/* E-Commerce */}
            <div className="card group ai-glow">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">E-Commerce</h3>
              <p className="text-gray-600 text-sm mb-4">
                Process refunds automatically with AI policies. Customer gets notified instantly.
              </p>
              <span className="text-xs text-amber-600 font-medium">API-ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-24 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to simplify crypto payments?
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join the hackathon demo and see AI-powered payments in action on Cronos Testnet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => authenticated ? navigate('/send') : login()}
              className="btn-hero"
            >
              {authenticated ? 'Send Your First Payment' : 'Get Started Free'}
              <svg className="inline-block w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            {authenticated && (
              <button onClick={() => navigate('/agents')} className="btn-dark">
                Create AI Agent
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-6">
            Built for the Cronos Hackathon 2026
          </p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">ChainDrop</span>
              <span className="text-gray-600">|</span>
              <span>AI-Powered Crypto Payments</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                GitHub
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Documentation
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
