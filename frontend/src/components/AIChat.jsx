import { useState, useRef, useEffect } from 'react';
import { useWallets, usePrivy } from '@privy-io/react-auth';

const API_URL = import.meta.env.VITE_API_URL;

export default function AIChat({ onPaymentComplete }) {
  const { wallets } = useWallets();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI payment assistant. Tell me who you want to pay and how much. Try: \"Send 5 CRO to alice@company.com\"",
      type: 'greeting'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Check if this is a confirmation
      if (pendingPayment && (userMessage.toLowerCase() === 'yes' || userMessage.toLowerCase() === 'confirm')) {
        await executePayment(pendingPayment);
        return;
      }

      if (pendingPayment && (userMessage.toLowerCase() === 'no' || userMessage.toLowerCase() === 'cancel')) {
        setPendingPayment(null);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Payment cancelled. What else can I help you with?',
          type: 'info'
        }]);
        setLoading(false);
        return;
      }

      // Parse the payment intent
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
          senderAddress: wallets[0]?.address
        })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage = {
          role: 'assistant',
          content: data.response.content,
          type: data.response.type,
          parsed: data.response.parsed
        };

        setMessages(prev => [...prev, assistantMessage]);

        // If we can execute, ask for confirmation
        if (data.canExecute && data.response.parsed) {
          setPendingPayment(data.response.parsed);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Ready to send **${data.response.parsed.amount} ${data.response.parsed.token || 'CRO'}** to **${data.response.parsed.recipient}**. Type "yes" to confirm or "no" to cancel.`,
            type: 'confirmation',
            parsed: data.response.parsed
          }]);
        }
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.error || 'Sorry, something went wrong. Please try again.',
          type: 'error'
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Network error. Please check your connection and try again.',
        type: 'error'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const executePayment = async (payment) => {
    try {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⏳ Processing payment...',
        type: 'processing'
      }]);

      const response = await fetch(`${API_URL}/ai/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Send ${payment.amount} ${payment.token || 'CRO'} to ${payment.recipient}`,
          senderAddress: wallets[0]?.address,
          autoExecute: true
        })
      });

      const data = await response.json();

      if (data.success && data.executed) {
        setPendingPayment(null);

        // Remove the processing message
        setMessages(prev => prev.filter(m => m.type !== 'processing'));

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ **Payment sent!** ${payment.amount} ${payment.token || 'CRO'} to ${payment.recipient}.\n\nThey'll receive an email with a claim link.`,
          type: 'success',
          payment: data.payment
        }]);

        if (onPaymentComplete) {
          onPaymentComplete(data.payment);
        }
      } else {
        setMessages(prev => prev.filter(m => m.type !== 'processing'));
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ Payment failed: ${data.error || data.message || 'Unknown error'}`,
          type: 'error'
        }]);
      }
    } catch (error) {
      setMessages(prev => prev.filter(m => m.type !== 'processing'));
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Payment failed: ${error.message}`,
        type: 'error'
      }]);
    } finally {
      setLoading(false);
      setPendingPayment(null);
    }
  };

  const quickActions = [
    { text: 'Send 1 CRO to...', prompt: 'Send 1 CRO to ' },
    { text: 'Pay my team', prompt: 'I want to pay multiple people' },
    { text: 'Help', prompt: 'What can you help me with?' }
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#0f172a] to-[#1e293b]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1de4c6] to-[#00a28e] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Payment Assistant</h3>
            <p className="text-xs text-gray-400">Send crypto with natural language</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-[#1de4c6] to-[#00a28e] text-white'
                  : msg.type === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : msg.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : msg.type === 'confirmation'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">
                {msg.content.split('**').map((part, i) =>
                  i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                )}
              </p>

              {/* Payment preview */}
              {msg.type === 'confirmation' && msg.parsed && (
                <div className="mt-3 pt-3 border-t border-amber-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-amber-700">Amount:</span>
                    <span className="font-bold">{msg.parsed.amount} {msg.parsed.token || 'CRO'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-amber-700">To:</span>
                    <span className="font-mono text-xs">{msg.parsed.recipient}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        setInput('yes');
                        setTimeout(() => inputRef.current?.form?.requestSubmit(), 0);
                      }}
                      className="flex-1 px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => {
                        setInput('no');
                        setTimeout(() => inputRef.current?.form?.requestSubmit(), 0);
                      }}
                      className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Success details */}
              {msg.type === 'success' && msg.payment && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <a
                    href={`/claim/${msg.payment.claimToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 hover:underline flex items-center gap-1"
                  >
                    View claim link
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
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
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => setInput(action.prompt)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-700 transition-colors"
              >
                {action.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={pendingPayment ? 'Type "yes" to confirm...' : 'Type a payment request...'}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1de4c6] focus:ring-2 focus:ring-[#1de4c6]/20 outline-none transition-all text-sm"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3 rounded-xl font-medium text-white transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            style={{
              background: 'linear-gradient(135deg, #1de4c6 0%, #00a28e 100%)'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
