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

  const [formData, setFormData] = useState({
    name: '',
    dailyLimit: '10',
    allowedRecipients: '*',
    requireApproval: '5',
    allowedTokens: 'CRO'
  });

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

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cronos-50/30">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="card text-center">
            <div className="text-6xl mb-6">🤖</div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cronos-50/30">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Agents</h1>
              <p className="text-lg text-gray-600">
                Automate payments with policy-based AI agents
              </p>
            </div>
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

                <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={() => setSelectedAgent(agent)}
                    className="text-cronos-600 font-semibold hover:text-cronos-700 flex-1 text-left"
                  >
                    View Details →
                  </button>
                  <button
                    onClick={async () => {
                      // Toggle agent status
                      const newStatus = agent.status === 'active' ? 'paused' : 'active';
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
                          alert(`Failed to update agent: ${error.message || 'Unknown error'}`);
                        }
                      } catch (err) {
                        console.error('Failed to update agent:', err);
                        alert('Failed to update agent status');
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      agent.status === 'active'
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-cronos-500 text-white hover:bg-cronos-600'
                    }`}
                  >
                    {agent.status === 'active' ? 'Pause' : 'Activate'}
                  </button>
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
      </div>
    </div>
  );
}
