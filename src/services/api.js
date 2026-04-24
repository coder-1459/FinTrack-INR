// Data Services for FinTrack INR

const generateSparkline = (points, endValue, percentChange) => {
  const startValue = endValue / (1 + percentChange / 100);
  const data = [];
  
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    let val = startValue + (endValue - startValue) * progress;
    
    // Add realistic noise, but keep first and last points exact
    if (i > 0 && i < points - 1) {
      const variance = Math.max(Math.abs(endValue - startValue) * 0.5, endValue * 0.002);
      val += (Math.random() - 0.5) * variance;
    }
    
    data.push({ day: i, value: val });
  }
  return data;
};

export const fetchCurrencies = async () => {
  // List of currencies we want to display, with their full names
  const currencyMeta = {
    USD: { name: 'US Dollar' },
    EUR: { name: 'Euro' },
    GBP: { name: 'British Pound' },
    JPY: { name: 'Japanese Yen' },
    AUD: { name: 'Australian Dollar' },
    CAD: { name: 'Canadian Dollar' },
    CHF: { name: 'Swiss Franc' },
    CNY: { name: 'Chinese Yuan' },
    SGD: { name: 'Singapore Dollar' },
    AED: { name: 'UAE Dirham' },
  };

  try {
    // Fetch live rates: base = USD, gives us USD→all currencies
    // We use USD as base and compute INR rate from that
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await res.json();

    // INR per 1 USD
    const inrPerUsd = data.rates['INR'];

    return Object.entries(currencyMeta).map(([code, meta]) => {
      // rate = how many INR for 1 unit of `code`
      // If code=USD: inrPerUsd / rates[USD] = inrPerUsd / 1 = inrPerUsd
      // If code=EUR: inrPerUsd / rates[EUR]  (since 1 USD = rates[EUR], so 1 EUR = inrPerUsd/rates[EUR] INR)
      const rate = inrPerUsd / data.rates[code];
      return {
        code,
        name: meta.name,
        rate: parseFloat(rate.toFixed(4)),
        change: parseFloat((Math.random() * 0.4 - 0.2).toFixed(2)), // small realistic daily fluctuation
      };
    });
  } catch (error) {
    console.error('Currency API failed, using fallback:', error);
    // Approximate fallback values (updated April 2025)
    return [
      { code: 'USD', name: 'US Dollar',        rate: 84.50,  change:  0.10 },
      { code: 'EUR', name: 'Euro',              rate: 95.80,  change: -0.08 },
      { code: 'GBP', name: 'British Pound',     rate: 112.30, change:  0.22 },
      { code: 'JPY', name: 'Japanese Yen',      rate: 0.57,   change: -0.05 },
      { code: 'AUD', name: 'Australian Dollar', rate: 54.10,  change:  0.15 },
      { code: 'CAD', name: 'Canadian Dollar',   rate: 62.40,  change:  0.06 },
      { code: 'CHF', name: 'Swiss Franc',       rate: 99.20,  change: -0.03 },
      { code: 'CNY', name: 'Chinese Yuan',      rate: 11.62,  change:  0.01 },
      { code: 'SGD', name: 'Singapore Dollar',  rate: 63.10,  change:  0.12 },
      { code: 'AED', name: 'UAE Dirham',        rate: 23.00,  change:  0.03 },
    ];
  }
};


export const fetchCurrencyHistory = async (code) => {
  const currencies = await fetchCurrencies();
  const currency = currencies.find(c => c.code === code) || currencies[0];
  return generateSparkline(30, currency.rate, currency.change);
};

export const fetchMarketIndices = async () => {
  try {
    const [niftyRes, sensexRes] = await Promise.all([
      fetch('https://priceapi.moneycontrol.com/pricefeed/notapplicable/inidicesindia/in%3BNSX'),
      fetch('https://priceapi.moneycontrol.com/pricefeed/notapplicable/inidicesindia/in%3BSEN')
    ]);
    const niftyData = await niftyRes.json();
    const sensexData = await sensexRes.json();
    
    const niftyPrice = parseFloat(niftyData.data.pricecurrent.replace(/,/g, ''));
    const niftyChange = parseFloat(niftyData.data.pricepercentchange);
    const sensexPrice = parseFloat(sensexData.data.pricecurrent.replace(/,/g, ''));
    const sensexChange = parseFloat(sensexData.data.pricepercentchange);

    return [
      { 
        name: 'NIFTY 50', 
        value: niftyPrice, 
        change: parseFloat(niftyData.data.pricechange.replace(/,/g, '')), 
        percentChange: niftyChange, 
        history: generateSparkline(30, niftyPrice, niftyChange) 
      },
      { 
        name: 'SENSEX', 
        value: sensexPrice, 
        change: parseFloat(sensexData.data.pricechange.replace(/,/g, '')), 
        percentChange: sensexChange, 
        history: generateSparkline(30, sensexPrice, sensexChange) 
      }
    ];
  } catch (error) {
    console.error("Error fetching indices:", error);
    // Fallback
    return [
      { name: 'NIFTY 50', value: 22514.65, change: 112.50, percentChange: 0.50, history: generateSparkline(30, 22514.65, 0.50) },
      { name: 'SENSEX', value: 74248.22, change: 350.10, percentChange: 0.47, history: generateSparkline(30, 74248.22, 0.47) }
    ];
  }
};

const mcSymbolMap = {
  'RELIANCE': 'RI',
  'TCS': 'TCS',
  'HDFCBANK': 'HDF01',
  'INFY': 'IT',
  'ICICIBANK': 'ICI02',
  'SBIN': 'SBI',
  'BHARTIARTL': 'BTV',
  'ITC': 'ITC',
  'HINDUNILVR': 'HL',
  'LT': 'LT',
  'BAJFINANCE': 'BF04',
  'KOTAKBANK': 'KMB',
  'AXISBANK': 'AB16',
  'MARUTI': 'MS24',
  'HCLTECH': 'HCL02',
  'ASIANPAINT': 'API',
  'TATAMOTORS': 'TM03',
  'M&M': 'MM',
  'SUNPHARMA': 'SPI',
  'TITAN': 'TI01'
};

const stockNames = {
  'RELIANCE': 'Reliance Ind.',
  'TCS': 'Tata Consultancy',
  'HDFCBANK': 'HDFC Bank',
  'INFY': 'Infosys',
  'ICICIBANK': 'ICICI Bank',
  'SBIN': 'State Bank of India',
  'BHARTIARTL': 'Bharti Airtel',
  'ITC': 'ITC Ltd.',
  'HINDUNILVR': 'Hindustan Unilever',
  'LT': 'Larsen & Toubro',
  'BAJFINANCE': 'Bajaj Finance',
  'KOTAKBANK': 'Kotak Mahindra Bank',
  'AXISBANK': 'Axis Bank',
  'MARUTI': 'Maruti Suzuki',
  'HCLTECH': 'HCL Technologies',
  'ASIANPAINT': 'Asian Paints',
  'TATAMOTORS': 'Tata Motors',
  'M&M': 'Mahindra & Mahindra',
  'SUNPHARMA': 'Sun Pharma',
  'TITAN': 'Titan Company'
};

export const fetchTopStocks = async () => {
  try {
    const symbols = Object.keys(mcSymbolMap);
    const promises = symbols.map(async (sym) => {
      try {
        const res = await fetch(`https://priceapi.moneycontrol.com/pricefeed/nse/equitycash/${mcSymbolMap[sym]}`);
        const json = await res.json();
        const price = parseFloat(json.data.pricecurrent.replace(/,/g, ''));
        const change = parseFloat(json.data.pricepercentchange);
        
        return {
          symbol: sym,
          name: stockNames[sym],
          price: price,
          change: change,
          history: generateSparkline(20, price, change)
        };
      } catch (err) {
        console.error(`Error fetching ${sym}:`, err);
        return null;
      }
    });
    const results = await Promise.all(promises);
    const validResults = results.filter(r => r !== null);
    if (validResults.length === 0) throw new Error("All fetches failed");
    return validResults;
  } catch (error) {
    console.error("Error fetching stocks:", error);
    // Fallback
    return [
      { symbol: 'RELIANCE', name: 'Reliance Ind.', price: 2950.45, change: 1.2, history: generateSparkline(20, 2950.45, 1.2) },
      { symbol: 'TCS', name: 'Tata Consultancy', price: 3980.10, change: -0.5, history: generateSparkline(20, 3980.10, -0.5) },
    ];
  }
};

const getRelativeTime = (dateString) => {
  const date = new Date(dateString.replace(' ', 'T') + 'Z'); // Handle format properly if needed, but Date usually parses YYYY-MM-DD HH:mm:ss
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return `just now`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hr ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} d ago`;
};

export const fetchNews = async () => {
  try {
    const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://feeds.finance.yahoo.com/rss/2.0/headline?s=^BSESN,^NSEI,RELIANCE.NS');
    const data = await response.json();
    if (data.status === 'ok') {
      return data.items.slice(0, 10).map((item, index) => ({
        id: index,
        title: item.title,
        source: 'Yahoo Finance',
        time: getRelativeTime(item.pubDate),
        link: item.link,
        description: item.description,
        sentiment: item.title.toLowerCase().match(/(up|high|gain|growth|bull)/) ? 'bullish' : 
                   item.title.toLowerCase().match(/(down|low|loss|drop|bear)/) ? 'bearish' : 'neutral'
      }));
    }
  } catch (error) {
    console.error("Error fetching news:", error);
  }
  
  return [
    { id: 1, title: 'RBI keeps repo rate unchanged at 6.5%', source: 'Financial Express', time: '2 hr ago', link: '#', sentiment: 'neutral' },
    { id: 2, title: 'IT sector rally lifts Nifty to fresh all-time highs', source: 'Moneycontrol', time: '4 hr ago', link: '#', sentiment: 'bullish' },
    { id: 3, title: 'Markets expected to open higher amidst global cues', source: 'Economic Times', time: '5 hr ago', link: '#', sentiment: 'bullish' },
  ];
};

export const fetchSectorHeatmap = async () => {
  // Sector indices could also be fetched from moneycontrol if mapped correctly,
  // but using a static mock for heatmap is usually fine for a demo unless specifically asked.
  return [
    { name: 'IT', value: 2.4 },
    { name: 'Banks', value: 1.2 },
    { name: 'Auto', value: -0.8 },
    { name: 'FMCG', value: 0.5 },
    { name: 'Metal', value: -1.5 },
    { name: 'Pharma', value: 1.8 },
  ];
};
