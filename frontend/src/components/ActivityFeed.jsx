import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const API_URL = import.meta.env.VITE_API_URL;

export default function ActivityFeed() {
  const [activity, setActivity] = useState([]);
  const [stats, setStats] = useState({ total: 0, claimed: 0, pending: 0 });
  const [croPrice, setCroPrice] = useState(0.09);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recent activity, stats, and price in parallel
        const [activityRes, statsRes, priceRes] = await Promise.all([
          fetch(`${API_URL}/transfer/recent?limit=5`),
          fetch(`${API_URL}/transfer/stats`),
          fetch(`${API_URL}/price/cro`)
        ]);

        const [activityData, statsData, priceData] = await Promise.all([
          activityRes.json(),
          statsRes.json(),
          priceRes.json()
        ]);

        if (activityData.success) setActivity(activityData.data);
        if (statsData.success) setStats(statsData.data);
        if (priceData.success) setCroPrice(priceData.price);
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Format time ago
  const timeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Format amount
  const formatAmount = (amount) => {
    const cro = parseFloat(ethers.formatEther(amount));
    const usd = cro * croPrice;
    return { cro: cro.toFixed(2), usd: usd.toFixed(2) };
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-white/5 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Payments</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.claimed}</div>
          <div className="text-xs text-gray-500">Claimed</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
      </div>

      {/* Activity list */}
      {activity.length > 0 ? (
        <div className="space-y-2">
          {activity.map((tx, idx) => {
            const amount = formatAmount(tx.amount);
            return (
              <div
                key={tx.id || idx}
                className="flex items-center gap-4 p-4 bg-white/[0.02] hover:bg-white/5 border border-white/5 rounded-xl transition-all"
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  tx.claimed
                    ? 'bg-green-500/20'
                    : 'bg-[#1de4c6]/20'
                }`}>
                  {tx.claimed ? (
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-[#1de4c6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium truncate">
                      {tx.senderShort}
                    </span>
                    <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="text-gray-400 truncate">
                      {tx.recipientType === 'email' ? '📧' : tx.recipientType === 'twitter' ? '🐦' : '📱'} {tx.recipientType}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {timeAgo(tx.createdAt)}
                    {tx.claimed && <span className="text-green-400 ml-2">• Claimed</span>}
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <div className="text-white font-semibold">${amount.usd}</div>
                  <div className="text-xs text-gray-500">{amount.cro} CRO</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No activity yet. Be the first to send a payment!</p>
        </div>
      )}

      {/* Live indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span>Live on Cronos Testnet</span>
      </div>
    </div>
  );
}
