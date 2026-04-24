import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, Search, Bell, Activity, TrendingUp, TrendingDown, Minus, X, DollarSign, LineChart, ExternalLink } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { fetchTopStocks, fetchCurrencies, fetchNews } from '../services/api';
import './Navbar.css';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [dailyUpdates, setDailyUpdates] = useState([]);
  const notifRef = useRef(null);

  useEffect(() => {
    // Load data for search and notifications
    const loadGlobalData = async () => {
      const [stocks, currencies, newsData] = await Promise.all([
        fetchTopStocks(),
        fetchCurrencies(),
        fetchNews()
      ]);
      
      // Setup daily updates for notifications using actual news
      const updates = newsData.map(item => ({
        id: item.id,
        text: item.title,
        sentiment: item.sentiment,
        time: item.time,
        source: item.source,
        description: item.description
      }));
      setDailyUpdates(updates.slice(0, 10));
      
      // Filter logic
      if (searchTerm.trim() === '') {
        setSearchResults([]);
      } else {
        const query = searchTerm.toLowerCase();
        const matchingStocks = stocks
          .filter(s => s.symbol.toLowerCase().includes(query) || s.name.toLowerCase().includes(query))
          .map(s => ({ ...s, type: 'stock' }));
        const matchingCurrencies = currencies
          .filter(c => c.code.toLowerCase().includes(query) || c.name.toLowerCase().includes(query))
          .map(c => ({ ...c, type: 'currency' }));
          
        setSearchResults([...matchingStocks, ...matchingCurrencies].slice(0, 6));
      }
    };
    
    loadGlobalData();

    // Auto-refresh news in the background every 60 seconds
    const interval = setInterval(async () => {
      const newsData = await fetchNews();
      const updates = newsData.map(item => ({
        id: item.id,
        text: item.title,
        sentiment: item.sentiment,
        time: item.time,
        source: item.source,
        description: item.description
      }));
      setDailyUpdates(updates.slice(0, 10));
    }, 60000);

    return () => clearInterval(interval);
  }, [searchTerm]);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (result) => {
    setShowSearch(false);
    setSearchTerm('');
    if (result.type === 'stock') {
      navigate(`/stocks?highlight=${result.symbol}`);
    } else {
      navigate(`/currency?highlight=${result.code}`);
    }
  };

  return (
    <header className="navbar glass-panel">
      <div className="container navbar-content">
        <div className="navbar-brand">
          <Activity className="brand-icon text-success" size={28} />
          <span className="brand-name h3">FinTrack <span className="text-success">INR</span></span>
        </div>
        
        <nav className="navbar-nav">
          <NavLink 
            to="/currency" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <DollarSign size={18} className="nav-icon" />
            <span className="nav-text">Currency</span>
          </NavLink>
          <NavLink 
            to="/stocks" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <LineChart size={18} className="nav-icon" />
            <span className="nav-text">Stocks</span>
          </NavLink>
        </nav>

        <div className="navbar-actions">
          <div className="search-bar hidden-mobile" ref={searchRef}>
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search assets..." 
              className="search-input" 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
            />
            {searchTerm && (
              <button 
                className="search-clear" 
                onClick={() => {
                  setSearchTerm('');
                  setShowSearch(false);
                }}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
            
            {showSearch && searchResults.length > 0 && (
              <div className="search-dropdown animate-fade-in glass-panel">
                {searchResults.map(res => (
                  <div 
                    key={res.type === 'stock' ? res.symbol : res.code} 
                    className="search-item"
                    onClick={() => handleResultClick(res)}
                  >
                    <div>
                      <strong>{res.type === 'stock' ? res.symbol : res.code}</strong>
                      <span className="text-xs text-secondary ml-2">{res.name}</span>
                    </div>
                    <span className="search-type-badge">{res.type}</span>
                  </div>
                ))}
              </div>
            )}
            {showSearch && searchTerm.length > 0 && searchResults.length === 0 && (
              <div className="search-dropdown animate-fade-in glass-panel">
                <div className="search-item text-secondary">No results found.</div>
              </div>
            )}
          </div>
          
          <div className="notification-wrapper" ref={notifRef}>
            <button 
              className="btn-icon animate-fade-in stagger-1 relative" 
              aria-label="Notifications"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={20} />
              <span className="notification-badge"></span>
            </button>
            
            {showNotifications && (
              <div className="notification-dropdown animate-fade-in glass-panel">
                <div className="dropdown-header-container">
                  <h4 className="dropdown-header">Market News</h4>
                  <span className="dropdown-badge">{dailyUpdates.length} New</span>
                </div>
                <div className="notification-list">
                  {dailyUpdates.map(update => (
                    <div key={update.id} className="notification-item">
                      <div className="notification-unread-dot"></div>
                      <div className={`notification-icon-wrapper bg-${update.sentiment}`}>
                        {update.sentiment === 'bullish' ? <TrendingUp size={16} className="text-success" /> : update.sentiment === 'bearish' ? <TrendingDown size={16} className="text-danger" /> : <Minus size={16} className="text-secondary" />}
                      </div>
                      <div className="notification-content">
                        <div className="notification-text">
                          {update.text}
                        </div>
                        {update.description && (
                          <div className="notification-desc">
                            {update.description}
                          </div>
                        )}
                        <div className="notification-meta">
                          <span className="notification-source">{update.source}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="notification-footer">
                  <button className="btn-link">View all news</button>
                </div>
              </div>
            )}
          </div>
          
          <button 
            className="btn-icon animate-fade-in stagger-2" 
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
