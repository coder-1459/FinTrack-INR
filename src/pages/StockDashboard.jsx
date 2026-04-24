import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { TrendingUp, TrendingDown, Clock, Activity, Star } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { fetchMarketIndices, fetchTopStocks, fetchNews, fetchSectorHeatmap } from '../services/api';
import { useWatchlist } from '../context/WatchlistContext';
import './StockDashboard.css';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: 'var(--surface-color)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '12px', boxShadow: 'var(--shadow-sm)' }}>
        <span>₹{payload[0].value.toFixed(2)}</span>
      </div>
    );
  }
  return null;
};

const Sparkline = ({ data, color }) => (
  <ResponsiveContainer width="100%" height={40}>
    <AreaChart data={data}>
      <YAxis domain={['auto', 'auto']} hide />
      <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-color)', strokeWidth: 1, strokeDasharray: '3 3' }} />
      <Area 
        type="monotone" 
        dataKey="value" 
        stroke={color} 
        strokeWidth={1.5}
        fill={color}
        fillOpacity={0.1} 
        isAnimationActive={false}
      />
    </AreaChart>
  </ResponsiveContainer>
);

const StockDashboard = () => {
  const [indices, setIndices] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [news, setNews] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highlightedSymbol, setHighlightedSymbol] = useState(null);
  const { watchlist, toggleStock } = useWatchlist();
  
  const location = useLocation();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [idxData, stData, nsData, scData] = await Promise.all([
        fetchMarketIndices(),
        fetchTopStocks(),
        fetchNews(),
        fetchSectorHeatmap()
      ]);
      setIndices(idxData);
      setStocks(stData);
      setNews(nsData);
      setSectors(scData);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      const searchParams = new URLSearchParams(location.search);
      const symbol = searchParams.get('highlight');
      if (symbol) {
        setHighlightedSymbol(symbol);
        setTimeout(() => {
          const element = document.getElementById(`stock-${symbol}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        
        // Remove highlight after 3 seconds
        const timer = setTimeout(() => {
          setHighlightedSymbol(null);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [location.search, loading]);

  if (loading) {
    return <div className="loading-state h-screen">Loading market data...</div>;
  }

  // Calculate sentiment score
  const bullishCount = news.filter(n => n.sentiment === 'bullish').length;
  const bearishCount = news.filter(n => n.sentiment === 'bearish').length;
  let sentimentScore = 50 + (bullishCount * 10) - (bearishCount * 10);
  let sentimentLabel = 'Neutral';
  if (sentimentScore > 60) sentimentLabel = 'Greed';
  if (sentimentScore > 80) sentimentLabel = 'Extreme Greed';
  if (sentimentScore < 40) sentimentLabel = 'Fear';
  if (sentimentScore < 20) sentimentLabel = 'Extreme Fear';

  return (
    <div className="container animate-fade-in">
      <div className="page-header">
        <h1 className="h1">Market Dashboard</h1>
        <p className="text-secondary">Live updates for Indian Stock Market</p>
      </div>

      {/* Indices Cards */}
      <div className="indices-grid">
        {indices.map((idx, i) => (
          <div key={idx.name} className={`glass-panel index-card stagger-${i + 1}`}>
            <div className="index-info">
              <h3 className="text-muted text-sm">{idx.name}</h3>
              <div className="index-value">
                <span className="h2">{idx.value.toLocaleString()}</span>
                <span className={`badge ${idx.change >= 0 ? 'badge-success' : 'badge-danger'}`}>
                  {idx.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(idx.percentChange)}%
                </span>
              </div>
            </div>
            <div className="index-chart">
              <Sparkline data={idx.history} color={idx.change >= 0 ? 'var(--success)' : 'var(--danger)'} />
            </div>
          </div>
        ))}
        
        {/* Sentiment Widget */}
        <div className="glass-panel sentiment-card stagger-3">
          <h3 className="text-muted text-sm">Market Sentiment</h3>
          <div className="sentiment-meter">
            <div className="h2">{sentimentLabel}</div>
            <div className="meter-bar">
              <div className="meter-fill" style={{ width: `${sentimentScore}%`, backgroundColor: sentimentScore > 50 ? 'var(--success)' : 'var(--danger)' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Top Stocks */}
        <div className="glass-panel main-widget stagger-2">
          <div className="widget-header">
            <h2 className="h3">Top Stocks to Watch</h2>
          </div>
          <div className="stocks-list">
            {stocks.map(stock => {
              const isPinned = watchlist.stocks.includes(stock.symbol);
              const color = stock.change >= 0 ? 'var(--success)' : 'var(--danger)';
              return (
                <div 
                  key={stock.symbol} 
                  id={`stock-${stock.symbol}`}
                  className={`stock-row ${highlightedSymbol === stock.symbol ? 'highlight-pulse' : ''}`}
                >
                  <div className="stock-name">
                    <button 
                      className={`btn-icon small ${isPinned ? 'text-primary' : ''}`}
                      onClick={() => toggleStock(stock.symbol)}
                    >
                      <Star fill={isPinned ? "currentColor" : "none"} size={16} />
                    </button>
                    <div>
                      <div className="font-bold">{stock.symbol}</div>
                      <div className="text-sm text-secondary">{stock.name}</div>
                    </div>
                  </div>
                  
                  <div className="stock-chart hide-mobile">
                    <Sparkline data={stock.history} color={color} />
                  </div>
                  
                  <div className="stock-price text-right">
                    <div className="font-bold">₹{stock.price.toFixed(2)}</div>
                    <div className={stock.change >= 0 ? 'text-success' : 'text-danger'}>
                      {stock.change >= 0 ? '+' : ''}{stock.change}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="sidebar-widgets">
          {/* Sector Heatmap */}
          <div className="glass-panel sector-widget stagger-3">
            <div className="widget-header">
              <h2 className="h3">Sector Performance</h2>
            </div>
            <div className="sectors-grid">
              {sectors.map(sector => (
                <div 
                  key={sector.name} 
                  className={`sector-box ${sector.value >= 0 ? 'bg-success' : 'bg-danger'}`}
                  style={{ opacity: Math.min(0.3 + Math.abs(sector.value) * 0.2, 1) }}
                >
                  <div className="sector-content">
                    <span className="sector-name">{sector.name}</span>
                    <span className="sector-value">{sector.value > 0 ? '+' : ''}{sector.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* News Feed */}
          <div className="glass-panel news-widget stagger-4">
            <div className="widget-header">
              <h2 className="h3">Latest News</h2>
            </div>
            <div className="news-list">
              {news.map(item => (
                <div key={item.id} className="news-item">
                  <div className="news-meta">
                    <span className={`news-tag tag-${item.sentiment}`}>
                      {item.sentiment}
                    </span>
                  </div>
                  <h4 className="news-title">{item.title}</h4>
                  <div className="text-xs text-secondary">{item.source}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDashboard;
