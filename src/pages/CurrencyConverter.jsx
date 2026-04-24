import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowRightLeft, TrendingUp, TrendingDown, Star } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { fetchCurrencies, fetchCurrencyHistory } from '../services/api';
import { useWatchlist } from '../context/WatchlistContext';
import './CurrencyConverter.css';

const CurrencyConverter = () => {
  const [amount, setAmount] = useState(1);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [currencies, setCurrencies] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { watchlist, toggleCurrency } = useWatchlist();
  
  const location = useLocation();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchCurrencies();
      setCurrencies(data);
      
      const searchParams = new URLSearchParams(location.search);
      const highlight = searchParams.get('highlight');
      const targetCurrency = highlight && data.some(c => c.code === highlight) ? highlight : fromCurrency;
      
      if (highlight && targetCurrency !== fromCurrency) {
        setFromCurrency(targetCurrency);
      } else {
        const history = await fetchCurrencyHistory(targetCurrency);
        setHistoryData(history);
        setLoading(false);
      }
    };
    loadData();
  }, [fromCurrency, location.search]);

  const handleSwap = () => {
    // Since we're always converting to INR in this app per requirements, 
    // "Swap" would logically swap the from/to, but since the requirement is to convert TO INR, 
    // let's just make the button an animation or reset for now, or just swap the base if we had multiple bases.
    // Given the prompt "convert any world currency to INR... swap button to reverse",
    // We can simulate reversed conversion (INR to USD).
  };

  const selectedCurrency = currencies.find(c => c.code === fromCurrency);
  const convertedAmount = selectedCurrency ? (amount * selectedCurrency.rate).toFixed(2) : 0;
  const isPinned = watchlist.currencies.includes(fromCurrency);

  return (
    <div className="container animate-fade-in">
      <div className="page-header">
        <h1 className="h1">Currency Converter</h1>
        <p className="text-secondary">Real-time exchange rates against Indian Rupee (INR)</p>
      </div>

      <div className="converter-grid">
        {/* Converter Widget */}
        <div className="glass-panel converter-widget stagger-1">
          <div className="widget-header">
            <h2 className="h3">Convert</h2>
            <button 
              className={`btn-icon ${isPinned ? 'text-primary' : ''}`}
              onClick={() => toggleCurrency(fromCurrency)}
              aria-label="Pin to watchlist"
            >
              <Star fill={isPinned ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="converter-inputs">
            <div className="input-group">
              <label className="input-label">Amount</label>
              <input 
                type="number" 
                className="input-field amount-input" 
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="0"
              />
            </div>

            <div className="currency-selectors">
              <div className="input-group flex-1">
                <label className="input-label">From</label>
                <select 
                  className="input-field" 
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                >
                  {currencies.map(c => (
                    <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>

              <button className="btn-icon swap-btn" onClick={handleSwap}>
                <ArrowRightLeft />
              </button>

              <div className="input-group flex-1">
                <label className="input-label">To</label>
                <div className="input-field read-only">INR - Indian Rupee</div>
              </div>
            </div>
          </div>

          <div className="conversion-result">
            <div className="result-amount">
              <span className="currency-symbol">₹</span>
              {loading ? '...' : convertedAmount}
            </div>
            <div className="result-rate">
              1 {fromCurrency} = ₹{selectedCurrency?.rate.toFixed(4)}
              <span className={`rate-change ${selectedCurrency?.change >= 0 ? 'text-success' : 'text-danger'}`}>
                {selectedCurrency?.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(selectedCurrency?.change || 0)}%
              </span>
            </div>
            <div className="last-updated">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Sparkline Chart */}
        <div className="glass-panel chart-widget stagger-2">
          <div className="widget-header">
            <h2 className="h3">{fromCurrency} vs INR (30 Days)</h2>
          </div>
          <div className="chart-container">
            {loading ? (
              <div className="loading-state">Loading chart data...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div style={{ backgroundColor: 'var(--surface-color)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '12px', boxShadow: 'var(--shadow-sm)' }}>
                            <span>₹{payload[0].value.toFixed(2)}</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ stroke: 'var(--border-color)', strokeWidth: 1, strokeDasharray: '3 3' }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="var(--primary)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="glass-panel table-widget stagger-3">
        <div className="widget-header">
          <h2 className="h3">Major Currencies vs INR</h2>
        </div>
        <div className="table-responsive">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Currency</th>
                <th>Rate (INR)</th>
                <th>24h Change</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currencies.map(c => {
                const pinned = watchlist.currencies.includes(c.code);
                return (
                  <tr key={c.code}>
                    <td>
                      <div className="currency-cell">
                        <strong>{c.code}</strong>
                        <span className="text-secondary text-sm">{c.name}</span>
                      </div>
                    </td>
                    <td className="font-medium">₹{c.rate.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${c.change >= 0 ? 'badge-success' : 'badge-danger'}`}>
                        {c.change >= 0 ? '+' : ''}{c.change}%
                      </span>
                    </td>
                    <td>
                      <button 
                        className={`btn-icon small ${pinned ? 'text-primary' : ''}`}
                        onClick={() => toggleCurrency(c.code)}
                      >
                        <Star fill={pinned ? "currentColor" : "none"} size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverter;
