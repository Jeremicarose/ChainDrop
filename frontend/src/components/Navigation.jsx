import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';

export default function Navigation() {
  const navigate = useNavigate();
  const { authenticated, login, logout, user } = usePrivy();

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)' }}>
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-xl font-bold" style={{ color: '#0d9488' }}>
              ChainDrop
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg font-medium transition-colors"
              style={{ color: '#374151', cursor: 'pointer' }}
              onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              Home
            </button>
            {authenticated && (
              <>
                <button
                  onClick={() => navigate('/send')}
                  className="px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{ color: '#374151', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  Send
                </button>
                <button
                  onClick={() => navigate('/wallet')}
                  className="px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{ color: '#374151', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  Wallet
                </button>
                <button
                  onClick={() => navigate('/agents')}
                  className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                  style={{ color: '#374151', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  <span>🤖</span>
                  <span>AI Agents</span>
                </button>
              </>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            {!authenticated ? (
              <button onClick={login} className="btn-primary">
                Sign In
              </button>
            ) : (
              <>
                <div className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700 truncate max-w-32">
                    {user?.email?.address || user?.twitter?.username || user?.phone?.number || 'User'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
