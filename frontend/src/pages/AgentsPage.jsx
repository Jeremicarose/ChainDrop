import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import Navigation from '../components/Navigation';
import AIChat from '../components/AIChat';

const API_URL = import.meta.env.VITE_API_URL;

export default function AgentsPage() {
  const { authenticated, login, ready } = usePrivy();
  const { wallets } = useWallets();
  const [agents, setAgents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'agents', or 'scheduled'
  const [recentPayments, setRecentPayments] = useState([]);
  const [scheduledPayments, setScheduledPayments] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  // ONLY use Privy embedded wallet - ignore external wallets like Rabby
  const privyEmbeddedWallet = wallets?.find(w => w.walletClientType === 'privy');
  const walletAddress = privyEmbeddedWallet?.address || null;

  const [formData, setFormData] = useState({
    name: '',
    dailyLimit: '100',
    allowedRecipients: '',
    requireApproval: '50',
    allowedTokens: 'CRO'
  });

  const [scheduleForm, setScheduleForm] = useState({
    agentKeyId: '',
    name: '',
    recipientIdentifier: '',
    recipientType: 'email',
    amount: '',
    scheduleType: 'weekly',
    frequency: '',
    startDate: '',
    endDate: '',
    maxExecutions: ''
  });

  // Fetch agents
  useEffect(() => {
    if (authenticated && walletAddress) {
      fetchAgents();
      fetchScheduledPayments();
    }
  }, [authenticated, walletAddress]);

  const fetchAgents = async () => {
    if (!walletAddress) return;
    try {
      const response = await fetch(
        `${API_URL}/agent/list?ownerAddress=${walletAddress}`
      );
      if (response.ok) {
        const data = await response.json();
        setAgents(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchScheduledPayments = async () => {
    if (!walletAddress) return;
    try {
      const response = await fetch(
        `${API_URL}/agent/schedule/list?ownerAddress=${walletAddress}`
      );
      if (response.ok) {
        const data = await response.json();
        setScheduledPayments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching scheduled payments:', error);
    }
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    if (!walletAddress) {
      alert('Wallet not ready. Please wait a moment and try again.');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/agent/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerAddress: walletAddress,
          name: formData.name,
          policies: {
            dailyLimit: formData.dailyLimit,
            allowedRecipients: formData.allowedRecipients,
            requireApproval: formData.requireApproval,
            allowedTokens: formData.allowedTokens
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateModal(false);
        fetchAgents();
        setFormData({
          name: '',
          dailyLimit: '100',
          allowedRecipients: '',
          requireApproval: '50',
          allowedTokens: 'CRO'
        });
      }
    } catch (error) {
      console.error('Error creating agent:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScheduledPayment = async (e) => {
    e.preventDefault();
    if (!walletAddress) {
      alert('Wallet not ready. Please wait a moment and try again.');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/agent/schedule/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentKeyId: scheduleForm.agentKeyId,
          ownerAddress: walletAddress,
          name: scheduleForm.name,
          recipientIdentifier: scheduleForm.recipientIdentifier,
          recipientType: scheduleForm.recipientType,
          amount: scheduleForm.amount,
          scheduleType: scheduleForm.scheduleType,
          frequency: scheduleForm.frequency || null,
          startDate: scheduleForm.startDate ? new Date(scheduleForm.startDate).getTime() : null,
          endDate: scheduleForm.endDate ? new Date(scheduleForm.endDate).getTime() : null,
          maxExecutions: scheduleForm.maxExecutions ? parseInt(scheduleForm.maxExecutions) : null
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowScheduleModal(false);
        fetchScheduledPayments();
        setScheduleForm({
          agentKeyId: '',
          name: '',
          recipientIdentifier: '',
          recipientType: 'email',
          amount: '',
          scheduleType: 'weekly',
          frequency: '',
          startDate: '',
          endDate: '',
          maxExecutions: ''
        });
      } else {
        alert(data.error || 'Failed to create scheduled payment');
      }
    } catch (error) {
      console.error('Error creating scheduled payment:', error);
      alert('Failed to create scheduled payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseScheduledPayment = async (id) => {
    if (!walletAddress) return;
    try {
      const response = await fetch(`${API_URL}/agent/schedule/${id}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerAddress: walletAddress })
      });
      if (response.ok) {
        fetchScheduledPayments();
      }
    } catch (error) {
      console.error('Error pausing scheduled payment:', error);
    }
  };

  const handleResumeScheduledPayment = async (id) => {
    if (!walletAddress) return;
    try {
      const response = await fetch(`${API_URL}/agent/schedule/${id}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerAddress: walletAddress })
      });
      if (response.ok) {
        fetchScheduledPayments();
      }
    } catch (error) {
      console.error('Error resuming scheduled payment:', error);
    }
  };

  const handleCancelScheduledPayment = async (id) => {
    if (!walletAddress) return;
    if (!confirm('Are you sure you want to cancel this scheduled payment?')) return;

    try {
      const response = await fetch(`${API_URL}/agent/schedule/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerAddress: walletAddress })
      });
      if (response.ok) {
        fetchScheduledPayments();
      }
    } catch (error) {
      console.error('Error cancelling scheduled payment:', error);
    }
  };

  const handlePaymentComplete = (payment) => {
    setRecentPayments(prev => [payment, ...prev].slice(0, 5));
  };

  const getScheduleTypeLabel = (type) => {
    const labels = {
      once: 'One-time',
      daily: 'Daily',
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      monthly: 'Monthly',
      custom: 'Custom'
    };
    return labels[type] || type;
  };

  const formatNextRun = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = date - now;

    if (diff < 0) return 'Overdue';
    if (diff < 60000) return 'Less than a minute';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours`;
    return date.toLocaleDateString();
  };

  // Loading state
  if (!ready) {
    return (
      <div className="min-h-screen bg-[#fafbfc]">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[#1de4c6] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated state
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#fafbfc]">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* AI Icon */}
            <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1de4c6]/20 to-transparent" />
              <svg className="w-12 h-12 text-[#1de4c6] relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Clash Display', sans-serif" }}>
              AI-Powered Payments
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto">
              Send crypto using natural language. Just describe who you want to pay and how much.
            </p>

            <div className="bg-gray-900 rounded-2xl p-6 max-w-md mx-auto mb-8 text-left">
              <p className="text-gray-400 text-sm mb-2">Try saying:</p>
              <p className="text-white font-mono">"Send 5 CRO to alice@company.com"</p>
            </div>

            <button
              onClick={login}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-white text-lg transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #1de4c6 0%, #00a28e 100%)',
                boxShadow: '0 8px 30px -5px rgba(29, 228, 198, 0.5)'
              }}
            >
              <span>Sign In to Start</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Clash Display', sans-serif" }}>
            AI Agents
          </h1>
          <p className="text-gray-600 mt-1">
            Natural language payments powered by AI
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              AI Chat
            </span>
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'agents'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              API Agents
              {agents.length > 0 && (
                <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">{agents.length}</span>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'scheduled'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Scheduled
              {scheduledPayments.filter(p => p.status === 'active').length > 0 && (
                <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">
                  {scheduledPayments.filter(p => p.status === 'active').length}
                </span>
              )}
            </span>
          </button>
        </div>

        {/* AI Chat Tab */}
        {activeTab === 'chat' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Chat */}
            <div className="lg:col-span-2">
              <AIChat onPaymentComplete={handlePaymentComplete} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* How It Works */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#1de4c6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  How It Works
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#1de4c6]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-[#00a28e]">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Describe your payment</p>
                      <p className="text-xs text-gray-500">"Send 5 CRO to alice@example.com"</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#1de4c6]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-[#00a28e]">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">AI extracts details</p>
                      <p className="text-xs text-gray-500">Recipient, amount, token detected</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#1de4c6]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-[#00a28e]">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Confirm & send</p>
                      <p className="text-xs text-gray-500">Recipient gets email with claim link</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Example Prompts */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#1de4c6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Try These
                </h3>
                <div className="space-y-2">
                  <div className="bg-white/10 rounded-lg px-3 py-2 text-sm font-mono">
                    "Pay @alice 10 CRO for lunch"
                  </div>
                  <div className="bg-white/10 rounded-lg px-3 py-2 text-sm font-mono">
                    "Send 25 to bob@company.com"
                  </div>
                  <div className="bg-white/10 rounded-lg px-3 py-2 text-sm font-mono">
                    "Refund +1234567890"
                  </div>
                </div>
              </div>

              {/* Recent AI Payments */}
              {recentPayments.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Recent AI Payments</h3>
                  <div className="space-y-3">
                    {recentPayments.map((payment, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 truncate">{payment.recipientIdentifier}</span>
                        <span className="font-medium text-gray-900">{payment.amount} CRO</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* API Agents Tab */}
        {activeTab === 'agents' && (
          <div>
            {/* Create Agent Button */}
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 rounded-xl font-medium text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #1de4c6 0%, #00a28e 100%)' }}
              >
                + Create API Agent
              </button>
            </div>

            {agents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No API Agents Yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Create an API agent to automate payments from your scripts, bots, or applications.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 rounded-xl font-medium text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #1de4c6 0%, #00a28e 100%)' }}
                >
                  Create Your First Agent
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1de4c6] to-[#00a28e] flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            agent.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {agent.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Daily Limit</span>
                        <span className="font-medium">{agent.policy_config?.dailyLimit || '10'} CRO</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Created</span>
                        <span className="font-medium">{new Date(agent.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-xs text-gray-500 mb-1">API Key</p>
                        <code className="text-xs font-mono text-gray-700 break-all">{agent.api_key}</code>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(agent.api_key);
                            alert('API key copied!');
                          }}
                          className="flex-1 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 transition-colors"
                        >
                          Copy Key
                        </button>
                        <button
                          onClick={() => {
                            setScheduleForm({ ...scheduleForm, agentKeyId: agent.id });
                            setShowScheduleModal(true);
                          }}
                          className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                          style={{ background: 'linear-gradient(135deg, #1de4c6 0%, #00a28e 100%)' }}
                        >
                          Schedule Payment
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* API Documentation */}
            <div className="mt-8 bg-gray-900 rounded-2xl p-6 text-white">
              <h3 className="font-semibold mb-4">API Usage</h3>
              <pre className="bg-black/30 rounded-lg p-4 text-sm overflow-x-auto">
{`curl -X POST ${API_URL}/agent/pay \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipientIdentifier": "alice@example.com",
    "identifierType": "email",
    "amount": "1.5"
  }'`}
              </pre>
            </div>
          </div>
        )}

        {/* Scheduled Payments Tab */}
        {activeTab === 'scheduled' && (
          <div>
            {/* Create Scheduled Payment Button */}
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setShowScheduleModal(true)}
                disabled={agents.length === 0}
                className="px-5 py-2.5 rounded-xl font-medium text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #1de4c6 0%, #00a28e 100%)' }}
              >
                + Schedule Payment
              </button>
            </div>

            {agents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Create an Agent First</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  You need at least one API agent to schedule payments. Go to the API Agents tab to create one.
                </p>
                <button
                  onClick={() => setActiveTab('agents')}
                  className="px-6 py-3 rounded-xl font-medium text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #1de4c6 0%, #00a28e 100%)' }}
                >
                  Go to API Agents
                </button>
              </div>
            ) : scheduledPayments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Scheduled Payments</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Set up recurring payments to automate your transfers. Perfect for subscriptions, salaries, or regular payments.
                </p>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="px-6 py-3 rounded-xl font-medium text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #1de4c6 0%, #00a28e 100%)' }}
                >
                  Create Your First Schedule
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduledPayments.map((payment) => (
                  <div key={payment.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          payment.status === 'active'
                            ? 'bg-gradient-to-br from-[#1de4c6] to-[#00a28e]'
                            : payment.status === 'paused'
                            ? 'bg-yellow-100'
                            : 'bg-gray-100'
                        }`}>
                          <svg className={`w-6 h-6 ${
                            payment.status === 'active' ? 'text-white' : 'text-gray-500'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{payment.name}</h3>
                          <p className="text-sm text-gray-500">{payment.recipient_identifier}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{payment.amount} {payment.currency}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          payment.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : payment.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-700'
                            : payment.status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Schedule</p>
                        <p className="font-medium">{getScheduleTypeLabel(payment.schedule_type)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Next Run</p>
                        <p className="font-medium">{formatNextRun(payment.next_run_at)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Executions</p>
                        <p className="font-medium">
                          {payment.total_executions}
                          {payment.max_executions ? ` / ${payment.max_executions}` : ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Agent</p>
                        <p className="font-medium">{payment.agent_name || 'Unknown'}</p>
                      </div>
                    </div>

                    {payment.status !== 'cancelled' && payment.status !== 'completed' && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                        {payment.status === 'active' ? (
                          <button
                            onClick={() => handlePauseScheduledPayment(payment.id)}
                            className="px-4 py-2 rounded-lg bg-yellow-100 hover:bg-yellow-200 text-sm font-medium text-yellow-700 transition-colors"
                          >
                            Pause
                          </button>
                        ) : payment.status === 'paused' ? (
                          <button
                            onClick={() => handleResumeScheduledPayment(payment.id)}
                            className="px-4 py-2 rounded-lg bg-green-100 hover:bg-green-200 text-sm font-medium text-green-700 transition-colors"
                          >
                            Resume
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleCancelScheduledPayment(payment.id)}
                          className="px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-sm font-medium text-red-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Programmable Payments Info */}
            <div className="mt-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#1de4c6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Programmable Payments
              </h3>
              <p className="text-gray-300 mb-4">
                Automate your crypto payments with scheduled transfers. Perfect for:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="font-medium mb-1">Subscriptions</p>
                  <p className="text-sm text-gray-400">Monthly payments to service providers</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="font-medium mb-1">Payroll</p>
                  <p className="text-sm text-gray-400">Weekly or bi-weekly salary payments</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="font-medium mb-1">Allowances</p>
                  <p className="text-sm text-gray-400">Regular payments to family or teams</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Agent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                Create API Agent
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Payroll Bot"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1de4c6] focus:ring-2 focus:ring-[#1de4c6]/20 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Daily Limit (CRO)</label>
                <input
                  type="number"
                  value={formData.dailyLimit}
                  onChange={(e) => setFormData({ ...formData, dailyLimit: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1de4c6] focus:ring-2 focus:ring-[#1de4c6]/20 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Recipients</label>
                <input
                  type="text"
                  value={formData.allowedRecipients}
                  onChange={(e) => setFormData({ ...formData, allowedRecipients: e.target.value })}
                  placeholder="*@company.com, alice@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1de4c6] focus:ring-2 focus:ring-[#1de4c6]/20 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for all recipients, or use patterns like *@company.com</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #1de4c6 0%, #00a28e 100%)' }}
                >
                  {loading ? 'Creating...' : 'Create Agent'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 rounded-xl font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Scheduled Payment Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                Schedule Payment
              </h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateScheduledPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Agent</label>
                <select
                  value={scheduleForm.agentKeyId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, agentKeyId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1de4c6] focus:ring-2 focus:ring-[#1de4c6]/20 outline-none"
                  required
                >
                  <option value="">Select an agent</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Name</label>
                <input
                  type="text"
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                  placeholder="Monthly Subscription"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1de4c6] focus:ring-2 focus:ring-[#1de4c6]/20 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
                  <input
                    type="text"
                    value={scheduleForm.recipientIdentifier}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, recipientIdentifier: e.target.value })}
                    placeholder="alice@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1de4c6] focus:ring-2 focus:ring-[#1de4c6]/20 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={scheduleForm.recipientType}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, recipientType: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1de4c6] focus:ring-2 focus:ring-[#1de4c6]/20 outline-none"
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="social">Social</option>
                    <option value="address">Wallet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (CRO)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={scheduleForm.amount}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, amount: e.target.value })}
                  placeholder="10"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1de4c6] focus:ring-2 focus:ring-[#1de4c6]/20 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Type</label>
                <select
                  value={scheduleForm.scheduleType}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduleType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1de4c6] focus:ring-2 focus:ring-[#1de4c6]/20 outline-none"
                  required
                >
                  <option value="once">One-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom (specify hours)</option>
                </select>
              </div>

              {scheduleForm.scheduleType === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency (hours)</label>
                  <input
                    type="number"
                    min="1"
                    value={scheduleForm.frequency}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value })}
                    placeholder="24"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1de4c6] focus:ring-2 focus:ring-[#1de4c6]/20 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 1 hour between payments</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date (optional)</label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.startDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, startDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1de4c6] focus:ring-2 focus:ring-[#1de4c6]/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date (optional)</label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.endDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, endDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1de4c6] focus:ring-2 focus:ring-[#1de4c6]/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Executions (optional)</label>
                <input
                  type="number"
                  min="1"
                  value={scheduleForm.maxExecutions}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, maxExecutions: e.target.value })}
                  placeholder="Unlimited"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1de4c6] focus:ring-2 focus:ring-[#1de4c6]/20 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited, or set minimum 1</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #1de4c6 0%, #00a28e 100%)' }}
                >
                  {loading ? 'Creating...' : 'Create Schedule'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-6 py-3 rounded-xl font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
