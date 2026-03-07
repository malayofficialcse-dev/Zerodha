/**
 * Mathematical utilities for Risk Analytics
 */

/**
 * Calculate Sharpe Ratio
 * (Mean Return - Risk Free Rate) / StdDev(Returns)
 * @param {number[]} returns - Array of periodic returns
 * @param {number} riskFreeRate - Annual risk-free rate (e.g., 0.05 for 5%)
 * @returns {number}
 */
export const calculateSharpeRatio = (returns, riskFreeRate = 0.05) => {
  if (returns.length < 2) return 0;
  
  const periodicRF = riskFreeRate / 252; // daily risk free rate approx
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0;
  
  return Number(((meanReturn - periodicRF) / stdDev * Math.sqrt(252)).toFixed(2)); // Annualized
};

/**
 * Calculate Maximum Drawdown
 * (Peak - Trough) / Peak
 * @param {number[]} prices - Array of portfolio values over time
 * @returns {number} - Percentage (e.g., 15.5 for 15.5%)
 */
export const calculateMaxDrawdown = (prices) => {
  if (prices.length < 2) return 0;
  
  let maxDD = 0;
  let peak = -Infinity;
  
  for (const price of prices) {
    if (price > peak) peak = price;
    const dd = (peak - price) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  
  return Number((maxDD * 100).toFixed(2));
};

/**
 * Calculate Beta
 * Covariance(Asset, Index) / Variance(Index)
 * @param {number[]} assetReturns 
 * @param {number[]} indexReturns 
 */
export const calculateBeta = (assetReturns, indexReturns) => {
  const len = Math.min(assetReturns.length, indexReturns.length);
  if (len < 2) return 1;

  const aMean = assetReturns.slice(-len).reduce((a, b) => a + b, 0) / len;
  const iMean = indexReturns.slice(-len).reduce((a, b) => a + b, 0) / len;

  let covariance = 0;
  let iVariance = 0;

  for (let i = 0; i < len; i++) {
    const aDiff = assetReturns[assetReturns.length - len + i] - aMean;
    const iDiff = indexReturns[indexReturns.length - len + i] - iMean;
    covariance += aDiff * iDiff;
    iVariance += iDiff * iDiff;
  }

  if (iVariance === 0) return 1;
  return Number((covariance / iVariance).toFixed(2));
};

/**
 * Group holdings by sector
 */
export const getSectorExposure = (holdings, stockMetadata) => {
  const sectorMap = {};
  let totalValue = 0;

  holdings.forEach(h => {
    const metadata = stockMetadata.find(s => s.name === h.name);
    const sector = metadata ? metadata.sector : "Unknown";
    const value = h.qty * h.price;
    
    sectorMap[sector] = (sectorMap[sector] || 0) + value;
    totalValue += value;
  });

  return Object.keys(sectorMap).map(sector => ({
    name: sector,
    value: Number(sectorMap[sector].toFixed(2)),
    percentage: Number(((sectorMap[sector] / totalValue) * 100).toFixed(2))
  }));
};
