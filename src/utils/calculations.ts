import { AccountConfig, CalculationResults, Warning } from '../types';

export const DEFAULT_CONFIG: AccountConfig = {
  id: 'default',
  name: 'My Account',
  accountBalance: 100000,
  dailyDrawdownPct: 5,
  maxDrawdownPct: 10,
  profitTargetPct: 10,
  consistencyRulePct: 20,
  consistencyRuleEnabled: false,
  winRate: 60,
  riskRewardRatio: 2,
  tradesPerDay: 3,
  mode: 'normal',
  customRiskPerTrade: 0,
};

export function calculate(config: AccountConfig): CalculationResults {
  const {
    accountBalance,
    dailyDrawdownPct,
    maxDrawdownPct,
    profitTargetPct,
    consistencyRulePct,
    consistencyRuleEnabled,
    winRate,
    riskRewardRatio,
    tradesPerDay,
    mode,
    customRiskPerTrade,
  } = config;

  const wr = winRate / 100;

  // Core dollar values
  const dailyDD = accountBalance * (dailyDrawdownPct / 100);
  const maxDD   = accountBalance * (maxDrawdownPct  / 100);
  const profitTarget = accountBalance * (profitTargetPct / 100);

  // Consistency rule: max single-day profit = X% of total profit target
  const maxDailyProfit = consistencyRuleEnabled
    ? profitTarget * (consistencyRulePct / 100)
    : Infinity;

  // Auto-calculated base risk — most conservative of three limits
  const baseRisk = Math.min(maxDD / 5, dailyDD / 3, maxDD / 8);

  // Final risk per trade — respects mode
  let safeRiskPerTrade: number;
  if (mode === 'custom') {
    safeRiskPerTrade = customRiskPerTrade > 0 ? customRiskPerTrade : baseRisk;
  } else if (mode === 'conservative') {
    safeRiskPerTrade = baseRisk / 1.5;
  } else if (mode === 'aggressive') {
    safeRiskPerTrade = baseRisk * 1.2;
  } else {
    safeRiskPerTrade = baseRisk; // normal
  }

  const rewardPerTrade = safeRiskPerTrade * riskRewardRatio;

  // Expectancy per trade
  const expectancy = wr * rewardPerTrade - (1 - wr) * safeRiskPerTrade;

  // Projected trades / days to target
  const estimatedTradesToTarget = expectancy > 0 ? Math.ceil(profitTarget / expectancy) : Infinity;
  const estimatedDaysToTarget   = estimatedTradesToTarget === Infinity
    ? Infinity
    : Math.ceil(estimatedTradesToTarget / tradesPerDay);

  // Risk as % of account
  const riskPct = (safeRiskPerTrade / accountBalance) * 100;

  // Risk of Ruin (gambler's ruin approximation for non-symmetric bets)
  let riskOfRuin = 100;
  if (expectancy > 0) {
    const lossRate     = 1 - wr;
    const adjustedRatio = lossRate / (wr * riskRewardRatio);
    const units        = Math.floor(maxDD / safeRiskPerTrade);
    riskOfRuin = adjustedRatio < 1 ? Math.min(100, Math.pow(adjustedRatio, units) * 100) : 100;
  }

  // ── Warnings ──────────────────────────────────────────────────────────
  const warnings: Warning[] = [];

  if (expectancy <= 0) {
    warnings.push({
      type: 'danger',
      message: 'Negative expectancy — this strategy will lose money over time. Increase win rate or R:R ratio.',
    });
  }

  if (safeRiskPerTrade * 5 >= maxDD) {
    warnings.push({
      type: 'danger',
      message: 'Five consecutive losses will breach your Max Drawdown limit.',
    });
  }

  if (riskPct > 1 && maxDrawdownPct < 8) {
    warnings.push({
      type: 'danger',
      message: `Risk per trade (${riskPct.toFixed(2)}%) is too high relative to Max DD (${maxDrawdownPct}%). Reduce risk immediately.`,
    });
  }

  if (riskOfRuin > 25) {
    warnings.push({
      type: 'warning',
      message: `Risk of Ruin is ${riskOfRuin.toFixed(1)}%. Consider reducing position size.`,
    });
  }

  if (mode === 'aggressive') {
    warnings.push({
      type: 'warning',
      message: 'Aggressive mode increases risk by 20%. Monitor drawdown carefully.',
    });
  }

  if (mode === 'custom' && customRiskPerTrade > baseRisk * 1.2) {
    warnings.push({
      type: 'warning',
      message: `Custom risk $${customRiskPerTrade.toFixed(0)} exceeds the recommended safe limit of $${(baseRisk * 1.2).toFixed(0)}.`,
    });
  }

  if (consistencyRuleEnabled && consistencyRulePct < 30 && profitTargetPct > 0) {
    warnings.push({
      type: 'info',
      message: `Tight consistency rule (${consistencyRulePct}%) — no single winning day should exceed $${maxDailyProfit.toFixed(0)}.`,
    });
  }

  return {
    dailyDD,
    maxDD,
    profitTarget,
    maxDailyProfit,
    baseRisk,
    safeRiskPerTrade,
    rewardPerTrade,
    expectancy,
    estimatedTradesToTarget,
    estimatedDaysToTarget,
    riskOfRuin,
    riskPct,
    warnings,
  };
}

export function formatCurrency(value: number): string {
  if (!isFinite(value)) return '∞';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, decimals = 0): string {
  if (!isFinite(value)) return '∞';
  return value.toFixed(decimals);
}

export function formatPct(value: number, decimals = 2): string {
  if (!isFinite(value)) return '∞%';
  return `${value.toFixed(decimals)}%`;
}
