import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import Navigation from '../components/Navigation';

const API_URL = import.meta.env.VITE_API_URL;

export default function AIChatPage() {
  const navigate = useNavigate();
  const { authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI payment assistant. Tell me who to pay and how much.\n\nTry: \"Send $5 to alice@company.com for lunch\""
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const messagesEndRef = useRef(null);

  // Get wallet address
  useEffect(() => {
    const getWallet = async () => {
      if (wallets?.length > 0) {
        setWalletAddress(wallets[0].address);
      } else if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts?.length > 0) setWalletAddress(accounts[0]);
      }
    };
    if (authenticated && ready) getWallet();
  }, [authenticated, ready, wallets]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content }]);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);
    setLoading(true);

    try {
      // Check for confirmation responses
      if (pendingPayment && (userMessage.toLowerCase() === 'yes' || userMessage.toLowerCase() === 'confirm')) {
        // Execute the payment
        addMessage('assistant', '⏳ Processing payment...');

        const executeRes = await fetch(`${API_URL}/ai/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: pendingPayment.originalMessage,
            walletAddress: walletAddress,
            autoExecute: true
          })
        });

        const executeData = await executeRes.json();

        if (executeData.success && executeData.executed) {
          addMessage('assistant', `✅ **Payment sent!** ${executeData.payment.amount} CRO to ${executeData.payment.recipientIdentifier}\n\nThey'll receive an email with a claim link.\n\n[View claim link](${executeData.payment.claimLink})`);
        } else {
          addMessage('assistant', `❌ Payment failed: ${executeData.error || 'Unknown error'}`);
        }
        setPendingPayment(null);
        setLoading(false);
        return;
      }

      if (pendingPayment && (userMessage.toLowerCase() === 'no' || userMessage.toLowerCase() === 'cancel')) {
        addMessage('assistant', '❌ Payment cancelled. What else can I help with?');
        setPendingPayment(null);
        setLoading(false);
        return;
      }

      // Parse the message with AI
      const parseRes = await fetch(`${API_URL}/ai/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      const parseData = await parseRes.json();

      if (!parseData.success) {
        addMessage('assistant', `I couldn't understand that. Try something like:\n- "Send $5 to alice@company.com"\n- "Pay @bob 10 CRO for coffee"\n- "Transfer $20 to john@gmail.com for lunch"`);
        setLoading(false);
        return;
      }

      const { amount, recipientIdentifier, amountUsd } = parseData.data;

      // Show confirmation
      const confirmMsg = `Ready to send **$${amountUsd?.toFixed(2) || '?'}** (${parseFloat(amount).toFixed(4)} CRO) to **${recipientIdentifier}**.\n\nType **"yes"** to confirm or **"no"** to cancel.`;

      addMessage('assistant', confirmMsg);
      setPendingPayment({
        originalMessage: userMessage,
        amount,
        recipientIdentifier,
        amountUsd
      });

    } catch (error) {
      console.error('AI Chat error:', error);
      addMessage('assistant', `❌ Error: ${error.message}`);
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick action buttons
  const quickActions = [
    "Send $5 to alice@company.com for lunch",
    "Pay @bob 10 CRO",
    "Transfer $20 to john@gmail.com"
  ];

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#fafbfc]">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">AI Payment Assistant</h1>
          <p className="text-gray-600 mb-8">Sign in to use natural language payments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      <Navigation />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">AI Payment Assistant</h1>
          <p className="text-gray-500">Send payments with natural language</p>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-[#1de4c6] text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm" dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="underline" target="_blank">$1</a>')
                  }} />
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 2 && !pendingPayment && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-400 mb-2">Try these:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(action)}
                    className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-100 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={pendingPayment ? 'Type "yes" to confirm...' : 'Send $5 to alice@company.com...'}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1de4c6] focus:ring-0 outline-none text-sm"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-6 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #1de4c6 0%, #00a28e 100%)' }}
              >
                {loading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>

        {/* Wallet Info */}
        <div className="mt-4 text-center text-xs text-gray-400">
          {walletAddress ? (
            <span>Sending from: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
          ) : (
            <span>No wallet connected</span>
          )}
        </div>
      </div>
    </div>
  );
}
