import { useState, useEffect, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Captured window error:', event.error || event.message);
      setHasError(true);
      setErrorMessage(event.message || 'Terjadi kesalahan sistem.');
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Captured unhandled rejection:', event.reason);
      setHasError(true);
      setErrorMessage(event.reason?.message || String(event.reason) || 'Terjadi kegagalan proses asinkron.');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-white mb-2 font-sans">
            SIMPANANKU
          </h1>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            {errorMessage || 'Terjadi kesalahan. Silakan muat ulang halaman.'}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
