import { CalculationResults, AccountConfig } from '../types';
import { formatCurrency, formatNumber, formatPct } from '../utils/calculations';
import { BarChart3, Target, TrendingUp, Shield, Clock, Percent, DollarSign, Zap } from 'lucide-react';

interface Props {
  results: CalculationResults;
  config: AccountConfig;
}

interface MetricProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}

function Metric({ label, value, sub, color = 'text-slate-100', icon, highlight }: MetricProps) {
  return (
    <div className={`metric-card ${highlight ? 'border-indigo-700/50 bg-indigo-950/30' : ''}`}>
      {icon && <div className="text-slate-500 mb-2">{icon}</div>}
      <p className="metric-label">{label}</p>
      <p className={`metric-value ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export function ResultsPanel({ results, config }: Props) {
  const {
    dailyDD, maxDD, profitTarget, maxDailyProfit,
    baseRisk, safeRiskPerTrade, rewardPerTrade,
    expectancy, estimatedTradesToTarget, estimatedDaysToTarget,
    riskOfRuin, riskPct, warnings,
  } = results;

  const expectancyColor = expectancy > 0 ? 'text-emerald-400' : 'text-red-400';
  const rorColor = riskOfRuin < 5 ? 'text-emerald-400' : riskOfRuin < 20 ? 'text-amber-400' : 'text-red-400';
  const hasDanger = warnings.some((w) => w.type === 'danger');

  const modeLabel =
    config.mode === 'conservative' ? '÷1.5' : config.mode === 'aggressive' ? '×1.2' : '×1.0';

  return (
    <div className="card animate-slide-up">
      <div className="card-header">
        <BarChart3 size={16} className="text-indigo-400" />
        <h2 className="text-sm font-semibold text-slate-100">Risk Analysis Results</h2>
        {hasDanger && (
          <span className="ml-auto badge bg-red-900/60 text-red-400 border border-red-800 animate-pulse">
            Risk Alert
          </span>
        )}
      </div>

      <div className="card-body space-y-4">
        {/* Drawdown limits */}
        <section>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 font-medium">Drawdown Limits</p>
          <div className="grid grid-cols-2 gap-3">
            <Metric
              label="Daily Drawdown"
              value={formatCurrency(dailyDD)}
              sub={`${config.dailyDrawdownPct}% of balance`}
              icon={<Shield size={14} />}
            />
            <Metric
              label="Max Drawdown"
              value={formatCurrency(maxDD)}
              sub={`${config.maxDrawdownPct}% of balance`}
              icon={<Shield size={14} />}
            />
          </div>
        </section>

        {/* Profit targets */}
        <section>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 font-medium">Profit Targets</p>
          <div className="grid grid-cols-2 gap-3">
            <Metric
              label="Profit Target"
              value={formatCurrency(profitTarget)}
              sub={`${config.profitTargetPct}% of balance`}
              color="text-emerald-400"
              icon={<Target size={14} />}
            />
            <Metric
              label="Max Daily Profit"
              value={config.consistencyRuleEnabled ? formatCurrency(maxDailyProfit) : 'Unlimited'}
              sub={config.consistencyRuleEnabled ? `Consistency rule ${config.consistencyRulePct}%` : 'Consistency rule off'}
              color={config.consistencyRuleEnabled ? 'text-slate-100' : 'text-slate-500'}
              icon={<Target size={14} />}
            />
          </div>
        </section>

        {/* Risk per trade */}
        <section>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 font-medium">
            Position Sizing — Mode: <span className="text-indigo-400">{config.mode} ({modeLabel})</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Metric
              label="Base Risk/Trade"
              value={formatCurrency(baseRisk)}
              sub="min(MaxDD/5, DD/3, MaxDD/8)"
              icon={<DollarSign size={14} />}
            />
            <Metric
              label="Adjusted Risk/Trade"
              value={formatCurrency(safeRiskPerTrade)}
              sub={`${formatPct(riskPct)} of account`}
              color={riskPct > 2 ? 'text-amber-400' : 'text-indigo-400'}
              icon={<DollarSign size={14} />}
              highlight
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Metric
              label="Reward/Trade"
              value={formatCurrency(rewardPerTrade)}
              sub={`1:${config.riskRewardRatio} R:R`}
              color="text-emerald-400"
              icon={<TrendingUp size={14} />}
            />
            <Metric
              label="Risk % of Account"
              value={formatPct(riskPct)}
              sub="per trade"
              color={riskPct > 2 ? 'text-red-400' : riskPct > 1 ? 'text-amber-400' : 'text-emerald-400'}
              icon={<Percent size={14} />}
            />
          </div>
        </section>

        {/* Expectancy */}
        <section>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 font-medium">Edge & Expectancy</p>
          <div className="grid grid-cols-2 gap-3">
            <Metric
              label="Expected Value/Trade"
              value={formatCurrency(expectancy)}
              sub="(WR × Reward) − (LR × Risk)"
              color={expectancyColor}
              icon={<Zap size={14} />}
              highlight
            />
            <Metric
              label="Risk of Ruin"
              value={formatPct(riskOfRuin)}
              sub="probability of blowout"
              color={rorColor}
              icon={<Shield size={14} />}
            />
          </div>
        </section>

        {/* Time projections */}
        <section>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 font-medium">
            Time to Target
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Metric
              label="Est. Trades"
              value={estimatedTradesToTarget === Infinity ? '∞' : formatNumber(estimatedTradesToTarget)}
              sub="to reach profit target"
              color={expectancy > 0 ? 'text-slate-100' : 'text-red-400'}
              icon={<BarChart3 size={14} />}
            />
            <Metric
              label="Est. Trading Days"
              value={estimatedDaysToTarget === Infinity ? '∞' : formatNumber(estimatedDaysToTarget)}
              sub={`at ${config.tradesPerDay} trades/day`}
              color={expectancy > 0 ? 'text-slate-100' : 'text-red-400'}
              icon={<Clock size={14} />}
            />
          </div>
        </section>

        {/* Progress bar: risk of ruin */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Risk of Ruin</span>
            <span className={rorColor}>{formatPct(riskOfRuin)}</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                riskOfRuin < 5 ? 'bg-emerald-500' : riskOfRuin < 20 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(riskOfRuin, 100)}%` }}
            />
          </div>
        </div>

        {/* Progress bar: days to target */}
        {expectancy > 0 && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Probability of Positive EV</span>
              <span className="text-emerald-400">Positive</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${config.winRate}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
