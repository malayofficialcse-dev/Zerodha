import StockModel from "../models/stockModel.js";

const companies = [
  { symbol: "BTC", name: "Bitcoin", sector: "Crypto", assetCategory: "Other" },
  { symbol: "ETH", name: "Ethereum", sector: "Crypto", assetCategory: "Other" },
  { symbol: "NIFTY", name: "Nifty 50", sector: "Index", assetCategory: "Other" },
  { symbol: "SENSEX", name: "Sensex", sector: "Index", assetCategory: "Other" },
  { symbol: "NIFTY_BANK", name: "Nifty Bank", sector: "Index", assetCategory: "Other" },

  { symbol: "TCS", name: "Tata Consultancy Services", sector: "IT", assetCategory: "Bluechip" },
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy", assetCategory: "Bluechip" },
  { symbol: "INFY", name: "Infosys", sector: "IT", assetCategory: "Bluechip" },
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking", assetCategory: "Bluechip" },
  { symbol: "ICICIBANK", name: "ICICI Bank", sector: "Banking", assetCategory: "Bluechip" },
  { symbol: "ITC", name: "ITC Limited", sector: "FMCG", assetCategory: "Bluechip" },
  { symbol: "SBIN", name: "State Bank of India", sector: "Banking", assetCategory: "Bluechip" },
  { symbol: "WIPRO", name: "Wipro", sector: "IT", assetCategory: "Bluechip" },
  { symbol: "HUL", name: "Hindustan Unilever", sector: "FMCG", assetCategory: "Bluechip" },
  { symbol: "M&M", name: "Mahindra & Mahindra", sector: "Auto", assetCategory: "Bluechip" },
  { symbol: "ONGC", name: "ONGC", sector: "Energy", assetCategory: "Bluechip" },
  { symbol: "AXISBANK", name: "Axis Bank", sector: "Banking", assetCategory: "Bluechip" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", sector: "Banking", assetCategory: "Bluechip" },
  { symbol: "LT", name: "Larsen & Toubro", sector: "Infra", assetCategory: "Bluechip" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", sector: "Finance", assetCategory: "Bluechip" },
  { symbol: "ADANIGREEN", name: "Adani Green", sector: "Energy", assetCategory: "Midcap" },
  { symbol: "KPITTECH", name: "KPIT Technologies", sector: "IT", assetCategory: "Midcap" },
  { symbol: "QUICKHEAL", name: "Quick Heal", sector: "IT", assetCategory: "Smallcap" },
];

function randomOHLC(startPrice) {
  let arr = [];
  let price = startPrice;
  for (let i = 0; i < 30; i++) {
    let open = price;
    let close = open + (Math.random() - 0.5) * 100;
    let high = Math.max(open, close) + Math.random() * 50;
    let low = Math.min(open, close) - Math.random() * 50;
    let volume = Math.floor(Math.random() * 10000 + 1000);
    arr.push({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });
    price = close;
  }
  return arr;
}

const getPremiumData = (symbol) => {
  const ratings = ["BUY", "BUY", "HOLD", "HOLD", "SELL"];
  return {
    marketCap: `${(Math.random() * 500 + 10).toFixed(1)}T`,
    peRatio: Number((Math.random() * 40 + 5).toFixed(2)),
    dividendYield: Number((Math.random() * 3).toFixed(2)),
    high52w: 0, // Will set below
    low52w: 0,
    description: `Leading company in the ${symbol} sector, known for its robust market position and innovative solutions.`,
    analystRating: ratings[Math.floor(Math.random() * ratings.length)],
  };
};

export async function seedStocks() {
  await StockModel.deleteMany({});
  for (const c of companies) {
    const startPrice = Math.random() * 5000 + 1000;
    const history = randomOHLC(startPrice);
    const high52 = Math.max(...history.map(h => h.high)) * 1.2;
    const low52 = Math.min(...history.map(h => h.low)) * 0.8;
    const premium = getPremiumData(c.symbol);

    await StockModel.create({
      ...c,
      currentPrice: startPrice,
      ohlc: history,
      ...premium,
      high52w: Number(high52.toFixed(2)),
      low52w: Number(low52.toFixed(2)),
    });
  }
  console.log("Seeded stocks with premium data!");
}
