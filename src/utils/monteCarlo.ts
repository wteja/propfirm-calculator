import { AccountConfig, MonteCarloResult } from '../types';
import { calculate } from './calculations';

const DISPLAY_CURVES = 30;
const SAFETY_LIMIT = 20000;

export function runMonteCarlo(config: AccountConfig, runs = 1000): MonteCarloResult {
  const results = calculate(config);
  const { safeRiskPerTrade, rewardPerTrade, profitTarget, maxDD, dailyDD } = results;
  const tradesPerDay = config.tradesPerDay;

  let successes = 0;
  const successTrades: number[] = [];
  const equityCurves: number[][] = [];

  for (let i = 0; i < runs; i++) {
    let equity = 0;
    let trades = 0;
    let success = false;
    const curve: number[] = [0];

    let dayOpen = 0;
    let tradeInDay = 0;

    while (trades < SAFETY_LIMIT) {
      // Start-of-day reset
      if (tradeInDay === 0) dayOpen = equity;

      trades++;
      tradeInDay++;

      const win = Math.random() < config.winRate / 100;
      equity += win ? rewardPerTrade : -safeRiskPerTrade;

      if (i < DISPLAY_CURVES) curve.push(equity);

      // Profit target reached
      if (equity >= profitTarget) { success = true; break; }

      // Max DD breach (fixed floor from starting balance)
      if (equity <= -maxDD) break;

      // Daily DD breach (fixed from day open)
      if (equity <= dayOpen - dailyDD) break;

      // End of day
      if (tradeInDay >= tradesPerDay) tradeInDay = 0;
    }

    if (success) { successes++; successTrades.push(trades); }
    if (i < DISPLAY_CURVES) equityCurves.push(curve);
  }

  const successRate = (successes / runs) * 100;

  const sorted = [...successTrades].sort((a, b) => a - b);
  const medianTrades       = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;
  const percentile10Trades = sorted[Math.floor(sorted.length * 0.1)] ?? 0;
  const percentile90Trades = sorted[Math.floor(sorted.length * 0.9)] ?? 0;
  const medianDays         = medianTrades > 0 ? Math.ceil(medianTrades / tradesPerDay) : 0;

  const maxLen = Math.max(...equityCurves.map((c) => c.length), 1);
  const medianEquityCurve: number[] = [];
  for (let step = 0; step < maxLen; step++) {
    const vals = equityCurves
      .map((c) => c[Math.min(step, c.length - 1)])
      .sort((a, b) => a - b);
    medianEquityCurve.push(vals[Math.floor(vals.length / 2)]);
  }

  return {
    successRate, medianTrades, medianDays,
    percentile10Trades, percentile90Trades,
    equityCurves, medianEquityCurve,
    profitTarget, maxDD,
  };
}

export function computeLosingStreak(config: AccountConfig, losses: number) {
  const { safeRiskPerTrade, maxDD, dailyDD } = calculate(config);
  const drawdownAmount     = losses * safeRiskPerTrade;
  const drawdownPct        = (drawdownAmount / config.accountBalance) * 100;
  const accountAfterLosses = config.accountBalance - drawdownAmount;
  const remainingBuffer    = maxDD - drawdownAmount;
  const remainingPct       = ((maxDD - drawdownAmount) / config.accountBalance) * 100;
  return {
    accountAfterLosses,
    drawdownAmount,
    drawdownPct,
    remainingBuffer,
    remainingPct,
    isDangerous: remainingBuffer < maxDD * 0.3,
    hitMaxDD: drawdownAmount >= maxDD,
    dailyDD,
  };
}
