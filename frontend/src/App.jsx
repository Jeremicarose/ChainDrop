import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ClaimPage from './pages/ClaimPage';
import SendPage from './pages/SendPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/claim/:claimToken" element={<ClaimPage />} />
        <Route path="/send" element={<SendPage />} />
      </Routes>
    </Router>
  );
}

export default App;
