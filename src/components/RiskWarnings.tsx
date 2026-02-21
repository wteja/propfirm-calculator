import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Warning } from '../types';

interface Props {
  warnings: Warning[];
}

const CONFIG = {
  danger: {
    Icon: AlertTriangle,
    bg: 'bg-red-950/60',
    border: 'border-red-800/60',
    text: 'text-red-300',
    icon: 'text-red-400',
    label: 'Danger',
  },
  warning: {
    Icon: AlertCircle,
    bg: 'bg-amber-950/60',
    border: 'border-amber-800/60',
    text: 'text-amber-300',
    icon: 'text-amber-400',
    label: 'Warning',
  },
  info: {
    Icon: Info,
    bg: 'bg-sky-950/60',
    border: 'border-sky-800/60',
    text: 'text-sky-300',
    icon: 'text-sky-400',
    label: 'Info',
  },
};

export function RiskWarnings({ warnings }: Props) {
  if (warnings.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="flex items-center gap-3 text-emerald-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-medium">No risk warnings — configuration looks healthy.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <AlertTriangle size={16} className="text-red-400" />
        <h2 className="text-sm font-semibold text-slate-100">
          Risk Warnings
          <span className="ml-2 badge bg-red-900/60 text-red-400 border border-red-800">
            {warnings.length}
          </span>
        </h2>
      </div>
      <div className="card-body space-y-2">
        {warnings.map((w, i) => {
          const { Icon, bg, border, text, icon, label } = CONFIG[w.type];
          return (
            <div key={i} className={`flex gap-3 p-3 rounded-lg border ${bg} ${border}`}>
              <Icon size={16} className={`${icon} flex-shrink-0 mt-0.5`} />
              <div>
                <span className={`text-xs font-bold uppercase tracking-wide ${icon}`}>{label}: </span>
                <span className={`text-xs ${text}`}>{w.message}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
