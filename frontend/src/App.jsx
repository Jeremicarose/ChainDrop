import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePageNew';
import ClaimPage from './pages/ClaimPageNew';
import SendPage from './pages/SendPageNew';
import WalletPage from './pages/WalletPageNew';
import AgentsPage from './pages/AgentsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/claim/:claimToken" element={<ClaimPage />} />
        <Route path="/send" element={<SendPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/agents" element={<AgentsPage />} />
      </Routes>
    </Router>
  );
}

export default App;