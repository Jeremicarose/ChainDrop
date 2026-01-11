import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';

const API_URL = import.meta.env.VITE_API_URL;

export default function AgentsPage() {
  const navigate = useNavigate();
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [createdAgent, setCreatedAgent] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAgent, setPaymentAgent] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    dailyLimit: '10',
    allowedRecipients: '*',
    requireApproval: '5',
    allowedTokens: 'CRO'
  });

  const [paymentData, setPaymentData] = useState({
    recipient: '',
    amount: ''
  });

  const [bulkPaymentMode, setBulkPaymentMode] = useState(false);
  const [bulkList, setBulkList] = useState('');
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, results: [] });

  // Fetch agents
  useEffect(() => {
    if (authenticated && wallets.length > 0) {
      fetchAgents();
    }
  }, [authenticated, wallets]);

  const fetchAgents = async () => {
    try {
      const response = await fetch(
        `${API_URL}/agent/list?ownerAddress=${wallets[0].address}`
      );
      if (response.ok) {
        const data = await response.json();
        setAgents(data.data);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/agent/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerAddress: wallets[0].address,
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
        setCreatedAgent(data.data);
        setShowCreateForm(false);
        fetchAgents();
        // Reset form
        setFormData({
          name: '',
          dailyLimit: '10',
          allowedRecipients: '*',
          requireApproval: '5',
          allowedTokens: 'CRO'
        });
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      alert('Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  const copyApiKey = (apiKey) => {
    navigator.clipboard.writeText(apiKey);
    alert('API Key copied to clipboard!');
  };

  const handleSendPayment = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    setPaymentResult(null);

    try {
      const response = await fetch(`${API_URL}/agent/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': paymentAgent.api_key
        },
        body: JSON.stringify({
          recipientIdentifier: paymentData.recipient,
          identifierType: 'email',
          amount: paymentData.amount
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPaymentResult({ success: true, data });
        setPaymentData({ recipient: '', amount: '' });
        alert(`✅ Payment sent successfully!\nAmount: ${paymentData.amount} CRO\nRecipient: ${paymentData.recipient}\nClaim link sent to their email!`);
        setShowPaymentForm(false);
      } else {
        setPaymentResult({ success: false, error: data.message || data.error });
        alert(`❌ Payment failed: ${data.message || data.error}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentResult({ success: false, error: error.message });
      alert(`❌ Payment failed: ${error.message}`);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDeleteAgent = async (agentId) => {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/agent/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          ownerAddress: wallets[0].address
        })
      });

      if (response.ok) {
        alert('✅ Agent deleted successfully!');
        fetchAgents(); // Refresh list
      } else {
        const error = await response.json();
        alert(`❌ Failed to delete: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(`❌ Failed to delete agent: ${error.message}`);
    }
  };

  const handleBulkPayment = async (e) => {
    e.preventDefault();

    // Parse the bulk list (CSV format: email,amount per line)
    const lines = bulkList.trim().split('\n').filter(line => line.trim());
    const payments = [];

    for (const line of lines) {
      const [email, amount] = line.split(',').map(s => s.trim());
      if (email && amount && email.includes('@')) {
        payments.push({ email, amount });
      }
    }

    if (payments.length === 0) {
      alert('❌ No valid payments found. Format: email@example.com,amount per line');
      return;
    }

    if (!confirm(`🤖 Agent will process ${payments.length} payments automatically.\n\nThis will:\n- Check all policy rules\n- Send payments one by one\n- Email each recipient\n\nContinue?`)) {
      return;
    }

    setPaymentLoading(true);
    setBulkProgress({ current: 0, total: payments.length, results: [] });

    const results = [];

    for (let i = 0; i < payments.length; i++) {
      const { email, amount } = payments[i];
      setBulkProgress({ current: i + 1, total: payments.length, results });

      try {
        const response = await fetch(`${API_URL}/agent/pay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': paymentAgent.api_key
          },
          body: JSON.stringify({
            recipientIdentifier: email,
            identifierType: 'email',
            amount: amount
          })
        });

        const data = await response.json();

        if (response.ok) {
          results.push({ email, amount, status: 'success', claimLink: data.data?.claimLink });
        } else {
          results.push({ email, amount, status: 'failed', error: data.message || data.error });
        }
      } catch (error) {
        results.push({ email, amount, status: 'failed', error: error.message });
      }

      // Small delay between payments
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setBulkProgress({ current: payments.length, total: payments.length, results });
    setPaymentLoading(false);

    const successful = results.filter(r => r.status === 'success').length;
    alert(`✅ Bulk payment complete!\n\n✓ Successful: ${successful}\n✗ Failed: ${results.length - successful}\n\nCheck the results below.`);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen gradient-mesh relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cronos-400/20 to-blue-400/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>

        <Navigation />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="card text-center animate-slide-up">
            <div className="text-6xl mb-6 animate-float">🤖</div>
            <h2 className="text-3xl font-bold mb-4">AI Agents</h2>
            <p className="text-xl text-gray-600 mb-8">
              Create AI agents that can automatically process payments with policy-based controls
            </p>
            <button onClick={login} className="btn-primary text-lg px-8 py-4">
              Sign In to Create Agent
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cronos-400/20 to-blue-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-cronos-300/10 to-blue-300/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <Navigation />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Agents</h1>
              <p className="text-lg text-gray-600">
                Automate payments with policy-based AI agents
              </p>
            </div>
            {import.meta.env.MODE === 'development' && (
              <button
                onClick={() => {
                  throw new Error('Sentry Test Error - This is intentional!');
                }}
                className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
              >
                🧪 Test Sentry
              </button>
            )}
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              + Create Agent
            </button>
          </div>
        </div>

        {/* New Agent Created Success */}
        {createdAgent && (
          <div className="mb-8 card bg-gradient-to-r from-green-50 to-cronos-50 border-2 border-green-200">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🎉</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Agent Created Successfully!
                </h3>
                <p className="text-gray-600 mb-4">
                  Your API key has been generated. Copy it now - you won't be able to see it again!
                </p>
                <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                  <div className="flex items-center justify-between">
                    <code className="text-sm text-gray-800 break-all">
                      {createdAgent.apiKey}
                    </code>
                    <button
                      onClick={() => copyApiKey(createdAgent.apiKey)}
                      className="ml-4 px-4 py-2 bg-cronos-500 text-white rounded-lg hover:bg-cronos-600 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setCreatedAgent(null)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Agent Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Create AI Agent</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateAgent} className="space-y-6">
                <div>
                  <label className="label">Agent Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Payroll Bot"
                    className="input-field"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">A friendly name for your agent</p>
                </div>

                <div>
                  <label className="label">Daily Spending Limit (CRO)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.dailyLimit}
                    onChange={(e) => setFormData({ ...formData, dailyLimit: e.target.value })}
                    placeholder="10"
                    className="input-field"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Maximum CRO the agent can spend per day</p>
                </div>

                <div>
                  <label className="label">Allowed Recipients</label>
                  <input
                    type="text"
                    value={formData.allowedRecipients}
                    onChange={(e) => setFormData({ ...formData, allowedRecipients: e.target.value })}
                    placeholder="*@company.com,@verified_users"
                    className="input-field"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Whitelist patterns (use * for all, or patterns like *@company.com)
                  </p>
                </div>

                <div>
                  <label className="label">Approval Threshold (CRO)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.requireApproval}
                    onChange={(e) => setFormData({ ...formData, requireApproval: e.target.value })}
                    placeholder="5"
                    className="input-field"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Amounts above this require manual approval
                  </p>
                </div>

                <div>
                  <label className="label">Allowed Tokens</label>
                  <input
                    type="text"
                    value={formData.allowedTokens}
                    onChange={(e) => setFormData({ ...formData, allowedTokens: e.target.value })}
                    placeholder="CRO"
                    className="input-field"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Comma-separated list of allowed tokens</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1"
                  >
                    {loading ? 'Creating...' : 'Create Agent'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Agents List */}
        {agents.length === 0 ? (
          <div className="card text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-2xl font-bold mb-2">No Agents Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first AI agent to start automating payments
            </p>
            <button onClick={() => setShowCreateForm(true)} className="btn-primary">
              Create Your First Agent
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <div key={agent.id} className="card hover:shadow-2xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-cronos-500 to-cronos-600 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{agent.name}</h3>
                      <span className={`badge ${agent.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                        {agent.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">
                      {new Date(agent.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {agent.last_used_at && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Last Used:</span>
                      <span className="font-medium">
                        {new Date(agent.last_used_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  {/* MICROCOPY: Descriptive with consequences */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setPaymentAgent(agent);
                        setShowPaymentForm(true);
                      }}
                      disabled={agent.status !== 'active'}
                      title={agent.status === 'active' ? 'Send payment with policy checks' : 'Agent is paused'}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                        agent.status === 'active'
                          ? 'bg-cronos-500 text-white hover:bg-cronos-600'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      💸 Send Payment
                    </button>
                    <button
                      onClick={() => setSelectedAgent(agent)}
                      title="View API key and configuration"
                      className="px-4 py-2 rounded-lg font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all text-sm"
                    >
                      View Config
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                    onClick={async () => {
                      // Toggle agent status
                      const newStatus = agent.status === 'active' ? 'paused' : 'active';
                      const confirmMsg = agent.status === 'active'
                        ? 'Pause agent? Stops all automated payments but keeps history.'
                        : 'Activate agent? Resumes automated payments with current policies.';

                      if (!confirm(confirmMsg)) return;

                      try {
                        const response = await fetch(`${API_URL}/agent/update-status`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            agentId: agent.id,
                            ownerAddress: wallets[0].address,
                            status: newStatus
                          }),
                        });
                        if (response.ok) {
                          fetchAgents(); // Refresh list
                        } else {
                          const error = await response.json();
                          alert(`Failed to update: ${error.message || 'Unknown error'}`);
                        }
                      } catch (err) {
                        console.error('Failed to update agent:', err);
                        alert('Network error. Check connection and retry.');
                      }
                    }}
                    title={agent.status === 'active' ? 'Stop payments but keep history' : 'Resume payments with policies'}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                      agent.status === 'active'
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-cronos-500 text-white hover:bg-cronos-600'
                    }`}
                  >
                    {agent.status === 'active' ? '⏸️ Pause Agent' : '▶️ Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteAgent(agent.id)}
                    title="Permanently delete agent and revoke API key"
                    className="px-4 py-2 rounded-lg font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-all text-sm"
                  >
                    🗑️ Delete Forever
                  </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Agent Details Modal */}
        {selectedAgent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{selectedAgent.name}</h2>
                  <span className={`badge ${selectedAgent.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                    {selectedAgent.status}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* API Key Section */}
              <div className="bg-gradient-to-r from-cronos-50 to-blue-50 rounded-xl p-6 mb-6">
                <h3 className="font-bold text-gray-900 mb-3">API Key</h3>
                <div className="bg-white rounded-lg p-4 mb-3">
                  <code className="text-sm font-mono break-all">{selectedAgent.api_key}</code>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedAgent.api_key);
                    alert('API Key copied to clipboard!');
                  }}
                  className="btn-secondary text-sm"
                >
                  Copy API Key
                </button>
              </div>

              {/* Configuration Details */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Configuration</h3>

                <div className="grid grid-cols-2 gap-4">
                  {selectedAgent.owner_address && (
                    <div>
                      <p className="text-sm text-gray-600">Owner Address</p>
                      <p className="font-mono text-sm">{selectedAgent.owner_address.substring(0, 10)}...{selectedAgent.owner_address.slice(-8)}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600">Daily Spending Limit</p>
                    <p className="font-semibold">{selectedAgent.policy_config?.dailyLimit || 'N/A'} CRO</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Approval Threshold</p>
                    <p className="font-semibold">{selectedAgent.policy_config?.requireApproval || 'N/A'} CRO</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Allowed Tokens</p>
                    <p className="font-semibold">{selectedAgent.policy_config?.allowedTokens || 'All'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Allowed Recipients</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <code className="text-sm">{selectedAgent.policy_config?.allowedRecipients || '*'}</code>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium">{new Date(selectedAgent.created_at).toLocaleString()}</p>
                  </div>

                  {selectedAgent.last_used_at && (
                    <div>
                      <p className="text-sm text-gray-600">Last Used</p>
                      <p className="font-medium">{new Date(selectedAgent.last_used_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="btn-primary flex-1"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Documentation Section */}
        <div className="mt-12 card bg-gradient-to-br from-gray-50 to-white">
          <h3 className="text-2xl font-bold mb-4">How to Use AI Agents</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-cronos-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-1">Create an Agent</h4>
                <p className="text-gray-600">
                  Set up policies like daily limits, whitelists, and approval thresholds
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-cronos-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-1">Use the API Key</h4>
                <p className="text-gray-600 mb-2">
                  Integrate the agent into your script or application
                </p>
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm font-mono overflow-x-auto">
                  <pre>{`curl -X POST ${API_URL}/agent/pay \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipientIdentifier": "alice@company.com",
    "identifierType": "email",
    "amount": "0.5"
  }'`}</pre>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-cronos-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-1">Automate Everything</h4>
                <p className="text-gray-600">
                  Let your AI handle payroll, refunds, rewards, and more - all within your policies
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <a
              href="/examples"
              className="text-cronos-600 font-semibold hover:text-cronos-700 flex items-center gap-2"
            >
              View Example Scripts
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        {/* Payment Form Modal */}
        {showPaymentForm && paymentAgent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card max-w-md w-full">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Use Agent: {paymentAgent.name}</h2>
                  <p className="text-sm text-gray-600 mt-1">Send payment with your agent's rules</p>
                </div>
                <button
                  onClick={() => {
                    setShowPaymentForm(false);
                    setPaymentData({ recipient: '', amount: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900 font-medium mb-2">Agent Rules:</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Daily limit: {paymentAgent.policy_config?.dailyLimit || '10'} CRO</li>
                  <li>• Auto-approve under: {paymentAgent.policy_config?.requireApproval || '5'} CRO</li>
                  <li>• Allowed tokens: {paymentAgent.policy_config?.allowedTokens || 'CRO'}</li>
                </ul>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setBulkPaymentMode(false)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    !bulkPaymentMode
                      ? 'bg-cronos-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Single Payment
                </button>
                <button
                  type="button"
                  onClick={() => setBulkPaymentMode(true)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    bulkPaymentMode
                      ? 'bg-cronos-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🚀 Bulk Payments
                </button>
              </div>

              {!bulkPaymentMode ? (
                <form onSubmit={handleSendPayment} className="space-y-4">
                <div>
                  <label className="label">Recipient Email</label>
                  <input
                    type="email"
                    value={paymentData.recipient}
                    onChange={(e) => setPaymentData({ ...paymentData, recipient: e.target.value })}
                    placeholder="user@example.com"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Amount (CRO)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    placeholder="1.5"
                    className="input-field"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={paymentLoading}
                    className="btn-primary flex-1"
                  >
                    {paymentLoading ? 'Sending...' : '💸 Send Payment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentForm(false);
                      setPaymentData({ recipient: '', amount: '' });
                    }}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              ) : (
                <form onSubmit={handleBulkPayment} className="space-y-4">
                  <div>
                    <label className="label">📄 Recipient List (CSV Format)</label>
                    <textarea
                      value={bulkList}
                      onChange={(e) => setBulkList(e.target.value)}
                      placeholder={`testchaindrop1@gmail.com,1\njeremic@company.com,2\nuser3@example.com,0.5`}
                      className="input-field min-h-[150px] font-mono text-sm"
                      required
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Format: One payment per line as <code className="bg-gray-100 px-1 rounded">email,amount</code>
                    </p>
                  </div>

                  {bulkProgress.total > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Processing...</span>
                        <span className="text-sm text-gray-600">{bulkProgress.current} / {bulkProgress.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-cronos-500 h-2 rounded-full transition-all"
                          style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                        ></div>
                      </div>
                      {bulkProgress.results.length > 0 && (
                        <div className="mt-3 max-h-40 overflow-y-auto space-y-1">
                          {bulkProgress.results.map((result, idx) => (
                            <div key={idx} className="text-xs flex items-center gap-2">
                              {result.status === 'success' ? (
                                <>
                                  <span className="text-green-600">✓</span>
                                  <span className="text-gray-600">{result.email}</span>
                                  <span className="text-gray-500">- {result.amount} CRO</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-red-600">✗</span>
                                  <span className="text-gray-600">{result.email}</span>
                                  <span className="text-red-500">- {result.error}</span>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={paymentLoading}
                      className="btn-primary flex-1"
                    >
                      {paymentLoading ? `Processing ${bulkProgress.current}/${bulkProgress.total}...` : '🚀 Start Bulk Payment'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPaymentForm(false);
                        setBulkList('');
                        setBulkProgress({ current: 0, total: 0, results: [] });
                      }}
                      className="btn-ghost"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
