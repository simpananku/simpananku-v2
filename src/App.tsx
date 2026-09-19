import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  Member, 
  SavingsProduct, 
  SavingsAccount, 
  PawnPledge, 
  CommodityFinancing, 
  Transaction, 
  NotificationItem 
} from './types';
import { loadInitialData, saveData } from './services/storage';
import { notificationService } from './services/notificationService';
import { ApiClient } from './services/api';
import { Navbar } from './components/Navbar';
import { NotificationToast } from './components/NotificationToast';
import { LoginView } from './views/LoginView';
import { AdminDashboard } from './views/AdminDashboard';
import { TellerDashboard } from './views/TellerDashboard';
import { NasabahDashboard } from './views/NasabahDashboard';
import { LaravelStructureView } from './views/LaravelStructureView';
import simpanankuLogo from './assets/images/simpananku.jpg';

export default function App() {
  const [data, setData] = useState(() => loadInitialData());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'laravel-code'>('dashboard');
  const [notifications, setNotifications] = useState<NotificationItem[]>(data.notifications);

  // Sync to localStorage whenever state changes
  useEffect(() => {
    saveData({
      users: data.users,
      members: data.members,
      products: data.products,
      accounts: data.accounts,
      pawns: data.pawns,
      credits: data.credits,
      transactions: data.transactions,
      notifications,
    });
  }, [data, notifications]);

  // Subscribe to real-time notification bus
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });
    return () => unsubscribe();
  }, []);

  // Fetch live synchronized data from Laravel 13 AI-Native Backend API
  const fetchBackendData = useCallback(async () => {
    try {
      const [membersRes, productsRes, accountsRes, pawnsRes, creditsRes, txRes, notifsRes] = await Promise.allSettled([
        ApiClient.getMembers(),
        ApiClient.getSavingsProducts(),
        ApiClient.getSavingsAccounts(),
        ApiClient.getPawns(),
        ApiClient.getCommodityFinancings(),
        ApiClient.getTransactions(),
        ApiClient.getNotifications(),
      ]);

      setData((prev) => {
        const nextMembers = membersRes.status === 'fulfilled' && membersRes.value.length > 0 ? membersRes.value : prev.members;
        const nextProducts = productsRes.status === 'fulfilled' && productsRes.value.length > 0 ? productsRes.value : prev.products;
        const nextAccounts = accountsRes.status === 'fulfilled' && accountsRes.value.length > 0 ? accountsRes.value : prev.accounts;
        const nextPawns = pawnsRes.status === 'fulfilled' && pawnsRes.value.length > 0 ? pawnsRes.value : prev.pawns;
        const nextCredits = creditsRes.status === 'fulfilled' && creditsRes.value.length > 0 ? creditsRes.value : prev.credits;
        const nextTx = txRes.status === 'fulfilled' && txRes.value.length > 0 ? txRes.value : prev.transactions;

        // Synchronize nasabah users accounts from backend members
        const memberUsers: User[] = nextMembers.map((m) => ({
          id: `USR-${m.memberNumber}`,
          name: m.fullName,
          email: m.email || `${m.memberNumber.toLowerCase()}@simpananku.my.id`,
          role: 'nasabah',
          phone: m.phone,
          memberId: m.memberNumber,
          createdAt: m.joinDate,
        }));

        const nonNasabahUsers = prev.users.filter((u) => u.role !== 'nasabah');

        return {
          ...prev,
          members: nextMembers,
          products: nextProducts,
          accounts: nextAccounts,
          pawns: nextPawns,
          credits: nextCredits,
          transactions: nextTx,
          users: [...nonNasabahUsers, ...memberUsers],
        };
      });

      if (notifsRes.status === 'fulfilled' && notifsRes.value.length > 0) {
        setNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const fresh = notifsRes.value.filter((n) => !existingIds.has(n.id));
          return [...fresh, ...prev];
        });
      }
    } catch (err) {
      console.warn('[SIMPANANKU] Gagal mengambil data terbaru dari backend Laravel:', err);
    }
  }, []);

  // Fetch initial live data on startup
  useEffect(() => {
    fetchBackendData();
  }, [fetchBackendData]);

  // Handlers for data updates
  const handleUpdateUsers = (updatedUsers: User[]) => {
    setData((prev) => ({ ...prev, users: updatedUsers }));
  };

  const handleUpdateMembers = (updatedMembers: Member[]) => {
    setData((prev) => {
      // Sync users data if member was updated or deleted
      const memberNumbers = new Set(updatedMembers.map((m) => m.memberNumber));
      const syncedUsers = prev.users
        .filter((u) => u.role !== 'nasabah' || (u.memberId && memberNumbers.has(u.memberId)))
        .map((u) => {
          if (u.role === 'nasabah' && u.memberId) {
            const m = updatedMembers.find((item) => item.memberNumber === u.memberId);
            if (m) {
              return {
                ...u,
                name: m.fullName,
                email: m.email || u.email,
                phone: m.phone || u.phone,
                password: m.password || u.password,
              };
            }
          }
          return u;
        });

      // Clean up orphan accounts if any member was removed
      const syncedAccounts = prev.accounts.filter((a) => memberNumbers.has(a.memberNumber));

      return {
        ...prev,
        members: updatedMembers,
        users: syncedUsers,
        accounts: syncedAccounts,
      };
    });
  };

  const handleUpdateProducts = (updatedProducts: SavingsProduct[]) => {
    setData((prev) => ({ ...prev, products: updatedProducts }));
  };

  const handleUpdateAccounts = (updatedAccounts: SavingsAccount[]) => {
    setData((prev) => {
      // Recalculate each member's totalSavings based on accounts
      const nextMembers = prev.members.map((m) => {
        const total = updatedAccounts
          .filter((a) => a.memberNumber === m.memberNumber)
          .reduce((sum, a) => sum + a.balance, 0);
        return { ...m, totalSavings: total };
      });
      return {
        ...prev,
        accounts: updatedAccounts,
        members: nextMembers,
      };
    });
  };

  const handleUpdatePawns = (updatedPawns: PawnPledge[]) => {
    setData((prev) => {
      const nextMembers = prev.members.map((m) => {
        const activeCount = updatedPawns.filter(
          (p) => p.memberNumber === m.memberNumber && p.status === 'aktif'
        ).length;
        return { ...m, activePawnCount: activeCount };
      });
      return {
        ...prev,
        pawns: updatedPawns,
        members: nextMembers,
      };
    });
  };

  const handleUpdateCredits = (updatedCredits: CommodityFinancing[]) => {
    setData((prev) => {
      const nextMembers = prev.members.map((m) => {
        const activeCount = updatedCredits.filter(
          (c) => c.memberNumber === m.memberNumber && c.status === 'berjalan'
        ).length;
        return { ...m, activeCreditCount: activeCount };
      });
      return {
        ...prev,
        credits: updatedCredits,
        members: nextMembers,
      };
    });
  };

  const handleUpdateTransactions = (updatedTransactions: Transaction[]) => {
    setData((prev) => ({ ...prev, transactions: updatedTransactions }));
  };

  // Register Member handler with Backend API Sync
  const handleRegisterMember = async (newMember: Member, newUser: User) => {
    const defaultAccounts: SavingsAccount[] = data.products.map((prod) => ({
      id: `ACC-${newMember.memberNumber}-${prod.id}`,
      memberNumber: newMember.memberNumber,
      productId: prod.id,
      productName: prod.name,
      akad: prod.akad,
      balance: prod.id === 'PRD-001' ? 50000 : 0,
      openedAt: new Date().toISOString().split('T')[0],
      status: 'active',
    }));

    const initialTotal = defaultAccounts.reduce((sum, a) => sum + a.balance, 0);
    const finalizedMember = { ...newMember, totalSavings: initialTotal };

    setData((prev) => ({
      ...prev,
      members: [finalizedMember, ...prev.members],
      users: [...prev.users, newUser],
      accounts: [...prev.accounts, ...defaultAccounts],
    }));

    notificationService.broadcast({
      title: 'Pendaftaran Anggota Baru Berhasil',
      message: `Selamat bergabung ${newMember.fullName}, nomor anggota Anda adalah ${newMember.memberNumber}. Rekening tabungan awal telah disiapkan.`,
      category: 'anggota',
      targetMemberNumber: newMember.memberNumber,
    });

    // Synchronize to Backend Laravel 13 API
    try {
      await ApiClient.registerMember({
        nik: newMember.nik,
        fullName: newMember.fullName,
        email: newMember.email,
        phone: newMember.phone,
        address: newMember.address,
        occupation: newMember.occupation,
        initialDeposit: 50000,
      });
      fetchBackendData();
    } catch (apiErr: any) {
      console.warn('Sync register member ke backend:', apiErr.message);
    }
  };

  // Teller Transactions with totalSavings Synchronization & Backend API Sync
  const handleDeposit = async (newTx: Transaction, updatedMember: Member, updatedAccount: SavingsAccount) => {
    setData((prev) => {
      const nextAccounts = prev.accounts.some((a) => a.id === updatedAccount.id)
        ? prev.accounts.map((a) => (a.id === updatedAccount.id ? updatedAccount : a))
        : [...prev.accounts, updatedAccount];

      const memberTotal = nextAccounts
        .filter((a) => a.memberNumber === updatedMember.memberNumber)
        .reduce((sum, a) => sum + a.balance, 0);

      const nextMembers = prev.members.map((m) =>
        m.id === updatedMember.id ? { ...updatedMember, totalSavings: memberTotal } : m
      );

      return {
        ...prev,
        transactions: [newTx, ...prev.transactions],
        members: nextMembers,
        accounts: nextAccounts,
      };
    });

    // Synchronize to Backend Laravel 13 API
    try {
      await ApiClient.deposit({
        accountNumber: updatedAccount.id,
        amount: newTx.amount,
        description: newTx.notes,
        tellerName: newTx.tellerName || 'Teller Syariah',
      });
      fetchBackendData();
    } catch (apiErr: any) {
      console.warn('Sync deposit ke backend:', apiErr.message);
    }
  };

  const handleWithdraw = async (newTx: Transaction, updatedMember: Member, updatedAccount: SavingsAccount) => {
    setData((prev) => {
      const nextAccounts = prev.accounts.map((a) =>
        a.id === updatedAccount.id ? updatedAccount : a
      );

      const memberTotal = nextAccounts
        .filter((a) => a.memberNumber === updatedMember.memberNumber)
        .reduce((sum, a) => sum + a.balance, 0);

      const nextMembers = prev.members.map((m) =>
        m.id === updatedMember.id ? { ...updatedMember, totalSavings: memberTotal } : m
      );

      return {
        ...prev,
        transactions: [newTx, ...prev.transactions],
        members: nextMembers,
        accounts: nextAccounts,
      };
    });

    // Synchronize to Backend Laravel 13 API
    try {
      await ApiClient.withdraw({
        accountNumber: updatedAccount.id,
        amount: newTx.amount,
        description: newTx.notes,
        tellerName: newTx.tellerName || 'Teller Syariah',
      });
      fetchBackendData();
    } catch (apiErr: any) {
      console.warn('Sync withdraw ke backend:', apiErr.message);
    }
  };

  const handlePawnDisbursement = async (newTx: Transaction, newPawn: PawnPledge) => {
    setData((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
      pawns: [newPawn, ...prev.pawns],
      members: prev.members.map((m) =>
        m.memberNumber === newPawn.memberNumber
          ? { ...m, activePawnCount: m.activePawnCount + 1 }
          : m
      ),
    }));

    // Synchronize to Backend Laravel 13 API
    try {
      await ApiClient.disbursePawn({
        memberNumber: newPawn.memberNumber,
        itemType: newPawn.itemType,
        itemDescription: newPawn.itemDescription,
        estimatedValue: newPawn.estimatedValue,
        loanAmount: newPawn.loanAmount,
        ujrahFeePerMonth: newPawn.monthlyUjrah,
        tenorMonths: newPawn.periodMonths,
        tellerName: newTx.tellerName || 'Teller Syariah',
        notes: newPawn.notes,
      });
      fetchBackendData();
    } catch (apiErr: any) {
      console.warn('Sync pawn disbursement ke backend:', apiErr.message);
    }
  };

  const handlePawnRedemption = async (newTx: Transaction, updatedPawn: PawnPledge) => {
    setData((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
      pawns: prev.pawns.map((p) => (p.id === updatedPawn.id ? updatedPawn : p)),
      members: prev.members.map((m) =>
        m.memberNumber === updatedPawn.memberNumber
          ? { ...m, activePawnCount: Math.max(0, m.activePawnCount - 1) }
          : m
      ),
    }));

    // Synchronize to Backend Laravel 13 API
    try {
      await ApiClient.redeemPawn(updatedPawn.pawnCode || updatedPawn.id, {
        tellerName: newTx.tellerName || 'Teller Syariah',
      });
      fetchBackendData();
    } catch (apiErr: any) {
      console.warn('Sync pawn redemption ke backend:', apiErr.message);
    }
  };

  const handlePayUjrah = async (newTx: Transaction, updatedPawn: PawnPledge) => {
    setData((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
      pawns: prev.pawns.map((p) => (p.id === updatedPawn.id ? updatedPawn : p)),
    }));

    // Synchronize to Backend Laravel 13 API
    try {
      await ApiClient.payPawnUjrah(updatedPawn.pawnCode || updatedPawn.id, {
        amount: newTx.amount,
        tellerName: newTx.tellerName || 'Teller Syariah',
      });
      fetchBackendData();
    } catch (apiErr: any) {
      console.warn('Sync pay ujrah ke backend:', apiErr.message);
    }
  };

  const handleCreditDisbursement = async (newTx: Transaction, newCredit: CommodityFinancing) => {
    setData((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
      credits: [newCredit, ...prev.credits],
      members: prev.members.map((m) =>
        m.memberNumber === newCredit.memberNumber
          ? { ...m, activeCreditCount: m.activeCreditCount + 1 }
          : m
      ),
    }));

    // Synchronize to Backend Laravel 13 API
    try {
      const marginPct = newCredit.purchaseCost > 0 
        ? Math.round((newCredit.marginAmount / newCredit.purchaseCost) * 100) 
        : 10;

      await ApiClient.disburseCommodityFinancing({
        memberNumber: newCredit.memberNumber,
        itemName: newCredit.itemName,
        itemCategory: newCredit.itemCategory,
        purchasePrice: newCredit.purchaseCost,
        downPayment: newCredit.downPayment,
        marginPercentage: marginPct,
        tenorMonths: newCredit.tenorMonths,
        tellerName: newTx.tellerName || 'Teller Syariah',
      });
      fetchBackendData();
    } catch (apiErr: any) {
      console.warn('Sync credit disbursement ke backend:', apiErr.message);
    }
  };

  const handlePayInstallment = async (newTx: Transaction, updatedCredit: CommodityFinancing) => {
    setData((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
      credits: prev.credits.map((c) => (c.id === updatedCredit.id ? updatedCredit : c)),
      members: updatedCredit.status === 'lunas'
        ? prev.members.map((m) =>
            m.memberNumber === updatedCredit.memberNumber
              ? { ...m, activeCreditCount: Math.max(0, m.activeCreditCount - 1) }
              : m
          )
        : prev.members,
    }));

    // Synchronize to Backend Laravel 13 API
    try {
      await ApiClient.payFinancingInstallment(updatedCredit.contractNumber || updatedCredit.id, {
        amount: newTx.amount,
        tellerName: newTx.tellerName || 'Teller Syariah',
      });
      fetchBackendData();
    } catch (apiErr: any) {
      console.warn('Sync installment ke backend:', apiErr.message);
    }
  };

  // If user is not logged in, show Login Screen (Initial Dashboard as requested)
  if (!currentUser) {
    if (activeView === 'laravel-code') {
      return (
        <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
          <div className="bg-emerald-900 text-white p-4 flex items-center justify-between border-b border-emerald-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white p-0.5 overflow-hidden flex items-center justify-center shrink-0 border border-emerald-300/40">
                <img 
                  src={simpanankuLogo} 
                  alt="Logo SIMPANANKU" 
                  className="w-full h-full object-cover rounded-md" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-bold text-lg">SIMPANANKU</span>
              <span className="text-xs bg-emerald-800 px-2 py-0.5 rounded text-emerald-200">Arsitektur Laravel 13</span>
            </div>
            <button
              onClick={() => setActiveView('dashboard')}
              className="px-4 py-1.5 text-xs font-bold bg-amber-400 text-emerald-950 rounded-lg hover:bg-amber-300 cursor-pointer"
            >
              Kembali ke Login
            </button>
          </div>
          <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1">
            <LaravelStructureView />
          </main>
          <NotificationToast />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
        <LoginView
          users={data.users}
          members={data.members}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setActiveView('dashboard');
            fetchBackendData();
          }}
          onRegisterMember={handleRegisterMember}
          onOpenLaravelCode={() => setActiveView('laravel-code')}
        />
        <NotificationToast />
      </div>
    );
  }

  // Active Member for Nasabah view with safe fallback
  const currentMember: Member =
    data.members.find((m) => m.memberNumber === currentUser.memberId) ||
    data.members.find((m) => m.email === currentUser.email) ||
    data.members[0] || {
      id: 'MBR-DEFAULT',
      memberNumber: currentUser.memberId || 'AG0001',
      nik: '3200000000000000',
      fullName: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      address: 'Alamat Anggota Terdaftar',
      occupation: 'Nasabah',
      status: 'aktif',
      joinDate: new Date().toISOString().split('T')[0],
      totalSavings: 0,
      activePawnCount: 0,
      activeCreditCount: 0,
    };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col antialiased">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        notifications={notifications}
        onLogout={() => {
          ApiClient.logout();
          setCurrentUser(null);
          setActiveView('dashboard');
        }}
        onOpenLaravelCode={() => {
          setActiveView((prev) => (prev === 'laravel-code' ? 'dashboard' : 'laravel-code'));
        }}
        onRefreshData={fetchBackendData}
        activeView={activeView}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1">
        {activeView === 'laravel-code' ? (
          <LaravelStructureView />
        ) : currentUser.role === 'admin' ? (
          <AdminDashboard
            currentUser={currentUser}
            onUpdateCurrentUser={(updated) => {
              setCurrentUser(updated);
              handleUpdateUsers(data.users.map((u) => (u.id === updated.id ? updated : u)));
            }}
            users={data.users}
            members={data.members}
            products={data.products}
            accounts={data.accounts}
            pawns={data.pawns}
            credits={data.credits}
            transactions={data.transactions}
            onUpdateUsers={handleUpdateUsers}
            onUpdateMembers={handleUpdateMembers}
            onUpdateProducts={handleUpdateProducts}
            onUpdateAccounts={handleUpdateAccounts}
            onUpdatePawns={handleUpdatePawns}
            onUpdateCredits={handleUpdateCredits}
            onUpdateTransactions={handleUpdateTransactions}
            onPawnRedemption={handlePawnRedemption}
            onPayUjrah={handlePayUjrah}
          />
        ) : currentUser.role === 'teller' ? (
          <TellerDashboard
            currentUser={currentUser}
            onUpdateCurrentUser={(updated) => {
              setCurrentUser(updated);
              handleUpdateUsers(data.users.map((u) => (u.id === updated.id ? updated : u)));
            }}
            members={data.members}
            products={data.products}
            accounts={data.accounts}
            pawns={data.pawns}
            credits={data.credits}
            transactions={data.transactions}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            onPawnDisbursement={handlePawnDisbursement}
            onPawnRedemption={handlePawnRedemption}
            onPayUjrah={handlePayUjrah}
            onCreditDisbursement={handleCreditDisbursement}
            onPayInstallment={handlePayInstallment}
            onAddMember={(newMember, newUser) => handleRegisterMember(newMember, newUser)}
            onUpdateMembers={handleUpdateMembers}
          />
        ) : (
          <NasabahDashboard
            currentUser={currentUser}
            onUpdateCurrentUser={(updated) => {
              setCurrentUser(updated);
              handleUpdateUsers(data.users.map((u) => (u.id === updated.id ? updated : u)));
            }}
            member={currentMember}
            accounts={data.accounts}
            transactions={data.transactions}
            pawns={data.pawns}
            credits={data.credits}
            onUpdateMember={(updated) => {
              handleUpdateMembers(data.members.map((m) => (m.id === updated.id ? updated : m)));
            }}
          />
        )}
      </main>

      {/* Global Notification Toast (Hanya untuk Admin dan Teller, dinonaktifkan untuk Nasabah) */}
      {currentUser?.role !== 'nasabah' && <NotificationToast />}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>SIMPANANKU</strong> • Sistem Pengelolaan Simpanan Tabungan, Gadai Syariah, & Kredit Barang (Non-Koperasi)
          </div>
          <div className="text-[11px] text-slate-400">
            Powered by Laravel 13 Architecture + MySQL + Tailwind CSS • API: <span className="font-mono text-emerald-700 font-semibold">https://api.simpananku.my.id/api/v1</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
