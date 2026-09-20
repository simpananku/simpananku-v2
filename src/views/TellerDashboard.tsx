import React, { useState } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Coins, 
  ShoppingBag, 
  Receipt, 
  Printer, 
  CheckCircle2, 
  Search, 
  User as UserIcon, 
  AlertCircle,
  Clock,
  Plus,
  BookOpen,
  CreditCard,
  X,
  Phone,
  Filter,
  Lock,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  Calendar,
  FileDown,
  RotateCcw,
  FileSpreadsheet,
  Edit3,
  Sparkles
} from 'lucide-react';
import { 
  User as UserType, 
  Member, 
  SavingsProduct, 
  SavingsAccount, 
  Transaction, 
  PawnPledge, 
  CommodityFinancing,
  InstallmentItem,
  ShariaAkad
} from '../types';
import { ApiClient } from '../services/api';
import { 
  formatRupiah, 
  formatDateIndo, 
  generateReferenceNumber, 
  generateMemberNumber
} from '../services/generator';
import { notificationService } from '../services/notificationService';
import { ReceiptModal } from '../components/ReceiptModal';
import { generateReceiptPdf } from '../services/receiptPdfService';
import { generatePassbookPdf } from '../services/passbookPdfService';
import simpanankuLogo from '../assets/images/simpananku.jpg';

interface TellerDashboardProps {
  currentUser: UserType;
  members: Member[];
  products: SavingsProduct[];
  accounts: SavingsAccount[];
  pawns: PawnPledge[];
  credits: CommodityFinancing[];
  transactions: Transaction[];
  onDeposit: (newTx: Transaction, updatedMember: Member, updatedAccount: SavingsAccount) => Promise<Transaction>;
  onWithdraw: (newTx: Transaction, updatedMember: Member, updatedAccount: SavingsAccount) => Promise<Transaction>;
  onPawnDisbursement: (newTx: Transaction, newPawn: PawnPledge) => Promise<Transaction>;
  onCreditDisbursement: (newTx: Transaction, newCredit: CommodityFinancing) => Promise<Transaction>;
  onPayInstallment: (newTx: Transaction, updatedCredit: CommodityFinancing) => Promise<Transaction>;
  onPawnRedemption?: (newTx: Transaction, updatedPawn: PawnPledge) => Promise<Transaction>;
  onPayUjrah?: (newTx: Transaction, updatedPawn: PawnPledge) => Promise<Transaction>;
  onAddMember?: (newMember: Member, newUser: UserType) => void;
  onUpdateMembers?: (members: Member[]) => void;
  onUpdateCurrentUser?: (user: UserType) => void;
}

type MainTab = 'members' | 'today_transactions' | 'profile';
type TxModalTab = 'setoran' | 'penarikan' | 'gadai' | 'kredit' | 'angsuran' | 'tebus_gadai';

export const TellerDashboard: React.FC<TellerDashboardProps> = ({
  currentUser,
  members,
  products,
  accounts,
  pawns,
  credits,
  transactions,
  onDeposit,
  onWithdraw,
  onPawnDisbursement,
  onCreditDisbursement,
  onPayInstallment,
  onPawnRedemption,
  onPayUjrah,
  onAddMember,
  onUpdateMembers,
  onUpdateCurrentUser,
}) => {
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationPending, setMutationPending] = useState(false);
  const runMutation = async <T,>(work: () => Promise<T>): Promise<{value: T} | null> => {
    setMutationPending(true); setMutationError(null);
    try { return { value: await work() }; }
    catch (error: any) { setMutationError(error.message || 'Perubahan gagal disimpan.'); return null; }
    finally { setMutationPending(false); }
  };
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [memberFilter, setMemberFilter] = useState<'all' | 'savings' | 'pawn' | 'credit'>('all');

  // Selected Member for Modal Action
  const [selectedMemberForTx, setSelectedMemberForTx] = useState<Member | null>(null);
  const [txModalTab, setTxModalTab] = useState<TxModalTab>('setoran');

  // Selected Member for Passbook / Mutation Modal
  const [selectedMemberForPassbook, setSelectedMemberForPassbook] = useState<Member | null>(null);

  // Edit Member Modal State (Teller)
  const [editingMemberForTeller, setEditingMemberForTeller] = useState<Member | null>(null);
  const [tellerEditName, setTellerEditName] = useState('');
  const [tellerEditNik, setTellerEditNik] = useState('');
  const [tellerEditPhone, setTellerEditPhone] = useState('');
  const [tellerEditAddress, setTellerEditAddress] = useState('');
  const [tellerEditOccupation, setTellerEditOccupation] = useState('');
  const [tellerEditNotes, setTellerEditNotes] = useState('');

  const openEditMemberTeller = (m: Member) => {
    setEditingMemberForTeller(m);
    setTellerEditName(m.fullName);
    setTellerEditNik(m.nik);
    setTellerEditPhone(m.phone);
    setTellerEditAddress(m.address);
    setTellerEditOccupation(m.occupation);
    setTellerEditNotes(m.notes || '');
  };

  const handleSaveMemberTeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemberForTeller || !onUpdateMembers) return;
    const updated = members.map((m) => {
      if (m.id === editingMemberForTeller.id) {
        return {
          ...m,
          fullName: tellerEditName,
          nik: tellerEditNik,
          phone: tellerEditPhone,
          address: tellerEditAddress,
          occupation: tellerEditOccupation,
          notes: tellerEditNotes,
        };
      }
      return m;
    });
    if (!await runMutation(() => Promise.resolve(onUpdateMembers(updated)))) return;
    setEditingMemberForTeller(null);
    notificationService.broadcast({
      title: 'Profil Nasabah Diperbarui',
      message: `Data profil ${tellerEditName} (${editingMemberForTeller.memberNumber}) berhasil diperbarui oleh Teller.`,
      category: 'anggota',
      targetMemberNumber: editingMemberForTeller.memberNumber,
    });
  };

  // Add Member Modal State
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemFullName, setNewMemFullName] = useState('');
  const [newMemNik, setNewMemNik] = useState('');
  const [newMemPhone, setNewMemPhone] = useState('');
  const [newMemEmail, setNewMemEmail] = useState('');
  const [newMemPassword, setNewMemPassword] = useState('');
  const [showNewMemPassword, setShowNewMemPassword] = useState(false);
  const [newMemAddress, setNewMemAddress] = useState('');
  const [newMemOccupation, setNewMemOccupation] = useState('');

  // Teller Profile Password Form State
  const [tellerCurrentPassword, setTellerCurrentPassword] = useState('');
  const [tellerNewPassword, setTellerNewPassword] = useState('');
  const [tellerConfirmPassword, setTellerConfirmPassword] = useState('');
  const [showTellerPassword, setShowTellerPassword] = useState(false);
  const [tellerPassSuccess, setTellerPassSuccess] = useState<string | null>(null);
  const [tellerPassError, setTellerPassError] = useState<string | null>(null);

  const handleChangeTellerPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setTellerPassSuccess(null);
    setTellerPassError(null);

    if (tellerNewPassword !== tellerConfirmPassword) { setTellerPassError('Konfirmasi password tidak cocok.'); return; }
    if (!await runMutation(() => ApiClient.changePassword(tellerCurrentPassword, tellerNewPassword))) {
      setTellerPassError('Gagal mengubah password. Periksa password saat ini.'); return;
    }
    window.location.reload();

    setTellerPassSuccess('Password akun Teller berhasil diperbarui!');
    setTellerCurrentPassword('');
    setTellerNewPassword('');
    setTellerConfirmPassword('');

    notificationService.broadcast({
      title: 'Password Teller Diperbarui',
      message: `Petugas teller ${currentUser.name} telah berhasil mengubah password akun.`,
      category: 'sistem',
      targetRole: 'admin',
    });
  };

  // Transaction Form States inside Modal
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [txAmount, setTxAmount] = useState<number>(100000);
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'transfer'>('tunai');
  const [txNotes, setTxNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Gadai Form State
  const [pawnItemType, setPawnItemType] = useState<'emas_batangan' | 'perhiasan' | 'bpkb_motor' | 'elektronik' | 'lainnya'>('emas_batangan');
  const [pawnDesc, setPawnDesc] = useState('');
  const [pawnEstimatedValue, setPawnEstimatedValue] = useState<number>(5000000);
  const [pawnLoanAmount, setPawnLoanAmount] = useState<number>(4000000);
  const [pawnPeriodMonths, setPawnPeriodMonths] = useState<number>(4);
  const [pawnMonthlyUjrah, setPawnMonthlyUjrah] = useState<number>(47500); // 0.95% dari taksiran Rp 5.000.000, dapat diatur mulai dari Rp 0
  const [isEstimatingAi, setIsEstimatingAi] = useState(false);

  const handleAiEstimate = async () => {
    if (!pawnDesc) {
      alert('Silakan isi deskripsi dan spesifikasi barang terlebih dahulu untuk ditaksir AI.');
      return;
    }
    setIsEstimatingAi(true);
    try {
      const res = await ApiClient.estimateMarhun(pawnItemType, pawnDesc, pawnEstimatedValue || 1000000);
      if (res && res.estimate) {
        const estVal = Number(res.estimate.recommended_market_value || res.estimate.estimated_market_value);
        if (estVal && !isNaN(estVal)) {
          setPawnEstimatedValue(estVal);
          setPawnLoanAmount(Math.round(estVal * 0.8));
          if (res.estimate.suggested_monthly_ujrah) {
            setPawnMonthlyUjrah(Number(res.estimate.suggested_monthly_ujrah));
          }
        }
      }
    } catch (err: any) {
      console.warn('AI Taksiran note:', err.message);
    } finally {
      setIsEstimatingAi(false);
    }
  };

  // Kredit Form State
  const [creditCategory, setCreditCategory] = useState<'kendaraan' | 'smartphone' | 'elektronik_rumah' | 'alat_usaha'>('smartphone');
  const [creditItemName, setCreditItemName] = useState('');
  const [creditCost, setCreditCost] = useState<number>(6000000);
  const [creditMargin, setCreditMargin] = useState<number>(600000);
  const [creditDownPayment, setCreditDownPayment] = useState<number>(1200000);
  const [creditTenor, setCreditTenor] = useState<number>(6);

  // Angsuran State
  const [selectedCreditId, setSelectedCreditId] = useState<string>('');
  const [selectedInstallmentNo, setSelectedInstallmentNo] = useState<number>(1);

  // Receipt Modal State
  const [activeReceiptTx, setActiveReceiptTx] = useState<Transaction | null>(null);
  const [activeReceiptMember, setActiveReceiptMember] = useState<Member | null>(null);

  // Metrics Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter((t) => t.createdAt && t.createdAt.startsWith(todayStr));
  const totalKasMasuk = todayTransactions
    .filter((t) => ['setoran', 'kredit_angsuran', 'gadai_tebus', 'gadai_ujrah'].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);
  const totalKasKeluar = todayTransactions
    .filter((t) => ['penarikan', 'gadai_pencairan', 'kredit_pencairan'].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);
  const totalSavings = members.reduce((sum, m) => sum + m.totalSavings, 0);

  // Audit Transaksi Kasir Filter States (Cari berdasarkan nama, tanggal, bulan, tahun)
  const [auditSearchName, setAuditSearchName] = useState<string>('');
  const [auditDateMode, setAuditDateMode] = useState<'today' | 'all' | 'date' | 'month_year'>('today');
  const [auditSpecificDate, setAuditSpecificDate] = useState<string>(todayStr);
  const [auditMonth, setAuditMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [auditYear, setAuditYear] = useState<string>(String(new Date().getFullYear()));
  const [auditTypeFilter, setAuditTypeFilter] = useState<string>('all');

  // Filtered Audit Transactions
  const filteredAuditTransactions = transactions.filter((t) => {
    // 1. Filter Nama / No Anggota / Ref / Teller / Catatan
    if (auditSearchName.trim()) {
      const q = auditSearchName.toLowerCase().trim();
      const match =
        t.memberName.toLowerCase().includes(q) ||
        t.memberNumber.toLowerCase().includes(q) ||
        t.referenceNumber.toLowerCase().includes(q) ||
        (t.tellerName && t.tellerName.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q));
      if (!match) return false;
    }

    // 2. Filter Jenis Transaksi
    if (auditTypeFilter !== 'all' && t.type !== auditTypeFilter) {
      return false;
    }

    // 3. Filter Tanggal, Bulan, Tahun
    const txDateStr = t.createdAt ? t.createdAt.split('T')[0] : '';
    if (auditDateMode === 'today') {
      return txDateStr === todayStr;
    }
    if (auditDateMode === 'date') {
      if (auditSpecificDate && txDateStr !== auditSpecificDate) return false;
    } else if (auditDateMode === 'month_year') {
      if (auditYear && !txDateStr.startsWith(auditYear)) return false;
      if (auditMonth && auditMonth !== 'all') {
        const parts = txDateStr.split('-');
        if (parts[1] !== auditMonth) return false;
      }
    }
    return true;
  });

  const auditKasMasuk = filteredAuditTransactions
    .filter((t) => ['setoran', 'kredit_angsuran', 'gadai_tebus', 'gadai_ujrah'].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  const auditKasKeluar = filteredAuditTransactions
    .filter((t) => ['penarikan', 'gadai_pencairan', 'kredit_pencairan'].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  const auditNetCash = auditKasMasuk - auditKasKeluar;

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      m.fullName.toLowerCase().includes(q) ||
      m.memberNumber.toLowerCase().includes(q) ||
      m.nik.includes(q) ||
      m.phone.includes(q) ||
      m.occupation.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (memberFilter === 'savings') return m.totalSavings > 0;
    if (memberFilter === 'pawn') return m.activePawnCount > 0;
    if (memberFilter === 'credit') return m.activeCreditCount > 0;
    return true;
  });

  // Open Transaction Modal for specific member
  const handleOpenTransaction = (member: Member, initialTab: TxModalTab = 'setoran') => {
    setSelectedMemberForTx(member);
    setTxModalTab(initialTab);
    setErrorMessage(null);
    setTxAmount(100000);
    setTxNotes('');

    // Pre-select first account product
    const memberAccs = accounts.filter((a) => a.memberNumber === member.memberNumber);
    if (memberAccs.length > 0) {
      setSelectedProductId(memberAccs[0].productId);
    } else if (products.length > 0) {
      setSelectedProductId(products[0].id);
    }

    // Pre-select active credit if tab is angsuran
    const memberCredits = credits.filter((c) => c.memberNumber === member.memberNumber && c.status === 'berjalan');
    if (memberCredits.length > 0) {
      setSelectedCreditId(memberCredits[0].id);
      const nextUnpaid = memberCredits[0].installments.find((i) => i.status === 'belum_bayar');
      if (nextUnpaid) {
        setSelectedInstallmentNo(nextUnpaid.installmentNo);
      }
    }

    if (initialTab === 'gadai') {
      setPawnEstimatedValue(5000000);
      setPawnLoanAmount(4000000);
      setPawnMonthlyUjrah(Math.round(5000000 * 0.0095));
    }
  };

  // Quick WhatsApp Chat
  const handleOpenWhatsAppChat = (phone: string, fullName: string, memberNumber: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const greeting = encodeURIComponent(`Assalamu'alaikum Wr. Wb. Bpk/Ibu ${fullName} (${memberNumber}), kami dari Loket Layanan SIMPANANKU Syariah.`);
    window.open(`https://wa.me/${intlPhone}?text=${greeting}`, '_blank');
  };

  // Add Member Submission
  const handleSaveAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemFullName || !newMemNik || !newMemPhone) {
      alert('Mohon lengkapi Nama, NIK, dan Nomor HP / WhatsApp.');
      return;
    }

    const nextNum = generateMemberNumber(members.length);
    const finalPassword = newMemPassword;
    const newMember: Member = {
      id: 'MBR-' + Date.now(),
      memberNumber: nextNum,
      nik: newMemNik,
      fullName: newMemFullName,
      email: newMemEmail || `${nextNum.toLowerCase()}@simpananku.my.id`,
      phone: newMemPhone,
      password: finalPassword,
      address: newMemAddress || 'Jl. Terdaftar Kasir Teller',
      occupation: newMemOccupation || 'Wiraswasta',
      status: 'aktif',
      joinDate: new Date().toISOString().split('T')[0],
      totalSavings: 0,
      activePawnCount: 0,
      activeCreditCount: 0,
    };

    const newUser: UserType = {
      id: 'USR-' + Date.now(),
      name: newMemFullName,
      email: newMember.email,
      role: 'nasabah',
      phone: newMemPhone,
      password: finalPassword,
      memberId: nextNum,
      createdAt: new Date().toISOString(),
    };

    if (onAddMember) {
      if (!await runMutation(() => Promise.resolve(onAddMember(newMember, newUser)))) return;
    }

    setShowAddMemberModal(false);
    setNewMemFullName('');
    setNewMemNik('');
    setNewMemPhone('');
    setNewMemEmail('');
    setNewMemPassword('');
    setNewMemAddress('');
    setNewMemOccupation('');

    // Open transaction modal immediately for new member deposit
    // Open the newly saved member from the refreshed list so the database number is used.
  };

  // Setoran Submission
  const handleProcessDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForTx) return;

    if (txAmount <= 0) {
      setErrorMessage('Nominal setoran harus lebih besar dari Rp 0');
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId);
    if (prod && txAmount < prod.minInitialDeposit && selectedMemberForTx.totalSavings === 0) {
      setErrorMessage(`Setoran pertama untuk produk ini minimal ${formatRupiah(prod.minInitialDeposit)}`);
      return;
    }

    let acc = accounts.find(
      (a) => a.memberNumber === selectedMemberForTx.memberNumber && a.productId === selectedProductId
    );

    if (!acc) {
      acc = {
        id: `ACC-${Date.now()}-${selectedProductId}`,
        memberNumber: selectedMemberForTx.memberNumber,
        productId: selectedProductId,
        productName: prod?.name || 'Tabungan Syariah',
        akad: (prod?.akad as 'wadiah' | 'mudharabah') || 'wadiah',
        balance: 0,
        openedAt: new Date().toISOString().split('T')[0],
        status: 'active',
      };
    }

    const ref = generateReferenceNumber('SET');
    const newTx: Transaction = {
      id: 'TX-' + Date.now(),
      referenceNumber: ref,
      memberNumber: selectedMemberForTx.memberNumber,
      memberName: selectedMemberForTx.fullName,
      type: 'setoran',
      akad: (prod?.akad as ShariaAkad) || 'wadiah',
      amount: txAmount,
      notes: txNotes || 'Setoran tunai di loket teller',
      tellerId: currentUser.id,
      tellerName: currentUser.name,
      createdAt: new Date().toISOString(),
      status: 'success',
      paymentMethod,
      receiptCode: ref,
    };

    const updatedAcc: SavingsAccount = {
      ...acc,
      balance: acc.balance + txAmount,
    };

    const updatedMem: Member = {
      ...selectedMemberForTx,
      totalSavings: selectedMemberForTx.totalSavings + txAmount,
    };

    const persisted = await runMutation(() => onDeposit(newTx, updatedMem, updatedAcc));
    if (!persisted) return;

    notificationService.broadcast({
      title: 'Setoran Berhasil Diproses',
      message: `Setoran ${formatRupiah(txAmount)} untuk ${selectedMemberForTx.fullName} (${selectedMemberForTx.memberNumber}) telah tercatat.`,
      category: 'transaksi',
      targetMemberNumber: selectedMemberForTx.memberNumber,
    });

    setSelectedMemberForTx(null);
    setActiveReceiptTx(persisted.value);
    setActiveReceiptMember(updatedMem);
  };

  // Penarikan Submission
  const handleProcessWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForTx) return;

    const acc = accounts.find(
      (a) => a.memberNumber === selectedMemberForTx.memberNumber && a.productId === selectedProductId
    );

    if (!acc) {
      setErrorMessage('Rekening simpanan untuk produk ini tidak ditemukan.');
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId);
    const minBalance = prod?.minBalance || 20000;

    if (acc.balance - txAmount < minBalance) {
      setErrorMessage(`Saldo tidak mencukupi. Saldo saat ini ${formatRupiah(acc.balance)} dengan saldo mengendap minimal ${formatRupiah(minBalance)}.`);
      return;
    }

    const ref = generateReferenceNumber('TRK');
    const newTx: Transaction = {
      id: 'TX-' + Date.now(),
      referenceNumber: ref,
      memberNumber: selectedMemberForTx.memberNumber,
      memberName: selectedMemberForTx.fullName,
      type: 'penarikan',
      akad: (acc.akad as ShariaAkad) || 'wadiah',
      amount: txAmount,
      notes: txNotes || 'Penarikan tunai loket teller',
      tellerId: currentUser.id,
      tellerName: currentUser.name,
      createdAt: new Date().toISOString(),
      status: 'success',
      paymentMethod: 'tunai',
      receiptCode: ref,
    };

    const updatedAcc: SavingsAccount = {
      ...acc,
      balance: acc.balance - txAmount,
    };

    const updatedMem: Member = {
      ...selectedMemberForTx,
      totalSavings: Math.max(0, selectedMemberForTx.totalSavings - txAmount),
    };

    const persisted = await runMutation(() => onWithdraw(newTx, updatedMem, updatedAcc));
    if (!persisted) return;

    notificationService.broadcast({
      title: 'Penarikan Saldo Berhasil',
      message: `Penarikan tunai ${formatRupiah(txAmount)} atas nama ${selectedMemberForTx.fullName} telah diserahkan.`,
      category: 'transaksi',
      targetMemberNumber: selectedMemberForTx.memberNumber,
    });

    setSelectedMemberForTx(null);
    setActiveReceiptTx(persisted.value);
    setActiveReceiptMember(updatedMem);
  };

  // Gadai Rahn Submission
  const handleProcessPawn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForTx) return;

    const maxLoan = pawnEstimatedValue * 0.85;
    if (pawnLoanAmount > maxLoan) {
      setErrorMessage(`Pinjaman Rahn maksimal 85% dari taksiran pasar (${formatRupiah(maxLoan)})`);
      return;
    }

    const monthlyUjrah = Math.max(0, pawnMonthlyUjrah);
    const ref = generateReferenceNumber('RHN');
    const startDate = new Date();
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + pawnPeriodMonths);

    const newPawn: PawnPledge = {
      id: 'RHN-' + Date.now(),
      pawnCode: ref,
      memberNumber: selectedMemberForTx.memberNumber,
      memberName: selectedMemberForTx.fullName,
      itemType: pawnItemType,
      itemDescription: pawnDesc || 'Emas Batangan / Barang Jaminan Rahn',
      estimatedValue: pawnEstimatedValue,
      loanAmount: pawnLoanAmount,
      monthlyUjrah,
      periodMonths: pawnPeriodMonths,
      startDate: startDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      status: 'aktif',
      paidUjrahTotal: 0,
      notes: monthlyUjrah === 0
        ? 'Akad Rahn Bebas Ujrah (Rp 0 / Qardhul Hasan Bebas Biaya Simpan).'
        : `Akad Rahn & Ijarah sewa tempat penyimpanan Rp ${monthlyUjrah.toLocaleString('id-ID')}/bulan.`,
    };

    const newTx: Transaction = {
      id: 'TX-' + Date.now(),
      referenceNumber: ref,
      memberNumber: selectedMemberForTx.memberNumber,
      memberName: selectedMemberForTx.fullName,
      type: 'gadai_pencairan',
      akad: 'rahn',
      amount: pawnLoanAmount,
      notes: `Pencairan Gadai Syariah: ${newPawn.itemDescription} (Taksiran: ${formatRupiah(pawnEstimatedValue)})`,
      tellerId: currentUser.id,
      tellerName: currentUser.name,
      createdAt: new Date().toISOString(),
      status: 'success',
      paymentMethod: 'tunai',
      receiptCode: ref,
    };

    const persisted = await runMutation(() => onPawnDisbursement(newTx, newPawn));
    if (!persisted) return;

    notificationService.broadcast({
      title: 'Pencairan Gadai Syariah Berhasil',
      message: `Akad Gadai Rahn ${ref} senilai ${formatRupiah(pawnLoanAmount)} telah dicairkan untuk ${selectedMemberForTx.fullName}.`,
      category: 'gadai',
      targetMemberNumber: selectedMemberForTx.memberNumber,
    });

    setSelectedMemberForTx(null);
    setActiveReceiptTx(persisted.value);
    setActiveReceiptMember(selectedMemberForTx);
  };

  // Kredit Murabahah Submission
  const handleProcessCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForTx) return;

    const sellingPrice = creditCost + creditMargin;
    const remainingReceivable = sellingPrice - creditDownPayment;
    const monthlyInstallment = Math.round(remainingReceivable / creditTenor);

    const installments: InstallmentItem[] = [];
    const baseDate = new Date();

    for (let i = 1; i <= creditTenor; i++) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + i);
      installments.push({
        id: `INST-${Date.now()}-${i}`,
        installmentNo: i,
        dueDate: d.toISOString().split('T')[0],
        amount: monthlyInstallment,
        principalPortion: Math.round(creditCost / creditTenor),
        marginPortion: Math.round(creditMargin / creditTenor),
        status: 'belum_bayar',
      });
    }

    const ref = generateReferenceNumber('MRB');
    const newCredit: CommodityFinancing = {
      id: 'CRD-' + Date.now(),
      contractNumber: ref,
      memberNumber: selectedMemberForTx.memberNumber,
      memberName: selectedMemberForTx.fullName,
      itemCategory: creditCategory,
      itemName: creditItemName || 'Barang Pembiayaan Murabahah',
      purchaseCost: creditCost,
      marginAmount: creditMargin,
      sellingPrice,
      downPayment: creditDownPayment,
      financingAmount: remainingReceivable,
      tenorMonths: creditTenor,
      monthlyInstallment,
      remainingBalance: remainingReceivable,
      paidInstallmentsCount: 0,
      startDate: baseDate.toISOString().split('T')[0],
      status: 'berjalan',
      installments,
    };

    const newTx: Transaction = {
      id: 'TX-' + Date.now(),
      referenceNumber: ref,
      memberNumber: selectedMemberForTx.memberNumber,
      memberName: selectedMemberForTx.fullName,
      type: 'kredit_pencairan',
      akad: 'murabahah',
      amount: remainingReceivable,
      notes: `Akad Murabahah Barang ${newCredit.itemName} (Modal ${formatRupiah(creditCost)} + Margin ${formatRupiah(creditMargin)})`,
      tellerId: currentUser.id,
      tellerName: currentUser.name,
      createdAt: new Date().toISOString(),
      status: 'success',
      paymentMethod: 'tunai',
      receiptCode: ref,
    };

    const persisted = await runMutation(() => onCreditDisbursement(newTx, newCredit));
    if (!persisted) return;

    notificationService.broadcast({
      title: 'Pembiayaan Murabahah Dicairkan',
      message: `Kontrak ${ref} untuk ${selectedMemberForTx.fullName} berhasil disepakati. Angsuran: ${formatRupiah(monthlyInstallment)}/bln.`,
      category: 'angsuran',
      targetMemberNumber: selectedMemberForTx.memberNumber,
    });

    setSelectedMemberForTx(null);
    setActiveReceiptTx(persisted.value);
    setActiveReceiptMember(selectedMemberForTx);
  };

  // Bayar Angsuran Submission
  const handleProcessPayInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForTx) return;

    const credit = credits.find((c) => c.id === selectedCreditId);
    if (!credit) {
      setErrorMessage('Kontrak pembiayaan tidak ditemukan.');
      return;
    }

    const instIndex = credit.installments.findIndex((i) => i.installmentNo === selectedInstallmentNo);
    if (instIndex === -1 || credit.installments[instIndex].status === 'lunas') {
      setErrorMessage('Angsuran ini sudah berstatus LUNAS atau tidak valid.');
      return;
    }

    const targetInst = credit.installments[instIndex];
    const ref = generateReferenceNumber('ANG');

    const updatedInstallments = [...credit.installments];
    updatedInstallments[instIndex] = {
      ...targetInst,
      status: 'lunas',
      paidAt: new Date().toISOString(),
      receiptNumber: ref,
    };

    const newRemaining = Math.max(0, credit.remainingBalance - targetInst.amount);
    const allDone = updatedInstallments.every((i) => i.status === 'lunas');

    const updatedCredit: CommodityFinancing = {
      ...credit,
      remainingBalance: newRemaining,
      status: allDone ? 'lunas' : 'berjalan',
      paidInstallmentsCount: credit.paidInstallmentsCount + 1,
      installments: updatedInstallments,
    };

    const newTx: Transaction = {
      id: 'TX-' + Date.now(),
      referenceNumber: ref,
      memberNumber: selectedMemberForTx.memberNumber,
      memberName: selectedMemberForTx.fullName,
      type: 'kredit_angsuran',
      akad: 'murabahah',
      amount: targetInst.amount,
      notes: `Pembayaran Angsuran ke-${targetInst.installmentNo} Kontrak ${credit.contractNumber} (${credit.itemName})`,
      tellerId: currentUser.id,
      tellerName: currentUser.name,
      createdAt: new Date().toISOString(),
      status: 'success',
      paymentMethod,
      receiptCode: ref,
    };

    const persisted = await runMutation(() => onPayInstallment(newTx, updatedCredit));
    if (!persisted) return;

    notificationService.broadcast({
      title: 'Pembayaran Angsuran Berhasil',
      message: `Angsuran ke-${targetInst.installmentNo} sebesar ${formatRupiah(targetInst.amount)} oleh ${selectedMemberForTx.fullName} telah diterima.`,
      category: 'angsuran',
      targetMemberNumber: selectedMemberForTx.memberNumber,
    });

    setSelectedMemberForTx(null);
    setActiveReceiptTx(persisted.value);
    setActiveReceiptMember(selectedMemberForTx);
  };

  // Tebus Gadai (Pelunasan Rahn)
  const handleProcessPawnRedeem = async (pawn: PawnPledge) => {
    if (!selectedMemberForTx) return;
    const ref = generateReferenceNumber('RDM');
    const updatedPawn: PawnPledge = {
      ...pawn,
      status: 'ditebus',
      notes: `${pawn.notes || ''} [LUNAS & DITEBUS TGL ${new Date().toISOString().split('T')[0]}]`,
    };

    const newTx: Transaction = {
      id: 'TX-' + Date.now(),
      referenceNumber: ref,
      memberNumber: selectedMemberForTx.memberNumber,
      memberName: selectedMemberForTx.fullName,
      type: 'gadai_tebus',
      akad: 'rahn',
      amount: pawn.loanAmount,
      notes: `Pelunasan & Penebusan Gadai Syariah: ${pawn.itemDescription} (${pawn.pawnCode})`,
      tellerId: currentUser.id,
      tellerName: currentUser.name,
      createdAt: new Date().toISOString(),
      status: 'success',
      paymentMethod: 'tunai',
      receiptCode: ref,
    };

    if (!onPawnRedemption) return;
    const persisted = await runMutation(() => onPawnRedemption(newTx, updatedPawn));
    if (!persisted) return;

    notificationService.broadcast({
      title: 'Penebusan Gadai Syariah Berhasil',
      message: `Akad Gadai Rahn ${pawn.pawnCode} telah ditebus lunas senilai ${formatRupiah(pawn.loanAmount)} oleh ${selectedMemberForTx.fullName}.`,
      category: 'gadai',
      targetMemberNumber: selectedMemberForTx.memberNumber,
    });

    setSelectedMemberForTx(null);
    setActiveReceiptTx(persisted.value);
    setActiveReceiptMember(selectedMemberForTx);
  };

  // Bayar Ujrah Gadai Bulanan
  const handleProcessPawnUjrah = async (pawn: PawnPledge) => {
    if (!selectedMemberForTx) return;
    const ref = generateReferenceNumber('UJR');
    const updatedPawn: PawnPledge = {
      ...pawn,
      paidUjrahTotal: (pawn.paidUjrahTotal || 0) + pawn.monthlyUjrah,
      notes: `${pawn.notes || ''} [PEMBAYARAN UJRAH BULANAN ${formatRupiah(pawn.monthlyUjrah)} TGL ${new Date().toISOString().split('T')[0]}]`,
    };

    const newTx: Transaction = {
      id: 'TX-' + Date.now(),
      referenceNumber: ref,
      memberNumber: selectedMemberForTx.memberNumber,
      memberName: selectedMemberForTx.fullName,
      type: 'gadai_ujrah',
      akad: 'ijarah',
      amount: pawn.monthlyUjrah,
      notes: `Pembayaran Ujrah Pemeliharaan Gadai Syariah: ${pawn.itemDescription} (${pawn.pawnCode})`,
      tellerId: currentUser.id,
      tellerName: currentUser.name,
      createdAt: new Date().toISOString(),
      status: 'success',
      paymentMethod: 'tunai',
      receiptCode: ref,
    };

    if (!onPayUjrah) return;
    const persisted = await runMutation(() => onPayUjrah(newTx, updatedPawn));
    if (!persisted) return;

    notificationService.broadcast({
      title: 'Pembayaran Ujrah Rahn Berhasil',
      message: `Pembayaran ujrah titip simpan ${pawn.pawnCode} senilai ${formatRupiah(pawn.monthlyUjrah)} berhasil dicatat untuk ${selectedMemberForTx.fullName}.`,
      category: 'gadai',
      targetMemberNumber: selectedMemberForTx.memberNumber,
    });

    setSelectedMemberForTx(null);
    setActiveReceiptTx(persisted.value);
    setActiveReceiptMember(selectedMemberForTx);
  };

  // Re-open receipt from today's transactions list
  const handleViewReceiptFromHistory = (tx: Transaction) => {
    const mem = members.find((m) => m.memberNumber === tx.memberNumber) || null;
    setActiveReceiptTx(tx);
    setActiveReceiptMember(mem);
  };

  return (
    <div>
      {mutationError && <div role="alert" className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-lg rounded-lg bg-rose-50 border border-rose-300 shadow-xl p-3 text-rose-800">{mutationError}</div>}
      {mutationPending && <div role="status" className="fixed top-4 right-4 z-[100] rounded-lg bg-white shadow p-3 text-emerald-800">Menyimpan perubahan...</div>}
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-700/80 text-emerald-200 border border-emerald-600">
                LOKET KASIR TELLER
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                Petugas: {currentUser.name}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-sans">
              Loket Kasir & Data Nasabah
            </h1>
            <p className="text-xs text-emerald-200/80 max-w-xl">
              Kelola data nasabah/anggota (AG0001), proses setoran, penarikan, pencairan gadai rahn, kredit murabahah, dan cetak bukti transaksi WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Tambah Nasabah Baru
            </button>
          </div>
        </div>

        {/* Quick Summary Metrics */}
        <div className="mt-6 pt-5 border-t border-emerald-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/50">
            <span className="text-emerald-300/80 block text-[10px] uppercase font-semibold">Total Nasabah</span>
            <span className="font-bold text-base text-white">{members.length} Orang</span>
          </div>
          <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/50">
            <span className="text-emerald-300/80 block text-[10px] uppercase font-semibold">Dana Simpanan Nasabah</span>
            <span className="font-bold text-base text-white">{formatRupiah(totalSavings)}</span>
          </div>
          <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/50">
            <span className="text-emerald-300/80 block text-[10px] uppercase font-semibold">Kas Masuk Hari Ini</span>
            <span className="font-bold text-base text-emerald-300">+{formatRupiah(totalKasMasuk)}</span>
          </div>
          <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/50">
            <span className="text-emerald-300/80 block text-[10px] uppercase font-semibold">Kas Keluar Hari Ini</span>
            <span className="font-bold text-base text-amber-300">-{formatRupiah(totalKasKeluar)}</span>
          </div>
        </div>
      </div>

      {/* Main Tab Selector (Members Table vs Riwayat Transaksi Hari Ini vs Profil Teller) */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveMainTab('members')}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeMainTab === 'members'
              ? 'border-emerald-700 text-emerald-900 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          Data Nasabah / Anggota ({members.length})
        </button>
        <button
          onClick={() => setActiveMainTab('today_transactions')}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeMainTab === 'today_transactions'
              ? 'border-emerald-700 text-emerald-900 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          Audit Transaksi Kasir ({filteredAuditTransactions.length})
        </button>
        <button
          onClick={() => setActiveMainTab('profile')}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeMainTab === 'profile'
              ? 'border-emerald-700 text-emerald-900 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          Profil Teller & Keamanan
        </button>
      </div>

      {/* TAB 1: DATA NASABAH / ANGGOTA (IDENTICAL IN STRUCTURE TO ADMIN NASABAH) */}
      {activeMainTab === 'members' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Data Nasabah / Anggota</h2>
              <p className="text-xs text-slate-500">
                Nomor Anggota AG0001 pengganti rekening konvensional • Layanan loket setoran, penarikan, & pembiayaan
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
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
                onClick={() => setShowAddMemberModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Nasabah
              </button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 pt-1 overflow-x-auto text-xs pb-1">
            <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            <button
              onClick={() => setMemberFilter('all')}
              className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                memberFilter === 'all'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({members.length})
            </button>
            <button
              onClick={() => setMemberFilter('savings')}
              className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                memberFilter === 'savings'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Ada Simpanan ({members.filter((m) => m.totalSavings > 0).length})
            </button>
            <button
              onClick={() => setMemberFilter('pawn')}
              className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                memberFilter === 'pawn'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Gadai Aktif ({members.filter((m) => m.activePawnCount > 0).length})
            </button>
            <button
              onClick={() => setMemberFilter('credit')}
              className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                memberFilter === 'credit'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Kredit Aktif ({members.filter((m) => m.activeCreditCount > 0).length})
            </button>
          </div>

          {/* Members Table */}
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
                  <th className="px-4 py-3 text-right">Aksi Loket Kasir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Tidak ada nasabah yang sesuai dengan pencarian atau filter.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-emerald-800">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                          {m.memberNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 text-sm">{m.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">NIK: {m.nik}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <button
                            onClick={() => handleOpenWhatsAppChat(m.phone, m.fullName, m.memberNumber)}
                            className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                            title="Kirim pesan WhatsApp"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            {m.phone}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{m.occupation} • {m.address}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          Aktif
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-800 text-sm">
                        {formatRupiah(m.totalSavings)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px]">
                          {m.activePawnCount} Rahn / {m.activeCreditCount} Mrb
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Primary Action: Open Transaction Loket Modal */}
                          <button
                            onClick={() => handleOpenTransaction(m, 'setoran')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                            title="Buka Transaksi Kasir"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            Transaksi
                          </button>

                          {/* Secondary Action: Passbook & Mutation Ledger */}
                          <button
                            onClick={() => setSelectedMemberForPassbook(m)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            title="Buka Buku Rekening & Mutasi"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </button>

                          {/* Tertiary Action: Edit Member Data */}
                          <button
                            onClick={() => openEditMemberTeller(m)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            title="Edit Profil & Kontak Nasabah"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT TRANSAKSI KASIR */}
      {activeMainTab === 'today_transactions' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Audit & Rekapitulasi Transaksi Kasir</h2>
              <p className="text-xs text-slate-500">
                Pencarian dan audit mutasi transaksi kasir berdasarkan nama nasabah, tanggal, bulan, dan tahun.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const headers = ['No Ref', 'Waktu', 'No Anggota', 'Nama Nasabah', 'Jenis Transaksi', 'Akad', 'Metode', 'Nominal', 'Teller', 'Catatan'];
                  const rows = filteredAuditTransactions.map((t) => [
                    t.referenceNumber,
                    t.createdAt,
                    t.memberNumber,
                    `"${t.memberName.replace(/"/g, '""')}"`,
                    t.type,
                    t.akad || '-',
                    t.paymentMethod,
                    t.amount,
                    t.tellerName || '-',
                    `"${(t.notes || '').replace(/"/g, '""')}"`
                  ]);
                  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute('download', `Audit_Transaksi_Kasir_${auditDateMode}_${new Date().toISOString().slice(0, 10)}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer border border-slate-200"
                title="Ekspor data audit ke format file Excel / CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                Ekspor CSV
              </button>
            </div>
          </div>

          {/* Filter Bar: Cari Berdasarkan Nama, Tanggal, Bulan, Tahun, dan Jenis */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* 1. Cari Nama Nasabah / No Anggota / Ref */}
              <div className="md:col-span-4 relative">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Cari Nama / No. Anggota / Ref:
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={auditSearchName}
                    onChange={(e) => setAuditSearchName(e.target.value)}
                    placeholder="Ketik nama, no anggota (AG0001), ref..."
                    className="w-full pl-9 pr-8 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  {auditSearchName && (
                    <button
                      type="button"
                      onClick={() => setAuditSearchName('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Pilihan Mode Periode (Hari Ini / Per Tanggal / Per Bulan-Tahun / Semua) */}
              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Periode Transaksi:
                </label>
                <select
                  value={auditDateMode}
                  onChange={(e) => setAuditDateMode(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer"
                >
                  <option value="today">📅 Hari Ini ({todayStr})</option>
                  <option value="date">📆 Pilih Tanggal Tertentu</option>
                  <option value="month_year">📊 Pilih Bulan & Tahun</option>
                  <option value="all">🌐 Semua Riwayat Transaksi</option>
                </select>
              </div>

              {/* 3. Input Dinamis: Tanggal vs Bulan & Tahun */}
              <div className="md:col-span-3">
                {auditDateMode === 'date' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Pilih Tanggal:
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        type="date"
                        value={auditSpecificDate}
                        onChange={(e) => setAuditSpecificDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      />
                    </div>
                  </div>
                )}

                {auditDateMode === 'month_year' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Bulan:
                      </label>
                      <select
                        value={auditMonth}
                        onChange={(e) => setAuditMonth(e.target.value)}
                        className="w-full px-2 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer"
                      >
                        <option value="all">Semua Bulan</option>
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
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Tahun:
                      </label>
                      <select
                        value={auditYear}
                        onChange={(e) => setAuditYear(e.target.value)}
                        className="w-full px-2 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer"
                      >
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                        <option value="2028">2028</option>
                      </select>
                    </div>
                  </div>
                )}

                {auditDateMode === 'today' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Status Tanggal:
                    </label>
                    <div className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100/70 border border-emerald-300 rounded-xl">
                      Hari Ini: {formatDateIndo(todayStr)}
                    </div>
                  </div>
                )}

                {auditDateMode === 'all' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Status Tanggal:
                    </label>
                    <div className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl">
                      Semua Waktu Transaksi
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Filter Jenis Transaksi */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Jenis Transaksi:
                </label>
                <select
                  value={auditTypeFilter}
                  onChange={(e) => setAuditTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer"
                >
                  <option value="all">Semua Jenis</option>
                  <option value="setoran">Setoran Simpanan</option>
                  <option value="penarikan">Penarikan Simpanan</option>
                  <option value="gadai_pencairan">Pencairan Gadai</option>
                  <option value="gadai_tebus">Tebus Gadai</option>
                  <option value="gadai_ujrah">Bayar Ujrah Gadai</option>
                  <option value="kredit_pencairan">Pencairan Murabahah</option>
                  <option value="kredit_angsuran">Bayar Angsuran</option>
                </select>
              </div>
            </div>

            {/* Active Filters Reset Indicator */}
            {(auditSearchName || auditDateMode !== 'today' || auditTypeFilter !== 'all') && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
                <span className="text-slate-500">
                  Filter aktif: Menampilkan <strong>{filteredAuditTransactions.length}</strong> dari {transactions.length} transaksi.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuditSearchName('');
                    setAuditDateMode('today');
                    setAuditSpecificDate(todayStr);
                    setAuditMonth(String(new Date().getMonth() + 1).padStart(2, '0'));
                    setAuditYear(String(new Date().getFullYear()));
                    setAuditTypeFilter('all');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Filter
                </button>
              </div>
            )}
          </div>

          {/* Ringkasan Arus Kas Audit Transaksi */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Transaksi</span>
              <span className="text-lg font-bold text-slate-900 font-mono">
                {filteredAuditTransactions.length} <span className="text-xs font-normal text-slate-500">transaksi</span>
              </span>
            </div>
            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Total Kas Masuk</span>
              <span className="text-lg font-bold text-emerald-700 font-mono">
                {formatRupiah(auditKasMasuk)}
              </span>
            </div>
            <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">Total Kas Keluar</span>
              <span className="text-lg font-bold text-rose-700 font-mono">
                {formatRupiah(auditKasKeluar)}
              </span>
            </div>
            <div className={`p-3.5 rounded-xl border ${
              auditNetCash >= 0 ? 'bg-teal-50/70 border-teal-200' : 'bg-amber-50/70 border-amber-200'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">Arus Kas Bersih (Net)</span>
              <span className={`text-lg font-bold font-mono ${auditNetCash >= 0 ? 'text-teal-800' : 'text-amber-800'}`}>
                {formatRupiah(auditNetCash)}
              </span>
            </div>
          </div>

          {/* Tabel Mutasi Audit Transaksi Kasir */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">No. Referensi</th>
                  <th className="px-4 py-3">Tanggal & Waktu</th>
                  <th className="px-4 py-3">Nasabah</th>
                  <th className="px-4 py-3">Jenis Transaksi</th>
                  <th className="px-4 py-3">Metode & Kasir</th>
                  <th className="px-4 py-3 text-right">Nominal</th>
                  <th className="px-4 py-3 text-right">Cetak Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAuditTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400 space-y-2">
                      <div className="text-slate-300 font-bold text-sm">Tidak Ada Transaksi Ditemukan</div>
                      <p className="text-xs">Silakan sesuaikan kata kunci nama nasabah atau ubah pilihan tanggal, bulan, dan tahun.</p>
                    </td>
                  </tr>
                ) : (
                  filteredAuditTransactions.map((t) => {
                    const isIncome = ['setoran', 'kredit_angsuran', 'gadai_tebus', 'gadai_ujrah'].includes(t.type);
                    const memberData = members.find((m) => m.memberNumber === t.memberNumber);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-slate-800 block">{t.referenceNumber}</span>
                          {t.notes && <span className="text-[10px] text-slate-400 line-clamp-1">{t.notes}</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-slate-700">{formatDateIndo(t.createdAt.split('T')[0])}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {new Date(t.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{t.memberName}</div>
                          <div className="text-[10px] text-emerald-800 font-mono font-semibold">{t.memberNumber}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isIncome
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {t.type.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          {t.akad && (
                            <span className="block text-[9px] text-slate-500 uppercase mt-0.5 font-medium">
                              Akad: {t.akad}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="uppercase text-slate-700 font-semibold block">{t.paymentMethod}</span>
                          <span className="text-[10px] text-slate-400">Kasir: {t.tellerName || currentUser.name}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-mono font-bold text-sm ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {isIncome ? '+' : '-'}{formatRupiah(t.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => generateReceiptPdf(t, memberData || null)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                              title="Cetak dan Unduh Dokumen PDF Resmi"
                            >
                              <FileDown className="w-3 h-3" />
                              Cetak PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => handleViewReceiptFromHistory(t)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-[11px] transition-colors cursor-pointer border border-slate-300"
                              title="Lihat Struk Thermal, Voucher, atau Kirim WA"
                            >
                              <Printer className="w-3 h-3 text-slate-500" />
                              Struk / WA
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

      {/* TAB 3: PROFIL TELLER & GANTI PASSWORD */}
      {activeMainTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1: Info Akun Teller */}
          <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-800 to-teal-700 text-white flex items-center justify-center font-bold text-xl shadow-md">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">{currentUser.name}</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mt-1">
                  <ShieldCheck className="w-3 h-3" />
                  Teller Layanan Kasir
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Email Akun:</span>
                <span className="font-semibold text-slate-800">{currentUser.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Nomor WhatsApp:</span>
                <span className="font-mono font-semibold text-slate-800">{currentUser.phone}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">ID Petugas:</span>
                <span className="font-mono font-semibold text-slate-800">{currentUser.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Hak Akses:</span>
                <span className="font-semibold text-emerald-800">Setoran, Tarik, Gadai, Angsuran & Cetak Bukti</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Status Loket:</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Aktif Bertugas
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 leading-relaxed">
              🔐 Demi keamanan operasional transaksi kasir, pastikan Anda mengganti kata sandi secara berkala dan tidak membagikan akses kepada pihak lain.
            </div>
          </div>

          {/* Card 2: Form Ganti Password Teller */}
          <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-base text-slate-900">Ubah Kata Sandi Teller</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbarui kata sandi untuk login ke loket teller SIMPANANKU.
              </p>
            </div>

            {tellerPassSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{tellerPassSuccess}</span>
              </div>
            )}

            {tellerPassError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{tellerPassError}</span>
              </div>
            )}

            <form onSubmit={handleChangeTellerPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password Saat Ini:
                </label>
                <div className="relative">
                  <input
                    type={showTellerPassword ? 'text' : 'password'}
                    value={tellerCurrentPassword}
                    onChange={(e) => setTellerCurrentPassword(e.target.value)}
                    placeholder="Masukkan password saat ini (demo: teller123)"
                    className="w-full pl-3 pr-10 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTellerPassword(!showTellerPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showTellerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password Baru:
                </label>
                <div className="relative">
                  <input
                    type={showTellerPassword ? 'text' : 'password'}
                    required
                    value={tellerNewPassword}
                    onChange={(e) => setTellerNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full pl-3 pr-10 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Kombinasi huruf dan angka disarankan untuk keamanan kasir.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Konfirmasi Password Baru:
                </label>
                <div className="relative">
                  <input
                    type={showTellerPassword ? 'text' : 'password'}
                    required
                    value={tellerConfirmPassword}
                    onChange={(e) => setTellerConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full pl-3 pr-10 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  Simpan Password Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: LOKET TRANSAKSI NASABAH (SETORAN, PENARIKAN, GADAI, KREDIT, DLL) */}
      {/* ========================================================================= */}
      {selectedMemberForTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header with Member Profile */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-800/80 border border-emerald-600 flex items-center justify-center font-bold text-base text-emerald-200">
                  {selectedMemberForTx.fullName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-800 text-emerald-200 border border-emerald-700">
                      {selectedMemberForTx.memberNumber}
                    </span>
                    <h3 className="font-bold text-base text-white">{selectedMemberForTx.fullName}</h3>
                  </div>
                  <p className="text-[11px] text-emerald-200/80">
                    NIK: {selectedMemberForTx.nik} • Saldo: {formatRupiah(selectedMemberForTx.totalSavings)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMemberForTx(null)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub Tabs in Transaction Modal */}
            <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto text-xs font-bold">
              <button
                onClick={() => { setTxModalTab('setoran'); setErrorMessage(null); }}
                className={`px-4 py-2.5 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  txModalTab === 'setoran'
                    ? 'border-emerald-700 text-emerald-800 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                Setoran Tabungan
              </button>
              <button
                onClick={() => { setTxModalTab('penarikan'); setErrorMessage(null); }}
                className={`px-4 py-2.5 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  txModalTab === 'penarikan'
                    ? 'border-rose-600 text-rose-800 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                Penarikan Saldo
              </button>
              <button
                onClick={() => { setTxModalTab('gadai'); setErrorMessage(null); }}
                className={`px-4 py-2.5 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  txModalTab === 'gadai'
                    ? 'border-amber-600 text-amber-800 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                Gadai (Rahn)
              </button>
              <button
                onClick={() => { setTxModalTab('kredit'); setErrorMessage(null); }}
                className={`px-4 py-2.5 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  txModalTab === 'kredit'
                    ? 'border-teal-600 text-teal-800 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-teal-600" />
                Kredit (Murabahah)
              </button>
              <button
                onClick={() => { setTxModalTab('angsuran'); setErrorMessage(null); }}
                className={`px-4 py-2.5 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  txModalTab === 'angsuran'
                    ? 'border-sky-600 text-sky-800 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-sky-600" />
                Bayar Angsuran
              </button>
              <button
                onClick={() => { setTxModalTab('tebus_gadai'); setErrorMessage(null); }}
                className={`px-4 py-2.5 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  txModalTab === 'tebus_gadai'
                    ? 'border-amber-700 text-amber-900 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                Tebus / Ujrah Gadai
              </button>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="m-6 mb-0 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form Content per Tab */}
            <div className="p-6">
              {/* TAB 1: SETORAN */}
              {txModalTab === 'setoran' && (
                <form onSubmit={handleProcessDeposit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pilih Produk Simpanan Syariah:
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                    >
                      {products.map((p) => {
                        const existingAcc = accounts.find(
                          (a) => a.memberNumber === selectedMemberForTx.memberNumber && a.productId === p.id
                        );
                        return (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.akad.toUpperCase()}) — Saldo: {formatRupiah(existingAcc?.balance || 0)}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nominal Setoran (Rp):
                    </label>
                    <input
                      type="number"
                      step={10000}
                      value={txAmount}
                      onChange={(e) => setTxAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-bold text-emerald-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      required
                    />
                    <div className="flex gap-2 mt-2">
                      {[50000, 100000, 250000, 500000, 1000000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setTxAmount(preset)}
                          className="px-2 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 rounded-lg transition-colors cursor-pointer"
                        >
                          +{formatRupiah(preset)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Metode Penyerahan:
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as 'tunai' | 'transfer')}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                      >
                        <option value="tunai">Tunai di Loket Teller</option>
                        <option value="transfer">Transfer Rekening Bank</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Berita / Catatan:
                      </label>
                      <input
                        type="text"
                        value={txNotes}
                        onChange={(e) => setTxNotes(e.target.value)}
                        placeholder="Setoran berkala tabungan..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedMemberForTx(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Receipt className="w-4 h-4" />
                      Proses Setoran & Cetak Struk
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: PENARIKAN */}
              {txModalTab === 'penarikan' && (
                <form onSubmit={handleProcessWithdraw} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pilih Rekening yang Ditarik:
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                    >
                      {products.map((p) => {
                        const existingAcc = accounts.find(
                          (a) => a.memberNumber === selectedMemberForTx.memberNumber && a.productId === p.id
                        );
                        return (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.akad.toUpperCase()}) — Saldo Tersedia: {formatRupiah(existingAcc?.balance || 0)}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nominal Penarikan (Rp):
                    </label>
                    <input
                      type="number"
                      step={10000}
                      value={txAmount}
                      onChange={(e) => setTxAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-bold text-rose-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      required
                    />
                    <div className="flex gap-2 mt-2">
                      {[50000, 100000, 200000, 500000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setTxAmount(preset)}
                          className="px-2 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800 rounded-lg transition-colors cursor-pointer"
                        >
                          +{formatRupiah(preset)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Berita / Keterangan Penarikan:
                    </label>
                    <input
                      type="text"
                      value={txNotes}
                      onChange={(e) => setTxNotes(e.target.value)}
                      placeholder="Penarikan tunai keperluan mendesak..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedMemberForTx(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Receipt className="w-4 h-4" />
                      Proses Penarikan Tunai
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: GADAI RAHN */}
              {txModalTab === 'gadai' && (
                <form onSubmit={handleProcessPawn} className="space-y-4">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                    <span className="font-bold block">Prinsip Gadai Syariah (Akad Rahn & Ijarah)</span>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Lembaga tidak mengenakan bunga pinjaman. Biaya hanya berupa sewa tempat penyimpanan & pemeliharaan barang jaminan (*Marhun*), dihitung transparan dari nilai taksiran barang.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Jenis Barang Jaminan (Marhun):
                      </label>
                      <select
                        value={pawnItemType}
                        onChange={(e) => setPawnItemType(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                      >
                        <option value="emas_batangan">Logam Mulia / Emas Antam</option>
                        <option value="perhiasan">Perhiasan Emas / Berlian</option>
                        <option value="bpkb_motor">BPKB Sepeda Motor / Mobil</option>
                        <option value="elektronik">Laptop / Smartphone / Gadget</option>
                        <option value="lainnya">Barang Berharga Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Jangka Waktu Akad (Bulan):
                      </label>
                      <select
                        value={pawnPeriodMonths}
                        onChange={(e) => setPawnPeriodMonths(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                      >
                        <option value={1}>1 Bulan</option>
                        <option value={2}>2 Bulan</option>
                        <option value={3}>3 Bulan</option>
                        <option value={4}>4 Bulan (Standar Syariah)</option>
                        <option value={6}>6 Bulan</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Deskripsi & Spesifikasi Barang:
                    </label>
                    <input
                      type="text"
                      value={pawnDesc}
                      onChange={(e) => setPawnDesc(e.target.value)}
                      placeholder="Contoh: Emas Antam 10 Gram bersertifikat resmi CertiEye..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Nilai Taksiran Pasar (Rp):
                        </label>
                        <button
                          type="button"
                          onClick={handleAiEstimate}
                          disabled={isEstimatingAi || !pawnDesc}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded border border-emerald-300 transition-colors cursor-pointer disabled:opacity-50"
                          title="Taksir nilai pasar marhun otomatis via AI Syariah Backend Laravel 13"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-700" />
                          <span>{isEstimatingAi ? 'Menaksir...' : 'AI Taksir'}</span>
                        </button>
                      </div>
                      <input
                        type="number"
                        step={100000}
                        value={pawnEstimatedValue}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPawnEstimatedValue(val);
                          if (pawnLoanAmount > val * 0.85) {
                            setPawnLoanAmount(Math.round(val * 0.8));
                          }
                        }}
                        className="w-full px-3 py-2 text-xs font-bold text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nilai Pinjaman Dicairkan (Maks 85%):
                      </label>
                      <input
                        type="number"
                        step={100000}
                        value={pawnLoanAmount}
                        onChange={(e) => setPawnLoanAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-bold text-amber-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  {/* Ujrah Calculation & Selection (Dapat diisi mulai dari Rp 0 /bulan) */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800">
                        Estimasi Biaya Sewa Simpan (Ujrah Bulanan):
                      </label>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        Bisa diisi mulai Rp 0 /bulan
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          value={pawnMonthlyUjrah}
                          onChange={(e) => setPawnMonthlyUjrah(Math.max(0, Number(e.target.value)))}
                          className="w-full pl-9 pr-18 py-2 text-xs font-bold text-emerald-950 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                          placeholder="0"
                          required
                        />
                        <span className="absolute right-3 top-2.5 text-[11px] font-medium text-slate-400">/ bln</span>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-right">
                        <span className="text-slate-400 block text-[10px]">Pinjaman Dibawa Pulang:</span>
                        <span className="font-bold text-sm text-emerald-800 font-mono">
                          {formatRupiah(pawnLoanAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Pilihan Cepat Mulai dari Rp 0 */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-200/80">
                      <span className="text-[10px] font-semibold text-slate-500 block">Pilihan Cepat Biaya Sewa:</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPawnMonthlyUjrah(0)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer border ${
                            pawnMonthlyUjrah === 0
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                              : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                          }`}
                        >
                          Rp 0 /bln (Gratis / Qardhul Hasan)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPawnMonthlyUjrah(Math.round(pawnEstimatedValue * 0.005))}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer border ${
                            pawnMonthlyUjrah === Math.round(pawnEstimatedValue * 0.005) && pawnMonthlyUjrah !== 0
                              ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Tarif Ringan 0.5% ({formatRupiah(Math.round(pawnEstimatedValue * 0.005))}/bln)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPawnMonthlyUjrah(Math.round(pawnEstimatedValue * 0.0095))}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer border ${
                            pawnMonthlyUjrah === Math.round(pawnEstimatedValue * 0.0095) && pawnMonthlyUjrah !== 0
                              ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Standar 0.95% ({formatRupiah(Math.round(pawnEstimatedValue * 0.0095))}/bln)
                        </button>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-600">
                      {pawnMonthlyUjrah === 0 ? (
                        <span className="text-emerald-700 font-semibold">
                          ✓ Bebas Ujrah: Nasabah tidak dibebankan biaya simpan bulanan (Rp 0 / Qardhul Hasan murni).
                        </span>
                      ) : (
                        <span>
                          ✓ Biaya simpan disepakati: <strong className="font-mono text-slate-800">{formatRupiah(pawnMonthlyUjrah)}/bulan</strong> untuk keamanan brankas & asuransi titipan.
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedMemberForTx(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Coins className="w-4 h-4" />
                      Cairkan Gadai & Cetak Akad Rahn
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 4: KREDIT MURABAHAH */}
              {txModalTab === 'kredit' && (
                <form onSubmit={handleProcessCredit} className="space-y-4">
                  <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-xs text-teal-950">
                    <span className="font-bold block">Prinsip Kredit Barang Syariah (Akad Murabahah)</span>
                    <p className="text-[11px] text-teal-800 mt-0.5">
                      Lembaga membeli barang yang dipesan nasabah, lalu menjualnya kembali dengan harga beli modal + margin keuntungan yang disepakati bersama. Cicilan tetap dan bebas bunga riba.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kategori Komoditas Barang:
                      </label>
                      <select
                        value={creditCategory}
                        onChange={(e) => setCreditCategory(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                      >
                        <option value="smartphone">Smartphone / Laptop / Gadget</option>
                        <option value="kendaraan">Sepeda Motor / Kendaraan</option>
                        <option value="elektronik_rumah">Elektronik Rumah Tangga (Kulkas/TV/AC)</option>
                        <option value="alat_usaha">Peralatan & Mesin Usaha Produktif</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Jangka Waktu Tenor (Bulan):
                      </label>
                      <select
                        value={creditTenor}
                        onChange={(e) => setCreditTenor(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                      >
                        <option value={3}>3 Bulan</option>
                        <option value={6}>6 Bulan</option>
                        <option value={12}>12 Bulan (1 Tahun)</option>
                        <option value={18}>18 Bulan</option>
                        <option value={24}>24 Bulan (2 Tahun)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama & Spesifikasi Barang Pesanan:
                    </label>
                    <input
                      type="text"
                      value={creditItemName}
                      onChange={(e) => setCreditItemName(e.target.value)}
                      placeholder="Contoh: Laptop Asus Vivobook 15 RAM 16GB SSD 512GB..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Harga Modal Beli (Rp):
                      </label>
                      <input
                        type="number"
                        step={100000}
                        value={creditCost}
                        onChange={(e) => setCreditCost(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-bold text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Margin Keuntungan (Rp):
                      </label>
                      <input
                        type="number"
                        step={50000}
                        value={creditMargin}
                        onChange={(e) => setCreditMargin(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-bold text-teal-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Uang Muka / DP (Rp):
                      </label>
                      <input
                        type="number"
                        step={100000}
                        value={creditDownPayment}
                        onChange={(e) => setCreditDownPayment(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-bold text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  {/* Installment Simulation Box */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Harga Jual Lembaga:</span>
                      <span className="font-bold text-slate-900">{formatRupiah(creditCost + creditMargin)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Sisa Piutang Pokok:</span>
                      <span className="font-bold text-slate-900">{formatRupiah(creditCost + creditMargin - creditDownPayment)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Angsuran per Bulan:</span>
                      <span className="font-bold text-emerald-800 text-sm">
                        {formatRupiah(Math.round((creditCost + creditMargin - creditDownPayment) / creditTenor))}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedMemberForTx(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Akad Murabahah & Cairkan Pembiayaan
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 5: BAYAR ANGSURAN */}
              {txModalTab === 'angsuran' && (
                <form onSubmit={handleProcessPayInstallment} className="space-y-4">
                  {credits.filter((c) => c.memberNumber === selectedMemberForTx.memberNumber && c.status === 'berjalan').length === 0 ? (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                      <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600 text-xs">
                        Nasabah {selectedMemberForTx.fullName} tidak memiliki kontrak kredit barang aktif saat ini.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Pilih Kontrak Kredit Berjalan:
                        </label>
                        <select
                          value={selectedCreditId}
                          onChange={(e) => {
                            setSelectedCreditId(e.target.value);
                            const found = credits.find((c) => c.id === e.target.value);
                            const unpaid = found?.installments.find((i) => i.status === 'belum_bayar');
                            if (unpaid) setSelectedInstallmentNo(unpaid.installmentNo);
                          }}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                        >
                          {credits
                            .filter((c) => c.memberNumber === selectedMemberForTx.memberNumber && c.status === 'berjalan')
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.contractNumber} — {c.itemName} (Sisa: {formatRupiah(c.remainingBalance)})
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Installments List for the selected credit */}
                      {(() => {
                        const targetCredit = credits.find((c) => c.id === selectedCreditId);
                        if (!targetCredit) return null;

                        return (
                          <div className="space-y-3">
                            <span className="text-xs font-bold text-slate-700 block">
                              Pilih Bulan Tagihan Angsuran:
                            </span>

                            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 border border-slate-200 rounded-xl p-2 bg-slate-50">
                              {targetCredit.installments.map((inst) => (
                                <div
                                  key={inst.id}
                                  onClick={() => {
                                    if (inst.status !== 'lunas') {
                                      setSelectedInstallmentNo(inst.installmentNo);
                                    }
                                  }}
                                  className={`p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                                    inst.status === 'lunas'
                                      ? 'opacity-60 bg-white'
                                      : selectedInstallmentNo === inst.installmentNo
                                      ? 'bg-emerald-100 border border-emerald-300 font-semibold cursor-pointer'
                                      : 'hover:bg-white bg-white/70 cursor-pointer'
                                  }`}
                                >
                                  <div>
                                    <span className="font-bold">Angsuran ke-{inst.installmentNo}</span>
                                    <div className="text-[10px] text-slate-400">
                                      Jatuh Tempo: {formatDateIndo(inst.dueDate)}
                                    </div>
                                  </div>

                                  <div className="text-right flex items-center gap-2">
                                    <span className="font-bold text-slate-900">{formatRupiah(inst.amount)}</span>
                                    {inst.status === 'lunas' ? (
                                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                        LUNAS
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                        BELUM BAYAR
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => setSelectedMemberForTx(null)}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                              >
                                Batal
                              </button>
                              <button
                                type="submit"
                                className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <CreditCard className="w-4 h-4" />
                                Terima Pembayaran Angsuran
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </form>
              )}

              {/* TAB 6: TEBUS & BAYAR UJRAH GADAI RAHN */}
              {txModalTab === 'tebus_gadai' && (
                <div className="space-y-4">
                  {pawns.filter((p) => p.memberNumber === selectedMemberForTx.memberNumber && p.status === 'aktif').length === 0 ? (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                      <Coins className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600 text-xs">
                        Nasabah {selectedMemberForTx.fullName} tidak memiliki akad gadai (Rahn) yang aktif saat ini.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                        <span className="font-bold block">Penebusan Barang Jaminan & Pembayaran Ujrah</span>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Nasabah dapat membayar biaya titip/pemeliharaan bulanan (Ujrah) untuk memperpanjang masa simpan, atau melakukan pelunasan pokok (Marhun Bih) untuk menebus dan mengambil kembali barang jaminan.
                        </p>
                      </div>

                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {pawns
                          .filter((p) => p.memberNumber === selectedMemberForTx.memberNumber && p.status === 'aktif')
                          .map((p) => (
                            <div key={p.id} className="p-3.5 bg-white rounded-xl border border-amber-200 shadow-2xs space-y-2.5">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-mono font-bold text-amber-900 text-xs">{p.pawnCode}</span>
                                  <h4 className="font-bold text-slate-900 text-xs mt-0.5">{p.itemDescription}</h4>
                                  <p className="text-[10px] text-slate-400 uppercase">{p.itemType.replace('_', ' ')} • Jatuh Tempo: {formatDateIndo(p.dueDate)}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-500 block">Pinjaman (Marhun Bih):</span>
                                  <span className="font-mono font-black text-slate-900 text-sm">{formatRupiah(p.loanAmount)}</span>
                                  <span className="text-[10px] text-amber-800 font-bold block mt-0.5">Ujrah: {formatRupiah(p.monthlyUjrah)}/bln</span>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-100 flex flex-wrap justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleProcessPawnUjrah(p)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                                  title="Bayar biaya sewa tempat / pemeliharaan bulanan"
                                >
                                  <Coins className="w-3.5 h-3.5 text-amber-700" />
                                  Bayar Ujrah ({formatRupiah(p.monthlyUjrah)})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleProcessPawnRedeem(p)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                                  title="Tebus lunas dan serahkan kembali barang jaminan"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Tebus & Ambil Barang ({formatRupiah(p.loanAmount)})
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BUKU REKENING & MUTASI NASABAH (PASSBOOK LEDGER) */}
      {/* ========================================================================= */}
      {selectedMemberForPassbook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400">Buku Tabungan & Mutasi</span>
                <h3 className="font-bold text-base text-white">
                  {selectedMemberForPassbook.fullName} ({selectedMemberForPassbook.memberNumber})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-teller-cetak-pdf-header"
                  onClick={() => {
                    generatePassbookPdf(
                      selectedMemberForPassbook,
                      accounts,
                      transactions,
                      currentUser?.name || 'Teller Syariah'
                    );
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  title="Unduh dan Cetak PDF Buku Tabungan"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Cetak PDF</span>
                </button>
                <button
                  onClick={() => setSelectedMemberForPassbook(null)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Kop Lembaga */}
              <div className="pb-3 border-b border-slate-200 text-center sm:text-left flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white p-0.5 border border-slate-200 overflow-hidden flex items-center justify-center shadow-xs shrink-0">
                  <img 
                    src={simpanankuLogo} 
                    alt="Logo SIMPANANKU" 
                    className="w-full h-full object-cover rounded-lg" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 tracking-tight">SIMPANANKU</h3>
                  <p className="text-xs text-slate-600 font-medium">
                    Simpanan Tabungan • Gadai Syariah (Rahn) • Kredit Barang (Murabahah)
                  </p>
                </div>
              </div>
              {/* Account Balances Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Buku Simpanan Terdaftar:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {accounts
                    .filter((a) => a.memberNumber === selectedMemberForPassbook.memberNumber)
                    .map((acc) => (
                      <div key={acc.id} className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                        <div className="text-xs font-bold text-emerald-950">{acc.productName}</div>
                        <div className="text-[10px] text-emerald-700 uppercase font-mono">Akad {acc.akad}</div>
                        <div className="text-lg font-black text-emerald-900 mt-1">
                          {formatRupiah(acc.balance)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Transactions Ledger Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase text-slate-400">Mutasi Rekening:</h4>
                  <button
                    id="btn-teller-cetak-pdf-table"
                    onClick={() => {
                      generatePassbookPdf(
                        selectedMemberForPassbook,
                        accounts,
                        transactions,
                        currentUser?.name || 'Teller Syariah'
                      );
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Cetak PDF
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Tanggal</th>
                        <th className="px-3 py-2">Referensi</th>
                        <th className="px-3 py-2">Keterangan</th>
                        <th className="px-3 py-2 text-right">Debit / Kredit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.filter((t) => t.memberNumber === selectedMemberForPassbook.memberNumber).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                            Belum ada riwayat transaksi.
                          </td>
                        </tr>
                      ) : (
                        transactions
                          .filter((t) => t.memberNumber === selectedMemberForPassbook.memberNumber)
                          .map((t) => {
                            const isIncoming = ['setoran', 'kredit_angsuran', 'gadai_tebus'].includes(t.type);
                            return (
                              <tr key={t.id} className="hover:bg-slate-50">
                                <td className="px-3 py-2 text-slate-500 font-mono text-[11px]">
                                  {new Date(t.createdAt).toLocaleDateString('id-ID')}
                                </td>
                                <td className="px-3 py-2 font-mono text-[11px] text-slate-700 font-medium">
                                  {t.referenceNumber}
                                </td>
                                <td className="px-3 py-2">
                                  <div className="font-semibold text-slate-900">{t.notes}</div>
                                  <div className="text-[10px] text-slate-400">{t.type.replace('_', ' ')}</div>
                                </td>
                                <td className="px-3 py-2 text-right font-bold font-mono">
                                  {isIncoming ? (
                                    <span className="text-emerald-700">+{formatRupiah(t.amount)}</span>
                                  ) : (
                                    <span className="text-rose-700">-{formatRupiah(t.amount)}</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                id="btn-teller-cetak-pdf-footer"
                onClick={() => {
                  generatePassbookPdf(
                    selectedMemberForPassbook,
                    accounts,
                    transactions,
                    currentUser?.name || 'Teller Syariah'
                  );
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Cetak PDF</span>
              </button>
              <button
                onClick={() => setSelectedMemberForPassbook(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TAMBAH NASABAH BARU LANGSUNG DARI LOKET TELLER */}
      {/* ========================================================================= */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Tambah Nasabah Baru</h3>
                <p className="text-[11px] text-emerald-200">
                  Auto-generasi Nomor Anggota {generateMemberNumber(members.length)}
                </p>
              </div>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap (Sesuai KTP):
                </label>
                <input
                  type="text"
                  value={newMemFullName}
                  onChange={(e) => setNewMemFullName(e.target.value)}
                  placeholder="Contoh: Muhammad Rahmat Hidayat"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Induk Kependudukan (NIK 16 Digit):
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={newMemNik}
                  onChange={(e) => setNewMemNik(e.target.value)}
                  placeholder="3273xxxxxxxxxxxx"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. WhatsApp / HP:
                  </label>
                  <input
                    type="tel"
                    value={newMemPhone}
                    onChange={(e) => setNewMemPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pekerjaan / Usaha:
                  </label>
                  <input
                    type="text"
                    value={newMemOccupation}
                    onChange={(e) => setNewMemOccupation(e.target.value)}
                    placeholder="Pedagang / Karyawan"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password Akun Nasabah:
                </label>
                <div className="relative">
                  <input
                    type={showNewMemPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newMemPassword}
                    onChange={(e) => setNewMemPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full pl-3 pr-10 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewMemPassword(!showNewMemPassword)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewMemPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Password awal nasabah untuk login mandiri ke portal SIMPANANKU.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Domisili Lengkap:
                </label>
                <textarea
                  rows={2}
                  value={newMemAddress}
                  onChange={(e) => setNewMemAddress(e.target.value)}
                  placeholder="Jl. Sukajadi No. 12, Bandung..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Daftarkan & Buka Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: EDIT PROFIL / KONTAK NASABAH DARI LOKET TELLER */}
      {/* ========================================================================= */}
      {editingMemberForTeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Edit Data & Kontak Nasabah</h3>
                <p className="text-[11px] text-emerald-400 font-mono">
                  {editingMemberForTeller.memberNumber} • {editingMemberForTeller.fullName}
                </p>
              </div>
              <button
                onClick={() => setEditingMemberForTeller(null)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMemberTeller} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap (Sesuai KTP):
                </label>
                <input
                  type="text"
                  value={tellerEditName}
                  onChange={(e) => setTellerEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Induk Kependudukan (NIK):
                </label>
                <input
                  type="text"
                  value={tellerEditNik}
                  onChange={(e) => setTellerEditNik(e.target.value)}
                  maxLength={16}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. WhatsApp / HP:
                  </label>
                  <input
                    type="tel"
                    value={tellerEditPhone}
                    onChange={(e) => setTellerEditPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pekerjaan / Usaha:
                  </label>
                  <input
                    type="text"
                    value={tellerEditOccupation}
                    onChange={(e) => setTellerEditOccupation(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Domisili Lengkap:
                </label>
                <textarea
                  rows={2}
                  value={tellerEditAddress}
                  onChange={(e) => setTellerEditAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Keterangan Khusus:
                </label>
                <input
                  type="text"
                  value={tellerEditNotes}
                  onChange={(e) => setTellerEditNotes(e.target.value)}
                  placeholder="Catatan verifikasi, kontak darurat, dll."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingMemberForTeller(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* THERMAL RECEIPT MODAL (58mm/80mm PRINT & WHATSAPP SHARE) */}
      {/* ========================================================================= */}
      {activeReceiptTx && (
        <ReceiptModal
          transaction={activeReceiptTx}
          member={activeReceiptMember || undefined}
          onClose={() => {
            setActiveReceiptTx(null);
            setActiveReceiptMember(null);
          }}
        />
      )}
    </div>
    </div>
  );
};
