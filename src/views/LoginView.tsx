import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Server,
  CheckCircle2
} from 'lucide-react';
import { User, Member } from '../types';
import { ApiClient } from '../services/api';
import simpanankuLogo from '../assets/images/simpananku.jpg';
import islamicOrnament from '../assets/images/islamic_ornament_1789511220748.jpg';

interface LoginViewProps {
  users: User[];
  members?: Member[];
  onLoginSuccess: (user: User) => void;
  onRegisterMember?: (newMember: Member, newUser: User) => void;
  onOpenLaravelCode?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  users,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    ApiClient.checkHealth()
      .then((res) => setBackendOnline(res.connected))
      .catch(() => setBackendOnline(false));
  }, []);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const searchVal = email.trim();

    try {
      // 1. Utamakan Login langsung ke Laravel 13 API Backend
      const apiResult = await ApiClient.login(searchVal, password);
      if (apiResult.success && apiResult.user) {
        onLoginSuccess(apiResult.user);
        return;
      }
    } catch (apiErr: any) {
      console.warn('API login check:', apiErr.message);
      if (
        apiErr.message &&
        !apiErr.message.includes('Gagal menghubungi') &&
        !apiErr.message.includes('fetch') &&
        !apiErr.message.includes('status 5')
      ) {
        setError(apiErr.message);
        setIsLoading(false);
        return;
      }
    }

    // 2. Fallback ke database akun lokal jika offline / jaringan terputus
    const lowerVal = searchVal.toLowerCase();
    const altSearchVal = lowerVal.endsWith('@simpananku.id')
      ? lowerVal.replace('@simpananku.id', '@simpananku.my.id')
      : lowerVal.endsWith('@simpananku.my.id')
      ? lowerVal.replace('@simpananku.my.id', '@simpananku.id')
      : lowerVal;

    const user = users.find(
      (u) =>
        u.email.toLowerCase() === lowerVal ||
        u.email.toLowerCase() === altSearchVal ||
        (u.memberId && u.memberId.toLowerCase() === lowerVal) ||
        u.phone.replace(/\D/g, '') === lowerVal.replace(/\D/g, '') ||
        u.role.toLowerCase() === lowerVal
    );

    if (user) {
      if (user.password && password && user.password !== password) {
        setError('Kata sandi yang Anda masukkan salah. Silakan periksa kembali.');
        setIsLoading(false);
        return;
      }
      onLoginSuccess(user);
    } else {
      setError('Email atau identitas pengguna tidak ditemukan dalam database.');
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (role: 'admin' | 'teller' | 'nasabah') => {
    setIsLoading(true);
    setError(null);
    const credentials = {
      admin: { email: 'admin@simpananku.my.id', pass: 'admin123' },
      teller: { email: 'teller@simpananku.my.id', pass: 'teller123' },
      nasabah: { email: 'nasabah@simpananku.my.id', pass: 'nasabah123' },
    };

    const target = credentials[role];
    try {
      const res = await ApiClient.login(target.email, target.pass);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
        return;
      }
    } catch (err) {
      console.warn('Quick login fallback to local user:', err);
    }

    const localUser = users.find((u) => u.role === role) || users[0];
    if (localUser) {
      onLoginSuccess(localUser);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 flex items-center justify-center p-3 sm:p-6 lg:p-10 relative overflow-hidden font-sans">
      {/* Ambient background glow & geometric motifs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Decorative Islamic Geometric Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" 
        aria-hidden="true"
      />

      {/* Main Responsive Container */}
      <div className="w-full max-w-5xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-emerald-500/20 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 transition-all">
        
        {/* LEFT COLUMN: Islamic Ornament & SIMPANANKU Branding (Dual-Panel Layout) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-b from-emerald-950 via-teal-950 to-slate-950 text-white p-8 xl:p-12 flex-col items-center justify-center relative overflow-hidden text-center">
          {/* Subtle Islamic ambient ornament glow */}
          <div className="absolute top-1/4 -left-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 -right-12 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center max-w-xs xl:max-w-sm">
            {/* Islamic Ornament Image Frame */}
            <div className="w-56 h-56 xl:w-68 xl:h-68 rounded-3xl p-2 bg-emerald-900/40 border border-emerald-500/30 shadow-2xl overflow-hidden flex items-center justify-center">
              <img 
                src={islamicOrnament} 
                alt="Ornamen Islami SIMPANANKU" 
                className="w-full h-full object-cover rounded-2xl"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Tulisan SIMPANANKU di bawahnya */}
            <div className="mt-6 text-center">
              <h2 className="text-3xl xl:text-4xl font-black tracking-widest text-white font-sans">
                SIMPANANKU
              </h2>
              <div className="w-16 h-0.5 bg-emerald-500/50 mx-auto mt-3" />
              <p className="text-xs text-emerald-200/70 mt-3 leading-relaxed">
                Sistem Informasi khusus anggota SIMPANANKU by. WAROENG HIJI
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Modern Clean Login Form (Responsive on Mobile & Desktop) */}
        <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto">
            
            {/* Mobile Header / Logo Display */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 rounded-3xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/20 p-2 border border-emerald-200 shadow-md flex items-center justify-center">
                <img 
                  src={simpanankuLogo} 
                  alt="Logo Simpananku" 
                  className="w-full h-full object-cover rounded-2xl shadow-xs"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-sans">
                SIMPANANKU
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Login Sistem Informasi Simpananku
              </p>

              {/* Status Koneksi Backend API */}
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${backendOnline !== false ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${backendOnline !== false ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </span>
                <Server className="w-3 h-3 text-emerald-600" />
                <span>API Backend Laravel 13:</span>
                <span className="font-mono text-[10px] text-emerald-950">
                  {backendOnline !== false ? 'Terhubung Aktif' : 'Menghubungkan...'}
                </span>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
            )}

            {/* Core Authentication Form */}
            <form onSubmit={handleManualLogin} className="space-y-4 sm:space-y-5">
              {/* Field 1: Email Pengguna */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Pengguna:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email pengguna"
                    className="w-full pl-10 pr-3.5 py-3 text-xs sm:text-sm text-slate-900 bg-slate-50/70 hover:bg-slate-50 focus:bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-hidden transition-all placeholder:text-slate-400"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Field 2: Kata Sandi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kata Sandi:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi akun"
                    className="w-full pl-10 pr-11 py-3 text-xs sm:text-sm text-slate-900 bg-slate-50/70 hover:bg-slate-50 focus:bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-hidden transition-all placeholder:text-slate-400"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
                    tabIndex={-1}
                    title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Button: Masuk Aplikasi */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 mt-2 group disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Masuk Aplikasi</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access Buttons */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center mb-3">
                Masuk Cepat Demo (Autentikasi API Otomatis)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickLogin('admin')}
                  className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span className="text-[11px] font-bold">Admin</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickLogin('teller')}
                  className="p-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4 text-teal-700" />
                  <span className="text-[11px] font-bold">Teller</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickLogin('nasabah')}
                  className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] font-black">
                    AG
                  </div>
                  <span className="text-[11px] font-bold">Nasabah</span>
                </button>
              </div>
            </div>

            {/* Bottom Institutional Disclaimer */}
            <div className="mt-6 text-center text-[11px] text-slate-400">
              <p>Layanan dan produk kami hadir secara eksklusif hanya untuk anggota terdaftar dan tidak tersedia untuk masyarakat umum</p>
            </div>
            <div className="mt-6 text-center text-[11px] text-slate-400">
              <p>© {new Date().getFullYear()} SIMPANANKU</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

