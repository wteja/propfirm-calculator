import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { useState } from 'react';

export function PWAUpdateBanner() {
  const [dismissed, setDismissed] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every 60 minutes
      if (r) setInterval(() => r.update(), 60 * 60 * 1000);
    },
  });

  if (!needRefresh || dismissed) return null;

  return (
    <div className="fixed top-14 inset-x-0 z-50 flex justify-center px-4 pt-2 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 bg-indigo-600 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-900/40 animate-slide-up">
        <RefreshCw size={15} className="flex-shrink-0" />
        <span>New version available</span>
        <button
          onClick={() => updateServiceWorker(true)}
          className="ml-1 font-semibold underline underline-offset-2 hover:no-underline focus:outline-none"
        >
          Update now
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="ml-1 text-indigo-200 hover:text-white focus:outline-none"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
