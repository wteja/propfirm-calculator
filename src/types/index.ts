export type TradingMode = 'conservative' | 'normal' | 'aggressive' | 'custom';

export interface AccountConfig {
  id: string;
  name: string;
  accountBalance: number;
  dailyDrawdownPct: number;
  maxDrawdownPct: number;
  profitTargetPct: number;
  consistencyRulePct: number;
  consistencyRuleEnabled: boolean;
  winRate: number;          // 0–100
  riskRewardRatio: number;
  tradesPerDay: number;
  mode: TradingMode;
  customRiskPerTrade: number; // used only when mode === 'custom'
}

export interface Warning {
  type: 'danger' | 'warning' | 'info';
  message: string;
}

export interface CalculationResults {
  dailyDD: number;
  maxDD: number;
  profitTarget: number;
  maxDailyProfit: number;
  baseRisk: number;
  safeRiskPerTrade: number;
  rewardPerTrade: number;
  expectancy: number;
  estimatedTradesToTarget: number;
  estimatedDaysToTarget: number;
  riskOfRuin: number;
  riskPct: number;
  warnings: Warning[];
}

export interface MonteCarloResult {
  successRate: number;
  medianTrades: number;
  medianDays: number;
  percentile10Trades: number;
  percentile90Trades: number;
  equityCurves: number[][];
  medianEquityCurve: number[];
  profitTarget: number;
  maxDD: number;
}

export interface LosingStreakResult {
  accountAfterLosses: number;
  drawdownAmount: number;
  drawdownPct: number;
  remainingBuffer: number;
  remainingPct: number;
  isDangerous: boolean;
  hitMaxDD: boolean;
}
