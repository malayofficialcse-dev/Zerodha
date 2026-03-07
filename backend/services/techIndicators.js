/**
 * Compute Relative Strength Index (RSI)
 * @param {Array} data - Array of closing prices
 * @param {number} period - RSI period (default 14)
 * @returns {Array} - RSI values
 */
export const calculateRSI = (data, period = 14) => {
  if (data.length <= period) return Array(data.length).fill(null);

  const rsi = Array(data.length).fill(null);
  let gains = 0;
  let losses = 0;

  // Initial Average Gain/Loss
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsi[period] = 100 - (100 / (1 + avgGain / (avgLoss || 1)));

  // Smoothed RSI
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgGain / (avgLoss || 1);
    rsi[i] = 100 - (100 / (1 + rs));
  }

  return rsi.map(val => val !== null ? Number(val.toFixed(2)) : null);
};

/**
 * Compute Moving Average Convergence Divergence (MACD)
 * @param {Array} data - Array of closing prices
 * @param {number} slow - Slow EMA period (26)
 * @param {number} fast - Fast EMA period (12)
 * @param {number} signal - Signal line EMA period (9)
 */
export const calculateMACD = (data, slow = 26, fast = 12, signal = 9) => {
  const emaFast = calculateEMA(data, fast);
  const emaSlow = calculateEMA(data, slow);

  const macdLine = emaFast.map((f, i) => (f !== null && emaSlow[i] !== null ? Number((f - emaSlow[i]).toFixed(2)) : null));
  
  // Signal line is EMA(9) of MACD Line
  const validMacdValues = macdLine.filter(v => v !== null);
  const signalLinesRaw = calculateEMA(validMacdValues, signal);
  
  // Align signal line with original data
  const nullCount = macdLine.length - signalLinesRaw.length;
  const signalLine = [...Array(nullCount).fill(null), ...signalLinesRaw];

  const histogram = macdLine.map((m, i) => (m !== null && signalLine[i] !== null ? Number((m - signalLine[i]).toFixed(2)) : null));

  return {
    macd: macdLine,
    signal: signalLine,
    histogram: histogram
  };
};

/**
 * Compute Exponential Moving Average (EMA)
 */
const calculateEMA = (data, period) => {
  if (data.length < period) return Array(data.length).fill(null);

  const ema = Array(data.length).fill(null);
  const k = 2 / (period + 1);

  // Initial SMA as first EMA
  let sma = 0;
  for (let i = 0; i < period; i++) sma += data[i];
  ema[period - 1] = sma / period;

  for (let i = period; i < data.length; i++) {
    ema[i] = (data[i] - ema[i - 1]) * k + ema[i - 1];
  }

  return ema.map(v => v !== null ? Number(v.toFixed(2)) : null);
};
