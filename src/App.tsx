import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { User, Member, SavingsProduct, SavingsAccount, PawnPledge, CommodityFinancing, Transaction, NotificationItem } from './types';
import { ApiClient } from './services/api';
import { Navbar } from './components/Navbar';
import { LoginView } from './views/LoginView';

const AdminDashboard = lazy(() => import('./views/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const TellerDashboard = lazy(() => import('./views/TellerDashboard').then((module) => ({ default: module.TellerDashboard })));
const NasabahDashboard = lazy(() => import('./views/NasabahDashboard').then((module) => ({ default: module.NasabahDashboard })));

type AppData = {
  users: User[]; members: Member[]; products: SavingsProduct[]; accounts: SavingsAccount[];
  pawns: PawnPledge[]; credits: CommodityFinancing[]; transactions: Transaction[];
};
const emptyData: AppData = { users: [], members: [], products: [], accounts: [], pawns: [], credits: [], transactions: [] };

export default function App() {
  const [data, setData] = useState<AppData>(emptyData);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (role?: User['role']) => {
    setLoading(true);
    setError(null);
    try {
      const effectiveRole = role ?? currentUser?.role;
      const [members, products, accounts, pawns, credits, transactions, notifications, staff] = await Promise.all([
        ApiClient.getMembers(), ApiClient.getSavingsProducts(), ApiClient.getSavingsAccounts(), ApiClient.getPawns(),
        ApiClient.getCommodityFinancings(), ApiClient.getTransactions(), ApiClient.getNotifications(),
        effectiveRole === 'admin' ? ApiClient.getStaff() : Promise.resolve([]),
      ]);
      setData({ users: staff, members, products, accounts, pawns, credits, transactions });
      setNotifications(notifications);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data dari server.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser?.role]);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        const { user } = await ApiClient.getMe();
        if (active) {
          setCurrentUser(user);
          await refresh(user.role);
        }
      } catch {
        // A failed data request keeps the login token; only a 401 clears it.
      } finally {
        if (active) setRestoring(false);
      }
    };
    restore();
    const unauthorized = () => { setCurrentUser(null); setData(emptyData); setNotifications([]); };
    window.addEventListener('simpananku:unauthorized', unauthorized);
    return () => { active = false; window.removeEventListener('simpananku:unauthorized', unauthorized); };
  }, []);

  const save = async <T,>(operation: () => Promise<T>): Promise<T> => {
    setLoading(true);
    setError(null);
    try { const result = await operation(); await refresh(); return result; }
    catch (err: any) { setError(err.message || 'Perubahan gagal disimpan.'); throw err; }
    finally { setLoading(false); }
  };

  const updateMembers = async (members: Member[]) => {
    const changed = members.find(m => data.members.some(old => old.memberNumber === m.memberNumber && JSON.stringify(old) !== JSON.stringify(m)));
    if (changed) await save(() => ApiClient.updateMember(changed.memberNumber, changed));
  };
  const registerMember = async (member: Member) => save(() => ApiClient.registerMember({
    nik: member.nik, fullName: member.fullName, email: member.email, phone: member.phone,
    address: member.address, occupation: member.occupation, initialDeposit: 0, password: member.password,
  }));
  const deposit = async (tx: Transaction, _member: Member, account: SavingsAccount) => save(async () => {
    const realAccount = data.accounts.some(a => a.id === account.id) ? account : await ApiClient.createSavingsAccount(account.memberNumber, account.productId);
    return (await ApiClient.deposit({ accountNumber: realAccount.id, amount: tx.amount, description: tx.notes, tellerName: tx.tellerName })).transaction;
  });
  const withdraw = async (tx: Transaction, _member: Member, account: SavingsAccount) => save(async () => (await ApiClient.withdraw({ accountNumber: account.id, amount: tx.amount, description: tx.notes, tellerName: tx.tellerName })).transaction);
  const disbursePawn = async (tx: Transaction, pawn: PawnPledge) => save(async () => (await ApiClient.disbursePawn({
    memberNumber: pawn.memberNumber, itemType: pawn.itemType, itemDescription: pawn.itemDescription,
    estimatedValue: pawn.estimatedValue, loanAmount: pawn.loanAmount, ujrahFeePerMonth: pawn.monthlyUjrah,
    tenorMonths: pawn.periodMonths, tellerName: tx.tellerName, notes: pawn.notes,
  })).transaction);
  const disburseCredit = async (tx: Transaction, credit: CommodityFinancing) => save(async () => (await ApiClient.disburseCommodityFinancing({
    memberNumber: credit.memberNumber, itemName: credit.itemName, itemCategory: credit.itemCategory,
    purchasePrice: credit.purchaseCost, downPayment: credit.downPayment,
    marginPercentage: credit.purchaseCost > 0 ? Math.round(credit.marginAmount / credit.purchaseCost * 100) : 0,
    tenorMonths: credit.tenorMonths, tellerName: tx.tellerName,
  })).transaction);
  const payInstallment = async (tx: Transaction, credit: CommodityFinancing) => save(async () => (await ApiClient.payFinancingInstallment(credit.contractNumber, { amount: tx.amount, tellerName: tx.tellerName })).transaction);
  const redeemPawn = async (tx: Transaction, pawn: PawnPledge) => save(async () => (await ApiClient.redeemPawn(pawn.pawnCode, { tellerName: tx.tellerName })).transaction);
  const payUjrah = async (tx: Transaction, pawn: PawnPledge) => save(async () => (await ApiClient.payPawnUjrah(pawn.pawnCode, { amount: tx.amount, tellerName: tx.tellerName })).transaction);

  if (restoring) return <div className="min-h-screen flex items-center justify-center">Memulihkan sesi...</div>;
  if (!currentUser) return <LoginView users={[]} onLoginSuccess={(user) => { setCurrentUser(user); refresh(user.role).catch(() => {}); }} />;

  const currentMember = data.members.find(m => m.memberNumber === currentUser.memberId || m.email === currentUser.email);
  return <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
    <Navbar currentUser={currentUser} notifications={notifications} onLogout={async () => {
      await ApiClient.logout(); setCurrentUser(null); setData(emptyData); setNotifications([]);
    }} onOpenLaravelCode={() => {}} onRefreshData={() => { refresh().catch(() => {}); }} activeView="dashboard" />
    <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1">
      {loading && <p role="status" className="mb-3 text-sm text-emerald-800">Menyinkronkan data...</p>}
      {error && <div role="alert" className="mb-3 p-3 bg-rose-50 text-rose-800 rounded-lg">{error} <button onClick={() => refresh().catch(() => {})} className="underline">Coba lagi</button></div>}
      <Suspense fallback={<p role="status" className="text-sm text-emerald-800">Menyiapkan dashboard...</p>}>
      {currentUser.role === 'admin' ? <AdminDashboard currentUser={currentUser} onUpdateCurrentUser={setCurrentUser}
        users={data.users} members={data.members} products={data.products} accounts={data.accounts} pawns={data.pawns}
        credits={data.credits} transactions={data.transactions} onUpdateUsers={() => {}} onUpdateMembers={updateMembers}
        onUpdateProducts={() => {}} onUpdateAccounts={() => {}} onUpdatePawns={() => {}} onUpdateCredits={() => {}}
        onUpdateTransactions={() => {}} onPawnRedemption={redeemPawn} onPayUjrah={payUjrah} onRefreshData={refresh} />
      : currentUser.role === 'teller' ? <TellerDashboard currentUser={currentUser} onUpdateCurrentUser={setCurrentUser}
        members={data.members} products={data.products} accounts={data.accounts} pawns={data.pawns} credits={data.credits}
        transactions={data.transactions} onDeposit={deposit} onWithdraw={withdraw} onPawnDisbursement={disbursePawn}
        onPawnRedemption={redeemPawn} onPayUjrah={payUjrah} onCreditDisbursement={disburseCredit}
        onPayInstallment={payInstallment} onAddMember={(m) => registerMember(m)} onUpdateMembers={updateMembers} />
      : currentMember ? <NasabahDashboard currentUser={currentUser} onUpdateCurrentUser={setCurrentUser} member={currentMember}
        accounts={data.accounts} transactions={data.transactions} pawns={data.pawns} credits={data.credits} onUpdateMember={() => {}} />
      : loading ? <p role="status" className="text-sm text-emerald-800">Memuat data keanggotaan...</p>
      : <p>Data anggota tidak ditemukan. Hubungi administrator.</p>}
      </Suspense>
    </main>
  </div>;
}
