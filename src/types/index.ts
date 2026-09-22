export type UserRole = 'admin' | 'teller' | 'nasabah';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone: string;
  password?: string;
  memberId?: string; // e.g. AG0001 if role === 'nasabah'
  createdAt: string;
}

export type MemberStatus = 'aktif' | 'nonaktif' | 'dibekukan';

export interface Member {
  id: string;
  memberNumber: string; // AG0001, AG0002...
  nik: string;
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  address: string;
  occupation: string;
  status?: MemberStatus;
  joinDate: string;
  totalSavings: number;
  activePawnCount: number;
  activeCreditCount: number;
  notes?: string;
}

export type ShariaAkad = 'wadiah' | 'mudharabah' | 'rahn' | 'murabahah' | 'ijarah' | 'qardh';

export interface SavingsProduct {
  id: string;
  code: string;
  name: string;
  akad: 'wadiah' | 'mudharabah';
  description: string;
  minInitialDeposit: number;
  minBalance: number;
  adminFee: number; // usually 0 for sharia
  profitSharingRatio?: string; // e.g. "80:20" for mudharabah
  isActive: boolean;
}

export interface SavingsAccount {
  id: string;
  memberNumber: string; // AG0001
  productId: string;
  productName: string;
  akad: 'wadiah' | 'mudharabah';
  balance: number;
  openedAt: string;
  status: 'active' | 'frozen' | 'closed';
}

export type TransactionType = 
  | 'setoran' 
  | 'penarikan' 
  | 'gadai_pencairan' 
  | 'gadai_tebus' 
  | 'gadai_ujrah' 
  | 'kredit_pencairan' 
  | 'kredit_angsuran';

export interface Transaction {
  id: string;
  referenceNumber: string; // TRX-20260914-001
  memberNumber: string;
  memberName: string;
  type: TransactionType;
  akad: ShariaAkad;
  amount: number;
  notes: string;
  tellerId: string;
  tellerName: string;
  createdAt: string;
  status: 'success' | 'pending' | 'failed';
  paymentMethod: 'tunai' | 'transfer' | 'qris' | 'autodebet';
  receiptCode: string;
}

export type PawnStatus = 'aktif' | 'ditebus' | 'diperpanjang' | 'dilelang';

export interface PawnPledge {
  id: string;
  pawnCode: string; // RAHN-001
  memberNumber: string;
  memberName: string;
  itemType: 'emas_batangan' | 'perhiasan' | 'bpkb_motor' | 'elektronik' | 'lainnya';
  itemDescription: string;
  estimatedValue: number; // Nilai Taksiran
  loanAmount: number; // Pinjaman Marhun Bih (maks 80% taksiran)
  monthlyUjrah: number; // Biaya pemeliharaan / simpan (ujrah syariah)
  periodMonths: number; // misal 4 bulan (120 hari)
  startDate: string;
  dueDate: string;
  status: PawnStatus;
  paidUjrahTotal: number;
  itemImage?: string;
  notes?: string;
}

export type CreditStatus = 'diajukan' | 'berjalan' | 'lunas' | 'macet';

export interface CommodityFinancing {
  id: string;
  contractNumber: string; // MRB-001
  memberNumber: string;
  memberName: string;
  itemCategory: 'kendaraan' | 'smartphone' | 'elektronik_rumah' | 'alat_usaha';
  itemName: string;
  purchaseCost: number; // Harga Pokok / Modal
  marginAmount: number; // Margin Keuntungan Syariah
  sellingPrice: number; // Harga Jual Murabahah (Pokok + Margin)
  downPayment: number; // Uang Muka (DP)
  financingAmount: number; // Plafon Pembiayaan (SellingPrice - DP)
  tenorMonths: number; // 3, 6, 12, 24 bulan
  monthlyInstallment: number; // Angsuran per bulan
  remainingBalance: number; // Sisa tagihan
  paidInstallmentsCount: number;
  startDate: string;
  status: CreditStatus;
  installments: InstallmentItem[];
}

export interface InstallmentItem {
  id: string;
  installmentNo: number;
  dueDate: string;
  amount: number;
  principalPortion: number;
  marginPortion: number;
  paidAt?: string;
  status: 'lunas' | 'belum_bayar' | 'jatuh_tempo';
  receiptNumber?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'transaksi' | 'angsuran' | 'gadai' | 'sistem' | 'anggota';
  timestamp: string;
  read: boolean;
  targetRole?: UserRole | 'all';
  targetMemberNumber?: string;
  actionUrl?: string;
}
