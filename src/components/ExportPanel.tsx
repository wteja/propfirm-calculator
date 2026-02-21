import { useRef, useState } from 'react';
import { AccountConfig, CalculationResults } from '../types';
import { exportToPDF } from '../utils/pdf';
import { Download, Upload, FileJson, FileText, CheckCircle, X } from 'lucide-react';

interface Props {
  config: AccountConfig;
  results: CalculationResults;
  onImport: (c: AccountConfig) => void;
}

export function ExportPanel({ config, results, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const exportJSON = () => {
    const data = JSON.stringify({ version: '1.0', config }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risk-config-${config.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const imported = parsed.config ?? parsed;
        if (imported && typeof imported.accountBalance === 'number') {
          onImport(imported as AccountConfig);
          setOpen(false);
        } else {
          alert('Invalid config file format.');
        }
      } catch {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePDF = async () => {
    setPdfLoading(true);
    try {
      await exportToPDF(config, results);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF export failed. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {/* Expanded menu */}
      {open && (
        <div className="card shadow-2xl shadow-black/60 animate-slide-up min-w-[180px]">
          <div className="p-3 flex flex-col gap-2">
            <button onClick={exportJSON} className="btn-secondary text-xs w-full justify-start">
              {copied ? <CheckCircle size={13} className="text-emerald-400" /> : <FileJson size={13} />}
              {copied ? 'Exported!' : 'Export JSON'}
            </button>

            <button onClick={() => fileRef.current?.click()} className="btn-secondary text-xs w-full justify-start">
              <Upload size={13} />
              Import JSON
            </button>

            <button onClick={handlePDF} disabled={pdfLoading} className="btn-secondary text-xs w-full justify-start">
              <FileText size={13} />
              {pdfLoading ? 'Generating…' : 'Export PDF'}
            </button>

            <input ref={fileRef} type="file" accept=".json" onChange={importJSON} className="hidden" />
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-11 h-11 rounded-full shadow-lg shadow-black/50 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${
          open
            ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
        }`}
        title={open ? 'Close' : 'Export / Import'}
      >
        {open ? <X size={18} /> : <Download size={18} />}
      </button>
    </div>
  );
}
