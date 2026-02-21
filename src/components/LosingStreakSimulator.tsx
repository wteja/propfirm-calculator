import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { computeLosingStreak } from '../utils/monteCarlo';
import { formatCurrency, formatPct } from '../utils/calculations';
import { AccountConfig, CalculationResults } from '../types';
import { Flame, TrendingDown } from 'lucide-react';

interface Props {
  config: AccountConfig;
  results: CalculationResults;
}

export function LosingStreakSimulator({ config, results }: Props) {
  const [losses, setLosses] = useState(5);

  const streak = computeLosingStreak(config, losses);

  // Build chart data: show impact at each loss count
  const maxLosses = Math.ceil(results.maxDD / results.safeRiskPerTrade) + 2;
  const chartData = Array.from({ length: Math.min(maxLosses + 1, 30) }, (_, i) => {
    const s = computeLosingStreak(config, i);
    return {
      losses: i,
      drawdown: s.drawdownAmount,
      remaining: Math.max(s.remainingBuffer, 0),
      account: s.accountAfterLosses,
    };
  });

  const barColor = streak.hitMaxDD ? '#ef4444' : streak.isDangerous ? '#f59e0b' : '#6366f1';
  const statusText = streak.hitMaxDD
    ? 'MAX DRAWDOWN BREACHED'
    : streak.isDangerous
    ? 'DANGER ZONE'
    : 'Safe';
  const statusColor = streak.hitMaxDD ? 'text-red-400' : streak.isDangerous ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card">
        <div className="card-header">
          <Flame size={16} className="text-amber-400" />
          <h2 className="text-sm font-semibold text-slate-100">Losing Streak Simulator</h2>
        </div>
        <div className="card-body space-y-5">
          <p className="text-sm text-slate-400">
            See the drawdown impact of consecutive losing trades on your account.
          </p>

          {/* Slider input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Consecutive Losses
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setLosses(Math.max(0, losses - 1))}
                  className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-xl font-bold font-mono w-8 text-center">{losses}</span>
                <button
                  onClick={() => setLosses(Math.min(30, losses + 1))}
                  className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              value={losses}
              onChange={(e) => setLosses(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>0</span>
              <span>15</span>
              <span>30</span>
            </div>
          </div>

          {/* Status banner */}
          <div
            className={`p-3 rounded-lg border text-center ${
              streak.hitMaxDD
                ? 'bg-red-950/60 border-red-800'
                : streak.isDangerous
                ? 'bg-amber-950/60 border-amber-800'
                : 'bg-emerald-950/40 border-emerald-800/40'
            }`}
          >
            <span className={`text-sm font-bold ${statusColor}`}>{statusText}</span>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="metric-card">
              <p className="metric-label">Drawdown Amount</p>
              <p className="metric-value text-red-400">{formatCurrency(streak.drawdownAmount)}</p>
              <p className="text-xs text-slate-500 mt-0.5">{formatPct(streak.drawdownPct)} of balance</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Account Balance</p>
              <p className={`metric-value ${streak.hitMaxDD ? 'text-red-400' : 'text-slate-100'}`}>
                {formatCurrency(streak.accountAfterLosses)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">after {losses} losses</p>
            </div>
            <div className="metric-card col-span-2 md:col-span-1">
              <p className="metric-label">Remaining Buffer</p>
              <p className={`metric-value ${streak.isDangerous ? 'text-amber-400' : 'text-emerald-400'}`}>
                {streak.remainingBuffer > 0 ? formatCurrency(streak.remainingBuffer) : '$0'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {streak.remainingBuffer > 0 ? `${formatPct(streak.remainingPct)} of balance` : 'Exceeded!'}
              </p>
            </div>
          </div>

          {/* Progress bar: drawdown used */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Max Drawdown Used</span>
              <span style={{ color: barColor }}>
                {formatPct(Math.min((streak.drawdownAmount / results.maxDD) * 100, 100))}
              </span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((streak.drawdownAmount / results.maxDD) * 100, 100)}%`,
                  backgroundColor: barColor,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>$0</span>
              <span>{formatCurrency(results.maxDD)} (Max DD)</span>
            </div>
          </div>

          {/* Key risk info */}
          <div className="bg-slate-800/50 rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Risk per trade:</span>
              <span className="text-mono text-slate-200">{formatCurrency(results.safeRiskPerTrade)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Trades to hit MaxDD:</span>
              <span className="text-mono text-red-400">
                ~{Math.floor(results.maxDD / results.safeRiskPerTrade)} losses
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Trades to hit DailyDD:</span>
              <span className="text-mono text-amber-400">
                ~{Math.floor(results.dailyDD / results.safeRiskPerTrade)} losses
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart: cumulative drawdown over streak length */}
      <div className="card">
        <div className="card-header">
          <TrendingDown size={16} className="text-red-400" />
          <h2 className="text-sm font-semibold text-slate-100">Drawdown vs. Streak Length</h2>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
              <defs>
                <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="losses"
                tick={{ fill: '#64748b', fontSize: 11 }}
                label={{ value: 'Consecutive Losses', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                tickFormatter={(v: number) => formatCurrency(v)}
                tick={{ fill: '#64748b', fontSize: 10 }}
                width={80}
              />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                formatter={(value: number) => [formatCurrency(value), 'Drawdown']}
                labelFormatter={(l) => `${l} losses`}
              />
              <ReferenceLine
                y={results.maxDD}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{ value: 'Max DD', fill: '#ef4444', fontSize: 11, position: 'right' }}
              />
              <ReferenceLine
                y={results.dailyDD}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{ value: 'Daily DD', fill: '#f59e0b', fontSize: 11, position: 'right' }}
              />
              <ReferenceLine
                x={losses}
                stroke="#6366f1"
                strokeDasharray="3 3"
              />
              <Area
                type="monotone"
                dataKey="drawdown"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#ddGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
