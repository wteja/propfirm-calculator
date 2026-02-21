import { useState } from 'react';
import { calculate, formatCurrency, formatNumber, formatPct } from '../utils/calculations';
import { runMonteCarlo } from '../utils/monteCarlo';
import { AccountConfig } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Plus, Trash2, Layers, Play } from 'lucide-react';
import { DEFAULT_CONFIG } from '../utils/calculations';
import { v4 as uuid } from '../utils/uuid';

interface Props {
  baseConfig: AccountConfig;
  accounts: AccountConfig[];
  onAccountsChange: (a: AccountConfig[]) => void;
}

interface CompResult {
  id: string;
  name: string;
  successRate: number;
  medianDays: number;
  riskPerTrade: number;
  expectancy: number;
  riskOfRuin: number;
}

const COLORS = ['#6366f1', '#22d3ee', '#10b981', '#f59e0b', '#f43f5e'];

export function MultiAccountComparison({ baseConfig, accounts, onAccountsChange }: Props) {
  const [compResults, setCompResults] = useState<CompResult[]>([]);
  const [simulating, setSimulating] = useState(false);

  const allAccounts = [{ ...baseConfig, name: `${baseConfig.name} (current)` }, ...accounts];

  const addAccount = () => {
    const newAcc: AccountConfig = {
      ...DEFAULT_CONFIG,
      id: uuid(),
      name: `Account ${accounts.length + 2}`,
    };
    onAccountsChange([...accounts, newAcc]);
  };

  const removeAccount = (id: string) => {
    onAccountsChange(accounts.filter((a) => a.id !== id));
    setCompResults((prev) => prev.filter((r) => r.id !== id));
  };

  const updateAccount = (id: string, field: keyof AccountConfig, value: AccountConfig[keyof AccountConfig]) => {
    onAccountsChange(accounts.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  };

  const runComparison = () => {
    setSimulating(true);
    setTimeout(() => {
      const results: CompResult[] = allAccounts.map((acc) => {
        const calc = calculate(acc);
        const mc = runMonteCarlo(acc, 500);
        return {
          id: acc.id,
          name: acc.name,
          successRate: mc.successRate,
          medianDays: mc.medianDays,
          riskPerTrade: calc.safeRiskPerTrade,
          expectancy: calc.expectancy,
          riskOfRuin: calc.riskOfRuin,
        };
      });
      setCompResults(results);
      setSimulating(false);
    }, 50);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header card */}
      <div className="card">
        <div className="card-header">
          <Layers size={16} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-100">Multi-Account Comparison</h2>
        </div>
        <div className="card-body space-y-4">
          <p className="text-sm text-slate-400">
            Compare your current account configuration against alternative setups. The current account is always
            included automatically.
          </p>

          {/* Account list */}
          <div className="space-y-3">
            {/* Base account (read-only preview) */}
            <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-400">
                  {baseConfig.name} (current)
                </span>
                <span className="badge bg-indigo-900/60 text-indigo-400 border border-indigo-800">Active</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400">
                <span>Balance: {formatCurrency(baseConfig.accountBalance)}</span>
                <span>MaxDD: {baseConfig.maxDrawdownPct}%</span>
                <span>Target: {baseConfig.profitTargetPct}%</span>
                <span>WR: {baseConfig.winRate}%</span>
                <span>RR: 1:{baseConfig.riskRewardRatio}</span>
              </div>
            </div>

            {/* Additional accounts */}
            {accounts.map((acc, idx) => (
              <div key={acc.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <input
                    type="text"
                    value={acc.name}
                    onChange={(e) => updateAccount(acc.id, 'name', e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-300 border-none outline-none w-40"
                  />
                  <button onClick={() => removeAccount(acc.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { label: 'Balance', key: 'accountBalance' as const, prefix: '$', step: 1000, min: 1000 },
                    { label: 'MaxDD %', key: 'maxDrawdownPct' as const, suffix: '%', step: 0.5, min: 0.1 },
                    { label: 'DailyDD %', key: 'dailyDrawdownPct' as const, suffix: '%', step: 0.5, min: 0.1 },
                    { label: 'Target %', key: 'profitTargetPct' as const, suffix: '%', step: 0.5, min: 0.1 },
                    { label: 'Win Rate', key: 'winRate' as const, suffix: '%', step: 1, min: 1 },
                    { label: 'R:R', key: 'riskRewardRatio' as const, prefix: '1:', step: 0.1, min: 0.1 },
                  ].map(({ label, key, prefix, suffix, step, min }) => (
                    <div key={key}>
                      <label className="text-xs text-slate-500">{label}</label>
                      <div className="flex items-center gap-1 mt-0.5">
                        {prefix && <span className="text-xs text-slate-500">{prefix}</span>}
                        <input
                          type="number"
                          value={acc[key] as number}
                          min={min}
                          step={step}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            if (!isNaN(v)) updateAccount(acc.id, key, v);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        {suffix && <span className="text-xs text-slate-500">{suffix}</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 text-xs text-slate-600">Account {idx + 2}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {accounts.length < 4 && (
              <button onClick={addAccount} className="btn-secondary">
                <Plus size={14} />
                Add Account
              </button>
            )}
            <button onClick={runComparison} disabled={simulating} className="btn-primary">
              <Play size={14} />
              {simulating ? 'Comparing…' : 'Run Comparison'}
            </button>
          </div>
        </div>
      </div>

      {/* Results table */}
      {compResults.length > 0 && (
        <div className="card">
          <div className="card-header">
            <Layers size={16} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-100">Comparison Results (500 runs each)</h2>
          </div>
          <div className="card-body space-y-4">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left">
                    {['Account', 'Success Rate', 'Median Days', 'Risk/Trade', 'Expectancy', 'RoR'].map((h) => (
                      <th key={h} className="pb-2 pr-4 text-xs text-slate-500 uppercase tracking-wide font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {compResults.map((r, i) => (
                    <tr key={r.id} className="text-sm">
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-slate-200 font-medium whitespace-nowrap">{r.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`font-mono font-medium ${r.successRate >= 70 ? 'text-emerald-400' : r.successRate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                          {formatPct(r.successRate, 1)}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-slate-300">
                        {r.medianDays > 0 ? formatNumber(r.medianDays) : 'N/A'}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-slate-300">
                        {formatCurrency(r.riskPerTrade)}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`font-mono font-medium ${r.expectancy > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatCurrency(r.expectancy)}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono">
                        <span className={r.riskOfRuin < 10 ? 'text-emerald-400' : r.riskOfRuin < 25 ? 'text-amber-400' : 'text-red-400'}>
                          {formatPct(r.riskOfRuin, 1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bar chart: success rates */}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Success Rate Comparison</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={compResults} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 12) + '…' : v} />
                  <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [`${v.toFixed(1)}%`, 'Success Rate']}
                  />
                  <Bar dataKey="successRate" radius={[4, 4, 0, 0]}>
                    {compResults.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
