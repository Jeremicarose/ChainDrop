import { useNavigate, useLocation } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';

export default function Navigation({ dark = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticated, login, logout, user } = usePrivy();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`sticky top-0 z-50 transition-all ${
      dark
        ? 'bg-transparent'
        : 'bg-white/80 backdrop-blur-lg border-b border-gray-200/50'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#1de4c6] to-[#00a28e] group-hover:scale-105 transition-transform shadow-lg shadow-[#1de4c6]/20">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className={`text-lg font-bold transition-colors ${
              dark ? 'text-white' : 'text-gray-900'
            }`}>
              ChainDrop
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink onClick={() => navigate('/')} active={isActive('/')} dark={dark}>
              Home
            </NavLink>
            {authenticated && (
              <>
                <NavLink onClick={() => navigate('/send')} active={isActive('/send')} dark={dark}>
                  Send
                </NavLink>
                <NavLink onClick={() => navigate('/wallet')} active={isActive('/wallet')} dark={dark}>
                  Wallet
                </NavLink>
                <NavLink onClick={() => navigate('/agents')} active={isActive('/agents')} dark={dark} highlight>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  <span>AI Agents</span>
                </NavLink>
              </>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {!authenticated ? (
              <button
                onClick={login}
                className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #1de4c6 0%, #00a28e 100%)',
                  boxShadow: '0 4px 15px -3px rgba(29, 228, 198, 0.4)'
                }}
              >
                Sign In
              </button>
            ) : (
              <>
                <div className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg ${
                  dark ? 'bg-white/10' : 'bg-gray-100'
                }`}>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className={`text-sm font-medium truncate max-w-[120px] ${
                    dark ? 'text-white' : 'text-gray-700'
                  }`}>
                    {user?.email?.address || user?.twitter?.username || user?.phone?.number || 'User'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dark
                      ? 'text-gray-400 hover:text-white hover:bg-white/10'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
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

function NavLink({ children, onClick, active, dark, highlight }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
        highlight
          ? dark
            ? 'text-[#1de4c6] hover:bg-[#1de4c6]/10'
            : 'text-[#00a28e] hover:bg-[#00a28e]/10'
          : dark
            ? active
              ? 'text-white bg-white/10'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
            : active
              ? 'text-gray-900 bg-gray-100'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}
