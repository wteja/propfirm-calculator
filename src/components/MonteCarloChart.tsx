import { useState, useMemo, Dispatch, SetStateAction } from 'react';
import {
  ComposedChart, Line, ReferenceLine, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { runMonteCarlo } from '../utils/monteCarlo';
import { formatCurrency, formatNumber, formatPct } from '../utils/calculations';
import { AccountConfig, MonteCarloResult } from '../types';
import { Dices, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Props {
  config: AccountConfig;
  mcResult: MonteCarloResult | null;
  onResult: Dispatch<SetStateAction<MonteCarloResult | null>>;
}

const RUNS = 1000;

export function MonteCarloChart({ config, mcResult, onResult }: Props) {
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    // Defer to allow UI to update
    setTimeout(() => {
      const r = runMonteCarlo(config, RUNS);
      onResult(r);
      setRunning(false);
    }, 50);
  };

  // Build chart data from equity curves + median
  const chartData = useMemo(() => {
    if (!mcResult) return [];
    const { equityCurves, medianEquityCurve } = mcResult;
    const maxLen = Math.max(medianEquityCurve.length, 1);

    return Array.from({ length: maxLen }, (_, i) => {
      const point: Record<string, number> = { step: i, median: medianEquityCurve[i] };
      equityCurves.forEach((curve, ci) => {
        point[`run${ci}`] = curve[Math.min(i, curve.length - 1)];
      });
      return point;
    });
  }, [mcResult]);

  const runKeys = useMemo(
    () => (mcResult ? mcResult.equityCurves.map((_, i) => `run${i}`) : []),
    [mcResult]
  );

  const successColor = mcResult
    ? mcResult.successRate >= 70 ? '#10b981' : mcResult.successRate >= 50 ? '#f59e0b' : '#ef4444'
    : '#6366f1';

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Controls */}
      <div className="card">
        <div className="card-header">
          <Dices size={16} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-100">Monte Carlo Simulation</h2>
          <span className="ml-2 text-xs text-slate-500">{RUNS.toLocaleString()} runs</span>
        </div>
        <div className="card-body space-y-4">
          <p className="text-sm text-slate-400">
            Simulates {RUNS.toLocaleString()} randomized trading sequences using your current configuration.
            Each run plays out until the profit target is reached or a drawdown limit is hit.
          </p>

          <div className="flex items-center gap-3">
            <button onClick={run} disabled={running} className="btn-primary">
              <Dices size={15} />
              {running ? 'Simulating…' : mcResult ? 'Re-run Simulation' : 'Run Simulation'}
            </button>
            {running && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                Computing…
              </div>
            )}
          </div>
        </div>
      </div>

      {mcResult && (
        <>
          {/* Summary metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="metric-card text-center">
              <div className="flex justify-center mb-2">
                {mcResult.successRate >= 60
                  ? <CheckCircle size={20} className="text-emerald-400" />
                  : <XCircle size={20} className="text-red-400" />}
              </div>
              <p className="metric-label">Success Rate</p>
              <p className="metric-value" style={{ color: successColor }}>
                {formatPct(mcResult.successRate, 1)}
              </p>
              <p className="text-xs text-slate-500 mt-1">of {RUNS} runs</p>
            </div>

            <div className="metric-card text-center">
              <div className="flex justify-center mb-2">
                <TrendingUp size={20} className="text-indigo-400" />
              </div>
              <p className="metric-label">Median Trades</p>
              <p className="metric-value">
                {mcResult.medianTrades > 0 ? formatNumber(mcResult.medianTrades) : 'N/A'}
              </p>
              <p className="text-xs text-slate-500 mt-1">to reach target</p>
            </div>

            <div className="metric-card text-center">
              <div className="flex justify-center mb-2">
                <Clock size={20} className="text-sky-400" />
              </div>
              <p className="metric-label">Median Days</p>
              <p className="metric-value text-sky-400">
                {mcResult.medianDays > 0 ? formatNumber(mcResult.medianDays) : 'N/A'}
              </p>
              <p className="text-xs text-slate-500 mt-1">trading days</p>
            </div>

            <div className="metric-card text-center">
              <div className="flex justify-center mb-2">
                <Dices size={20} className="text-amber-400" />
              </div>
              <p className="metric-label">Range (P10–P90)</p>
              <p className="metric-value text-amber-400 text-base">
                {mcResult.percentile10Trades > 0 ? formatNumber(mcResult.percentile10Trades) : '—'}
                {' – '}
                {mcResult.percentile90Trades > 0 ? formatNumber(mcResult.percentile90Trades) : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-1">trades (success only)</p>
            </div>
          </div>

          {/* Equity curves chart */}
          <div className="card">
            <div className="card-header">
              <TrendingUp size={16} className="text-indigo-400" />
              <h2 className="text-sm font-semibold text-slate-100">Simulated Equity Curves</h2>
              <span className="ml-auto text-xs text-slate-500">
                Showing {mcResult.equityCurves.length} sample paths + median
              </span>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="step"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    label={{ value: 'Trade #', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 11 }}
                  />
                  <YAxis
                    tickFormatter={(v: number) => formatCurrency(v)}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(value: number, name: string) =>
                      name === 'median'
                        ? [formatCurrency(value), 'Median']
                        : [formatCurrency(value), `Run ${name.replace('run', '')}`]
                    }
                    itemStyle={{ display: 'none' }}
                    labelFormatter={(label) => `Trade ${label}`}
                  />

                  {/* Reference lines */}
                  <ReferenceLine
                    y={mcResult.profitTarget}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{ value: 'Target', fill: '#10b981', fontSize: 11, position: 'right' }}
                  />
                  <ReferenceLine
                    y={-mcResult.maxDD}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    label={{ value: 'Max DD', fill: '#ef4444', fontSize: 11, position: 'right' }}
                  />

                  {/* Sample runs (faded) */}
                  {runKeys.map((key) => (
                    <Line
                      key={key}
                      dataKey={key}
                      stroke="#6366f1"
                      strokeWidth={1}
                      strokeOpacity={0.12}
                      dot={false}
                      isAnimationActive={false}
                      legendType="none"
                    />
                  ))}

                  {/* Median line */}
                  <Line
                    dataKey="median"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                    name="median"
                  />

                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    formatter={(value) => (value === 'median' ? 'Median Equity Curve' : '')}
                  />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Success rate visual */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Success Rate ({RUNS} runs)</span>
                  <span style={{ color: successColor }}>{formatPct(mcResult.successRate, 1)}</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${mcResult.successRate}%`, backgroundColor: successColor }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  {mcResult.successRate >= 70 ? '✓ Good probability of passing the challenge.' :
                   mcResult.successRate >= 50 ? '⚠ Moderate risk — consider adjusting parameters.' :
                   '✗ High probability of failure — review your setup.'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
