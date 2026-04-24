import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { WatchlistProvider } from './context/WatchlistContext';
import Navbar from './components/Navbar';
import CurrencyConverter from './pages/CurrencyConverter';
import StockDashboard from './pages/StockDashboard';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <WatchlistProvider>
        <Router>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/currency" element={<CurrencyConverter />} />
                <Route path="/stocks" element={<StockDashboard />} />
                <Route path="/" element={<Navigate to="/currency" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </WatchlistProvider>
    </ThemeProvider>
  );
}

export default App;
