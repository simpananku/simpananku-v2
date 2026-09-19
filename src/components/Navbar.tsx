import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  LogOut, 
  ShieldCheck, 
  UserCheck, 
  Wallet, 
  Code2, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { User, NotificationItem, UserRole } from '../types';
import { formatDateIndo } from '../services/generator';
import simpanankuLogo from '../assets/images/simpananku.jpg';
import { ApiStatusBadge } from './ApiStatusBadge';

interface NavbarProps {
  currentUser: User;
  allUsers?: User[];
  notifications: NotificationItem[];
  onSelectRole?: (user: User) => void;
  onLogout: () => void;
  onOpenLaravelCode: () => void;
  onRefreshData?: () => void;
  activeView: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  notifications,
  onLogout,
  onOpenLaravelCode,
  onRefreshData,
  activeView,
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [notifs, setNotifs] = useState<NotificationItem[]>(notifications);

  useEffect(() => {
    setNotifs(notifications);
  }, [notifications]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            Administrator
          </span>
        );
      case 'teller':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <UserCheck className="w-3.5 h-3.5" />
            Teller Kasir
          </span>
        );
      case 'nasabah':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-900 border border-sky-300">
            <Wallet className="w-3.5 h-3.5" />
            Nasabah Syariah
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-emerald-900 text-white shadow-md border-b border-emerald-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Brand Logo & Sharia Identity */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white p-0.5 shadow-md border border-emerald-300/40 flex items-center justify-center overflow-hidden shrink-0">
              <img 
                src={simpanankuLogo} 
                alt="Simpananku Logo" 
                className="w-full h-full object-cover rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-xl font-bold tracking-tight text-white font-sans truncate">
                  SIMPANANKU
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider rounded bg-emerald-800/80 text-emerald-200 border border-emerald-700">
                  Non-Koperasi
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-700/60 text-emerald-100">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  Murni Syariah
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-200 hidden lg:block truncate">
                Simpanan Tabungan • Gadai Syariah (Rahn) • Kredit Barang (Murabahah)
              </p>
            </div>
          </div>

          {/* Right Navigation & Tools */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Live Backend Laravel 13 Status Badge */}
            <ApiStatusBadge onDataRefreshNeeded={onRefreshData} />

            {/* Laravel 13 Architecture Shortcut */}
            <button
              id="btn-laravel-architecture"
              onClick={onOpenLaravelCode}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all shrink-0 cursor-pointer ${
                activeView === 'laravel-code'
                  ? 'bg-amber-400 text-emerald-950 border-amber-300 shadow-sm'
                  : 'bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border-emerald-700'
              }`}
              title="Lihat Arsitektur Laravel 13, Migrasi, Model & Relasi"
            >
              <Code2 className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="hidden sm:inline">Struktur </span>
              <span className="text-[11px] sm:text-xs">Laravel 13</span>
            </button>

            {/* Real-time Notification Popover (Disembunyikan khusus untuk Nasabah) */}
            {currentUser.role !== 'nasabah' && (
              <div className="relative">
                <button
                  id="btn-notifications-toggle"
                  onClick={() => {
                    setShowNotifMenu(!showNotifMenu);
                    setShowRoleMenu(false);
                  }}
                  className="relative p-1.5 sm:p-2 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
                  title="Pusat Notifikasi Real-Time"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-emerald-900 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifMenu && (
                  <div className="fixed sm:absolute inset-x-2 sm:inset-x-auto sm:right-0 top-16 mt-1 sm:mt-2 sm:w-80 md:w-96 rounded-xl bg-white shadow-2xl ring-1 ring-black/10 z-50 overflow-hidden text-slate-800">
                    <div className="p-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-emerald-700" />
                        <span className="font-semibold text-sm text-emerald-950">
                          Notifikasi Real-Time
                        </span>
                        <span className="text-xs bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-mono">
                          {unreadCount} baru
                        </span>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-emerald-700 hover:text-emerald-900 font-medium cursor-pointer"
                        >
                          Tandai semua dibaca
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifs.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-400">
                          Belum ada notifikasi baru
                        </div>
                      ) : (
                        notifs.map((item) => (
                          <div
                            key={item.id}
                            className={`p-3 text-xs transition-colors hover:bg-slate-50 ${
                              !item.read ? 'bg-emerald-50/40 font-medium' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-slate-900">
                                {item.title}
                              </span>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                {formatDateIndo(item.timestamp).split(',')[0]}
                              </span>
                            </div>
                            <p className="mt-1 text-slate-600 leading-relaxed">
                              {item.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Current Active Account Profile Card & Logout in dropdown */}
            <div className="relative">
              <button
                id="btn-active-user-menu"
                onClick={() => {
                  setShowRoleMenu(!showRoleMenu);
                  setShowNotifMenu(false);
                }}
                className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-emerald-800/90 hover:bg-emerald-700/90 border border-emerald-700/80 transition-all text-left cursor-pointer"
                title="Informasi Akun Masuk"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs border border-emerald-400/50 shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden md:block">
                  <div className="text-xs font-semibold text-white leading-tight truncate max-w-[130px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-emerald-200">
                    {currentUser.memberId ? `${currentUser.memberId} • ` : ''}
                    {currentUser.role.toUpperCase()}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-300 hidden sm:block" />
              </button>

              {showRoleMenu && (
                <div className="fixed sm:absolute inset-x-2 sm:inset-x-auto sm:right-0 top-16 mt-1 sm:mt-2 sm:w-72 rounded-xl bg-white shadow-2xl ring-1 ring-black/10 z-50 overflow-hidden text-slate-800 divide-y divide-slate-100">
                  <div className="p-4 bg-slate-50">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Akun Aktif Masuk
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                        {currentUser.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
                        <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                      </div>
                    </div>
                    {currentUser.memberId && (
                      <div className="mt-2 text-[11px] font-mono font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md inline-block">
                        No. Anggota: {currentUser.memberId}
                      </div>
                    )}
                    <div className="mt-2">{getRoleBadge(currentUser.role)}</div>
                  </div>

                  <div className="p-2.5">
                    <button
                      id="btn-navbar-logout"
                      onClick={() => {
                        setShowRoleMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors font-bold cursor-pointer shadow-xs"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar dari Aplikasi
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
