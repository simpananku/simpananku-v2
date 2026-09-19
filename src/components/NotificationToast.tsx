import React, { useEffect, useState } from 'react';
import { Bell, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { NotificationItem } from '../types';
import { notificationService } from '../services/notificationService';

export const NotificationToast: React.FC = () => {
  const [currentToast, setCurrentToast] = useState<NotificationItem | null>(null);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((item) => {
      setCurrentToast(item);
      const timer = setTimeout(() => {
        setCurrentToast((prev) => (prev?.id === item.id ? null : prev));
      }, 5000);
      return () => clearTimeout(timer);
    });

    return () => unsubscribe();
  }, []);

  if (!currentToast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/30 animate-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-emerald-600/30 text-emerald-400 shrink-0 border border-emerald-500/40">
          <Bell className="w-5 h-5 animate-bounce" />
        </div>
        <div className="flex-1 pr-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              {currentToast.category}
            </span>
            <span className="text-[11px] text-slate-400">Baru saja</span>
          </div>
          <h4 className="text-xs font-bold text-white mt-1.5">{currentToast.title}</h4>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{currentToast.message}</p>
        </div>
        <button
          onClick={() => setCurrentToast(null)}
          className="text-slate-400 hover:text-white transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
