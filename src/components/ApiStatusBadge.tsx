import React, { useState, useEffect } from 'react';
import { Server, CheckCircle2, AlertCircle, RefreshCw, X, Database, ShieldCheck, Activity } from 'lucide-react';
import { ApiClient, ApiHealthStatus } from '../services/api';
import { formatRupiah } from '../services/generator';

interface ApiStatusBadgeProps {
  onDataRefreshNeeded?: () => void;
}

export const ApiStatusBadge: React.FC<ApiStatusBadgeProps> = ({ onDataRefreshNeeded }) => {
  const [status, setStatus] = useState<ApiHealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const res = await ApiClient.checkHealth();
      setStatus(res);
      if (res.connected && onDataRefreshNeeded) {
        onDataRefreshNeeded();
      }
    } catch {
      setStatus({
        connected: false,
        apiUrl: 'https://api.simpananku.my.id/api/v1',
        latencyMs: 0,
        message: 'Koneksi ke backend Laravel gagal dihubungi.',
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    // Periodically re-check every 60 seconds
    const interval = setInterval(checkConnection, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Badge Button in Header */}
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border shadow-xs cursor-pointer bg-emerald-950/60 text-emerald-200 border-emerald-500/30 hover:bg-emerald-800/80 hover:border-emerald-400"
        title="Klik untuk melihat status koneksi Backend Laravel"
      >
        <span className="relative flex h-2 w-2">
          {status?.connected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              status?.connected ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
        </span>
        <Server className="w-3 h-3 text-emerald-300" />
        <span className="font-mono text-[10px] hidden sm:inline">API</span>
        <span className="hidden md:inline font-sans">
          {status?.connected ? 'Terhubung' : 'Memeriksa...'}
        </span>
        {status?.latencyMs ? (
          <span className="text-[9px] text-emerald-300/80 font-mono hidden lg:inline">
            {status.latencyMs}ms
          </span>
        ) : null}
      </button>

      {/* Modal Detail Koneksi Backend */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-emerald-500/20 overflow-hidden text-slate-900 font-sans">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 border border-white/20">
                  <Database className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Status Koneksi API Backend</h3>
                  <p className="text-[11px] text-emerald-200">Laravel 13 AI-Native Framework</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Status Integrasi:</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                      status?.connected
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {status?.connected ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Terhubung Aktif
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Sedang Menghubungkan
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium shrink-0">Endpoint API:</span>
                  <span className="font-mono text-[11px] text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 break-all text-right">
                    https://api.simpananku.my.id/api/v1
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">Respon / Latensi:</span>
                  <span className="font-mono font-bold text-slate-700">
                    {status?.latencyMs ? `${status.latencyMs} ms` : '-'}
                  </span>
                </div>
              </div>

              {/* Data Metrik Backend Terkini */}
              {status?.connected && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    Data Live Dari Database Laravel:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                      <p className="text-[10px] text-emerald-800 font-medium">Total Anggota Terdaftar</p>
                      <p className="text-base font-black text-emerald-950 mt-0.5">
                        {status.totalMembers ?? '-'} <span className="text-xs font-normal text-slate-600">orang</span>
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200">
                      <p className="text-[10px] text-teal-800 font-medium">Total Simpanan Terhimpun</p>
                      <p className="text-sm font-black text-teal-950 mt-1 truncate">
                        {status.totalSavings !== undefined ? formatRupiah(status.totalSavings) : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sharia Compliance Guarantee */}
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Seluruh transaksi simpanan, gadai syariah (rahn), dan kredit barang (murabahah) disinkronisasikan langsung ke backend Laravel 13 dengan validasi kepatuhan Fatwa DSN-MUI.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={checkConnection}
                disabled={isChecking}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'Menguji...' : 'Uji Ulang Koneksi'}</span>
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
