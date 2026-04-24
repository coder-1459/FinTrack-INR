import React, { createContext, useContext, useState, useEffect } from 'react';

const WatchlistContext = createContext();

export const useWatchlist = () => useContext(WatchlistContext);

export const WatchlistProvider = ({ children }) => {
  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem('watchlist');
    return saved ? JSON.parse(saved) : { currencies: ['USD', 'EUR', 'GBP'], stocks: ['RELIANCE', 'TCS'] };
  });

  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const toggleCurrency = (code) => {
    setWatchlist(prev => {
      const currencies = prev.currencies.includes(code)
        ? prev.currencies.filter(c => c !== code)
        : [...prev.currencies, code];
      return { ...prev, currencies };
    });
  };

  const toggleStock = (symbol) => {
    setWatchlist(prev => {
      const stocks = prev.stocks.includes(symbol)
        ? prev.stocks.filter(s => s !== symbol)
        : [...prev.stocks, symbol];
      return { ...prev, stocks };
    });
  };

  return (
    <WatchlistContext.Provider value={{ watchlist, toggleCurrency, toggleStock }}>
      {children}
    </WatchlistContext.Provider>
  );
};
