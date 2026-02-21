import { useMemo, useState } from 'react';
import { MonteCarloResult } from './types';
import { Header } from './components/Header';
import { AccountForm } from './components/AccountForm';
import { ResultsPanel } from './components/ResultsPanel';
import { RiskWarnings } from './components/RiskWarnings';
import { MonteCarloChart } from './components/MonteCarloChart';
import { LosingStreakSimulator } from './components/LosingStreakSimulator';
import { MultiAccountComparison } from './components/MultiAccountComparison';
import { ExportPanel } from './components/ExportPanel';
import { PWAUpdateBanner } from './components/PWAUpdateBanner';
import { useLocalStorage } from './hooks/useLocalStorage';
import { calculate, DEFAULT_CONFIG } from './utils/calculations';
import { AccountConfig } from './types';
import { BarChart3, Dices, Flame, Layers } from 'lucide-react';

type Tab = 'calculator' | 'montecarlo' | 'losingstreak' | 'comparison';

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'calculator', label: 'Calculator', Icon: BarChart3 },
  { id: 'montecarlo', label: 'Monte Carlo', Icon: Dices },
  { id: 'losingstreak', label: 'Losing Streak', Icon: Flame },
  { id: 'comparison', label: 'Compare', Icon: Layers },
];

export default function App() {
  // Merge with DEFAULT_CONFIG so any new fields added after a user's first visit
  // (e.g. dailyDrawdownType / maxDrawdownType) always have a valid default value.
  const [rawConfig, setRawConfig] = useLocalStorage<AccountConfig>('riskCalcConfig', DEFAULT_CONFIG);
  const config: AccountConfig = { ...DEFAULT_CONFIG, ...rawConfig };
  const setConfig = (updater: AccountConfig | ((prev: AccountConfig) => AccountConfig)) => {
    setRawConfig((prev) => {
      const merged = { ...DEFAULT_CONFIG, ...prev };
      return typeof updater === 'function' ? updater(merged) : updater;
    });
  };

  const [activeTab, setActiveTab] = useState<Tab>('calculator');
  const [compAccounts, setCompAccounts] = useState<AccountConfig[]>([]);
  const [mcResult, setMcResult] = useState<MonteCarloResult | null>(null);

  const results = useMemo(() => calculate(config), [config]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header />
      <PWAUpdateBanner />

      {/* Tab navigation */}
      <div className="bg-slate-900/50 border-b border-slate-800 sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1 py-2 overflow-x-auto scrollbar-none">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`tab-btn flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === id ? 'tab-btn-active' : 'tab-btn-inactive'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 pb-24">
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <AccountForm config={config} onChange={setConfig} />
            </div>
            <div className="space-y-4">
              <ResultsPanel results={results} config={config} />
              <RiskWarnings warnings={results.warnings} />
            </div>
          </div>
        )}

        {activeTab === 'montecarlo' && (
          <MonteCarloChart config={config} mcResult={mcResult} onResult={setMcResult} />
        )}

        {activeTab === 'losingstreak' && (
          <LosingStreakSimulator config={config} results={results} />
        )}

        {activeTab === 'comparison' && (
          <MultiAccountComparison
            baseConfig={config}
            accounts={compAccounts}
            onAccountsChange={setCompAccounts}
          />
        )}
      </main>

      {/* Floating export panel */}
      <ExportPanel config={config} results={results} onImport={setConfig} />
    </div>
  );
}
