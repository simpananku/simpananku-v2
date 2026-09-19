import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Wallet, 
  Layers, 
  Coins, 
  ShoppingBag, 
  FileText, 
  BarChart3, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Fingerprint,
  Download,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Building2,
  Calendar,
  X,
  Key,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Printer,
  RotateCcw,
  FileSpreadsheet,
  PieChart,
  DollarSign,
  Check,
  FileDown
} from 'lucide-react';
import { 
  User, 
  Member, 
  SavingsProduct, 
  SavingsAccount,
  PawnPledge, 
  CommodityFinancing, 
  Transaction,
  ShariaAkad
} from '../types';
import { formatRupiah, formatDateIndo, generateMemberNumber } from '../services/generator';
import { notificationService } from '../services/notificationService';
import { ReceiptModal } from '../components/ReceiptModal';
import { generateReceiptPdf } from '../services/receiptPdfService';
import simpanankuLogo from '../assets/images/simpananku.jpg';

const REPORT_MONTHS = [
  { value: '01', name: 'Januari' },
  { value: '02', name: 'Februari' },
  { value: '03', name: 'Maret' },
  { value: '04', name: 'April' },
  { value: '05', name: 'Mei' },
  { value: '06', name: 'Juni' },
  { value: '07', name: 'Juli' },
  { value: '08', name: 'Agustus' },
  { value: '09', name: 'September' },
  { value: '10', name: 'Oktober' },
  { value: '11', name: 'November' },
  { value: '12', name: 'Desember' },
];

const REPORT_YEARS = ['2023', '2024', '2025', '2026', '2027', '2028'];

interface AdminDashboardProps {
  currentUser?: User;
  onUpdateCurrentUser?: (user: User) => void;
  users: User[];
  members: Member[];
  products: SavingsProduct[];
  accounts?: SavingsAccount[];
  pawns: PawnPledge[];
  credits: CommodityFinancing[];
  transactions: Transaction[];
  onUpdateUsers: (users: User[]) => void;
  onUpdateMembers: (members: Member[]) => void;
  onUpdateProducts: (products: SavingsProduct[]) => void;
  onUpdateAccounts?: (accounts: SavingsAccount[]) => void;
  onUpdatePawns: (pawns: PawnPledge[]) => void;
  onUpdateCredits: (credits: CommodityFinancing[]) => void;
  onUpdateTransactions?: (transactions: Transaction[]) => void;
  onPawnRedemption?: (newTx: Transaction, updatedPawn: PawnPledge) => void;
  onPayUjrah?: (newTx: Transaction, updatedPawn: PawnPledge) => void;
}

type AdminTab = 
  | 'overview' 
  | 'admins' 
  | 'tellers' 
  | 'members' 
  | 'products' 
  | 'pawns' 
  | 'credits' 
  | 'transactions' 
  | 'reports'
  | 'profile';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onUpdateCurrentUser,
  users,
  members,
  products,
  accounts = [],
  pawns,
  credits,
  transactions,
  onUpdateUsers,
  onUpdateMembers,
  onUpdateProducts,
  onUpdateAccounts,
  onUpdatePawns,
  onUpdateCredits,
  onUpdateTransactions,
  onPawnRedemption,
  onPayUjrah,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Generic Create/Edit Modal states
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SavingsProduct | null>(null);

  // Pawn (Gadai) Edit Modal State
  const [showPawnModal, setShowPawnModal] = useState(false);
  const [editingPawn, setEditingPawn] = useState<PawnPledge | null>(null);
  const [pawnItemDesc, setPawnItemDesc] = useState('');
  const [pawnItemType, setPawnItemType] = useState<PawnPledge['itemType']>('emas_batangan');
  const [pawnEstValue, setPawnEstValue] = useState<number>(0);
  const [pawnLoan, setPawnLoan] = useState<number>(0);
  const [pawnUjrah, setPawnUjrah] = useState<number>(0);
  const [pawnPeriod, setPawnPeriod] = useState<number>(4);
  const [pawnDueDate, setPawnDueDate] = useState('');
  const [pawnStatus, setPawnStatus] = useState<PawnPledge['status']>('aktif');
  const [pawnNotes, setPawnNotes] = useState('');

  // Credit (Kredit Barang Murabahah) Edit Modal State
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [editingCredit, setEditingCredit] = useState<CommodityFinancing | null>(null);
  const [creditItemName, setCreditItemName] = useState('');
  const [creditItemCategory, setCreditItemCategory] = useState<CommodityFinancing['itemCategory']>('elektronik_rumah');
  const [creditCost, setCreditCost] = useState<number>(0);
  const [creditMargin, setCreditMargin] = useState<number>(0);
  const [creditDP, setCreditDP] = useState<number>(0);
  const [creditTenor, setCreditTenor] = useState<number>(12);
  const [creditStatus, setCreditStatus] = useState<CommodityFinancing['status']>('berjalan');

  // Transaction Filters, Search & Modals
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<string>('all');
  const [txPeriodType, setTxPeriodType] = useState<'all' | 'date' | 'month' | 'year' | 'range'>('all');
  const [txFilterDate, setTxFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [txFilterMonth, setTxFilterMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [txFilterYear, setTxFilterYear] = useState<string>(String(new Date().getFullYear()));
  const [txFilterStartDate, setTxFilterStartDate] = useState<string>('');
  const [txFilterEndDate, setTxFilterEndDate] = useState<string>('');

  // Transaction Edit Modal
  const [showTxModal, setShowTxModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txType, setTxType] = useState<Transaction['type']>('setoran');
  const [txAkad, setTxAkad] = useState<ShariaAkad>('wadiah');
  const [txPaymentMethod, setTxPaymentMethod] = useState<Transaction['paymentMethod']>('tunai');
  const [txStatus, setTxStatus] = useState<Transaction['status']>('success');
  const [txNotes, setTxNotes] = useState('');

  // Transaction Print Report Modal
  const [showPrintReportModal, setShowPrintReportModal] = useState(false);

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffRole, setStaffRole] = useState<'admin' | 'teller'>('teller');
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  // Member Form State
  const [memFullName, setMemFullName] = useState('');
  const [memNik, setMemNik] = useState('');
  const [memPhone, setMemPhone] = useState('');
  const [memEmail, setMemEmail] = useState('');
  const [memAddress, setMemAddress] = useState('');
  const [memOccupation, setMemOccupation] = useState('');
  const [memPassword, setMemPassword] = useState('');
  const [showMemPassword, setShowMemPassword] = useState(false);

  // Administrator Change Password Modal for Any User (Nasabah, Teller, Admin)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePassTarget, setChangePassTarget] = useState<{
    type: 'nasabah' | 'teller' | 'admin';
    id: string;
    name: string;
    identifier: string;
    currentPassword?: string;
  } | null>(null);
  const [targetNewPassword, setTargetNewPassword] = useState('');
  const [showTargetPassword, setShowTargetPassword] = useState(false);
  const [targetSuccessMessage, setTargetSuccessMessage] = useState<string | null>(null);
  const [targetErrorMessage, setTargetErrorMessage] = useState<string | null>(null);

  // Admin Self Profile Password Form State
  const [adminCurrentPassword, setAdminCurrentPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminPassSuccess, setAdminPassSuccess] = useState<string | null>(null);
  const [adminPassError, setAdminPassError] = useState<string | null>(null);

  // Product Form State
  const [prodCode, setProdCode] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodAkad, setProdAkad] = useState<'wadiah' | 'mudharabah'>('wadiah');
  const [prodDesc, setProdDesc] = useState('');
  const [prodMinDeposit, setProdMinDeposit] = useState(50000);
  const [prodMinBalance, setProdMinBalance] = useState(20000);
  const [prodRatio, setProdRatio] = useState('70 : 30');

  // Universal In-App Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'member' | 'product' | 'pawn' | 'credit' | 'transaction' | 'teller' | 'admin';
    id: string;
    title: string;
    itemName: string;
    itemDetails?: string;
    warningText?: string;
  } | null>(null);

  // Financial Reports Period & Category States
  const [reportPeriodType, setReportPeriodType] = useState<'month' | 'year' | 'all'>('month');
  const [reportSelectedMonth, setReportSelectedMonth] = useState<string>(
    String(new Date().getMonth() + 1).padStart(2, '0')
  );
  const [reportSelectedYear, setReportSelectedYear] = useState<string>(
    String(new Date().getFullYear())
  );
  const [reportViewTab, setReportViewTab] = useState<'neraca' | 'labarugi' | 'arus_kas' | 'portofolio'>('neraca');
  const [showPrintFinancialModal, setShowPrintFinancialModal] = useState(false);

  // Bukti Transaksi Receipt Modal State
  const [adminReceiptTx, setAdminReceiptTx] = useState<Transaction | null>(null);
  const [adminReceiptMember, setAdminReceiptMember] = useState<Member | null>(null);

  // Metrics calculation
  const totalSavings = members.reduce((acc, m) => acc + m.totalSavings, 0);
  const totalPawnPortfolio = pawns.reduce((acc, p) => p.status === 'aktif' ? acc + p.loanAmount : acc, 0);
  const totalCreditPortfolio = credits.reduce((acc, c) => c.status === 'berjalan' ? acc + c.remainingBalance : acc, 0);
  const totalAssets = totalSavings + totalPawnPortfolio + totalCreditPortfolio;

  // Dynamic Financial Reports Calculations based on Month, Year, and Period Type
  const reportTransactions = transactions.filter((t) => {
    if (reportPeriodType === 'all') return true;
    const txDate = new Date(t.createdAt);
    const txYear = String(txDate.getFullYear());
    const txMonth = String(txDate.getMonth() + 1).padStart(2, '0');

    if (reportPeriodType === 'year') {
      return txYear === reportSelectedYear;
    }
    if (reportPeriodType === 'month') {
      return txYear === reportSelectedYear && txMonth === reportSelectedMonth;
    }
    return true;
  });

  // Calculate Cash Inflow & Outflow for the selected report period
  const repTotalMasuk = reportTransactions.reduce((acc, t) => {
    return ['setoran', 'gadai_tebus', 'gadai_ujrah', 'kredit_angsuran'].includes(t.type)
      ? acc + t.amount
      : acc;
  }, 0);

  const repTotalKeluar = reportTransactions.reduce((acc, t) => {
    return ['penarikan', 'gadai_pencairan', 'kredit_pencairan'].includes(t.type)
      ? acc + t.amount
      : acc;
  }, 0);

  const repNetCash = repTotalMasuk - repTotalKeluar;

  // Breakdown of Income for Laba Rugi
  const repUjrahIncome = reportTransactions
    .filter((t) => t.type === 'gadai_ujrah')
    .reduce((acc, t) => acc + t.amount, 0);

  const effectiveUjrahIncome =
    repUjrahIncome > 0
      ? repUjrahIncome
      : pawns
          .filter((p) => p.status === 'aktif')
          .reduce((acc, p) => acc + (reportPeriodType === 'year' ? p.monthlyUjrah * 12 : p.monthlyUjrah), 0);

  const repAngsuranReceived = reportTransactions
    .filter((t) => t.type === 'kredit_angsuran')
    .reduce((acc, t) => acc + t.amount, 0);

  const repEstimatedMargin =
    repAngsuranReceived > 0
      ? Math.round(repAngsuranReceived * 0.18)
      : credits
          .filter((c) => c.status === 'berjalan')
          .reduce(
            (acc, c) =>
              acc +
              Math.round((c.marginAmount / c.tenorMonths) * (reportPeriodType === 'year' ? 12 : 1)),
            0
          );

  const repTotalShariaIncome = effectiveUjrahIncome + repEstimatedMargin;
  const repOperationalExpense = Math.max(
    1500000,
    Math.round(repTotalShariaIncome * 0.22)
  );
  const repNetSurplus = Math.max(0, repTotalShariaIncome - repOperationalExpense);
  const repHakPihakKetiga = Math.round(repNetSurplus * 0.3); // Bagi Hasil Mudharabah Muthlaqah 30%
  const repLabaBersihLembaga = repNetSurplus - repHakPihakKetiga;

  // Pawns & Credits active in report period
  const reportPawns = pawns.filter((p) => {
    if (reportPeriodType === 'all') return true;
    const d = new Date(p.createdAt);
    const y = String(d.getFullYear());
    const m = String(d.getMonth() + 1).padStart(2, '0');
    if (reportPeriodType === 'year') return y === reportSelectedYear;
    return y === reportSelectedYear && m === reportSelectedMonth;
  });

  const reportCredits = credits.filter((c) => {
    if (reportPeriodType === 'all') return true;
    const d = new Date(c.createdAt);
    const y = String(d.getFullYear());
    const m = String(d.getMonth() + 1).padStart(2, '0');
    if (reportPeriodType === 'year') return y === reportSelectedYear;
    return y === reportSelectedYear && m === reportSelectedMonth;
  });

  // Export Financial Report CSV handler
  const handleExportFinancialReportCSV = () => {
    const periodLabel =
      reportPeriodType === 'month'
        ? `${REPORT_MONTHS.find((m) => m.value === reportSelectedMonth)?.name || reportSelectedMonth} ${reportSelectedYear}`
        : reportPeriodType === 'year'
        ? `Tahun ${reportSelectedYear}`
        : 'Semua Periode';

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `"LAPORAN KEUANGAN & AUDIT KAS SYARIAH SIMPANANKU"\r\n`;
    csvContent += `"Periode","${periodLabel}"\r\n`;
    csvContent += `"Tanggal Cetak","${new Date().toLocaleString('id-ID')}"\r\n\r\n`;

    csvContent += `"RINGKASAN KEUANGAN PERIODE"\r\n`;
    csvContent += `"Indikator","Nominal (Rp)"\r\n`;
    csvContent += `"Total Kas Masuk","${repTotalMasuk}"\r\n`;
    csvContent += `"Total Kas Keluar","${repTotalKeluar}"\r\n`;
    csvContent += `"Arus Kas Bersih (Net)","${repNetCash}"\r\n`;
    csvContent += `"Pendapatan Ujrah Gadai Syariah","${effectiveUjrahIncome}"\r\n`;
    csvContent += `"Pendapatan Margin Murabahah","${repEstimatedMargin}"\r\n`;
    csvContent += `"Total Pendapatan Operasional Syariah","${repTotalShariaIncome}"\r\n`;
    csvContent += `"Beban Operasional Lembaga","${repOperationalExpense}"\r\n`;
    csvContent += `"Hak Bagi Hasil Pihak Ketiga","${repHakPihakKetiga}"\r\n`;
    csvContent += `"Laba Bersih Lembaga","${repLabaBersihLembaga}"\r\n\r\n`;

    csvContent += `"MUTASI TRANSAKSI PERIODE (${periodLabel})"\r\n`;
    csvContent += `"No Ref","Tanggal","Nasabah","No Anggota","Jenis Transaksi","Akad","Nominal","Arus Kas","Teller","Status"\r\n`;

    reportTransactions.forEach((t) => {
      const isMasuk = ['setoran', 'gadai_tebus', 'gadai_ujrah', 'kredit_angsuran'].includes(t.type);
      csvContent += `"${t.referenceNumber}","${t.createdAt.split('T')[0]}","${t.memberName}","${t.memberNumber}","${t.type}","${t.akad}","${t.amount}","${isMasuk ? 'KAS MASUK (+)' : 'KAS KELUAR (-)'}","${t.tellerName}","${t.status}"\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Keuangan_${reportPeriodType}_${reportSelectedYear}_${reportSelectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete Trigger and Execution
  const openDeleteModal = (
    type: 'member' | 'product' | 'pawn' | 'credit' | 'transaction' | 'teller' | 'admin',
    id: string,
    itemName: string,
    itemDetails?: string,
    warningText?: string
  ) => {
    if (type === 'admin') {
      if (currentUser && currentUser.id === id) {
        alert('Tidak dapat menghapus akun Administrator yang sedang aktif Anda gunakan saat ini.');
        return;
      }
      const adminCount = users.filter((u) => u.role === 'admin').length;
      if (adminCount <= 1) {
        alert('Tidak dapat menghapus! Sistem harus memiliki minimal satu akun Super Administrator.');
        return;
      }
    }

    setDeleteModal({
      isOpen: true,
      type,
      id,
      title: `Konfirmasi Hapus ${
        type === 'member'
          ? 'Data Nasabah'
          : type === 'product'
          ? 'Produk Simpanan'
          : type === 'pawn'
          ? 'Kontrak Gadai Syariah'
          : type === 'credit'
          ? 'Kontrak Pembiayaan Barang'
          : type === 'transaction'
          ? 'Data Transaksi Kas'
          : type === 'teller'
          ? 'Akun Petugas Teller'
          : 'Akun Administrator'
      }`,
      itemName,
      itemDetails,
      warningText,
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteModal) return;
    const { type, id, itemName } = deleteModal;

    if (type === 'member') {
      const target = members.find((m) => m.id === id);
      onUpdateMembers(members.filter((m) => m.id !== id));
      if (target) {
        onUpdateUsers(users.filter((u) => u.memberId !== target.memberNumber && u.email !== target.email));
        if (accounts.length > 0 && onUpdateAccounts) {
          onUpdateAccounts(accounts.filter((a) => a.memberNumber !== target.memberNumber));
        }
      }
      notificationService.broadcast({
        title: 'Nasabah Dihapus',
        message: `Data nasabah ${itemName} beserta akun dan rekening terkait telah dihapus oleh Administrator.`,
        category: 'sistem',
      });
    } else if (type === 'product') {
      onUpdateProducts(products.filter((x) => x.id !== id));
      notificationService.broadcast({
        title: 'Produk Simpanan Dihapus',
        message: `Produk simpanan ${itemName} telah berhasil dihapus.`,
        category: 'sistem',
      });
    } else if (type === 'pawn') {
      const targetPawn = pawns.find((p) => p.id === id);
      onUpdatePawns(pawns.filter((p) => p.id !== id));
      if (targetPawn && targetPawn.status === 'aktif') {
        const updatedMembers = members.map((m) =>
          m.memberNumber === targetPawn.memberNumber
            ? { ...m, activePawnCount: Math.max(0, (m.activePawnCount || 0) - 1) }
            : m
        );
        onUpdateMembers(updatedMembers);
      }
      notificationService.broadcast({
        title: 'Kontrak Gadai Dihapus',
        message: `Data gadai ${itemName} telah dihapus dari portofolio Rahn aktif.`,
        category: 'gadai',
      });
    } else if (type === 'credit') {
      const targetCredit = credits.find((c) => c.id === id);
      onUpdateCredits(credits.filter((c) => c.id !== id));
      if (targetCredit && targetCredit.status === 'berjalan') {
        const updatedMembers = members.map((m) =>
          m.memberNumber === targetCredit.memberNumber
            ? { ...m, activeCreditCount: Math.max(0, (m.activeCreditCount || 0) - 1) }
            : m
        );
        onUpdateMembers(updatedMembers);
      }
      notificationService.broadcast({
        title: 'Kontrak Kredit Barang Dihapus',
        message: `Kontrak pembiayaan ${itemName} telah dihapus dari piutang berjalan.`,
        category: 'angsuran',
      });
    } else if (type === 'transaction') {
      if (onUpdateTransactions) {
        onUpdateTransactions(transactions.filter((t) => t.id !== id));
      }
      notificationService.broadcast({
        title: 'Transaksi Kas Dihapus',
        message: `Transaksi ${itemName} telah dihapus dari buku mutasi kas.`,
        category: 'sistem',
      });
    } else if (type === 'teller' || type === 'admin') {
      onUpdateUsers(users.filter((u) => u.id !== id));
      notificationService.broadcast({
        title: `Pengguna ${type === 'admin' ? 'Administrator' : 'Teller'} Dihapus`,
        message: `Akun petugas ${itemName} telah dihapus dari sistem.`,
        category: 'sistem',
      });
    }

    setDeleteModal(null);
  };

  // Handlers for Staff
  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const defaultPass = staffRole === 'admin' ? 'admin123' : 'teller123';
    const chosenPassword = staffPassword.trim() || defaultPass;
    const newUser: User = {
      id: 'USR-' + Date.now(),
      name: staffName,
      email: staffEmail,
      role: staffRole,
      phone: staffPhone,
      password: chosenPassword,
      createdAt: new Date().toISOString(),
    };
    onUpdateUsers([...users, newUser]);
    setShowStaffModal(false);
    setStaffName('');
    setStaffEmail('');
    setStaffPhone('');
    setStaffPassword('');
    setShowStaffPassword(false);

    notificationService.broadcast({
      title: `Petugas ${staffRole.toUpperCase()} Baru`,
      message: `${staffName} (${staffEmail}) telah ditambahkan ke sistem dengan password yang ditentukan.`,
      category: 'sistem',
      targetRole: 'admin',
    });
  };

  const handleDeleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    openDeleteModal(
      target.role === 'admin' ? 'admin' : 'teller',
      target.id,
      target.name,
      `Email: ${target.email} • Peran: ${target.role.toUpperCase()}`,
      `Akun ${target.role === 'admin' ? 'Administrator' : 'Teller'} ini akan dihapus dari sistem secara permanen.`
    );
  };

  // Administrator Change Any User's Password
  const openChangePasswordModal = (
    type: 'nasabah' | 'teller' | 'admin',
    id: string,
    name: string,
    identifier: string,
    currentPassword?: string
  ) => {
    setChangePassTarget({ type, id, name, identifier, currentPassword });
    setTargetNewPassword('');
    setShowTargetPassword(false);
    setTargetSuccessMessage(null);
    setTargetErrorMessage(null);
    setShowChangePasswordModal(true);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changePassTarget) return;
    if (targetNewPassword.trim().length < 6) {
      setTargetErrorMessage('Password baru minimal 6 karakter!');
      return;
    }

    const newPass = targetNewPassword.trim();

    if (changePassTarget.type === 'nasabah') {
      // 1. Update in members collection
      const updatedMembers = members.map((m) =>
        m.id === changePassTarget.id || m.memberNumber === changePassTarget.identifier
          ? { ...m, password: newPass }
          : m
      );
      onUpdateMembers(updatedMembers);

      // 2. Sync to linked user record
      const updatedUsers = users.map((u) =>
        u.memberId === changePassTarget.identifier || u.email === changePassTarget.identifier || u.id === changePassTarget.id
          ? { ...u, password: newPass }
          : u
      );
      onUpdateUsers(updatedUsers);
    } else {
      // Teller or Admin user
      const updatedUsers = users.map((u) =>
        u.id === changePassTarget.id ? { ...u, password: newPass } : u
      );
      onUpdateUsers(updatedUsers);

      // If updating current logged in user
      if (currentUser && currentUser.id === changePassTarget.id && onUpdateCurrentUser) {
        onUpdateCurrentUser({ ...currentUser, password: newPass });
      }
    }

    notificationService.broadcast({
      title: 'Password Pengguna Diperbarui',
      message: `Password akun ${changePassTarget.name} (${changePassTarget.identifier}) berhasil diubah oleh Administrator.`,
      category: 'sistem',
      targetRole: changePassTarget.type,
    });

    setTargetSuccessMessage(`Password akun ${changePassTarget.name} berhasil diperbarui!`);
    setTimeout(() => {
      setShowChangePasswordModal(false);
      setChangePassTarget(null);
      setTargetSuccessMessage(null);
    }, 1000);
  };

  // Admin Self Profile Password Change
  const handleChangeAdminOwnPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPassError(null);
    setAdminPassSuccess(null);

    const activeAdmin = currentUser || users.find((u) => u.role === 'admin');
    if (!activeAdmin) return;

    if (adminCurrentPassword && activeAdmin.password && adminCurrentPassword !== activeAdmin.password) {
      setAdminPassError('Password saat ini tidak sesuai!');
      return;
    }

    if (adminNewPassword.length < 6) {
      setAdminPassError('Password baru minimal 6 karakter!');
      return;
    }

    if (adminNewPassword !== adminConfirmPassword) {
      setAdminPassError('Konfirmasi password baru tidak cocok!');
      return;
    }

    const updatedUsers = users.map((u) =>
      u.id === activeAdmin.id ? { ...u, password: adminNewPassword } : u
    );
    onUpdateUsers(updatedUsers);

    if (onUpdateCurrentUser) {
      onUpdateCurrentUser({ ...activeAdmin, password: adminNewPassword });
    }

    setAdminPassSuccess('Kata sandi Administrator berhasil diperbarui!');
    setAdminCurrentPassword('');
    setAdminNewPassword('');
    setAdminConfirmPassword('');

    notificationService.broadcast({
      title: 'Password Admin Diubah',
      message: `Administrator ${activeAdmin.name} telah memperbarui kata sandi login.`,
      category: 'sistem',
      targetRole: 'admin',
    });
  };

  // Handlers for Member
  const openAddMemberModal = () => {
    setEditingMember(null);
    setMemFullName('');
    setMemNik('');
    setMemPhone('');
    setMemEmail('');
    setMemAddress('');
    setMemOccupation('');
    setMemPassword('nasabah123');
    setShowMemPassword(false);
    setShowMemberModal(true);
  };

  const openEditMemberModal = (m: Member) => {
    setEditingMember(m);
    setMemFullName(m.fullName);
    setMemNik(m.nik);
    setMemPhone(m.phone);
    setMemEmail(m.email);
    setMemAddress(m.address);
    setMemOccupation(m.occupation);
    setMemPassword(m.password || 'nasabah123');
    setShowMemPassword(false);
    setShowMemberModal(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenPassword = memPassword.trim() || 'nasabah123';
    if (editingMember) {
      const updated = members.map((m) =>
        m.id === editingMember.id
          ? {
              ...m,
              fullName: memFullName,
              nik: memNik,
              phone: memPhone,
              email: memEmail,
              address: memAddress,
              occupation: memOccupation,
              password: chosenPassword,
            }
          : m
      );
      onUpdateMembers(updated);

      // Sync user table
      const updatedUsers = users.map((u) =>
        u.memberId === editingMember.memberNumber || u.email === editingMember.email
          ? {
              ...u,
              name: memFullName,
              email: memEmail || u.email,
              phone: memPhone,
              password: chosenPassword,
            }
          : u
      );
      onUpdateUsers(updatedUsers);
    } else {
      const nextNum = generateMemberNumber(members.length);
      const newM: Member = {
        id: 'MBR-' + Date.now(),
        memberNumber: nextNum,
        nik: memNik,
        fullName: memFullName,
        email: memEmail || `${nextNum.toLowerCase()}@simpananku.my.id`,
        phone: memPhone,
        address: memAddress,
        occupation: memOccupation,
        status: 'aktif',
        joinDate: new Date().toISOString().split('T')[0],
        totalSavings: 0,
        activePawnCount: 0,
        activeCreditCount: 0,
        password: chosenPassword,
      };
      onUpdateMembers([...members, newM]);

      // Create linked user login
      const newU: User = {
        id: 'USR-' + Date.now(),
        name: memFullName,
        email: newM.email,
        role: 'nasabah',
        phone: memPhone,
        memberId: nextNum,
        password: chosenPassword,
        createdAt: new Date().toISOString(),
      };
      onUpdateUsers([...users, newU]);
    }
    setShowMemberModal(false);
  };

  const handleDeleteMember = (memberId: string) => {
    const target = members.find((m) => m.id === memberId);
    if (!target) return;
    openDeleteModal(
      'member',
      target.id,
      target.fullName,
      `No. Anggota: ${target.memberNumber} • NIK: ${target.nik} • Simpanan: ${formatRupiah(target.totalSavings)}`,
      'Menghapus nasabah ini juga akan menonaktifkan akun login terkait dan menghapus dari buku anggota.'
    );
  };

  // Handlers for Product
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProdCode('');
    setProdName('');
    setProdAkad('wadiah');
    setProdDesc('');
    setProdMinDeposit(50000);
    setProdMinBalance(20000);
    setProdRatio('70 : 30');
    setShowProductModal(true);
  };

  const openEditProductModal = (product: SavingsProduct) => {
    setEditingProduct(product);
    setProdCode(product.code);
    setProdName(product.name);
    setProdAkad(product.akad);
    setProdDesc(product.description);
    setProdMinDeposit(product.minInitialDeposit);
    setProdMinBalance(product.minBalance);
    setProdRatio(product.profitSharingRatio || '70 : 30');
    setShowProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdateProducts(
        products.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                code: prodCode,
                name: prodName,
                akad: prodAkad,
                description: prodDesc,
                minInitialDeposit: prodMinDeposit,
                minBalance: prodMinBalance,
                profitSharingRatio: prodAkad === 'mudharabah' ? prodRatio : undefined,
              }
            : p
        )
      );
      notificationService.broadcast({
        title: 'Produk Simpanan Diperbarui',
        message: `Produk simpanan ${prodName} (${prodCode}) berhasil diubah.`,
        category: 'sistem',
      });
    } else {
      const newP: SavingsProduct = {
        id: 'PRD-' + Date.now(),
        code: prodCode || 'PRD-' + (products.length + 1),
        name: prodName,
        akad: prodAkad,
        description: prodDesc,
        minInitialDeposit: prodMinDeposit,
        minBalance: prodMinBalance,
        adminFee: 0,
        profitSharingRatio: prodAkad === 'mudharabah' ? prodRatio : undefined,
        isActive: true,
      };
      onUpdateProducts([...products, newP]);
      notificationService.broadcast({
        title: 'Produk Simpanan Baru',
        message: `Produk simpanan ${newP.name} (${newP.code}) berhasil ditambahkan.`,
        category: 'sistem',
      });
    }
    setShowProductModal(false);
  };

  const handleDeleteProduct = (prodId: string) => {
    const p = products.find((x) => x.id === prodId);
    if (!p) return;
    openDeleteModal(
      'product',
      p.id,
      p.name,
      `Kode: ${p.code} • Akad: ${p.akad.toUpperCase()} • Min Setoran: ${formatRupiah(p.minInitialDeposit)}`,
      'Produk simpanan ini akan dihapus dari katalog simpanan syariah.'
    );
  };

  const handleDeletePawn = (pawnId: string) => {
    const target = pawns.find((p) => p.id === pawnId);
    if (!target) return;
    openDeleteModal(
      'pawn',
      target.id,
      `${target.pawnCode} - ${target.itemDescription}`,
      `Nasabah: ${target.memberName} (${target.memberNumber}) • Pinjaman: ${formatRupiah(target.loanAmount)} • Ujrah: ${formatRupiah(target.monthlyUjrah)}/bln`,
      'Kontrak gadai syariah ini akan dihapus dari portofolio Rahn aktif lembaga.'
    );
  };

  const handleDeleteCredit = (creditId: string) => {
    const target = credits.find((c) => c.id === creditId);
    if (!target) return;
    openDeleteModal(
      'credit',
      target.id,
      `${target.contractNumber} - ${target.itemName}`,
      `Nasabah: ${target.memberName} (${target.memberNumber}) • Sisa Piutang: ${formatRupiah(target.remainingBalance)} • Margin: ${formatRupiah(target.marginAmount)}`,
      'Kontrak pembiayaan barang murabahah ini akan dihapus dari daftar piutang berjalan.'
    );
  };

  // Handlers for Pawn (Gadai Syariah - Rahn)
  const openEditPawnModal = (pawn: PawnPledge) => {
    setEditingPawn(pawn);
    setPawnItemDesc(pawn.itemDescription);
    setPawnItemType(pawn.itemType);
    setPawnEstValue(pawn.estimatedValue);
    setPawnLoan(pawn.loanAmount);
    setPawnUjrah(pawn.monthlyUjrah);
    setPawnPeriod(pawn.periodMonths);
    setPawnDueDate(pawn.dueDate);
    setPawnStatus(pawn.status);
    setPawnNotes(pawn.notes || '');
    setShowPawnModal(true);
  };

  const handleSavePawn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPawn) return;

    const updatedPawns = pawns.map((p) =>
      p.id === editingPawn.id
        ? {
            ...p,
            itemDescription: pawnItemDesc,
            itemType: pawnItemType,
            estimatedValue: Number(pawnEstValue),
            loanAmount: Number(pawnLoan),
            monthlyUjrah: Number(pawnUjrah),
            periodMonths: Number(pawnPeriod),
            dueDate: pawnDueDate,
            status: pawnStatus,
            notes: pawnNotes,
          }
        : p
    );
    onUpdatePawns(updatedPawns);

    if (editingPawn.status !== pawnStatus) {
      const wasActive = editingPawn.status === 'aktif';
      const isNowActive = pawnStatus === 'aktif';
      if (wasActive !== isNowActive) {
        const diff = isNowActive ? 1 : -1;
        const updatedMembers = members.map((m) =>
          m.memberNumber === editingPawn.memberNumber
            ? { ...m, activePawnCount: Math.max(0, (m.activePawnCount || 0) + diff) }
            : m
        );
        onUpdateMembers(updatedMembers);
      }
    }

    setShowPawnModal(false);
    setEditingPawn(null);

    notificationService.broadcast({
      title: 'Perubahan Kontrak & Ujrah Gadai',
      message: `Data gadai ${editingPawn.pawnCode} (${editingPawn.memberName}) dengan Ujrah/Bln ${formatRupiah(pawnUjrah)} telah diperbarui.`,
      category: 'gadai',
    });
  };

  // Handlers for Credit (Kredit Barang - Murabahah)
  const openEditCreditModal = (credit: CommodityFinancing) => {
    setEditingCredit(credit);
    setCreditItemName(credit.itemName);
    setCreditItemCategory(credit.itemCategory);
    setCreditCost(credit.purchaseCost);
    setCreditMargin(credit.marginAmount);
    setCreditDP(credit.downPayment);
    setCreditTenor(credit.tenorMonths);
    setCreditStatus(credit.status);
    setShowCreditModal(true);
  };

  const handleSaveCredit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCredit) return;

    const cost = Number(creditCost);
    const margin = Number(creditMargin);
    const dp = Number(creditDP);
    const tenor = Number(creditTenor) || 1;
    const sellingPrice = cost + margin;
    const financingAmount = Math.max(0, sellingPrice - dp);
    const monthlyInstallment = Math.round(financingAmount / tenor);
    const paidCount = editingCredit.paidInstallmentsCount;
    const remainingBalance = Math.max(0, financingAmount - paidCount * monthlyInstallment);

    const updatedCredits = credits.map((c) =>
      c.id === editingCredit.id
        ? {
            ...c,
            itemName: creditItemName,
            itemCategory: creditItemCategory,
            purchaseCost: cost,
            marginAmount: margin,
            sellingPrice,
            downPayment: dp,
            financingAmount,
            tenorMonths: tenor,
            monthlyInstallment,
            remainingBalance,
            status: creditStatus,
          }
        : c
    );
    onUpdateCredits(updatedCredits);

    if (editingCredit.status !== creditStatus) {
      const wasActive = editingCredit.status === 'berjalan';
      const isNowActive = creditStatus === 'berjalan';
      if (wasActive !== isNowActive) {
        const diff = isNowActive ? 1 : -1;
        const updatedMembers = members.map((m) =>
          m.memberNumber === editingCredit.memberNumber
            ? { ...m, activeCreditCount: Math.max(0, (m.activeCreditCount || 0) + diff) }
            : m
        );
        onUpdateMembers(updatedMembers);
      }
    }

    setShowCreditModal(false);
    setEditingCredit(null);

    notificationService.broadcast({
      title: 'Perubahan Kontrak & Margin Kredit Barang',
      message: `Kontrak ${editingCredit.contractNumber} (${creditItemName}) telah diperbarui dengan Margin Syariah ${formatRupiah(margin)}.`,
      category: 'angsuran',
    });
  };

  // Handlers for Transactions
  const openEditTxModal = (tx: Transaction) => {
    setEditingTx(tx);
    setTxAmount(tx.amount);
    setTxType(tx.type);
    setTxAkad(tx.akad);
    setTxPaymentMethod(tx.paymentMethod);
    setTxStatus(tx.status);
    setTxNotes(tx.notes || '');
    setShowTxModal(true);
  };

  const handleSaveTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || !onUpdateTransactions) return;

    const updated = transactions.map((t) =>
      t.id === editingTx.id
        ? {
            ...t,
            amount: Number(txAmount),
            type: txType,
            akad: txAkad,
            paymentMethod: txPaymentMethod,
            status: txStatus,
            notes: txNotes,
          }
        : t
    );
    onUpdateTransactions(updated);
    setShowTxModal(false);
    setEditingTx(null);

    notificationService.broadcast({
      title: 'Koreksi Transaksi Kas',
      message: `Transaksi ${editingTx.referenceNumber} senilai ${formatRupiah(txAmount)} telah diperbarui oleh Administrator.`,
      category: 'sistem',
    });
  };

  const handleDeleteTx = (txId: string) => {
    if (!onUpdateTransactions) return;
    const target = transactions.find((t) => t.id === txId);
    if (!target) return;
    openDeleteModal(
      'transaction',
      target.id,
      target.referenceNumber,
      `Nominal: ${formatRupiah(target.amount)} • Nasabah: ${target.memberName} (${target.memberNumber}) • Jenis: ${target.type.replace('_', ' ').toUpperCase()}`,
      'Data mutasi transaksi ini akan dihapus secara permanen dari buku besar audit kas.'
    );
  };

  // Transaction Filtering
  const filteredTransactions = transactions.filter((t) => {
    // 1. Search Query
    if (txSearch.trim()) {
      const q = txSearch.toLowerCase().trim();
      const matchRef = t.referenceNumber.toLowerCase().includes(q);
      const matchMember =
        t.memberName.toLowerCase().includes(q) || t.memberNumber.toLowerCase().includes(q);
      const matchTeller = t.tellerName.toLowerCase().includes(q);
      const matchNotes = (t.notes || '').toLowerCase().includes(q);
      if (!matchRef && !matchMember && !matchTeller && !matchNotes) {
        return false;
      }
    }

    // 2. Transaction Type Filter
    if (txTypeFilter !== 'all') {
      if (t.type !== txTypeFilter) {
        return false;
      }
    }

    // 3. Date / Month / Year Filter
    const txDateStr = t.createdAt ? t.createdAt.split('T')[0] : '';
    if (txPeriodType === 'date') {
      if (txFilterDate && txDateStr !== txFilterDate) {
        return false;
      }
    } else if (txPeriodType === 'month') {
      const targetMonthYear = `${txFilterYear}-${txFilterMonth}`;
      if (!txDateStr.startsWith(targetMonthYear)) {
        return false;
      }
    } else if (txPeriodType === 'year') {
      if (!txDateStr.startsWith(txFilterYear)) {
        return false;
      }
    } else if (txPeriodType === 'range') {
      if (txFilterStartDate && txDateStr < txFilterStartDate) return false;
      if (txFilterEndDate && txDateStr > txFilterEndDate) return false;
    }

    return true;
  });

  // Filtered stats
  const txTotalCount = filteredTransactions.length;
  const txTotalMasuk = filteredTransactions
    .filter((t) => ['setoran', 'gadai_tebus', 'gadai_ujrah', 'kredit_angsuran'].includes(t.type))
    .reduce((acc, t) => acc + t.amount, 0);
  const txTotalKeluar = filteredTransactions
    .filter((t) => ['penarikan', 'gadai_pencairan', 'kredit_pencairan'].includes(t.type))
    .reduce((acc, t) => acc + t.amount, 0);
  const txNetFlow = txTotalMasuk - txTotalKeluar;

  const filteredMembers = members.filter(
    (m) =>
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.memberNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.nik.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 font-sans tracking-tight">
              Dashboard Administrator
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Hak Akses Penuh
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan Operasional Syariah: Nasabah, Simpanan, Gadai (Rahn), Pembiayaan Barang (Murabahah), dan Laporan Keuangan.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ikhtisar
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'members'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nasabah ({members.length})
          </button>
          <button
            onClick={() => setActiveTab('tellers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'tellers'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Teller
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'admins'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'products'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Produk Simpanan
          </button>
          <button
            onClick={() => setActiveTab('pawns')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'pawns'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Gadai (Rahn)
          </button>
          <button
            onClick={() => setActiveTab('credits')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'credits'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kredit Barang
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'transactions'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Transaksi
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'reports'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Laporan
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            Profil Admin
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">Total Dana Simpanan</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Wallet className="w-5 h-5" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {formatRupiah(totalSavings)}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Akad Wadi'ah & Mudharabah</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">Portofolio Gadai (Rahn)</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Coins className="w-5 h-5" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {formatRupiah(totalPawnPortfolio)}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium mt-1">
                <span>{pawns.filter((p) => p.status === 'aktif').length} akad Rahn aktif</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">Kredit Barang (Murabahah)</span>
                <span className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <ShoppingBag className="w-5 h-5" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {formatRupiah(totalCreditPortfolio)}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-teal-600 font-medium mt-1">
                <span>{credits.filter((c) => c.status === 'berjalan').length} kontrak berjalan</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">Total Nasabah / Anggota</span>
                <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <Users className="w-5 h-5" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {members.length} Orang
              </div>
              <div className="flex items-center gap-1 text-[11px] text-sky-600 font-medium mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{members.length} Anggota Terdaftar Aktif</span>
              </div>
            </div>
          </div>

          {/* Quick Monitoring Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Transactions List */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Audit Transaksi Terkini
                </h3>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-0.5"
                >
                  Semua <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {transactions.slice(0, 5).map((t) => (
                  <div key={t.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{t.memberName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {t.memberNumber} • {t.referenceNumber}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-800">
                        {formatRupiah(t.amount)}
                      </div>
                      <div className="text-[10px] uppercase text-slate-500">
                        {t.type.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sharia Principles Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                Struktur Lembaga Syariah (Bukan Koperasi)
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="font-bold text-emerald-900">1. Simpanan Syariah (Wadi'ah & Mudharabah)</div>
                  <p className="text-emerald-700 text-[11px] mt-0.5">
                    Titipan murni (Yad Dhamanah) bebas potongan admin bulanan, atau investasi bagi hasil (Mudharabah Muthlaqah) dengan nisbah transparan.
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="font-bold text-amber-900">2. Gadai Syariah (Akad Rahn & Ijarah)</div>
                  <p className="text-amber-700 text-[11px] mt-0.5">
                    Pinjaman kebajikan (Qardh) dengan jaminan barang (Marhun). Biaya hanya berupa sewa tempat penyimpanan (Ujrah), bukan bunga pinjaman.
                  </p>
                </div>
                <div className="p-3 bg-teal-50 rounded-xl border border-teal-200">
                  <div className="font-bold text-teal-900">3. Kredit Barang (Akad Murabahah)</div>
                  <p className="text-teal-700 text-[11px] mt-0.5">
                    Jual beli barang riil: lembaga membeli barang pesanan nasabah lalu menjualnya dengan margin keuntungan yang disepakati di awal akad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NASABAH TAB */}
      {activeTab === 'members' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Data Nasabah / Anggota</h2>
              <p className="text-xs text-slate-500">
                Nomor Anggota AG0001 pengganti rekening konvensional • Data Terpusat & Kepatuhan Syariah
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, NIK, AG000x..."
                  className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden w-48 sm:w-64"
                />
              </div>
              <button
                onClick={openAddMemberModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Nasabah
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3">No. Anggota</th>
                  <th className="px-4 py-3">Nama & NIK</th>
                  <th className="px-4 py-3">Kontak & Alamat</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total Simpanan</th>
                  <th className="px-4 py-3 text-center">Gadai / Kredit</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-800">
                      {m.memberNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{m.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">NIK: {m.nik}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{m.phone}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{m.address}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3" />
                        Aktif
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatRupiah(m.totalSavings)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px]">
                        {m.activePawnCount} Rahn / {m.activeCreditCount} Mrb
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => openChangePasswordModal('nasabah', m.id, m.fullName, m.memberNumber, m.password)}
                        className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                        title="Ganti Password Akun Nasabah"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditMemberModal(m)}
                        className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        title="Edit Data Nasabah"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(m.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Hapus Nasabah"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TELLER MANAGEMENT TAB */}
      {activeTab === 'tellers' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Kelola Akun Teller (Kasir)</h2>
              <p className="text-xs text-slate-500">
                Teller memiliki akses operasional setoran, penarikan, pencairan gadai, dan share WhatsApp.
              </p>
            </div>
            <button
              onClick={() => {
                setStaffRole('teller');
                setShowStaffModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Teller
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users
              .filter((u) => u.role === 'teller')
              .map((t) => (
                <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{t.name}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">ID: {t.id}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteUser(t.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>Email: {t.email}</div>
                    <div>HP: {t.phone}</div>
                    <div>Bergabung: {formatDateIndo(t.createdAt).split(',')[0]}</div>
                  </div>
                  <div className="pt-2 border-t border-slate-200/80 flex justify-end">
                    <button
                      onClick={() => openChangePasswordModal('teller', t.id, t.name, t.email, t.password)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      <Key className="w-3.5 h-3.5 text-emerald-600" />
                      Ganti Password
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ADMIN MANAGEMENT TAB */}
      {activeTab === 'admins' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Kelola Akun Administrator</h2>
              <p className="text-xs text-slate-500">
                Admin memiliki otoritas master data, persetujuan gadai & kredit, serta laporan keuangan.
              </p>
            </div>
            <button
              onClick={() => {
                setStaffRole('admin');
                setStaffPassword('');
                setShowStaffModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Admin
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users
              .filter((u) => u.role === 'admin')
              .map((a) => (
                <div key={a.id} className="p-4 rounded-xl border border-slate-200 bg-amber-50/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                        {a.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{a.name}</h4>
                        <span className="text-[10px] text-amber-800 font-bold">SUPER ADMIN</span>
                      </div>
                    </div>
                    {users.filter((u) => u.role === 'admin').length > 1 && a.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDeleteUser(a.id)}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Administrator"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>Email: {a.email}</div>
                    <div>HP: {a.phone}</div>
                  </div>
                  <div className="pt-2 border-t border-amber-200/60 flex justify-end">
                    <button
                      onClick={() => openChangePasswordModal('admin', a.id, a.name, a.email, a.password)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      <Key className="w-3.5 h-3.5 text-amber-600" />
                      Ganti Password
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* PRODUK SIMPANAN TAB */}
      {activeTab === 'products' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Produk Simpanan Syariah</h2>
              <p className="text-xs text-slate-500">
                Akad Wadi'ah Yad Dhamanah & Mudharabah Muthlaqah (Tanpa Biaya Admin Riba)
              </p>
            </div>
            <button
              onClick={openAddProductModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Produk
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((p) => (
              <div key={p.id} className="p-5 rounded-xl border border-slate-200 bg-white space-y-3 hover:border-emerald-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      Akad {p.akad.toUpperCase()}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-1">{p.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono">Kode: {p.code}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditProductModal(p)}
                      title="Ubah Produk Simpanan"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-50 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      Ubah
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      title="Hapus Produk Simpanan"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Setoran Awal Min</span>
                    <span className="font-bold text-slate-800">{formatRupiah(p.minInitialDeposit)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Saldo Mengendap</span>
                    <span className="font-bold text-slate-800">{formatRupiah(p.minBalance)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Biaya Admin Bulanan</span>
                    <span className="font-bold text-emerald-700">Rp 0 (Murni Syariah)</span>
                  </div>
                </div>

                {p.profitSharingRatio && (
                  <div className="p-2 bg-emerald-50 rounded-lg text-xs text-emerald-900 flex justify-between items-center">
                    <span>Nisbah Bagi Hasil (Nasabah : Lembaga):</span>
                    <span className="font-bold font-mono text-emerald-800">{p.profitSharingRatio}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GADAI SYARIAH (RAHN) TAB */}
      {activeTab === 'pawns' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Portofolio Gadai Syariah (Akad Rahn)</h2>
              <p className="text-xs text-slate-500">
                Penyimpanan Marhun Emas/BPKB • Ujrah Biaya Titip Pemeliharaan Syariah
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Total Pinjaman Aktif</span>
              <span className="text-base font-black text-amber-700 font-mono">
                {formatRupiah(totalPawnPortfolio)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3">No. Rahn</th>
                  <th className="px-4 py-3">Nasabah</th>
                  <th className="px-4 py-3">Barang Jaminan (Marhun)</th>
                  <th className="px-4 py-3 text-right">Nilai Taksiran</th>
                  <th className="px-4 py-3 text-right">Pinjaman (Marhun Bih)</th>
                  <th className="px-4 py-3 text-right">Ujrah / Bln</th>
                  <th className="px-4 py-3">Jatuh Tempo</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pawns.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-amber-800">{p.pawnCode}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{p.memberName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.memberNumber}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{p.itemDescription}</div>
                      <div className="text-[10px] text-slate-400 uppercase">{p.itemType.replace('_', ' ')}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-600">
                      {formatRupiah(p.estimatedValue)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatRupiah(p.loanAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-amber-700">
                      {formatRupiah(p.monthlyUjrah)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                      {p.dueDate}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => openEditPawnModal(p)}
                        title="Ubah Produk & Nilai Ujrah Gadai"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3 text-amber-700" />
                        Ubah Ujrah
                      </button>
                      <button
                        onClick={() => handleDeletePawn(p.id)}
                        title="Hapus Kontrak Gadai"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KREDIT BARANG (MURABAHAH) TAB */}
      {activeTab === 'credits' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Kredit Barang (Akad Murabahah)</h2>
              <p className="text-xs text-slate-500">
                Jual Beli Barang dengan Margin Keuntungan Terbuka (Bukan Pinjaman Uang Tunai)
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Sisa Piutang Pembiayaan</span>
              <span className="text-base font-black text-teal-700 font-mono">
                {formatRupiah(totalCreditPortfolio)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {credits.map((c) => (
              <div key={c.id} className="p-5 rounded-xl border border-slate-200 bg-white space-y-3 hover:border-teal-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                      Kontrak {c.contractNumber}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{c.itemName}</h3>
                    <p className="text-xs text-slate-500">
                      Nasabah: <strong className="text-emerald-800">{c.memberName}</strong> ({c.memberNumber})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditCreditModal(c)}
                      title="Ubah Produk & Nilai Margin Syariah"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-teal-700" />
                      Ubah Margin Syariah
                    </button>
                    <button
                      onClick={() => handleDeleteCredit(c.id)}
                      title="Hapus Kontrak Pembiayaan"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Status: {c.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Harga Modal Beli</span>
                    <span className="font-bold text-slate-800">{formatRupiah(c.purchaseCost)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Margin Syariah</span>
                    <span className="font-bold text-teal-700">+{formatRupiah(c.marginAmount)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Uang Muka (DP)</span>
                    <span className="font-bold text-slate-800">{formatRupiah(c.downPayment)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Angsuran / Bln</span>
                    <span className="font-bold text-emerald-800">{formatRupiah(c.monthlyInstallment)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Sisa Saldo & Progress</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {formatRupiah(c.remainingBalance)} ({c.paidInstallmentsCount}/{c.tenorMonths} Bln)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-teal-600 h-2 rounded-full transition-all"
                    style={{ width: `${(c.paidInstallmentsCount / c.tenorMonths) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRANSAKSI AUDIT TAB */}
      {activeTab === 'transactions' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          {/* Header & Main Export Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Jurnal & Audit Mutasi Transaksi</h2>
              <p className="text-xs text-slate-500">
                Kelola, koreksi, cari, dan cetak laporan audit transaksi keuangan syariah secara lengkap.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  const headers = ['No. Referensi', 'Waktu', 'Nama Nasabah', 'No. Anggota', 'Jenis Transaksi', 'Akad', 'Nominal', 'Metode', 'Teller', 'Status', 'Catatan'];
                  const rows = filteredTransactions.map((t) => [
                    t.referenceNumber,
                    formatDateIndo(t.createdAt),
                    `"${t.memberName.replace(/"/g, '""')}"`,
                    t.memberNumber,
                    t.type,
                    t.akad,
                    t.amount,
                    t.paymentMethod,
                    `"${t.tellerName.replace(/"/g, '""')}"`,
                    t.status,
                    `"${(t.notes || '').replace(/"/g, '""')}"`,
                  ]);
                  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute('download', `laporan_transaksi_simpananku_${Date.now()}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-slate-600" />
                Unduh CSV
              </button>

              <button
                onClick={() => setShowPrintReportModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak / Unduh PDF Laporan
              </button>
            </div>
          </div>

          {/* Filter Bar: Pencarian, Jenis Transaksi, & Periode Waktu */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            {/* Search Input & Transaction Type Filter */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-7 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  placeholder="Cari No. Referensi, Nama Nasabah, No. Anggota, Teller, Catatan..."
                  className="w-full pl-10 pr-9 py-2.5 bg-white text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
                {txSearch && (
                  <button
                    onClick={() => setTxSearch('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="md:col-span-5">
                <div className="relative">
                  <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <select
                    value={txTypeFilter}
                    onChange={(e) => setTxTypeFilter(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer"
                  >
                    <option value="all">Semua Jenis Transaksi</option>
                    <option value="setoran">Setoran Simpanan (Wadi'ah / Mudharabah)</option>
                    <option value="penarikan">Penarikan Simpanan</option>
                    <option value="gadai_pencairan">Pencairan Pinjaman Gadai (Rahn)</option>
                    <option value="gadai_tebus">Pelunasan / Tebus Gadai</option>
                    <option value="gadai_ujrah">Pembayaran Ujrah Titip Gadai</option>
                    <option value="kredit_pencairan">Pencairan Kredit Barang</option>
                    <option value="kredit_angsuran">Pembayaran Angsuran Kredit Murabahah</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Date/Month/Year Filtering Options */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-200/80">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-bold text-slate-600 mr-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  Periode:
                </span>
                <button
                  type="button"
                  onClick={() => setTxPeriodType('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    txPeriodType === 'all'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Semua Waktu
                </button>
                <button
                  type="button"
                  onClick={() => setTxPeriodType('date')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    txPeriodType === 'date'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Harian (Tanggal)
                </button>
                <button
                  type="button"
                  onClick={() => setTxPeriodType('month')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    txPeriodType === 'month'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Bulanan
                </button>
                <button
                  type="button"
                  onClick={() => setTxPeriodType('year')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    txPeriodType === 'year'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Tahunan
                </button>
                <button
                  type="button"
                  onClick={() => setTxPeriodType('range')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    txPeriodType === 'range'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Rentang Tanggal
                </button>
              </div>

              {/* Dynamic Pickers based on Period Mode */}
              <div className="flex items-center gap-2">
                {txPeriodType === 'date' && (
                  <input
                    type="date"
                    value={txFilterDate}
                    onChange={(e) => setTxFilterDate(e.target.value)}
                    className="px-3 py-1.5 bg-white text-xs font-medium border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                )}

                {txPeriodType === 'month' && (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={txFilterMonth}
                      onChange={(e) => setTxFilterMonth(e.target.value)}
                      className="px-2.5 py-1.5 bg-white text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    >
                      <option value="01">Januari</option>
                      <option value="02">Februari</option>
                      <option value="03">Maret</option>
                      <option value="04">April</option>
                      <option value="05">Mei</option>
                      <option value="06">Juni</option>
                      <option value="07">Juli</option>
                      <option value="08">Agustus</option>
                      <option value="09">September</option>
                      <option value="10">Oktober</option>
                      <option value="11">November</option>
                      <option value="12">Desember</option>
                    </select>
                    <select
                      value={txFilterYear}
                      onChange={(e) => setTxFilterYear(e.target.value)}
                      className="px-2.5 py-1.5 bg-white text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                    </select>
                  </div>
                )}

                {txPeriodType === 'year' && (
                  <select
                    value={txFilterYear}
                    onChange={(e) => setTxFilterYear(e.target.value)}
                    className="px-3 py-1.5 bg-white text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                  </select>
                )}

                {txPeriodType === 'range' && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <input
                      type="date"
                      value={txFilterStartDate}
                      onChange={(e) => setTxFilterStartDate(e.target.value)}
                      placeholder="Dari"
                      className="px-2.5 py-1.5 bg-white text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                    <span>s/d</span>
                    <input
                      type="date"
                      value={txFilterEndDate}
                      onChange={(e) => setTxFilterEndDate(e.target.value)}
                      placeholder="Sampai"
                      className="px-2.5 py-1.5 bg-white text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                )}

                {(txSearch || txTypeFilter !== 'all' || txPeriodType !== 'all') && (
                  <button
                    onClick={() => {
                      setTxSearch('');
                      setTxTypeFilter('all');
                      setTxPeriodType('all');
                      setTxFilterStartDate('');
                      setTxFilterEndDate('');
                    }}
                    title="Reset Semua Filter"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Financial Summary KPI Cards for Filtered Results */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-[11px] text-slate-500 block">Transaksi Ditemukan</span>
              <span className="text-base font-black text-slate-900 font-mono">
                {txTotalCount} Transaksi
              </span>
            </div>
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60">
              <span className="text-[11px] text-emerald-700 font-medium block">Total Kas Masuk</span>
              <span className="text-base font-black text-emerald-800 font-mono">
                +{formatRupiah(txTotalMasuk)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/60">
              <span className="text-[11px] text-rose-700 font-medium block">Total Kas Keluar</span>
              <span className="text-base font-black text-rose-800 font-mono">
                -{formatRupiah(txTotalKeluar)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60">
              <span className="text-[11px] text-blue-700 font-medium block">Arus Kas Bersih (Net)</span>
              <span className={`text-base font-black font-mono ${txNetFlow >= 0 ? 'text-blue-800' : 'text-rose-800'}`}>
                {txNetFlow >= 0 ? '+' : ''}{formatRupiah(txNetFlow)}
              </span>
            </div>
          </div>

          {/* Transactions Table with Edit & Delete Actions */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3">No. Referensi</th>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Nasabah (AG)</th>
                  <th className="px-4 py-3">Jenis & Akad</th>
                  <th className="px-4 py-3 text-right">Nominal Mutasi</th>
                  <th className="px-4 py-3">Metode & Teller</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-1">
                        <AlertCircle className="w-6 h-6 mx-auto text-slate-300" />
                        <p className="font-bold text-slate-600">Tidak ada transaksi ditemukan</p>
                        <p className="text-[11px]">Silakan sesuaikan kata kunci pencarian atau pilihan filter periode/jenis transaksi.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => {
                    const isMasuk = ['setoran', 'gadai_tebus', 'gadai_ujrah', 'kredit_angsuran'].includes(t.type);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          <div>{t.referenceNumber}</div>
                          {t.notes && <div className="text-[10px] text-slate-400 font-sans italic">{t.notes}</div>}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatDateIndo(t.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{t.memberName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{t.memberNumber}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold uppercase text-slate-800">
                            {t.type.replace('_', ' ')}
                          </span>
                          <div className="text-[10px] text-emerald-700 font-medium uppercase">
                            Akad {t.akad}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold">
                          <span className={isMasuk ? 'text-emerald-700' : 'text-rose-700'}>
                            {isMasuk ? '+' : '-'}{formatRupiah(t.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-700 font-medium capitalize">{t.paymentMethod || 'tunai'}</div>
                          <div className="text-[10px] text-slate-400">Opr: {t.tellerName}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                const mem = members.find((m) => m.memberNumber === t.memberNumber) || null;
                                generateReceiptPdf(t, mem);
                              }}
                              title="Cetak dan Unduh Bukti Transaksi (PDF)"
                              className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                const mem = members.find((m) => m.memberNumber === t.memberNumber) || null;
                                setAdminReceiptTx(t);
                                setAdminReceiptMember(mem);
                              }}
                              title="Lihat Struk / Cetak Voucher / Kirim WA"
                              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                            </button>
                            <button
                              onClick={() => openEditTxModal(t)}
                              title="Koreksi / Edit Transaksi"
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTx(t.id)}
                              title="Hapus Transaksi"
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-rose-200"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LAPORAN KEUANGAN SYARIAH TAB */}
      {activeTab === 'reports' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          {/* Header & Filter Periode (Bulan & Tahun) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <BarChart3 className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Laporan Keuangan & Posisi Syariah</h2>
                  <p className="text-xs text-slate-500">
                    Audit Neraca Aktiva/Pasiva, Laba Rugi Ujrah & Margin, serta Arus Kas berbasis Periode.
                  </p>
                </div>
              </div>
            </div>

            {/* Kontrol Filter Periode Bulan & Tahun */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Mode Periode */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setReportPeriodType('month')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    reportPeriodType === 'month'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bulanan
                </button>
                <button
                  type="button"
                  onClick={() => setReportPeriodType('year')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    reportPeriodType === 'year'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tahunan
                </button>
                <button
                  type="button"
                  onClick={() => setReportPeriodType('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    reportPeriodType === 'all'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua
                </button>
              </div>

              {/* Pilihan Bulan (Tampil jika mode Bulanan) */}
              {reportPeriodType === 'month' && (
                <div className="flex items-center gap-1">
                  <label className="text-xs font-bold text-slate-600">Bulan:</label>
                  <select
                    value={reportSelectedMonth}
                    onChange={(e) => setReportSelectedMonth(e.target.value)}
                    className="px-3 py-1.5 text-xs font-bold bg-white text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer"
                  >
                    {REPORT_MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Pilihan Tahun (Tampil jika mode Bulanan atau Tahunan) */}
              {reportPeriodType !== 'all' && (
                <div className="flex items-center gap-1">
                  <label className="text-xs font-bold text-slate-600">Tahun:</label>
                  <select
                    value={reportSelectedYear}
                    onChange={(e) => setReportSelectedYear(e.target.value)}
                    className="px-3 py-1.5 text-xs font-bold bg-white text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer"
                  >
                    {REPORT_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  onClick={handleExportFinancialReportCSV}
                  title="Unduh CSV Ringkasan & Transaksi Periode Ini"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  CSV
                </button>
                <button
                  onClick={() => setShowPrintFinancialModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak / PDF Resmi
                </button>
              </div>
            </div>
          </div>

          {/* Banner Keterangan Periode Aktif */}
          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="text-slate-700">
                Periode Laporan Aktif:{' '}
                <strong className="text-emerald-950 font-bold">
                  {reportPeriodType === 'month'
                    ? `Bulan ${REPORT_MONTHS.find((m) => m.value === reportSelectedMonth)?.name || reportSelectedMonth} ${reportSelectedYear}`
                    : reportPeriodType === 'year'
                    ? `Tahun Buku ${reportSelectedYear}`
                    : 'Seluruh Periode Akumulatif'}
                </strong>
              </span>
            </div>
            <div className="text-slate-500 font-mono text-[11px]">
              Ditemukan <span className="font-bold text-emerald-800">{reportTransactions.length}</span> mutasi kas pada periode ini
            </div>
          </div>

          {/* Metric Cards Periode Terpilih */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                Total Kas Masuk
              </span>
              <div className="text-lg font-black text-emerald-900 font-mono">
                {formatRupiah(repTotalMasuk)}
              </div>
              <p className="text-[10px] text-slate-500">Setoran, Tebus Rahn, & Angsuran</p>
            </div>

            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-1">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                Total Kas Keluar
              </span>
              <div className="text-lg font-black text-rose-900 font-mono">
                {formatRupiah(repTotalKeluar)}
              </div>
              <p className="text-[10px] text-slate-500">Penarikan & Pencairan Pembiayaan</p>
            </div>

            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-1">
              <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                Arus Kas Bersih (Net)
              </span>
              <div className={`text-lg font-black font-mono ${repNetCash >= 0 ? 'text-teal-900' : 'text-rose-700'}`}>
                {repNetCash >= 0 ? '+' : ''}{formatRupiah(repNetCash)}
              </div>
              <p className="text-[10px] text-slate-500">Likuiditas Operasional Lembaga</p>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-1">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                Pendapatan Ujrah & Margin
              </span>
              <div className="text-lg font-black text-amber-900 font-mono">
                {formatRupiah(repTotalShariaIncome)}
              </div>
              <p className="text-[10px] text-slate-500">Estimasi Bagi Hasil & Surplus Bersih</p>
            </div>
          </div>

          {/* Subtabs Navigasi Laporan Keuangan */}
          <div className="flex border-b border-slate-200 gap-1 overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setReportViewTab('neraca')}
              className={`pb-3 px-4 flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                reportViewTab === 'neraca'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              1. Neraca Posisi Keuangan
            </button>
            <button
              onClick={() => setReportViewTab('labarugi')}
              className={`pb-3 px-4 flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                reportViewTab === 'labarugi'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              2. Laporan Laba Rugi & Operasional
            </button>
            <button
              onClick={() => setReportViewTab('arus_kas')}
              className={`pb-3 px-4 flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                reportViewTab === 'arus_kas'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Coins className="w-4 h-4" />
              3. Arus Kas & Jurnal Mutasi ({reportTransactions.length})
            </button>
            <button
              onClick={() => setReportViewTab('portofolio')}
              className={`pb-3 px-4 flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                reportViewTab === 'portofolio'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              4. Portofolio Rahn & Murabahah
            </button>
          </div>

          {/* Subtab 1: Neraca Posisi Keuangan */}
          {reportViewTab === 'neraca' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Aset / Aktiva */}
              <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                  <h3 className="font-bold text-sm text-emerald-950 uppercase tracking-wide">
                    ASET SYARIAH (AKTIVA)
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900">
                    Posisi Per Periode
                  </span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-emerald-100">
                    <span className="text-slate-600">Kas & Bank Operasional (Likuid)</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {formatRupiah(Math.max(25000000, totalSavings * 0.45 + repNetCash))}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-emerald-100">
                    <span className="text-slate-600">Piutang Pinjaman Gadai Syariah (Rahn)</span>
                    <span className="font-bold text-slate-900 font-mono">{formatRupiah(totalPawnPortfolio)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-emerald-100">
                    <span className="text-slate-600">Piutang Pembiayaan Murabahah</span>
                    <span className="font-bold text-slate-900 font-mono">{formatRupiah(totalCreditPortfolio)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-emerald-100">
                    <span className="text-slate-600">Aset Tetap & Peralatan Kantor (Netto)</span>
                    <span className="font-bold text-slate-900 font-mono">Rp 18.500.000</span>
                  </div>
                  <div className="flex justify-between py-2.5 font-bold text-emerald-950 text-sm border-t-2 border-emerald-400">
                    <span>TOTAL AKTIVA BERSIH</span>
                    <span className="font-mono">
                      {formatRupiah(Math.max(25000000, totalSavings * 0.45 + repNetCash) + totalPawnPortfolio + totalCreditPortfolio + 18500000)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kewajiban & Dana Syirkah */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                    DANA SYIRKAH & KEWAJIBAN (PASIVA)
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    Akad Murni
                  </span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-600">Simpanan Titipan Wadi'ah (Giro & Tabungan)</span>
                    <span className="font-bold text-slate-900 font-mono">{formatRupiah(totalSavings * 0.6)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-600">Investasi Tidak Terikat (Mudharabah Muthlaqah)</span>
                    <span className="font-bold text-slate-900 font-mono">{formatRupiah(totalSavings * 0.4)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-600">Cadangan Dana Kebajikan (Qardhul Hasan)</span>
                    <span className="font-bold text-emerald-700 font-mono">Rp 12.500.000</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-600">Ekuitas Modal Awal Koperasi</span>
                    <span className="font-bold text-slate-900 font-mono">Rp 35.000.000</span>
                  </div>
                  <div className="flex justify-between py-2.5 font-bold text-slate-950 text-sm border-t-2 border-slate-400">
                    <span>TOTAL KEWAJIBAN & EKUITAS</span>
                    <span className="font-mono">
                      {formatRupiah(totalSavings + 12500000 + 35000000)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subtab 2: Laporan Laba Rugi & Operasional */}
          {reportViewTab === 'labarugi' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                  <h3 className="font-bold text-sm text-emerald-950 uppercase tracking-wide">
                    Rincian Pendapatan Operasional Syariah
                  </h3>
                  <span className="text-xs text-emerald-800 font-mono">
                    Periode: {reportPeriodType === 'month' ? `${REPORT_MONTHS.find((m) => m.value === reportSelectedMonth)?.name} ${reportSelectedYear}` : reportSelectedYear}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Pendapatan */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-700 border-b border-slate-200 pb-1">1. PENDAPATAN OPERASIONAL</h4>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Pendapatan Jasa Pemeliharaan Marhun (Ujrah Rahn)</span>
                      <span className="font-bold text-emerald-800 font-mono">{formatRupiah(effectiveUjrahIncome)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Pendapatan Margin Penjualan Barang Murabahah</span>
                      <span className="font-bold text-emerald-800 font-mono">{formatRupiah(repEstimatedMargin)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Biaya Administrasi & Pencatatan Akad</span>
                      <span className="font-bold text-emerald-800 font-mono">Rp 0 (Murni Bebas Riba)</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold text-emerald-950 text-sm border-t border-emerald-300">
                      <span>TOTAL PENDAPATAN OPERASIONAL</span>
                      <span className="font-mono">{formatRupiah(repTotalShariaIncome)}</span>
                    </div>
                  </div>

                  {/* Beban & Hasil Usaha */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-700 border-b border-slate-200 pb-1">2. BEBAN OPERASIONAL & BAGI HASIL</h4>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Beban Pemeliharaan Fasilitas Brankas & Keamanan Jaminan</span>
                      <span className="font-bold text-rose-800 font-mono">{formatRupiah(repOperationalExpense * 0.4)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Beban Administrasi Kantor, IT & Pelaporan Syariah</span>
                      <span className="font-bold text-rose-800 font-mono">{formatRupiah(repOperationalExpense * 0.6)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Hak Pihak Ketiga (Bagi Hasil Simpanan Mudharabah 30%)</span>
                      <span className="font-bold text-amber-800 font-mono">-{formatRupiah(repHakPihakKetiga)}</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold text-emerald-900 text-sm border-t border-emerald-300">
                      <span>SISA HASIL USAHA (LABA BERSIH LEMBAGA)</span>
                      <span className="font-mono">{formatRupiah(repLabaBersihLembaga)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subtab 3: Arus Kas & Jurnal Mutasi */}
          {reportViewTab === 'arus_kas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">
                  Daftar Transaksi Kas pada Periode Terpilih ({reportTransactions.length})
                </h3>
                <span className="text-xs text-slate-500">
                  Net Arus Kas: <strong className={repNetCash >= 0 ? 'text-emerald-700' : 'text-rose-700'}>{formatRupiah(repNetCash)}</strong>
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5">No. Referensi</th>
                      <th className="px-3 py-2.5">Tanggal</th>
                      <th className="px-3 py-2.5">Nasabah</th>
                      <th className="px-3 py-2.5">Jenis Transaksi</th>
                      <th className="px-3 py-2.5">Akad</th>
                      <th className="px-3 py-2.5 text-right">Nominal</th>
                      <th className="px-3 py-2.5 text-center">Status</th>
                      <th className="px-3 py-2.5">Teller</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {reportTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-sans">
                          Tidak ada transaksi yang tercatat pada periode bulan/tahun yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      reportTransactions.map((t) => {
                        const isMasuk = ['setoran', 'gadai_tebus', 'gadai_ujrah', 'kredit_angsuran'].includes(t.type);
                        return (
                          <tr key={t.id} className="hover:bg-slate-50/70">
                            <td className="px-3 py-2 font-bold text-slate-900">{t.referenceNumber}</td>
                            <td className="px-3 py-2 font-sans text-slate-600">{t.createdAt.split('T')[0]}</td>
                            <td className="px-3 py-2 font-sans">
                              <div className="font-bold text-slate-900">{t.memberName}</div>
                              <div className="text-[10px] text-slate-400">{t.memberNumber}</div>
                            </td>
                            <td className="px-3 py-2 font-sans uppercase font-semibold text-slate-700">
                              {t.type.replace('_', ' ')}
                            </td>
                            <td className="px-3 py-2 uppercase text-emerald-800 font-semibold">{t.akad}</td>
                            <td className={`px-3 py-2 text-right font-bold ${isMasuk ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {isMasuk ? '+' : '-'}{formatRupiah(t.amount)}
                            </td>
                            <td className="px-3 py-2 text-center font-sans">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                {t.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-sans text-slate-600">{t.tellerName}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subtab 4: Portofolio Gadai & Kredit */}
          {reportViewTab === 'portofolio' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Portofolio Gadai Rahn */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <h3 className="font-bold text-xs text-amber-950 uppercase tracking-wide">
                    Portofolio Gadai Syariah (Rahn)
                  </h3>
                  <span className="text-xs font-bold text-amber-900 font-mono">
                    Total: {formatRupiah(totalPawnPortfolio)}
                  </span>
                </div>
                <div className="space-y-2">
                  {pawns.map((p) => (
                    <div key={p.id} className="p-3 bg-white rounded-lg border border-amber-200/80 text-xs space-y-1">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-amber-900">{p.pawnCode}</span>
                        <span className="text-slate-900 font-mono">{formatRupiah(p.loanAmount)}</span>
                      </div>
                      <div className="text-slate-600 text-[11px]">{p.itemDescription} • {p.memberName}</div>
                      <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 font-mono">
                        <span>Ujrah: {formatRupiah(p.monthlyUjrah)}/bln</span>
                        <span>Jatuh Tempo: {p.dueDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Portofolio Murabahah */}
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/30 space-y-3">
                <div className="flex items-center justify-between border-b border-teal-200 pb-2">
                  <h3 className="font-bold text-xs text-teal-950 uppercase tracking-wide">
                    Portofolio Kredit Barang (Murabahah)
                  </h3>
                  <span className="text-xs font-bold text-teal-900 font-mono">
                    Total: {formatRupiah(totalCreditPortfolio)}
                  </span>
                </div>
                <div className="space-y-2">
                  {credits.map((c) => (
                    <div key={c.id} className="p-3 bg-white rounded-lg border border-teal-200/80 text-xs space-y-1">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-teal-900">{c.contractNumber}</span>
                        <span className="text-slate-900 font-mono">{formatRupiah(c.remainingBalance)}</span>
                      </div>
                      <div className="text-slate-600 text-[11px]">{c.itemName} • {c.memberName}</div>
                      <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 font-mono">
                        <span>Angsuran: {formatRupiah(c.monthlyInstallment)}/bln</span>
                        <span>Progress: {c.paidInstallmentsCount}/{c.tenorMonths} Bulan</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PROFIL ADMIN & GANTI PASSWORD TAB */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1: Data Profil Administrator */}
          <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-800 text-white flex items-center justify-center font-bold text-xl shadow-md">
                {(currentUser?.name || 'A').charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">{currentUser?.name || 'Administrator Sistem'}</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 mt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  Super Administrator
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Email Akun Admin:</span>
                <span className="font-semibold text-slate-800">{currentUser?.email || 'admin@simpananku.my.id'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Nomor WhatsApp:</span>
                <span className="font-mono font-semibold text-slate-800">{currentUser?.phone || '081234567890'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Tingkat Akses:</span>
                <span className="font-semibold text-amber-900">Hak Penuh (Master, Keuangan, User & Password)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Status Keamanan:</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Terverifikasi
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-950 leading-relaxed space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <Lock className="w-3.5 h-3.5" />
                Prosedur Keamanan Administrator
              </div>
              <p>
                Sebagai Super Administrator, akun Anda mengendalikan seluruh data anggota, persetujuan gadai emas, piutang barang, dan hak reset password. Selalu gunakan kombinasi password yang kuat dan simpan kerahasiaan kredensial Anda.
              </p>
            </div>
          </div>

          {/* Card 2: Form Ganti Password Profil Admin */}
          <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900">Ubah Password Akun Administrator</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbarui kata sandi profil Admin untuk keamanan otorisasi sistem SIMPANANKU.
              </p>
            </div>

            {adminPassSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{adminPassSuccess}</span>
              </div>
            )}

            {adminPassError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{adminPassError}</span>
              </div>
            )}

            <form onSubmit={handleChangeAdminOwnPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password Admin Saat Ini:
                </label>
                <div className="relative">
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    value={adminCurrentPassword}
                    onChange={(e) => setAdminCurrentPassword(e.target.value)}
                    placeholder="Masukkan password saat ini (demo: admin123)"
                    className="w-full pl-3 pr-10 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password Baru:
                </label>
                <div className="relative">
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    required
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-3 pr-10 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Konfirmasi Password Baru:
                </label>
                <div className="relative">
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    required
                    value={adminConfirmPassword}
                    onChange={(e) => setAdminConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full pl-3 pr-10 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  Simpan Password Admin Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingMember ? 'Edit Data Nasabah' : 'Tambah Nasabah Baru'}
              </h3>
              <button onClick={() => setShowMemberModal(false)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap:</label>
                <input
                  type="text"
                  required
                  value={memFullName}
                  onChange={(e) => setMemFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NIK (16 Digit):</label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  value={memNik}
                  onChange={(e) => setMemNik(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. HP / WA:</label>
                  <input
                    type="tel"
                    required
                    value={memPhone}
                    onChange={(e) => setMemPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pekerjaan:</label>
                  <input
                    type="text"
                    required
                    value={memOccupation}
                    onChange={(e) => setMemOccupation(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email:</label>
                <input
                  type="email"
                  value={memEmail}
                  onChange={(e) => setMemEmail(e.target.value)}
                  placeholder="Opsional / default autogenerate"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password Akun Nasabah:
                </label>
                <div className="relative">
                  <input
                    type={showMemPassword ? 'text' : 'password'}
                    value={memPassword}
                    onChange={(e) => setMemPassword(e.target.value)}
                    placeholder="Minimal 6 karakter (default: nasabah123)"
                    className="w-full pl-3 pr-9 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMemPassword(!showMemPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showMemPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Password untuk nasabah login mandiri ke portal SIMPANANKU.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Domisili:</label>
                <textarea
                  required
                  rows={2}
                  value={memAddress}
                  onChange={(e) => setMemAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Simpan Nasabah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                Tambah {staffRole === 'admin' ? 'Administrator' : 'Teller Kasir'}
              </h3>
              <button onClick={() => setShowStaffModal(false)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap:</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Login:</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Telepon:</label>
                <input
                  type="tel"
                  required
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password Akun {staffRole === 'admin' ? 'Admin' : 'Teller'}:
                </label>
                <div className="relative">
                  <input
                    type={showStaffPassword ? 'text' : 'password'}
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder={`Minimal 6 karakter (default: ${staffRole === 'admin' ? 'admin123' : 'teller123'})`}
                    className="w-full pl-3 pr-9 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPassword(!showStaffPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showStaffPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Password yang akan digunakan untuk login sistem SIMPANANKU.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Administrator Change Password Modal for Any User */}
      {showChangePasswordModal && changePassTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-700 to-amber-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-600/60 border border-amber-400/40">
                  <Key className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Ganti Password Akun Pengguna</h3>
                  <p className="text-[11px] text-amber-200">
                    Otoritas Administrator • Role: <span className="uppercase font-bold">{changePassTarget.type}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setChangePassTarget(null);
                }}
                className="text-amber-200 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* User Target Info Banner */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Pengguna:</span>
                  <span className="font-bold text-slate-800">{changePassTarget.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nomor Anggota / ID / Email:</span>
                  <span className="font-mono font-bold text-emerald-800">{changePassTarget.identifier}</span>
                </div>
                {changePassTarget.currentPassword && (
                  <div className="flex justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                    <span className="text-slate-400">Password Saat Ini:</span>
                    <span className="font-mono text-slate-600 bg-slate-200/70 px-1.5 py-0.5 rounded">
                      {changePassTarget.currentPassword}
                    </span>
                  </div>
                )}
              </div>

              {targetSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{targetSuccessMessage}</span>
                </div>
              )}

              {targetErrorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{targetErrorMessage}</span>
                </div>
              )}

              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password Baru yang Ditetapkan:
                  </label>
                  <div className="relative">
                    <input
                      type={showTargetPassword ? 'text' : 'password'}
                      required
                      value={targetNewPassword}
                      onChange={(e) => setTargetNewPassword(e.target.value)}
                      placeholder="Masukkan kata sandi baru (minimal 6 karakter)"
                      className="w-full pl-3 pr-10 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowTargetPassword(!showTargetPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showTargetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Pengguna dapat langsung menggunakan kata sandi baru ini untuk login.
                  </span>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePasswordModal(false);
                      setChangePassTarget(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Simpan Perubahan Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingProduct ? 'Ubah Produk Simpanan' : 'Tambah Produk Simpanan'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-emerald-200 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Produk:</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="Contoh: Tabungan Kurban Syariah"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode Produk:</label>
                  <input
                    type="text"
                    required
                    value={prodCode}
                    onChange={(e) => setProdCode(e.target.value)}
                    placeholder="TAB-QRB"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Akad:</label>
                  <select
                    value={prodAkad}
                    onChange={(e) => setProdAkad(e.target.value as 'wadiah' | 'mudharabah')}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value="wadiah">Wadi'ah (Titipan)</option>
                    <option value="mudharabah">Mudharabah (Bagi Hasil)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi:</label>
                <textarea
                  rows={2}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Keterangan manfaat dan peruntukan simpanan..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Setoran Awal Min:</label>
                  <input
                    type="number"
                    value={prodMinDeposit}
                    onChange={(e) => setProdMinDeposit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Saldo Mengendap:</label>
                  <input
                    type="number"
                    value={prodMinBalance}
                    onChange={(e) => setProdMinBalance(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              {prodAkad === 'mudharabah' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rasio Nisbah (Nasabah : Lembaga):</label>
                  <input
                    type="text"
                    value={prodRatio}
                    onChange={(e) => setProdRatio(e.target.value)}
                    placeholder="70 : 30"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs cursor-pointer"
                >
                  {editingProduct ? 'Simpan Perubahan' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Pawn (Gadai Syariah - Rahn) Modal */}
      {showPawnModal && editingPawn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden text-slate-800 my-8">
            <div className="px-6 py-4 bg-amber-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Ubah Produk Gadai & Nilai Ujrah</h3>
                <p className="text-xs text-amber-200">Kontrak Rahn #{editingPawn.pawnCode}</p>
              </div>
              <button
                onClick={() => {
                  setShowPawnModal(false);
                  setEditingPawn(null);
                }}
                className="text-amber-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePawn} className="p-6 space-y-4">
              {/* Info Nasabah */}
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">Nasabah:</span>
                  <strong className="text-slate-900">{editingPawn.memberName}</strong>
                  <span className="text-slate-400 font-mono ml-1">({editingPawn.memberNumber})</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Kode Akad:</span>
                  <span className="font-mono font-bold text-amber-800">{editingPawn.pawnCode}</span>
                </div>
              </div>

              {/* Barang Jaminan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deskripsi Barang Jaminan (Marhun):
                  </label>
                  <input
                    type="text"
                    required
                    value={pawnItemDesc}
                    onChange={(e) => setPawnItemDesc(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Marhun:</label>
                  <select
                    value={pawnItemType}
                    onChange={(e) => setPawnItemType(e.target.value as PawnPledge['itemType'])}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                  >
                    <option value="emas_batangan">Emas Logam Mulia / Batangan</option>
                    <option value="emas_perhiasan">Perhiasan Emas</option>
                    <option value="bpkb_motor">BPKB Sepeda Motor</option>
                    <option value="bpkb_mobil">BPKB Mobil</option>
                    <option value="sertifikat">Sertifikat Tanah / Bangunan</option>
                    <option value="elektronik">Barang Elektronik</option>
                  </select>
                </div>
              </div>

              {/* Nilai Taksiran & Pinjaman */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nilai Taksiran (Rp):</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={pawnEstValue}
                    onChange={(e) => setPawnEstValue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pinjaman / Marhun Bih (Rp):</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={pawnLoan}
                    onChange={(e) => setPawnLoan(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* UJRAH / BULAN - Core Requirement */}
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-amber-950">
                    Nilai UJRAH / BULAN (Biaya Titip & Pemeliharaan):
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">
                    Murni Syariah
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">Rp</span>
                  <input
                    type="number"
                    required
                    min={0}
                    value={pawnUjrah}
                    onChange={(e) => setPawnUjrah(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 text-sm font-bold text-amber-900 bg-white border border-amber-400 rounded-lg focus:ring-2 focus:ring-amber-600 outline-hidden font-mono"
                  />
                </div>
                <p className="text-[10px] text-amber-800 leading-relaxed">
                  Ujrah merupakan upah atas jasa pemeliharaan, penjagaan tempat penyimpanan brankas aman, dan asuransi barang jaminan, bukan merupakan persentase bunga atas uang pinjaman.
                </p>
              </div>

              {/* Tenor, Due Date, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tenor (Bulan):</label>
                  <input
                    type="number"
                    min={1}
                    max={36}
                    value={pawnPeriod}
                    onChange={(e) => setPawnPeriod(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jatuh Tempo:</label>
                  <input
                    type="date"
                    value={pawnDueDate}
                    onChange={(e) => setPawnDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Gadai:</label>
                  <select
                    value={pawnStatus}
                    onChange={(e) => setPawnStatus(e.target.value as PawnPledge['status'])}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden uppercase font-bold"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="ditebus">Ditebus / Selesai</option>
                    <option value="diperpanjang">Diperpanjang</option>
                    <option value="lelang">Lelang Eksekusi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Akad:</label>
                <textarea
                  rows={2}
                  value={pawnNotes}
                  onChange={(e) => setPawnNotes(e.target.value)}
                  placeholder="Kondisi fisik barang, nomor seri, kelengkapan surat..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowPawnModal(false);
                    setEditingPawn(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Perubahan Gadai & Ujrah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Credit (Kredit Barang - Murabahah) Modal */}
      {showCreditModal && editingCredit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden text-slate-800 my-8">
            <div className="px-6 py-4 bg-teal-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Ubah Produk Kredit Barang & Margin Syariah</h3>
                <p className="text-xs text-teal-200">Kontrak Murabahah #{editingCredit.contractNumber}</p>
              </div>
              <button
                onClick={() => {
                  setShowCreditModal(false);
                  setEditingCredit(null);
                }}
                className="text-teal-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCredit} className="p-6 space-y-4">
              {/* Nasabah Header */}
              <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">Nasabah:</span>
                  <strong className="text-slate-900">{editingCredit.memberName}</strong>
                  <span className="text-slate-400 font-mono ml-1">({editingCredit.memberNumber})</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Progress Angsuran:</span>
                  <span className="font-mono font-bold text-teal-800">
                    {editingCredit.paidInstallmentsCount} dari {creditTenor} Bulan
                  </span>
                </div>
              </div>

              {/* Nama Barang & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Barang:</label>
                  <input
                    type="text"
                    required
                    value={creditItemName}
                    onChange={(e) => setCreditItemName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Barang:</label>
                  <select
                    value={creditItemCategory}
                    onChange={(e) => setCreditItemCategory(e.target.value as CommodityFinancing['itemCategory'])}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden"
                  >
                    <option value="motor_baru">Sepeda Motor Baru</option>
                    <option value="motor_bekas">Sepeda Motor Bekas</option>
                    <option value="mobil_bekas">Mobil Bekas</option>
                    <option value="elektronik_rumah">Elektronik & Perabot Rumah</option>
                    <option value="smartphone_laptop">Smartphone / Laptop</option>
                    <option value="bahan_bangunan">Bahan Material Bangunan</option>
                    <option value="modal_alat_kerja">Alat Kerja / Mesin Usaha</option>
                  </select>
                </div>
              </div>

              {/* Harga Pokok Beli & MARGIN SYARIAH */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Harga Modal Pokok Beli (Rp):
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={creditCost}
                    onChange={(e) => setCreditCost(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-teal-900 mb-1">
                    MARGIN SYARIAH (Keuntungan Disepakati):
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={creditMargin}
                    onChange={(e) => setCreditMargin(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-teal-400 bg-teal-50/50 rounded-lg focus:ring-2 focus:ring-teal-600 outline-hidden font-mono font-bold text-teal-900"
                  />
                </div>
              </div>

              {/* DP & Tenor */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Uang Muka / DP (Rp):</label>
                  <input
                    type="number"
                    min={0}
                    value={creditDP}
                    onChange={(e) => setCreditDP(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tenor (Bulan):</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={creditTenor}
                    onChange={(e) => setCreditTenor(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Kontrak:</label>
                  <select
                    value={creditStatus}
                    onChange={(e) => setCreditStatus(e.target.value as CommodityFinancing['status'])}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden uppercase font-bold"
                  >
                    <option value="berjalan">Berjalan</option>
                    <option value="lunas">Lunas</option>
                    <option value="menunggak">Menunggak</option>
                  </select>
                </div>
              </div>

              {/* Real-time Calculation Summary */}
              {(() => {
                const totalSelling = Number(creditCost) + Number(creditMargin);
                const financing = Math.max(0, totalSelling - Number(creditDP));
                const monthly = Math.round(financing / (Number(creditTenor) || 1));
                const marginPct = Number(creditCost) > 0 ? ((Number(creditMargin) / Number(creditCost)) * 100).toFixed(1) : '0';
                return (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="font-bold text-slate-800 flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span>Rincian Skema Murabahah Baru:</span>
                      <span className="text-teal-700 font-mono">Margin: {marginPct}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Harga Jual Murabahah</span>
                        <span className="font-bold text-slate-900">{formatRupiah(totalSelling)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Plafon Pembiayaan</span>
                        <span className="font-bold text-teal-800">{formatRupiah(financing)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Angsuran per Bulan</span>
                        <span className="font-bold text-emerald-700">{formatRupiah(monthly)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreditModal(false);
                    setEditingCredit(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Perubahan Murabahah & Margin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showTxModal && editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-slate-800 my-8">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Koreksi Data Transaksi</h3>
                <p className="text-xs text-emerald-200 font-mono">{editingTx.referenceNumber}</p>
              </div>
              <button
                onClick={() => {
                  setShowTxModal(false);
                  setEditingTx(null);
                }}
                className="text-emerald-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTx} className="p-6 space-y-3.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nasabah:</span>
                  <strong className="text-slate-900">{editingTx.memberName} ({editingTx.memberNumber})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu Transaksi:</span>
                  <span className="text-slate-700">{formatDateIndo(editingTx.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Operator Teller:</span>
                  <span className="text-slate-700">{editingTx.tellerName}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Mutasi (Rp):</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={txAmount}
                  onChange={(e) => setTxAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Transaksi:</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as Transaction['type'])}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value="setoran">Setoran Simpanan</option>
                    <option value="penarikan">Penarikan Simpanan</option>
                    <option value="gadai_pencairan">Pencairan Gadai</option>
                    <option value="gadai_tebus">Tebus / Pelunasan Gadai</option>
                    <option value="gadai_ujrah">Pembayaran Ujrah</option>
                    <option value="kredit_pencairan">Pencairan Kredit</option>
                    <option value="kredit_angsuran">Angsuran Murabahah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Akad Syariah:</label>
                  <select
                    value={txAkad}
                    onChange={(e) => setTxAkad(e.target.value as ShariaAkad)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden uppercase"
                  >
                    <option value="wadiah">Wadi'ah</option>
                    <option value="mudharabah">Mudharabah</option>
                    <option value="murabahah">Murabahah</option>
                    <option value="rahn">Rahn (Gadai)</option>
                    <option value="ijarah">Ijarah</option>
                    <option value="qardh">Qardh</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Metode Pembayaran:</label>
                  <select
                    value={txPaymentMethod}
                    onChange={(e) => setTxPaymentMethod(e.target.value as Transaction['paymentMethod'])}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden uppercase"
                  >
                    <option value="tunai">Tunai Kas</option>
                    <option value="transfer">Transfer Bank</option>
                    <option value="qris">QRIS Syariah</option>
                    <option value="autodebet">Autodebet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status:</label>
                  <select
                    value={txStatus}
                    onChange={(e) => setTxStatus(e.target.value as Transaction['status'])}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden uppercase font-bold"
                  >
                    <option value="success">Sukses</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Gagal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan / Keterangan:</label>
                <textarea
                  rows={2}
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  placeholder="Keterangan koreksi atau alasan perubahan transaksi..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowTxModal(false);
                    setEditingTx(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Koreksi Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print / Download PDF Laporan Transaksi Modal */}
      {showPrintReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden text-slate-800 my-4 max-h-[92vh] flex flex-col">
            {/* Modal Header & Print Action Bar (Hidden during actual print) */}
            <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between no-print shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Pratinjau Cetak / Unduh PDF Laporan Transaksi</h3>
                  <p className="text-xs text-emerald-300">
                    Filter Aktif: {txPeriodType.toUpperCase()} | {txTypeFilter === 'all' ? 'SEMUA TRANSAKSI' : txTypeFilter.toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Dokumen Sekarang (PDF)
                </button>
                <button
                  onClick={() => setShowPrintReportModal(false)}
                  className="p-1.5 text-emerald-300 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-8 overflow-y-auto space-y-6 bg-white text-black font-sans print:p-0 print:overflow-visible">
              {/* Kop Surat Resmi */}
              <div className="border-b-2 border-black pb-4 text-center space-y-1">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-white p-0.5 border border-slate-300 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                    <img 
                      src={simpanankuLogo} 
                      alt="Logo SIMPANANKU" 
                      className="w-full h-full object-cover rounded-lg" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-left">
                    <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                      SIMPANANKU
                    </h1>
                    <p className="text-xs font-semibold text-slate-700">
                      Simpanan Tabungan • Gadai Syariah (Rahn) • Kredit Barang (Murabahah)
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Izin Kemenkumham & Rekomendasi Dewan Pengawas Syariah • Hotline: (021) 7890-1234
                    </p>
                  </div>
                </div>
                <div className="border-t border-slate-300 mt-2 pt-1" />
              </div>

              {/* Judul & Metadata Laporan */}
              <div className="text-center space-y-1">
                <h2 className="text-base font-black uppercase tracking-wide text-slate-900">
                  LAPORAN AUDIT MUTASI JURNAL TRANSAKSI KEUANGAN
                </h2>
                <div className="inline-flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600 font-medium">
                  <span>
                    Periode:{' '}
                    <strong className="text-slate-900">
                      {txPeriodType === 'all' && 'Semua Riwayat Transaksi'}
                      {txPeriodType === 'date' && `Harian (${txFilterDate})`}
                      {txPeriodType === 'month' && `Bulan ${txFilterMonth} Tahun ${txFilterYear}`}
                      {txPeriodType === 'year' && `Tahun ${txFilterYear}`}
                      {txPeriodType === 'range' && `${txFilterStartDate || 'Awal'} s/d ${txFilterEndDate || 'Sekarang'}`}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Jenis Filter:{' '}
                    <strong className="text-slate-900">
                      {txTypeFilter === 'all' ? 'Semua Jenis Transaksi' : txTypeFilter.replace('_', ' ').toUpperCase()}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Waktu Cetak:{' '}
                    <strong className="text-slate-900 font-mono">
                      {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Ringkasan Arus Kas */}
              <div className="grid grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Total Transaksi</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">{txTotalCount} Data</span>
                </div>
                <div>
                  <span className="text-emerald-700 block text-[10px]">Total Kas Masuk (Kredit)</span>
                  <span className="font-bold text-emerald-800 font-mono text-sm">+{formatRupiah(txTotalMasuk)}</span>
                </div>
                <div>
                  <span className="text-rose-700 block text-[10px]">Total Kas Keluar (Debet)</span>
                  <span className="font-bold text-rose-800 font-mono text-sm">-{formatRupiah(txTotalKeluar)}</span>
                </div>
                <div>
                  <span className="text-blue-700 block text-[10px]">Arus Kas Bersih (Net)</span>
                  <span className="font-bold text-blue-900 font-mono text-sm">{formatRupiah(txNetFlow)}</span>
                </div>
              </div>

              {/* Tabel Mutasi Rinci */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-100 font-bold uppercase text-[9px] border-b border-slate-300 text-slate-700">
                    <tr>
                      <th className="px-3 py-2">No</th>
                      <th className="px-3 py-2">No. Referensi</th>
                      <th className="px-3 py-2">Waktu</th>
                      <th className="px-3 py-2">Nasabah (AG)</th>
                      <th className="px-3 py-2">Jenis Transaksi</th>
                      <th className="px-3 py-2">Akad</th>
                      <th className="px-3 py-2 text-right">Nominal</th>
                      <th className="px-3 py-2 text-center">Status</th>
                      <th className="px-3 py-2">Teller</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {filteredTransactions.map((t, idx) => {
                      const isMasuk = ['setoran', 'gadai_tebus', 'gadai_ujrah', 'kredit_angsuran'].includes(t.type);
                      return (
                        <tr key={t.id} className="text-slate-800">
                          <td className="px-3 py-2 text-center font-sans">{idx + 1}</td>
                          <td className="px-3 py-2 font-bold">{t.referenceNumber}</td>
                          <td className="px-3 py-2 font-sans text-slate-600">{t.createdAt.split('T')[0]}</td>
                          <td className="px-3 py-2 font-sans">
                            <div className="font-bold text-slate-900">{t.memberName}</div>
                            <div className="text-[9px] text-slate-500">{t.memberNumber}</div>
                          </td>
                          <td className="px-3 py-2 font-sans uppercase font-medium text-slate-700">
                            {t.type.replace('_', ' ')}
                          </td>
                          <td className="px-3 py-2 uppercase font-medium text-emerald-800">
                            {t.akad}
                          </td>
                          <td className={`px-3 py-2 text-right font-bold ${isMasuk ? 'text-emerald-800' : 'text-rose-800'}`}>
                            {isMasuk ? '+' : '-'}{formatRupiah(t.amount)}
                          </td>
                          <td className="px-3 py-2 text-center font-sans">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-300">
                              {t.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-sans text-slate-600">{t.tellerName}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Tanda Tangan & Otorisasi Dokumen */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-center">
                <div className="space-y-16">
                  <div>
                    <span className="text-slate-500 block">Mengetahui & Menyetujui,</span>
                    <strong className="text-slate-900">Dewan Pengawas Syariah / Direksi</strong>
                  </div>
                  <div>
                    <div className="w-44 border-b border-black mx-auto" />
                    <span className="text-[10px] text-slate-500 mt-1 block">NIP. DPS-2026-001</span>
                  </div>
                </div>

                <div className="space-y-16">
                  <div>
                    <span className="text-slate-500 block">Dibuat Oleh,</span>
                    <strong className="text-slate-900">Administrator Sistem Keuangan</strong>
                  </div>
                  <div>
                    <div className="w-44 border-b border-black mx-auto" />
                    <span className="text-[10px] text-slate-900 font-bold mt-1 block">
                      {currentUser?.name || 'Administrator Simpananku'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Centralized Universal Delete Confirmation Modal */}
      {deleteModal && deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-100 max-w-md w-full p-6 text-slate-800 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-slate-900">
                  {deleteModal.title || 'Konfirmasi Hapus Data'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data berikut dari sistem?
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="text-xs font-bold text-slate-900">{deleteModal.itemName}</div>
              {deleteModal.itemDetails && (
                <div className="text-[11px] text-slate-600 leading-tight">
                  {deleteModal.itemDetails}
                </div>
              )}
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {deleteModal.warningText ||
                  'Perhatian: Tindakan ini permanen dan akan langsung memperbarui saldo serta data portofolio terkait.'}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Financial Report Print & PDF Modal (DSN-MUI Standard) */}
      {showPrintFinancialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden text-slate-800 my-4 max-h-[92vh] flex flex-col">
            {/* Modal Header & Action Bar */}
            <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between no-print shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Pratinjau Cetak / Unduh PDF Laporan Keuangan Syariah</h3>
                  <p className="text-xs text-emerald-300">
                    Periode:{' '}
                    {reportPeriodType === 'month'
                      ? `Bulan ${REPORT_MONTHS.find((m) => m.value === reportSelectedMonth)?.name} ${reportSelectedYear}`
                      : reportPeriodType === 'year'
                      ? `Tahun ${reportSelectedYear}`
                      : 'Semua Periode Akumulatif'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Dokumen Sekarang (PDF)
                </button>
                <button
                  onClick={() => setShowPrintFinancialModal(false)}
                  className="p-1.5 text-emerald-300 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="p-8 overflow-y-auto space-y-6 bg-white text-black font-sans print:p-0 print:overflow-visible text-xs">
              {/* Kop Surat Resmi Lembaga */}
              <div className="border-b-2 border-black pb-4 text-center space-y-1">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-white p-0.5 border border-slate-300 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                    <img 
                      src={simpanankuLogo} 
                      alt="Logo SIMPANANKU" 
                      className="w-full h-full object-cover rounded-lg" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-left">
                    <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                      SIMPANANKU
                    </h1>
                    <p className="text-xs font-semibold text-slate-700">
                      Simpanan Tabungan • Gadai Syariah (Rahn) • Kredit Barang (Murabahah)
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Izin Kemenkumham & Rekomendasi Dewan Pengawas Syariah No. 412/DSN-MUI/2024
                    </p>
                  </div>
                </div>
                <div className="border-t border-slate-300 mt-2 pt-1" />
              </div>

              {/* Judul Laporan */}
              <div className="text-center space-y-1">
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                  LAPORAN POSISI KEUANGAN & HASIL USAHA SYARIAH
                </h2>
                <p className="text-xs text-slate-600 font-semibold">
                  Periode:{' '}
                  {reportPeriodType === 'month'
                    ? `Bulan ${REPORT_MONTHS.find((m) => m.value === reportSelectedMonth)?.name} ${reportSelectedYear}`
                    : reportPeriodType === 'year'
                    ? `Tahun Buku ${reportSelectedYear}`
                    : 'Seluruh Periode Akumulatif'}
                </p>
                <p className="text-[10px] text-slate-400">
                  Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-3 text-center border border-slate-300 p-3 rounded-xl bg-slate-50/50">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Kas Masuk Periode</span>
                  <span className="font-bold text-emerald-800 font-mono text-xs">{formatRupiah(repTotalMasuk)}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Kas Keluar Periode</span>
                  <span className="font-bold text-rose-800 font-mono text-xs">{formatRupiah(repTotalKeluar)}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Net Arus Kas</span>
                  <span className="font-bold text-slate-900 font-mono text-xs">{formatRupiah(repNetCash)}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Laba Bersih Lembaga</span>
                  <span className="font-bold text-emerald-900 font-mono text-xs">{formatRupiah(repLabaBersihLembaga)}</span>
                </div>
              </div>

              {/* 1. Neraca */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wide text-emerald-950 border-b border-black pb-1">
                  I. POSISI NERACA SYARIAH
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-300 rounded-lg p-3 space-y-1.5 bg-slate-50/30">
                    <div className="font-bold text-[11px] text-slate-800 border-b border-slate-200 pb-1">AKTIVA (ASET)</div>
                    <div className="flex justify-between">
                      <span>Kas & Bank Operasional</span>
                      <span className="font-mono font-bold">{formatRupiah(Math.max(25000000, totalSavings * 0.45 + repNetCash))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Piutang Gadai Syariah (Rahn)</span>
                      <span className="font-mono font-bold">{formatRupiah(totalPawnPortfolio)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Piutang Pembiayaan Murabahah</span>
                      <span className="font-mono font-bold">{formatRupiah(totalCreditPortfolio)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-300 pt-1 font-bold">
                      <span>Total Aktiva</span>
                      <span className="font-mono">{formatRupiah(Math.max(25000000, totalSavings * 0.45 + repNetCash) + totalPawnPortfolio + totalCreditPortfolio)}</span>
                    </div>
                  </div>

                  <div className="border border-slate-300 rounded-lg p-3 space-y-1.5 bg-slate-50/30">
                    <div className="font-bold text-[11px] text-slate-800 border-b border-slate-200 pb-1">PASIVA (KEWAJIBAN & DANA)</div>
                    <div className="flex justify-between">
                      <span>Simpanan Wadi'ah Titipan</span>
                      <span className="font-mono font-bold">{formatRupiah(totalSavings * 0.6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Investasi Mudharabah Muthlaqah</span>
                      <span className="font-mono font-bold">{formatRupiah(totalSavings * 0.4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cadangan Qardhul Hasan</span>
                      <span className="font-mono font-bold">Rp 12.500.000</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-300 pt-1 font-bold">
                      <span>Total Pasiva & Dana</span>
                      <span className="font-mono">{formatRupiah(totalSavings + 12500000)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Laba Rugi */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wide text-emerald-950 border-b border-black pb-1">
                  II. PERHITUNGAN HASIL USAHA & PENDAPATAN OPERASIONAL
                </h3>
                <div className="border border-slate-300 rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between">
                    <span>Pendapatan Jasa Pemeliharaan Barang Gadai (Ujrah Rahn)</span>
                    <span className="font-mono font-bold text-emerald-800">{formatRupiah(effectiveUjrahIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pendapatan Margin Penjualan Barang (Murabahah)</span>
                    <span className="font-mono font-bold text-emerald-800">{formatRupiah(repEstimatedMargin)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-800">
                    <span>Total Pendapatan Operasional Syariah</span>
                    <span className="font-mono">{formatRupiah(repTotalShariaIncome)}</span>
                  </div>
                  <div className="flex justify-between text-rose-800">
                    <span>Beban Operasional Fasilitas & Pengelolaan Kantor</span>
                    <span className="font-mono font-bold">-{formatRupiah(repOperationalExpense)}</span>
                  </div>
                  <div className="flex justify-between text-amber-800">
                    <span>Hak Bagi Hasil Pihak Ketiga (Simpanan Mudharabah 30%)</span>
                    <span className="font-mono font-bold">-{formatRupiah(repHakPihakKetiga)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-1.5 font-black text-slate-900 text-sm">
                    <span>SISA HASIL USAHA BERSIH (LABA LEMBAGA)</span>
                    <span className="font-mono text-emerald-900">{formatRupiah(repLabaBersihLembaga)}</span>
                  </div>
                </div>
              </div>

              {/* 3. Daftar Mutasi Periode Terpilih */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wide text-emerald-950 border-b border-black pb-1">
                  III. REKAPITULASI TRANSAKSI PADA PERIODE INI ({reportTransactions.length} TRANSAKSI)
                </h3>
                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-100 font-bold border-b border-slate-300">
                      <tr>
                        <th className="px-2 py-1.5">No</th>
                        <th className="px-2 py-1.5">No. Ref</th>
                        <th className="px-2 py-1.5">Tanggal</th>
                        <th className="px-2 py-1.5">Nasabah</th>
                        <th className="px-2 py-1.5">Transaksi</th>
                        <th className="px-2 py-1.5">Akad</th>
                        <th className="px-2 py-1.5 text-right">Nominal</th>
                        <th className="px-2 py-1.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {reportTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-3 py-4 text-center text-slate-400 font-sans">
                            Tidak ada data transaksi pada periode ini.
                          </td>
                        </tr>
                      ) : (
                        reportTransactions.map((t, idx) => {
                          const isMasuk = ['setoran', 'gadai_tebus', 'gadai_ujrah', 'kredit_angsuran'].includes(t.type);
                          return (
                            <tr key={t.id}>
                              <td className="px-2 py-1 font-sans">{idx + 1}</td>
                              <td className="px-2 py-1 font-bold">{t.referenceNumber}</td>
                              <td className="px-2 py-1 font-sans">{t.createdAt.split('T')[0]}</td>
                              <td className="px-2 py-1 font-sans">{t.memberName}</td>
                              <td className="px-2 py-1 font-sans uppercase text-[10px]">{t.type}</td>
                              <td className="px-2 py-1 uppercase text-emerald-800">{t.akad}</td>
                              <td className={`px-2 py-1 text-right font-bold ${isMasuk ? 'text-emerald-800' : 'text-rose-800'}`}>
                                {isMasuk ? '+' : '-'}{formatRupiah(t.amount)}
                              </td>
                              <td className="px-2 py-1 text-center font-sans uppercase text-[10px]">{t.status}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tanda Tangan & Otorisasi Pengesahan */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-center">
                <div className="space-y-16">
                  <div>
                    <span className="text-slate-500 block">Mengetahui & Menyetujui,</span>
                    <strong className="text-slate-900">Dewan Pengawas Syariah (DPS)</strong>
                  </div>
                  <div>
                    <div className="w-44 border-b border-black mx-auto" />
                    <span className="text-[10px] text-slate-500 mt-1 block">NIP. DPS-2026-001</span>
                  </div>
                </div>

                <div className="space-y-16">
                  <div>
                    <span className="text-slate-500 block">Dibuat & Disahkan Oleh,</span>
                    <strong className="text-slate-900">Administrator Keuangan</strong>
                  </div>
                  <div>
                    <div className="w-44 border-b border-black mx-auto" />
                    <span className="text-[10px] text-slate-900 font-bold mt-1 block">
                      {currentUser?.name || 'Administrator Simpananku'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cetak Bukti Transaksi Resmi Syariah */}
      {adminReceiptTx && (
        <ReceiptModal
          transaction={adminReceiptTx}
          member={adminReceiptMember}
          currentBalance={adminReceiptMember?.totalSavings || 0}
          onClose={() => {
            setAdminReceiptTx(null);
            setAdminReceiptMember(null);
          }}
        />
      )}
    </div>
  );
};
