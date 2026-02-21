import { AccountConfig, TradingMode } from '../types';
import { InputField, NumberInput, SelectInput } from './InputField';
import { Settings2, Sliders } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

interface Props {
  config: AccountConfig;
  onChange: (c: AccountConfig) => void;
}

const MODE_OPTIONS: { value: TradingMode; label: string }[] = [
  { value: 'conservative', label: 'Conservative (Risk ÷ 1.5)' },
  { value: 'normal',       label: 'Normal' },
  { value: 'aggressive',   label: 'Aggressive (Risk × 1.2)' },
  { value: 'custom',       label: 'Custom (enter $ amount)' },
];

export function AccountForm({ config, onChange }: Props) {
  const set = <K extends keyof AccountConfig>(key: K, value: AccountConfig[K]) =>
    onChange({ ...config, [key]: value });

  // Suggest a safe default when user first switches to custom
  const suggestedRisk = (() => {
    const dailyDD = config.accountBalance * (config.dailyDrawdownPct / 100);
    const maxDD   = config.accountBalance * (config.maxDrawdownPct  / 100);
    return Math.min(maxDD / 5, dailyDD / 3, maxDD / 8);
  })();

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <Settings2 size={16} className="text-indigo-400" />
        <h2 className="text-sm font-semibold text-slate-100">Account Configuration</h2>
      </div>

      <div className="card-body space-y-5">
        {/* Account name + Balance */}
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Account Name">
            <input
              type="text"
              value={config.name}
              onChange={(e) => set('name', e.target.value)}
              className="input-base"
              placeholder="e.g. FTMO $100k"
            />
          </InputField>
          <InputField label="Account Balance" hint="USD">
            <NumberInput
              value={config.accountBalance}
              onChange={(v) => set('accountBalance', v)}
              min={1000}
              step={1000}
              prefix="$"
            />
          </InputField>
        </div>

        {/* Daily + Max Drawdown */}
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Daily Drawdown" hint="% of balance">
            <NumberInput
              value={config.dailyDrawdownPct}
              onChange={(v) => set('dailyDrawdownPct', Math.min(v, 100))}
              min={0.1} max={100} step={0.5}
              suffix="%"
            />
          </InputField>
          <InputField label="Max Drawdown" hint="% of balance">
            <NumberInput
              value={config.maxDrawdownPct}
              onChange={(v) => set('maxDrawdownPct', Math.min(v, 100))}
              min={0.1} max={100} step={0.5}
              suffix="%"
            />
          </InputField>
        </div>

        {/* Profit Target + Consistency Rule */}
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Profit Target" hint="% of balance">
            <NumberInput
              value={config.profitTargetPct}
              onChange={(v) => set('profitTargetPct', Math.min(v, 100))}
              min={0.1} max={100} step={0.5}
              suffix="%"
            />
          </InputField>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="consistency-rule-enabled"
                checked={config.consistencyRuleEnabled}
                onChange={(e) => set('consistencyRuleEnabled', e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-indigo-500 cursor-pointer flex-shrink-0"
              />
              <label
                htmlFor="consistency-rule-enabled"
                className="text-xs font-medium uppercase tracking-wide cursor-pointer select-none text-slate-400"
              >
                Consistency Rule
              </label>
            </div>
            <div className={config.consistencyRuleEnabled ? '' : 'opacity-40 pointer-events-none'}>
              <NumberInput
                value={config.consistencyRulePct}
                onChange={(v) => set('consistencyRulePct', Math.min(v, 100))}
                min={1} max={100} step={1}
                suffix="%"
              />
            </div>
            <p className="text-xs text-slate-500">Max daily % of target</p>
          </div>
        </div>

        {/* Win Rate + R:R */}
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Win Rate">
            <div className="space-y-1.5">
              <NumberInput
                value={config.winRate}
                onChange={(v) => set('winRate', Math.min(Math.max(v, 1), 99))}
                min={1} max={99} step={1}
                suffix="%"
              />
              <input
                type="range" min={1} max={99} step={1} value={config.winRate}
                onChange={(e) => set('winRate', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </InputField>
          <InputField label="Risk:Reward Ratio" hint="e.g. 1.5 = 1:1.5">
            <div className="space-y-1.5">
              <NumberInput
                value={config.riskRewardRatio}
                onChange={(v) => set('riskRewardRatio', Math.max(v, 0.1))}
                min={0.1} max={20} step={0.1}
                prefix="1:"
              />
              <input
                type="range" min={0.1} max={10} step={0.1} value={config.riskRewardRatio}
                onChange={(e) => set('riskRewardRatio', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </InputField>
        </div>

        {/* Trades/Day + Risk Mode */}
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Trades per Day">
            <NumberInput
              value={config.tradesPerDay}
              onChange={(v) => set('tradesPerDay', Math.max(1, Math.floor(v)))}
              min={1} max={100} step={1}
            />
          </InputField>
          <InputField label="Risk Mode">
            <SelectInput
              value={config.mode}
              onChange={(v) => {
                // Pre-fill custom amount with the safe suggestion when switching to custom
                if (v === 'custom' && config.customRiskPerTrade === 0) {
                  onChange({ ...config, mode: v, customRiskPerTrade: Math.round(suggestedRisk) });
                } else {
                  set('mode', v);
                }
              }}
              options={MODE_OPTIONS}
            />
          </InputField>
        </div>

        {/* Custom risk amount — only visible in Custom mode */}
        {config.mode === 'custom' && (
          <div className="rounded-lg border border-indigo-700/50 bg-indigo-950/30 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sliders size={14} className="text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-300">Custom Risk Per Trade</span>
            </div>
            <InputField
              label="Risk Amount"
              hint={`Recommended safe range: up to ${formatCurrency(suggestedRisk * 1.2)}`}
            >
              <NumberInput
                value={config.customRiskPerTrade}
                onChange={(v) => set('customRiskPerTrade', Math.max(0, v))}
                min={0}
                step={10}
                prefix="$"
              />
            </InputField>
            <input
              type="range"
              min={0}
              max={Math.round(suggestedRisk * 3)}
              step={Math.max(1, Math.round(suggestedRisk / 50))}
              value={config.customRiskPerTrade}
              onChange={(e) => set('customRiskPerTrade', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>$0</span>
              <span className="text-indigo-400">Safe: {formatCurrency(suggestedRisk)}</span>
              <span>{formatCurrency(suggestedRisk * 3)}</span>
            </div>
          </div>
        )}

        {/* Quick presets */}
        <div>
          <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Quick Presets</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => onChange({ ...config, ...p.values })}
                className="text-xs px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const PRESETS: { label: string; values: Partial<AccountConfig> }[] = [
  {
    label: 'FTMO $25k',
    values: { accountBalance: 25000, dailyDrawdownPct: 5, maxDrawdownPct: 10, profitTargetPct: 10, consistencyRulePct: 30 },
  },
  {
    label: 'FTMO $100k',
    values: { accountBalance: 100000, dailyDrawdownPct: 5, maxDrawdownPct: 10, profitTargetPct: 10, consistencyRulePct: 30 },
  },
  {
    label: 'Funded Trader',
    values: { accountBalance: 50000, dailyDrawdownPct: 4, maxDrawdownPct: 8, profitTargetPct: 8, consistencyRulePct: 40 },
  },
  {
    label: 'TopStep $50k',
    values: { accountBalance: 50000, dailyDrawdownPct: 2, maxDrawdownPct: 3, profitTargetPct: 6, consistencyRulePct: 50 },
  },
];
