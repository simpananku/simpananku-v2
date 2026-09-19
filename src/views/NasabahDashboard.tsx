import React, { useState } from 'react';
import { 
  Wallet, 
  Layers, 
  Coins, 
  ShoppingBag, 
  Receipt, 
  User, 
  History, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Share2, 
  ShieldCheck, 
  Fingerprint,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Download,
  AlertCircle,
  Key,
  Lock,
  Eye,
  EyeOff,
  FileDown
} from 'lucide-react';
import { 
  User as UserType, 
  Member, 
  SavingsAccount, 
  Transaction, 
  PawnPledge, 
  CommodityFinancing 
} from '../types';
import { formatRupiah, formatDateIndo } from '../services/generator';
import { ReceiptModal } from '../components/ReceiptModal';
import { generateReceiptPdf } from '../services/receiptPdfService';
import { generatePassbookPdf } from '../services/passbookPdfService';
import { notificationService } from '../services/notificationService'; 
import simpanankuLogo from '../assets/images/simpananku.jpg';

interface NasabahDashboardProps {
  currentUser: UserType;
  member: Member;
  accounts: SavingsAccount[];
  transactions: Transaction[];
  pawns: PawnPledge[];
  credits: CommodityFinancing[];
  onUpdateMember: (updated: Member) => void;
  onUpdateCurrentUser?: (updated: UserType) => void;
}

type NasabahTab = 'ringkasan' | 'simpanan' | 'mutasi' | 'gadai' | 'kredit' | 'angsuran' | 'profil';

export const NasabahDashboard: React.FC<NasabahDashboardProps> = ({
  currentUser,
  member,
  accounts,
  transactions,
  pawns,
  credits,
  onUpdateMember,
  onUpdateCurrentUser,
}) => {
  const [activeTab, setActiveTab] = useState<NasabahTab>('ringkasan');
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);

  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Filter personal data
  const myAccounts = accounts.filter((a) => a.memberNumber === member.memberNumber);
  const myTransactions = transactions.filter((t) => t.memberNumber === member.memberNumber);
  const myPawns = pawns.filter((p) => p.memberNumber === member.memberNumber);
  const myCredits = credits.filter((c) => c.memberNumber === member.memberNumber);

  const totalBalance = myAccounts.reduce((acc, a) => acc + a.balance, 0);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    // Validate old password
    const currentPass = member.password || currentUser.password || 'nasabah123';
    if (oldPassword && oldPassword !== currentPass) {
      setPasswordError('Password saat ini tidak sesuai!');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password baru minimal 6 karakter!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password baru tidak cocok!');
      return;
    }

    // Update member record
    const updatedMember = {
      ...member,
      password: newPassword,
    };
    onUpdateMember(updatedMember);

    // Update currentUser record
    if (onUpdateCurrentUser) {
      onUpdateCurrentUser({
        ...currentUser,
        password: newPassword,
      });
    }

    setPasswordSuccess('Password akun Anda berhasil diperbarui!');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');

    notificationService.broadcast({
      title: 'Kata Sandi Nasabah Diperbarui',
      message: `Nasabah ${member.fullName} (${member.memberNumber}) telah memperbarui kata sandi akunnya.`,
      category: 'sistem',
      targetRole: 'nasabah',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Greeting Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-700/80 text-emerald-200 border border-emerald-600">
                {member.memberNumber}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                Anggota Aktif
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-sans">
              Ahlan Wa Sahlan, {member.fullName}
            </h1>
            <p className="text-xs text-emerald-200/80 max-w-xl">
              Akses portofolio simpanan tabungan berkah, gadai syariah (Rahn), dan fasilitas pembiayaan barang (Murabahah) bebas riba.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-right min-w-[220px]">
            <span className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider block">
              Total Saldo Simpanan
            </span>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              {formatRupiah(totalBalance)}
            </div>
            <span className="text-[10px] text-emerald-300 block mt-0.5">
              {myAccounts.length} Rekening Buku Tabungan
            </span>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-6 mt-4 border-t border-emerald-800/80 text-xs">
          <button
            onClick={() => setActiveTab('ringkasan')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'ringkasan'
                ? 'bg-white text-emerald-950 shadow-md'
                : 'bg-emerald-800/60 text-emerald-200 hover:bg-emerald-700/60'
            }`}
          >
            Ringkasan
          </button>
          <button
            onClick={() => setActiveTab('simpanan')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'simpanan'
                ? 'bg-white text-emerald-950 shadow-md'
                : 'bg-emerald-800/60 text-emerald-200 hover:bg-emerald-700/60'
            }`}
          >
            Simpanan ({myAccounts.length})
          </button>
          <button
            onClick={() => setActiveTab('mutasi')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'mutasi'
                ? 'bg-white text-emerald-950 shadow-md'
                : 'bg-emerald-800/60 text-emerald-200 hover:bg-emerald-700/60'
            }`}
          >
            Mutasi Rekening
          </button>
          <button
            onClick={() => setActiveTab('gadai')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'gadai'
                ? 'bg-white text-emerald-950 shadow-md'
                : 'bg-emerald-800/60 text-emerald-200 hover:bg-emerald-700/60'
            }`}
          >
            Gadai (Rahn) ({myPawns.length})
          </button>
          <button
            onClick={() => setActiveTab('kredit')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'kredit'
                ? 'bg-white text-emerald-950 shadow-md'
                : 'bg-emerald-800/60 text-emerald-200 hover:bg-emerald-700/60'
            }`}
          >
            Kredit Barang ({myCredits.length})
          </button>
          <button
            onClick={() => setActiveTab('angsuran')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'angsuran'
                ? 'bg-white text-emerald-950 shadow-md'
                : 'bg-emerald-800/60 text-emerald-200 hover:bg-emerald-700/60'
            }`}
          >
            Jadwal Angsuran
          </button>
          <button
            onClick={() => setActiveTab('profil')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'profil'
                ? 'bg-white text-emerald-950 shadow-md'
                : 'bg-emerald-800/60 text-emerald-200 hover:bg-emerald-700/60'
            }`}
          >
            Profil Anggota
          </button>
        </div>
      </div>

      {/* RINGKASAN TAB */}
      {activeTab === 'ringkasan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 uppercase font-semibold">
                <span>Tabungan Syariah</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Wallet className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-bold text-slate-900 mt-2">
                {formatRupiah(totalBalance)}
              </div>
              <div className="text-[11px] text-emerald-700 mt-1">
                Aman & bergaransi penuh
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 uppercase font-semibold">
                <span>Gadai Rahn Aktif</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Coins className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-bold text-slate-900 mt-2">
                {myPawns.length} Akad
              </div>
              <div className="text-[11px] text-amber-700 mt-1">
                Nilai Pinjaman: {formatRupiah(myPawns.reduce((a, b) => a + b.loanAmount, 0))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 uppercase font-semibold">
                <span>Kredit Barang Berjalan</span>
                <span className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <ShoppingBag className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-bold text-slate-900 mt-2">
                {myCredits.length} Kontrak
              </div>
              <div className="text-[11px] text-teal-700 mt-1">
                Sisa Hutang: {formatRupiah(myCredits.reduce((a, b) => a + b.remainingBalance, 0))}
              </div>
            </div>
          </div>

          {/* Quick Recent Transactions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                Transaksi Terkini Saya
              </h3>
              <button
                onClick={() => setActiveTab('mutasi')}
                className="text-xs text-emerald-700 font-bold hover:underline"
              >
                Lihat Semua Mutasi
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {myTransactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      tx.type === 'setoran' || tx.type === 'gadai_pencairan'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}>
                      {tx.type === 'setoran' || tx.type === 'gadai_pencairan' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{tx.notes}</div>
                      <div className="text-[10px] text-slate-400">
                        {formatDateIndo(tx.createdAt)} • Ref: {tx.referenceNumber}
                      </div>
                    </div>
                  </div>

                    <div className="text-right flex items-center gap-2">
                      <div>
                        <div className="font-bold text-slate-900">
                          {tx.type === 'penarikan' || tx.type === 'kredit_angsuran' ? '-' : '+'}
                          {formatRupiah(tx.amount)}
                        </div>
                        <div className="text-[10px] uppercase text-emerald-700 font-medium">
                          Akad {tx.akad.toUpperCase()}
                        </div>
                      </div>
                      <button
                        onClick={() => generateReceiptPdf(tx, member)}
                        className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                        title="Cetak dan Unduh Bukti PDF"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedReceiptTx(tx)}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Lihat Bukti Transaksi (Struk / WA)"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SIMPANAN & SALDO TAB */}
      {activeTab === 'simpanan' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Buku Rekening Simpanan Syariah</h2>
            <p className="text-xs text-slate-500">
              Setiap produk memiliki buku catatan terpisah dengan akad dan nisbah syariah masing-masing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myAccounts.map((acc) => (
              <div key={acc.id} className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-200 text-emerald-900">
                      Akad {acc.akad.toUpperCase()}
                    </span>
                    <h3 className="text-base font-bold text-emerald-950 mt-1">{acc.productName}</h3>
                    <p className="text-xs text-emerald-700">No. Rek: {member.memberNumber}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-600 text-white">
                    {acc.status}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-200 flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">Saldo Tersedia</span>
                  <span className="text-xl font-black text-emerald-950 font-mono">
                    {formatRupiah(acc.balance)}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Tanggal Buka:</span>
                    <span className="font-medium">{acc.openedAt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Biaya Administrasi:</span>
                    <span className="font-bold text-emerald-700">Rp 0 (Bebas Riba)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MUTASI TAB */}
      {activeTab === 'mutasi' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          {/* Kop Lembaga */}
          <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white p-0.5 border border-slate-200 overflow-hidden flex items-center justify-center shadow-xs shrink-0">
                <img 
                  src={simpanankuLogo} 
                  alt="Logo SIMPANANKU" 
                  className="w-full h-full object-cover rounded-lg" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h2 className="font-bold text-base text-slate-900 tracking-tight">SIMPANANKU</h2>
                <p className="text-xs text-slate-600 font-medium">
                  Simpanan Tabungan • Gadai Syariah (Rahn) • Kredit Barang (Murabahah)
                </p>
              </div>
            </div>
            <button
              id="btn-nasabah-cetak-mutasi-pdf"
              onClick={() => {
                generatePassbookPdf(member, accounts, transactions, 'Portal Mandiri Nasabah');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              Cetak PDF
            </button>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">Buku Mutasi Transaksi</h3>
            <p className="text-xs text-slate-500">
              Catatan mutasi debit, kredit, dan saldo berjalan nomor anggota {member.memberNumber} ({member.fullName})
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3">Tanggal & Waktu</th>
                  <th className="px-4 py-3">No. Referensi</th>
                  <th className="px-4 py-3">Keterangan & Akad</th>
                  <th className="px-4 py-3 text-right">Debit (Keluar)</th>
                  <th className="px-4 py-3 text-right">Kredit (Masuk)</th>
                  <th className="px-4 py-3 text-center">Struk Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myTransactions.map((tx) => {
                  const isCredit = tx.type === 'setoran' || tx.type === 'gadai_pencairan';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 text-slate-600">{formatDateIndo(tx.createdAt)}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{tx.referenceNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{tx.notes}</div>
                        <div className="text-[10px] text-emerald-700">Akad {tx.akad.toUpperCase()}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-rose-700 font-medium">
                        {!isCredit ? formatRupiah(tx.amount) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-700 font-bold">
                        {isCredit ? formatRupiah(tx.amount) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => generateReceiptPdf(tx, member)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] transition-colors shadow-2xs"
                            title="Cetak dan Unduh Dokumen PDF Resmi"
                          >
                            <FileDown className="w-3 h-3" />
                            Cetak PDF
                          </button>
                          <button
                            onClick={() => setSelectedReceiptTx(tx)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 font-medium text-[10px] transition-colors"
                            title="Lihat Struk Thermal / Kirim WhatsApp"
                          >
                            <Printer className="w-3 h-3 text-slate-500" />
                            Struk / WA
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GADAI SYARIAH SAYA TAB */}
      {activeTab === 'gadai' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Gadai Syariah (Akad Rahn) Saya</h2>
            <p className="text-xs text-slate-500">
              Pinjaman qardh dengan jaminan barang aman di khazanah brankas lembaga
            </p>
          </div>

          {myPawns.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Anda belum memiliki akad gadai syariah yang sedang aktif.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myPawns.map((p) => (
                <div key={p.id} className="p-5 rounded-2xl border border-amber-200 bg-amber-50/30 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-200 text-amber-900">
                        {p.pawnCode}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 mt-1">{p.itemDescription}</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-600 text-white">
                      {p.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3 rounded-xl border border-amber-200">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Nilai Taksiran Emas</span>
                      <span className="font-semibold text-slate-900">{formatRupiah(p.estimatedValue)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Pinjaman Diterima</span>
                      <span className="font-bold text-amber-900">{formatRupiah(p.loanAmount)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Biaya Titip / Ujrah</span>
                      <span className="font-mono text-emerald-800 font-bold">{formatRupiah(p.monthlyUjrah)} / bln</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Jatuh Tempo Tebus</span>
                      <span className="font-mono text-rose-700 font-bold">{p.dueDate}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed italic">
                    "{p.notes}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* KREDIT BARANG SAYA TAB */}
      {activeTab === 'kredit' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Kredit Barang (Akad Murabahah) Saya</h2>
            <p className="text-xs text-slate-500">
              Barang halal yang telah diserahterimakan dengan margin keuntungan syariah tetap tanpa bunga
            </p>
          </div>

          {myCredits.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Anda tidak memiliki pembiayaan kredit barang berjalan.
            </div>
          ) : (
            <div className="space-y-4">
              {myCredits.map((c) => (
                <div key={c.id} className="p-5 rounded-2xl border border-teal-200 bg-white space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-100 text-teal-800">
                        Kontrak {c.contractNumber}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{c.itemName}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500">Sisa Tagihan:</span>
                      <div className="text-base font-bold text-emerald-800 font-mono">
                        {formatRupiah(c.remainingBalance)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Harga Jual Murabahah</span>
                      <span className="font-bold text-slate-900">{formatRupiah(c.sellingPrice)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Uang Muka (DP)</span>
                      <span className="font-medium text-slate-900">{formatRupiah(c.downPayment)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Angsuran Bulanan</span>
                      <span className="font-bold text-teal-800">{formatRupiah(c.monthlyInstallment)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Status Angsuran</span>
                      <span className="font-bold text-slate-900">
                        {c.paidInstallmentsCount} dari {c.tenorMonths} Bulan
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2.5 rounded-full transition-all"
                      style={{ width: `${(c.paidInstallmentsCount / c.tenorMonths) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* JADWAL ANGSURAN TAB */}
      {activeTab === 'angsuran' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Jadwal Rinci Angsuran Bulanan</h2>
            <p className="text-xs text-slate-500">
              Daftar tanggal jatuh tempo angsuran pokok dan margin syariah tanpa denda keterlambatan riba.
            </p>
          </div>

          {myCredits.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Tidak ada jadwal angsuran aktif saat ini.
            </div>
          ) : (
            myCredits.map((c) => (
              <div key={c.id} className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-900">{c.itemName} ({c.contractNumber})</span>
                  <span className="text-xs text-slate-500 font-mono">
                    Angsuran: {formatRupiah(c.monthlyInstallment)} / bln
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-700">
                    <thead className="bg-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-2.5">Bulan Ke</th>
                        <th className="px-4 py-2.5">Jatuh Tempo</th>
                        <th className="px-4 py-2.5 text-right">Porsi Pokok</th>
                        <th className="px-4 py-2.5 text-right">Porsi Margin</th>
                        <th className="px-4 py-2.5 text-right">Total Angsuran</th>
                        <th className="px-4 py-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {c.installments.map((inst) => (
                        <tr key={inst.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-bold">Angsuran Ke-{inst.installmentNo}</td>
                          <td className="px-4 py-2.5 text-slate-600 font-mono">{inst.dueDate}</td>
                          <td className="px-4 py-2.5 text-right text-slate-500">{formatRupiah(inst.principalPortion)}</td>
                          <td className="px-4 py-2.5 text-right text-teal-700">{formatRupiah(inst.marginPortion)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatRupiah(inst.amount)}</td>
                          <td className="px-4 py-2.5 text-center">
                            {inst.status === 'lunas' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                LUNAS
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                Belum Bayar
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* PROFIL TAB */}
      {activeTab === 'profil' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Profil Anggota</h2>
              <p className="text-xs text-slate-500">
                Data resmi kependudukan dan rincian keanggotaan terdaftar
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Nomor Anggota (Pengganti Rekening)</span>
                <span className="font-mono font-black text-emerald-800 text-sm">{member.memberNumber}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Nama Lengkap (Sesuai KTP)</span>
                <span className="font-bold text-slate-900">{member.fullName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Nomor Induk Kependudukan (NIK)</span>
                <span className="font-mono text-slate-900 font-bold">{member.nik}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Nomor Telepon WhatsApp</span>
                <span className="font-mono text-slate-900">{member.phone}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Pekerjaan / Usaha</span>
                <span className="text-slate-900 font-medium">{member.occupation}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Alamat Domisili</span>
                <span className="text-slate-900 leading-relaxed">{member.address}</span>
              </div>
            </div>
          </div>

          {/* Status Details Box */}
          <div className="p-4 rounded-2xl border border-emerald-300 bg-emerald-50/60 flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950">
              <div className="font-bold text-sm">Status Keanggotaan: AKTIF</div>
              <p className="mt-1 leading-relaxed text-emerald-800">
                Akun Anda telah memenuhi kepatuhan regulasi identitas syariah dan terdaftar resmi di SIMPANANKU.
              </p>
              <div className="text-[10px] text-emerald-600 font-mono mt-1">
                Tanggal Bergabung: {formatDateIndo(member.joinDate)}
              </div>
            </div>
          </div>

          {/* Form Ubah Password Nasabah */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <Key className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-900">Ubah Kata Sandi / Password Nasabah</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Amankan akses portal digital SIMPANANKU dengan memperbarui password secara berkala.
            </p>

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="max-w-md space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password Saat Ini:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan password saat ini (demo: nasabah123)"
                    className="w-full pl-3 pr-10 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password Baru:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-3 pr-10 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Konfirmasi Password Baru:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full pl-3 pr-10 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Simpan Kata Sandi Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceiptTx && (
        <ReceiptModal
          transaction={selectedReceiptTx}
          member={member}
          onClose={() => setSelectedReceiptTx(null)}
        />
      )}
    </div>
  );
};
