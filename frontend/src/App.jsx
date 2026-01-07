import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/Homepage';
import ClaimPage from './pages/ClaimPage';
import SendPage from './pages?sendPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"element={<HomePage />} />
        <Route path="/claim/:claimToken" element={<ClaimPage />} />
        <Route path="/send" element={<SendPage />} />
      </Routes>
    </Router>
  );
}

export default App;