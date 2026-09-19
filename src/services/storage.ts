import { 
  User, 
  Member, 
  SavingsProduct, 
  SavingsAccount, 
  Transaction, 
  PawnPledge, 
  CommodityFinancing, 
  NotificationItem 
} from '../types';
import { generateReferenceNumber } from './generator';

const STORAGE_KEYS = {
  USERS: 'simpananku_users_v2',
  MEMBERS: 'simpananku_members_v2',
  SAVINGS_PRODUCTS: 'simpananku_products_v2',
  SAVINGS_ACCOUNTS: 'simpananku_accounts_v2',
  TRANSACTIONS: 'simpananku_transactions_v2',
  PAWNS: 'simpananku_pawns_v2',
  CREDITS: 'simpananku_credits_v2',
  NOTIFICATIONS: 'simpananku_notifications_v2',
  CURRENT_USER: 'simpananku_current_user_v2',
};

// Seed Users
const INITIAL_USERS: User[] = [
  {
    id: 'USR-ADMIN-1',
    name: 'Ustadz H. Irfan Shidiq, S.E.I., M.E.Sy',
    email: 'admin@simpananku.my.id',
    role: 'admin',
    phone: '081288991122',
    password: 'admin123',
    createdAt: '2025-01-10T08:00:00Z',
  },
  {
    id: 'USR-TELLER-1',
    name: 'Siti Rahmawati, S.E. (Teller Syariah)',
    email: 'teller@simpananku.my.id',
    role: 'teller',
    phone: '085711223344',
    password: 'teller123',
    createdAt: '2025-02-01T08:30:00Z',
  },
  {
    id: 'USR-NASABAH-1',
    name: 'Ahmad Fauzi Mubarak',
    email: 'nasabah@simpananku.my.id',
    role: 'nasabah',
    phone: '081399887766',
    memberId: 'AG0001',
    password: 'nasabah123',
    createdAt: '2025-02-15T09:00:00Z',
  },
  {
    id: 'USR-NASABAH-2',
    name: 'Khadijah Nurul Aini',
    email: 'khadijah@simpananku.my.id',
    role: 'nasabah',
    phone: '082155667788',
    memberId: 'AG0002',
    password: 'nasabah123',
    createdAt: '2025-03-01T10:00:00Z',
  },
  {
    id: 'USR-NASABAH-3',
    name: 'Bambang Trihatmojo',
    email: 'bambang@gmail.com',
    role: 'nasabah',
    phone: '081977665544',
    memberId: 'AG0003',
    password: 'nasabah123',
    createdAt: '2025-04-10T09:30:00Z',
  },
];

// Seed Members with AG0001 numbering
const INITIAL_MEMBERS: Member[] = [
  {
    id: 'MBR-001',
    memberNumber: 'AG0001',
    nik: '3273011405900002',
    fullName: 'Ahmad Fauzi Mubarak',
    email: 'nasabah@simpananku.my.id',
    phone: '081399887766',
    password: 'nasabah123',
    address: 'Jl. Cisitu Indah No. 18, Dago, Coblong, Kota Bandung',
    occupation: 'Wirausaha Kuliner Berkah',
    status: 'aktif',
    joinDate: '2025-02-15',
    totalSavings: 15450000,
    activePawnCount: 1,
    activeCreditCount: 1,
  },
  {
    id: 'MBR-002',
    memberNumber: 'AG0002',
    nik: '3273022508920004',
    fullName: 'Khadijah Nurul Aini',
    email: 'khadijah@simpananku.my.id',
    phone: '082155667788',
    password: 'nasabah123',
    address: 'Jl. Riau No. 82, Cihapit, Bandung Wetan',
    occupation: 'Guru Madrasah Aliyah',
    status: 'aktif',
    joinDate: '2025-03-01',
    totalSavings: 8200000,
    activePawnCount: 1,
    activeCreditCount: 0,
  },
  {
    id: 'MBR-003',
    memberNumber: 'AG0003',
    nik: '3273031012880001',
    fullName: 'Bambang Trihatmojo',
    email: 'bambang@gmail.com',
    phone: '081977665544',
    password: 'nasabah123',
    address: 'Jl. Buah Batu No. 120, Lengkong, Bandung',
    occupation: 'Konsultan Teknik Sipil',
    status: 'aktif',
    joinDate: '2025-04-10',
    totalSavings: 25000000,
    activePawnCount: 0,
    activeCreditCount: 1,
  },
];

// Seed Savings Products (Wadiah & Mudharabah)
const INITIAL_PRODUCTS: SavingsProduct[] = [
  {
    id: 'PRD-001',
    code: 'TAB-WDH',
    name: 'Tabungan Amanah Wadi\'ah',
    akad: 'wadiah',
    description: 'Simpanan murni berbasis titipan (Yad Dhamanah) tanpa biaya administrasi bulanan, bebas ditarik kapan saja dengan jaminan keamanan dana penuh.',
    minInitialDeposit: 50000,
    minBalance: 20000,
    adminFee: 0,
    isActive: true,
  },
  {
    id: 'PRD-002',
    code: 'TAB-MDB',
    name: 'Tabungan Berkah Mudharabah',
    akad: 'mudharabah',
    description: 'Simpanan investasi syariah bagi hasil (Muthlaqah) dengan rasio nisbah kompetitif 70:30 untuk nasabah dan lembaga.',
    minInitialDeposit: 250000,
    minBalance: 50000,
    adminFee: 0,
    profitSharingRatio: '70 : 30',
    isActive: true,
  },
  {
    id: 'PRD-003',
    code: 'TAB-QRB',
    name: 'Tabungan Qurban & Aqiqah Syariah',
    akad: 'wadiah',
    description: 'Perencanaan ibadah qurban tahunan dengan target terencana dan pendampingan penyaluran hewan qurban syar\'i.',
    minInitialDeposit: 100000,
    minBalance: 0,
    adminFee: 0,
    isActive: true,
  },
  {
    id: 'PRD-004',
    code: 'TAB-HAJI',
    name: 'Tabungan Safar Haji & Umroh',
    akad: 'mudharabah',
    description: 'Persiapan ongkos naik haji (ONH) & umroh berencana dengan nisbah berkah dan konsultasi porsi Kemenag.',
    minInitialDeposit: 500000,
    minBalance: 100000,
    adminFee: 0,
    profitSharingRatio: '75 : 25',
    isActive: true,
  },
];

// Seed Savings Accounts
const INITIAL_ACCOUNTS: SavingsAccount[] = [
  {
    id: 'ACC-001',
    memberNumber: 'AG0001',
    productId: 'PRD-001',
    productName: 'Tabungan Amanah Wadi\'ah',
    akad: 'wadiah',
    balance: 5450000,
    openedAt: '2025-02-15',
    status: 'active',
  },
  {
    id: 'ACC-002',
    memberNumber: 'AG0001',
    productId: 'PRD-002',
    productName: 'Tabungan Berkah Mudharabah',
    akad: 'mudharabah',
    balance: 10000000,
    openedAt: '2025-02-20',
    status: 'active',
  },
  {
    id: 'ACC-003',
    memberNumber: 'AG0002',
    productId: 'PRD-001',
    productName: 'Tabungan Amanah Wadi\'ah',
    akad: 'wadiah',
    balance: 8200000,
    openedAt: '2025-03-01',
    status: 'active',
  },
  {
    id: 'ACC-004',
    memberNumber: 'AG0003',
    productId: 'PRD-002',
    productName: 'Tabungan Berkah Mudharabah',
    akad: 'mudharabah',
    balance: 25000000,
    openedAt: '2025-04-10',
    status: 'active',
  },
];

// Seed Gadai Syariah (Rahn)
const INITIAL_PAWNS: PawnPledge[] = [
  {
    id: 'RAHN-001',
    pawnCode: 'RHN-202508-004',
    memberNumber: 'AG0001',
    memberName: 'Ahmad Fauzi Mubarak',
    itemType: 'emas_batangan',
    itemDescription: 'Logam Mulia Antam CertiEye 10 Gram (Kadar 99.99%)',
    estimatedValue: 14200000,
    loanAmount: 11000000,
    monthlyUjrah: 95000,
    periodMonths: 4,
    startDate: '2025-08-01',
    dueDate: '2025-12-01',
    status: 'aktif',
    paidUjrahTotal: 190000,
    notes: 'Kondisi segel press utuh, kwitansi toko emas terlampir.',
  },
  {
    id: 'RAHN-002',
    pawnCode: 'RHN-202509-009',
    memberNumber: 'AG0002',
    memberName: 'Khadijah Nurul Aini',
    itemType: 'perhiasan',
    itemDescription: 'Kalung Emas Putih Berlian 750 (Berat Bersih 8.4 Gram)',
    estimatedValue: 8500000,
    loanAmount: 6500000,
    monthlyUjrah: 60000,
    periodMonths: 4,
    startDate: '2025-09-02',
    dueDate: '2026-01-02',
    status: 'aktif',
    paidUjrahTotal: 0,
    notes: 'Disimpan di Khazanah Khasanah Safe Deposit Box No. A-14.',
  },
];

// Helper to create installments
function createInstallments(
  count: number,
  monthlyAmount: number,
  startDateStr: string,
  paidCount: number
) {
  const list = [];
  const start = new Date(startDateStr);
  const principal = Math.round(monthlyAmount * 0.85);
  const margin = monthlyAmount - principal;

  for (let i = 1; i <= count; i++) {
    const due = new Date(start);
    due.setMonth(due.getMonth() + i);
    const isPaid = i <= paidCount;

    list.push({
      id: `INST-${i}`,
      installmentNo: i,
      dueDate: due.toISOString().split('T')[0],
      amount: monthlyAmount,
      principalPortion: principal,
      marginPortion: margin,
      paidAt: isPaid ? new Date(due.getTime() - 2 * 86400000).toISOString() : undefined,
      status: isPaid ? ('lunas' as const) : ('belum_bayar' as const),
      receiptNumber: isPaid ? `TRX-INST-${1000 + i}` : undefined,
    });
  }
  return list;
}

// Seed Kredit Barang (Murabahah)
const INITIAL_CREDITS: CommodityFinancing[] = [
  {
    id: 'MRB-001',
    contractNumber: 'MRB-202506-002',
    memberNumber: 'AG0001',
    memberName: 'Ahmad Fauzi Mubarak',
    itemCategory: 'kendaraan',
    itemName: 'Honda Beat Deluxe Smart Key CBS 2025 (Warna Black Matte)',
    purchaseCost: 19500000,
    marginAmount: 2400000,
    sellingPrice: 21900000,
    downPayment: 3900000,
    financingAmount: 18000000,
    tenorMonths: 12,
    monthlyInstallment: 1500000,
    remainingBalance: 10500000,
    paidInstallmentsCount: 5,
    startDate: '2025-06-15',
    status: 'berjalan',
    installments: createInstallments(12, 1500000, '2025-06-15', 5),
  },
  {
    id: 'MRB-002',
    contractNumber: 'MRB-202508-011',
    memberNumber: 'AG0003',
    memberName: 'Bambang Trihatmojo',
    itemCategory: 'elektronik_rumah',
    itemName: 'Laptop ASUS Zenbook OLED AI Core Ultra 7',
    purchaseCost: 18000000,
    marginAmount: 1800000,
    sellingPrice: 19800000,
    downPayment: 3600000,
    financingAmount: 16200000,
    tenorMonths: 6,
    monthlyInstallment: 2700000,
    remainingBalance: 10800000,
    paidInstallmentsCount: 2,
    startDate: '2025-08-10',
    status: 'berjalan',
    installments: createInstallments(6, 2700000, '2025-08-10', 2),
  },
];

// Seed Transactions
const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TRX-001',
    referenceNumber: 'TRX-20250910-4821',
    memberNumber: 'AG0001',
    memberName: 'Ahmad Fauzi Mubarak',
    type: 'setoran',
    akad: 'wadiah',
    amount: 1500000,
    notes: 'Setoran Tunai Tabungan Amanah Wadi\'ah via Teller 01',
    tellerId: 'USR-TELLER-1',
    tellerName: 'Siti Rahmawati, S.E.',
    createdAt: '2025-09-10T10:15:00Z',
    status: 'success',
    paymentMethod: 'tunai',
    receiptCode: 'RCP-882910',
  },
  {
    id: 'TRX-002',
    referenceNumber: 'TRX-20250912-3312',
    memberNumber: 'AG0001',
    memberName: 'Ahmad Fauzi Mubarak',
    type: 'kredit_angsuran',
    akad: 'murabahah',
    amount: 1500000,
    notes: 'Pembayaran Angsuran ke-5 Kredit Sepeda Motor Honda Beat',
    tellerId: 'USR-TELLER-1',
    tellerName: 'Siti Rahmawati, S.E.',
    createdAt: '2025-09-12T14:30:00Z',
    status: 'success',
    paymentMethod: 'tunai',
    receiptCode: 'RCP-554109',
  },
  {
    id: 'TRX-003',
    referenceNumber: 'TRX-20250913-9082',
    memberNumber: 'AG0002',
    memberName: 'Khadijah Nurul Aini',
    type: 'gadai_pencairan',
    akad: 'rahn',
    amount: 6500000,
    notes: 'Pencairan Pinjaman Rahn Jaminan Perhiasan Kalung Berlian 8.4gr',
    tellerId: 'USR-TELLER-1',
    tellerName: 'Siti Rahmawati, S.E.',
    createdAt: '2025-09-13T11:00:00Z',
    status: 'success',
    paymentMethod: 'tunai',
    receiptCode: 'RCP-990812',
  },
];

// Seed Notifications
const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'NOTIF-001',
    title: 'Setoran Berhasil Diproses',
    message: 'Setoran tunai Rp 1.500.000 atas nama Ahmad Fauzi Mubarak (AG0001) telah berhasil dibukukan.',
    category: 'transaksi',
    timestamp: '2025-09-10T10:15:05Z',
    read: false,
    targetRole: 'all',
  },
  {
    id: 'NOTIF-002',
    title: 'Pendaftaran Anggota Baru',
    message: 'Nasabah Khadijah Nurul Aini (AG0002) telah aktif terdaftar dalam sistem.',
    category: 'anggota',
    timestamp: '2025-09-11T09:00:00Z',
    read: true,
    targetRole: 'admin',
  },
  {
    id: 'NOTIF-003',
    title: 'Pengingat Jatuh Tempo Ujrah Gadai',
    message: 'Gadai Rahn RHN-202508-004 (Emas Antam 10gr) milik AG0001 mendekati masa pembayaran ujrah bulanan.',
    category: 'gadai',
    timestamp: '2025-09-14T08:00:00Z',
    read: false,
    targetRole: 'all',
  },
];

// Storage Helper Functions
function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Storage quota or parse error:', err);
  }
}

export const storage = {
  getUsers: (): User[] => {
    const list = getFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    return list.map((u) => ({
      ...u,
      email: u.email ? u.email.replace(/@simpananku\.id$/i, '@simpananku.my.id') : u.email,
      password: u.password || (u.role === 'admin' ? 'admin123' : u.role === 'teller' ? 'teller123' : 'nasabah123'),
    }));
  },
  saveUsers: (users: User[]) => saveToStorage(STORAGE_KEYS.USERS, users),

  getMembers: (): Member[] => {
    const list = getFromStorage(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    return list.map((m) => ({
      ...m,
      email: m.email ? m.email.replace(/@simpananku\.id$/i, '@simpananku.my.id') : m.email,
      password: m.password || 'nasabah123',
    }));
  },
  saveMembers: (members: Member[]) => saveToStorage(STORAGE_KEYS.MEMBERS, members),

  getProducts: (): SavingsProduct[] => getFromStorage(STORAGE_KEYS.SAVINGS_PRODUCTS, INITIAL_PRODUCTS),
  saveProducts: (products: SavingsProduct[]) => saveToStorage(STORAGE_KEYS.SAVINGS_PRODUCTS, products),

  getAccounts: (): SavingsAccount[] => getFromStorage(STORAGE_KEYS.SAVINGS_ACCOUNTS, INITIAL_ACCOUNTS),
  saveAccounts: (accounts: SavingsAccount[]) => saveToStorage(STORAGE_KEYS.SAVINGS_ACCOUNTS, accounts),

  getTransactions: (): Transaction[] => getFromStorage(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS),
  saveTransactions: (txs: Transaction[]) => saveToStorage(STORAGE_KEYS.TRANSACTIONS, txs),

  getPawns: (): PawnPledge[] => getFromStorage(STORAGE_KEYS.PAWNS, INITIAL_PAWNS),
  savePawns: (pawns: PawnPledge[]) => saveToStorage(STORAGE_KEYS.PAWNS, pawns),

  getCredits: (): CommodityFinancing[] => getFromStorage(STORAGE_KEYS.CREDITS, INITIAL_CREDITS),
  saveCredits: (credits: CommodityFinancing[]) => saveToStorage(STORAGE_KEYS.CREDITS, credits),

  getNotifications: (): NotificationItem[] => getFromStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS),
  saveNotifications: (notifs: NotificationItem[]) => saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifs),

  getCurrentUser: (): User => {
    const u = getFromStorage(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
    if (u && u.email) {
      u.email = u.email.replace(/@simpananku\.id$/i, '@simpananku.my.id');
    }
    return u;
  },
  setCurrentUser: (user: User) => saveToStorage(STORAGE_KEYS.CURRENT_USER, user),

  resetToDefault: () => {
    localStorage.clear();
    saveToStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    saveToStorage(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    saveToStorage(STORAGE_KEYS.SAVINGS_PRODUCTS, INITIAL_PRODUCTS);
    saveToStorage(STORAGE_KEYS.SAVINGS_ACCOUNTS, INITIAL_ACCOUNTS);
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    saveToStorage(STORAGE_KEYS.PAWNS, INITIAL_PAWNS);
    saveToStorage(STORAGE_KEYS.CREDITS, INITIAL_CREDITS);
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    saveToStorage(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
  },
};

export function loadInitialData() {
  return {
    users: storage.getUsers(),
    members: storage.getMembers(),
    products: storage.getProducts(),
    accounts: storage.getAccounts(),
    pawns: storage.getPawns(),
    credits: storage.getCredits(),
    transactions: storage.getTransactions(),
    notifications: storage.getNotifications(),
  };
}

export function saveData(data: {
  users: User[];
  members: Member[];
  products: SavingsProduct[];
  accounts: SavingsAccount[];
  pawns: PawnPledge[];
  credits: CommodityFinancing[];
  transactions: Transaction[];
  notifications: NotificationItem[];
}) {
  storage.saveUsers(data.users);
  storage.saveMembers(data.members);
  storage.saveProducts(data.products);
  storage.saveAccounts(data.accounts);
  storage.savePawns(data.pawns);
  storage.saveCredits(data.credits);
  storage.saveTransactions(data.transactions);
  storage.saveNotifications(data.notifications);
}
