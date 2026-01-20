import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import Navigation from '../components/Navigation';
import ActivityFeed from '../components/ActivityFeed';

export default function HomePage() {
  const navigate = useNavigate();
  const { authenticated, login } = usePrivy();

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* ===== DRAMATIC HERO - VALUE FIRST, WALLET LATER ===== */}
      <div className="relative min-h-screen overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f172a] to-[#0a0a0f]" />
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#1de4c6]/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#3b82f6]/15 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />

        <Navigation dark />

        {/* Hero Content */}
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center space-y-8">
            {/* The breakthrough badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#1de4c6]/20 to-[#3b82f6]/20 border border-[#1de4c6]/30 animate-slide-up">
              <span className="w-2 h-2 bg-[#1de4c6] rounded-full animate-pulse" />
              <span className="text-[#1de4c6] text-sm font-medium">The recipient doesn't need a wallet yet</span>
            </div>

            {/* THE HEADLINE - Punchy, memorable */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight animate-slide-up" style={{ animationDelay: '100ms' }}>
              <span className="text-white">Pay first.</span>
              <br />
              <span className="bg-gradient-to-r from-[#1de4c6] via-[#00c9ad] to-[#3b82f6] bg-clip-text text-transparent">
                Onboard later.
              </span>
            </h1>

            {/* Value prop - crystal clear */}
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '200ms' }}>
              Send crypto to anyone's <span className="text-white font-semibold">email</span> or <span className="text-white font-semibold">Twitter</span>.
              <br className="hidden sm:block" />
              They claim when they're ready. No wallet required.
            </p>

            {/* THE ONE CTA */}
            <div className="pt-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
              <button
                onClick={() => authenticated ? navigate('/send') : login()}
                className="group relative inline-flex items-center gap-3 px-10 py-5 text-xl font-bold text-white rounded-2xl overflow-hidden transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #1de4c6 0%, #00a28e 50%, #028273 100%)',
                  boxShadow: '0 0 60px -15px rgba(29, 228, 198, 0.5)'
                }}
              >
                <span>{authenticated ? 'Send a Payment' : 'Try It Free'}</span>
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <p className="text-gray-500 text-sm mt-4">No credit card. No gas fees to start.</p>
            </div>
          </div>

          {/* ===== THE MAGIC VISUALIZED ===== */}
          <div className="mt-24 animate-slide-up" style={{ animationDelay: '400ms' }}>
            <div className="relative max-w-4xl mx-auto">
              {/* Flow diagram */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0">
                {/* Step 1: You send */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-2xl p-6 text-center h-full">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#1de4c6] to-[#00a28e] flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">You Send</h3>
                    <p className="text-gray-400 text-sm">Enter their email or @twitter. Funds go to a Ghost Vault.</p>
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      <span className="text-green-400 text-xs font-medium">Instant</span>
                    </div>
                  </div>
                  {/* Arrow */}
                  <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <svg className="w-4 h-4 text-[#1de4c6]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13.025 1l-2.847 2.828 6.176 6.176H0v3.992h16.354l-6.176 6.176L13.025 23 24 12z" />
                    </svg>
                  </div>
                </div>

                {/* Step 2: They get notified */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-2xl p-6 text-center h-full">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">They Get Notified</h3>
                    <p className="text-gray-400 text-sm">Email with claim link. No wallet, no app, no signup yet.</p>
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      <span className="text-blue-400 text-xs font-medium">Auto-sent</span>
                    </div>
                  </div>
                  {/* Arrow */}
                  <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <svg className="w-4 h-4 text-[#1de4c6]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13.025 1l-2.847 2.828 6.176 6.176H0v3.992h16.354l-6.176 6.176L13.025 23 24 12z" />
                    </svg>
                  </div>
                </div>

                {/* Step 3: They claim (whenever) */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-2xl p-6 text-center h-full">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#a855f7] to-[#7c3aed] flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">They Claim Anytime</h3>
                    <p className="text-gray-400 text-sm">One click. Wallet created automatically. Gas paid from the vault.</p>
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                      <span className="text-purple-400 text-xs font-medium">Self-funded</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* The breakthrough callout */}
              <div className="mt-8 text-center">
                <p className="text-gray-500 text-sm">
                  <span className="text-[#1de4c6] font-semibold">The magic:</span> The recipient's wallet address exists before they do.
                  <br />
                  It's waiting for them, funded and ready.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== GHOST VAULTS - THE TECHNOLOGY ===== */}
      <section className="py-24 bg-gradient-to-b from-[#0a0a0f] to-[#111119] border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Explanation */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                <span className="text-purple-400 text-xs font-semibold uppercase tracking-wider">How it works</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Ghost Vaults
              </h2>
              <p className="text-xl text-gray-400">
                Counterfactual smart accounts that <span className="text-white">exist before deployment</span>.
                The address is mathematically derived from the recipient's identity—no wallet creation needed upfront.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1de4c6]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-[#1de4c6]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Identity-locked</p>
                    <p className="text-gray-500 text-sm">Only the verified owner of that email/Twitter can claim</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1de4c6]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-[#1de4c6]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Self-funded claiming</p>
                    <p className="text-gray-500 text-sm">Gas fees paid from the vault itself—recipient needs nothing</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1de4c6]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-[#1de4c6]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Non-custodial</p>
                    <p className="text-gray-500 text-sm">We never hold keys. CREATE2 + ERC-4337 magic.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Right: Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-3xl p-8">
                {/* Code-like visual */}
                <div className="font-mono text-sm space-y-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="text-purple-400">const</span> recipient <span className="text-gray-600">=</span> <span className="text-[#1de4c6]">"alice@company.com"</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="text-purple-400">const</span> salt <span className="text-gray-600">=</span> keccak256(recipient)
                  </div>
                  <div className="h-px bg-white/10 my-4" />
                  <div className="text-gray-400 text-xs">// Address exists before Alice has a wallet</div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="text-purple-400">const</span> vaultAddress <span className="text-gray-600">=</span>
                  </div>
                  <div className="pl-4 text-[#1de4c6] break-all text-xs">
                    0x7f4d...c3a2
                    <span className="ml-2 text-green-400 animate-pulse">● live</span>
                  </div>
                  <div className="h-px bg-white/10 my-4" />
                  <div className="text-gray-400 text-xs">// Send funds now, Alice claims whenever</div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">await</span>
                    <span className="text-gray-500">vault.deposit(</span>
                    <span className="text-yellow-400">50 CRO</span>
                    <span className="text-gray-500">)</span>
                    <span className="text-green-400 ml-2">✓</span>
                  </div>
                </div>
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-[#1de4c6]/10 to-[#3b82f6]/10 rounded-3xl blur-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== AI NATURAL LANGUAGE PAYMENTS ===== */}
      <section className="py-24 bg-[#111119] border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Chat Demo */}
            <div className="relative order-2 lg:order-1">
              <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-3xl p-6 border border-white/10 shadow-2xl">
                {/* Chat Header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1de4c6] to-[#00a28e] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">AI Payment Assistant</h4>
                    <p className="text-gray-500 text-xs">Powered by Claude</p>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-[#1de4c6] to-[#00a28e] rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%]">
                      <p className="text-white text-sm">Send 10 CRO to alice@company.com for the design work</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                      <p className="text-gray-300 text-sm">Ready to send <span className="text-white font-semibold">10 CRO</span> to <span className="text-[#1de4c6]">alice@company.com</span> for "design work"</p>
                      <div className="flex gap-2 mt-3">
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium">Confirm</span>
                        <span className="px-3 py-1 bg-white/5 text-gray-400 rounded-lg text-xs">Cancel</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-[#1de4c6] to-[#00a28e] rounded-2xl rounded-tr-sm px-4 py-2">
                      <p className="text-white text-sm">yes</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                      <p className="text-green-400 text-sm">✅ <span className="font-semibold">Payment sent!</span> Alice will receive an email with a claim link.</p>
                    </div>
                  </div>
                </div>

                {/* Input */}
                <div className="mt-6 flex gap-2">
                  <div className="flex-1 bg-white/5 rounded-xl px-4 py-3 text-gray-500 text-sm">
                    Type a payment request...
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1de4c6] to-[#00a28e] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                </div>
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-[#1de4c6]/10 to-[#3b82f6]/10 rounded-3xl blur-2xl -z-10" />
            </div>

            {/* Right: Explanation */}
            <div className="space-y-6 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1de4c6]/10 border border-[#1de4c6]/20">
                <svg className="w-4 h-4 text-[#1de4c6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-[#1de4c6] text-xs font-semibold uppercase tracking-wider">AI-Powered</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Pay with plain English
              </h2>
              <p className="text-xl text-gray-400">
                Just describe your payment in natural language. Our AI understands intent, extracts details, and executes on <span className="text-white">Cronos blockchain</span>.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1de4c6]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-[#1de4c6]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">"Send 5 CRO to bob@email.com"</p>
                    <p className="text-gray-500 text-sm">AI extracts: recipient, amount, token</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1de4c6]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-[#1de4c6]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">"Pay @alice_twitter 20 for lunch"</p>
                    <p className="text-gray-500 text-sm">Works with Twitter handles too</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1de4c6]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-[#1de4c6]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Confirm and done</p>
                    <p className="text-gray-500 text-sm">One "yes" to execute on-chain</p>
                  </div>
                </li>
              </ul>

              {/* Tech badges */}
              <div className="pt-4 flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-400 text-xs font-medium">Anthropic Claude</span>
                <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-400 text-xs font-medium">Crypto.com SDK</span>
                <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-400 text-xs font-medium">Cronos EVM</span>
              </div>

              <button
                onClick={() => authenticated ? navigate('/agents') : login()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#1de4c6] to-[#00a28e] hover:opacity-90 rounded-xl text-white font-semibold transition-all"
              >
                <span>Try AI Payments</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== AI AGENTS - AUTOMATION ===== */}
      <section className="py-24 bg-[#111119]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1de4c6]/10 border border-[#1de4c6]/20 mb-4">
              <svg className="w-4 h-4 text-[#1de4c6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className="text-[#1de4c6] text-xs font-semibold uppercase tracking-wider">Automation</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              AI Agents for Bulk Payments
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Create an agent with spending policies. It pays people automatically via API—perfect for payroll, rewards, or refunds.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 hover:border-[#1de4c6]/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1de4c6]/20 to-[#1de4c6]/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#1de4c6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Spending Limits</h3>
              <p className="text-gray-400 text-sm">Set daily/monthly caps. Agent stops automatically when limit reached.</p>
            </div>

            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 hover:border-[#1de4c6]/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3b82f6]/20 to-[#3b82f6]/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Whitelists</h3>
              <p className="text-gray-400 text-sm">Only pay approved recipients. Pattern matching like *@company.com.</p>
            </div>

            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 hover:border-[#1de4c6]/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#a855f7]/20 to-[#a855f7]/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#a855f7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">API Keys</h3>
              <p className="text-gray-400 text-sm">Secure keys for your scripts. Revoke anytime. Full audit trail.</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => authenticated ? navigate('/agents') : login()}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#1de4c6]/30 rounded-xl text-white font-semibold transition-all"
            >
              <svg className="w-5 h-5 text-[#1de4c6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span>{authenticated ? 'Create an AI Agent' : 'Get Started'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ===== USE CASES ===== */}
      <section className="py-24 bg-gradient-to-b from-[#111119] to-[#0a0a0f]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Who's this for?
            </h2>
            <p className="text-xl text-gray-400">
              Anyone paying people who might not have wallets yet
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'DAOs', desc: 'Pay contributors by email', color: 'from-purple-500 to-purple-600', tag: 'Popular' },
              { title: 'Gaming', desc: 'Prize payouts to Discord/Twitter', color: 'from-pink-500 to-pink-600', tag: 'Fast' },
              { title: 'Payroll', desc: 'Global contractor payments', color: 'from-blue-500 to-blue-600', tag: 'Bulk' },
              { title: 'Refunds', desc: 'Automated customer refunds', color: 'from-amber-500 to-amber-600', tag: 'API' },
            ].map((item, i) => (
              <div key={i} className="group bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <span className="text-white text-lg font-bold">{item.title[0]}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                <p className="text-gray-500 text-sm mb-3">{item.desc}</p>
                <span className="text-xs text-gray-600 font-medium">{item.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LIVE ACTIVITY FEED ===== */}
      <section className="py-24 bg-gradient-to-b from-[#0a0a0f] to-[#111119] border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">Live</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Recent Activity
            </h2>
            <p className="text-xl text-gray-400">
              Real payments happening on ChainDrop right now
            </p>
          </div>

          <ActivityFeed />
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-24 bg-[#0a0a0f] border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to pay someone who doesn't have a wallet?
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            It takes 30 seconds. They'll get an email. You'll feel like magic.
          </p>
          <button
            onClick={() => authenticated ? navigate('/send') : login()}
            className="inline-flex items-center gap-3 px-12 py-5 text-xl font-bold text-white rounded-2xl transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #1de4c6 0%, #00a28e 100%)',
              boxShadow: '0 0 80px -20px rgba(29, 228, 198, 0.6)'
            }}
          >
            <span>{authenticated ? 'Send Your First Payment' : 'Get Started Free'}</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <p className="text-gray-600 text-sm mt-6">
            Built for Cronos x402 Hackathon • Agentic Finance
          </p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#0a0a0f] border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1de4c6] to-[#00a28e] flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-semibold text-white">ChainDrop</span>
              <span className="text-gray-600">|</span>
              <span>Value first, wallet later</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
              <a href="#" className="hover:text-white transition-colors">Docs</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
