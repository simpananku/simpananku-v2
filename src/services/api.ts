/**
 * SIMPANANKU API Client Adapter
 * Menghubungkan Frontend React dengan Backend Laravel 13 AI-Native
 * Endpoint Resmi: https://api.simpananku.my.id/api/v1
 */

import { 
  User, 
  Member, 
  SavingsProduct, 
  SavingsAccount, 
  PawnPledge, 
  CommodityFinancing, 
  Transaction, 
  NotificationItem 
} from '../types';

// Konfigurasi Base URL dengan smart fallback (Direct API & Proxy dev server)
const PROXY_API_URL = '/api/v1';

export interface ApiHealthStatus {
  connected: boolean;
  apiUrl: string;
  latencyMs: number;
  message: string;
  institutionName?: string;
  totalMembers?: number;
  totalSavings?: number;
}

export class ApiClient {
  private static activeBaseUrl: string = import.meta.env.VITE_API_URL || PROXY_API_URL;

  public static getBaseUrl(): string {
    return this.activeBaseUrl;
  }

  public static setBaseUrl(url: string) {
    this.activeBaseUrl = url;
  }

  private static csrfToken(): string | null {
    const value = document.cookie.split('; ').find(part => part.startsWith('XSRF-TOKEN='));
    return value ? decodeURIComponent(value.substring('XSRF-TOKEN='.length)) : null;
  }

  private static async ensureCsrf(): Promise<void> {
    if (this.csrfToken()) return;
    const origin = new URL(this.activeBaseUrl, window.location.origin).origin;
    const response = await fetch(`${origin}/sanctum/csrf-cookie`, { credentials: 'include', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Gagal memulai sesi aman. Periksa cookie dan CORS.');
  }

  /**
   * Internal fetch method with automatic fallback between Proxy and Direct URL
   */
  public static async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (options.method && options.method.toUpperCase() !== 'GET') await this.ensureCsrf();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const csrf = this.csrfToken();
    if (csrf && options.method && options.method.toUpperCase() !== 'GET') headers['X-XSRF-TOKEN'] = csrf;
    const response = await fetch(`${this.activeBaseUrl}${endpoint}`, { ...options, headers, credentials: 'include' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && endpoint !== '/auth/login') {
        window.dispatchEvent(new Event('simpananku:unauthorized'));
      }
      const details = data.errors ? Object.values(data.errors).flat().join(' ') : '';
      throw new Error(details || data.message || `Permintaan gagal (${response.status})`);
    }
    return data as T;
  }

  // ==========================================
  // Health & Diagnostics
  // ==========================================
  public static async checkHealth(): Promise<ApiHealthStatus> {
    const start = performance.now();
    try {
      const res = await this.getDashboardStats();
      const latencyMs = Math.round(performance.now() - start);
      return {
        connected: true,
        apiUrl: this.activeBaseUrl,
        latencyMs,
        message: 'Koneksi ke Backend Laravel 13 AI-Native Aktif & Stabil',
        institutionName: res?.institution?.name || 'SIMPANANKU',
        totalMembers: res?.metrics?.total_members || 0,
        totalSavings: res?.metrics?.total_savings || 0,
      };
    } catch (err: any) {
      return {
        connected: false,
        apiUrl: this.activeBaseUrl,
        latencyMs: Math.round(performance.now() - start),
        message: `Koneksi API terhambat: ${err.message || 'Server tidak merespons'}`,
      };
    }
  }

  // ==========================================
  // Autentikasi Pengguna (Sanctum)
  // ==========================================
  public static async login(email: string, password: string): Promise<{
    success: boolean;
    token: string | null;
    user: User;
    member?: Member | null;
    message?: string;
  }> {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const transformedUser: User = {
      id: res.user?.id || `USR-${Date.now()}`,
      name: res.user?.name || email,
      email: res.user?.email || email,
      role: res.user?.role || 'nasabah',
      phone: res.user?.phone || '',
      memberId: res.user?.memberId || undefined,
      createdAt: res.user?.created_at || new Date().toISOString(),
    };

    const transformedMember = res.member ? this.transformMember(res.member) : null;

    return {
      success: true,
      token: res.token,
      user: transformedUser,
      member: transformedMember,
      message: res.message,
    };
  }

  public static async getMe(): Promise<{ user: User; member?: Member | null }> {
    const res = await this.request('/auth/me');
    return {
      user: {
        id: res.user?.id || 'USR-ME',
        name: res.user?.name || '',
        email: res.user?.email || '',
        role: res.user?.role || 'nasabah',
        phone: res.user?.phone || '',
        memberId: res.user?.memberId || undefined,
        createdAt: new Date().toISOString(),
      },
      member: res.member ? this.transformMember(res.member) : null,
    };
  }

  public static async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' });
  }

  // ==========================================
  // Dashboard & Statistik
  // ==========================================
  public static async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // ==========================================
  // Anggota (Nasabah) Syariah
  // ==========================================
  public static async getMembers(params?: { search?: string; status?: string }): Promise<Member[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);

    const endpoint = `/members${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await this.request(endpoint);
    const rawList = Array.isArray(res.data) ? res.data : [];
    return rawList.map((m: any) => this.transformMember(m));
  }

  public static async getMember(memberNumber: string): Promise<Member> {
    const res = await this.request(`/members/${memberNumber}`);
    return this.transformMember(res.data);
  }

  public static async getNextMemberNumber(): Promise<string> {
    try {
      const res = await this.request('/members/next-number');
      return res.next_member_number || 'AG0001';
    } catch {
      return 'AG0001';
    }
  }

  public static async registerMember(payload: {
    nik: string;
    fullName: string;
    email?: string;
    phone: string;
    address: string;
    occupation?: string;
    initialDeposit?: number;
    password?: string;
  }): Promise<{ success: boolean; member: Member; user?: User; defaultPassword?: string; message: string }> {
    const res = await this.request('/members/register', {
      method: 'POST',
      body: JSON.stringify({
        nik: payload.nik,
        full_name: payload.fullName,
        email: payload.email || undefined,
        phone: payload.phone,
        address: payload.address,
        occupation: payload.occupation || 'Wirausaha / Mandiri',
        initial_deposit: payload.initialDeposit ?? 0,
        password: payload.password,
      }),
    });

    return {
      success: true,
      member: this.transformMember(res.member),
      user: res.user ? {
        id: `USR-${res.user.id}`,
        name: res.user.name,
        email: res.user.email,
        phone: res.user.phone,
        role: res.user.role,
        memberId: res.user.member_id,
        createdAt: res.user.created_at || new Date().toISOString(),
      } : undefined,
      defaultPassword: res.default_password,
      message: res.message,
    };
  }

  public static async updateMember(memberNumber: string, payload: Partial<Member>): Promise<Member> {
    const body: Record<string, any> = {};
    if (payload.fullName) body.full_name = payload.fullName;
    if (payload.nik) body.nik = payload.nik;
    if (payload.phone) body.phone = payload.phone;
    if (payload.email) body.email = payload.email;
    if (payload.address) body.address = payload.address;
    if (payload.occupation) body.occupation = payload.occupation;
    if (payload.status) body.status = payload.status;

    const res = await this.request(`/members/${memberNumber}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    return this.transformMember(res.data);
  }

  public static async deleteMember(memberNumber: string): Promise<void> {
    await this.request(`/members/${memberNumber}`, { method: 'DELETE' });
  }

  public static async resetMemberPassword(memberNumber: string, password: string): Promise<void> {
    await this.request(`/members/${memberNumber}/password`, { method: 'PUT', body: JSON.stringify({ password }) });
  }

  public static async getStaff(): Promise<User[]> {
    const res = await this.request('/staff');
    return res.data.map((u: any) => ({ ...u, id: `USR-${u.id}`, createdAt: u.created_at }));
  }

  public static async createStaff(user: User): Promise<void> {
    await this.request('/staff', { method: 'POST', body: JSON.stringify(user) });
  }

  public static async updateStaff(user: User): Promise<void> {
    await this.request(`/staff/${user.id.replace('USR-', '')}`, { method: 'PUT', body: JSON.stringify(user) });
  }

  public static async deleteStaff(id: string): Promise<void> {
    await this.request(`/staff/${id.replace('USR-', '')}`, { method: 'DELETE' });
  }

  public static async changePassword(currentPassword: string, password: string): Promise<void> {
    await this.request('/auth/change-password', { method: 'POST', body: JSON.stringify({ current_password: currentPassword, password, password_confirmation: password }) });
  }

  // ==========================================
  // Produk Simpanan Syariah
  // ==========================================
  public static async getSavingsProducts(): Promise<SavingsProduct[]> {
    const res = await this.request('/savings-products');
    const rawList = Array.isArray(res.data) ? res.data : [];
    return rawList.map((p: any) => this.transformSavingsProduct(p));
  }

  public static async createSavingsProduct(payload: Partial<SavingsProduct>): Promise<SavingsProduct> {
    const res = await this.request('/savings-products', {
      method: 'POST',
      body: JSON.stringify({
        code: payload.code,
        name: payload.name,
        akad: payload.akad,
        description: payload.description,
        min_initial_deposit: payload.minInitialDeposit,
        min_balance: payload.minBalance,
        admin_fee: payload.adminFee || 0,
        profit_sharing_ratio: payload.profitSharingRatio || null,
        is_active: payload.isActive ?? true,
      }),
    });
    return this.transformSavingsProduct(res.data);
  }

  public static async updateSavingsProduct(id: string | number, payload: Partial<SavingsProduct>): Promise<SavingsProduct> {
    const res = await this.request(`/savings-products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: payload.name,
        akad: payload.akad,
        description: payload.description,
        min_initial_deposit: payload.minInitialDeposit,
        min_balance: payload.minBalance,
        admin_fee: payload.adminFee,
        profit_sharing_ratio: payload.profitSharingRatio,
        is_active: payload.isActive,
      }),
    });
    return this.transformSavingsProduct(res.data);
  }

  public static async deleteSavingsProduct(id: string): Promise<void> {
    await this.request(`/savings-products/${id}`, { method: 'DELETE' });
  }

  public static async updatePawn(pawn: PawnPledge): Promise<void> {
    await this.request(`/pawns/${pawn.pawnCode}`, { method: 'PUT', body: JSON.stringify({
      item_type: pawn.itemType, item_description: pawn.itemDescription, estimated_value: pawn.estimatedValue,
      loan_amount: pawn.loanAmount, ujrah_fee_per_month: pawn.monthlyUjrah, tenor_months: pawn.periodMonths,
      due_date: pawn.dueDate, status: pawn.status === 'ditebus' ? 'lunas' : pawn.status, notes: pawn.notes,
    }) });
  }

  public static async deletePawn(number: string): Promise<void> {
    await this.request(`/pawns/${number}`, { method: 'DELETE' });
  }

  public static async updateCredit(credit: CommodityFinancing): Promise<void> {
    await this.request(`/commodity-financings/${credit.contractNumber}`, { method: 'PUT', body: JSON.stringify({
      item_name: credit.itemName, item_category: credit.itemCategory, purchase_price: credit.purchaseCost,
      down_payment: credit.downPayment, margin_amount: credit.marginAmount, tenor_months: credit.tenorMonths,
      status: credit.status === 'diajukan' || credit.status === 'macet' ? 'menunggak' : credit.status,
    }) });
  }

  public static async deleteCredit(number: string): Promise<void> {
    await this.request(`/commodity-financings/${number}`, { method: 'DELETE' });
  }

  public static async updateTransaction(tx: Transaction): Promise<void> {
    await this.request(`/transactions/${tx.referenceNumber}`, { method: 'PUT', body: JSON.stringify({ description: tx.notes }) });
  }

  public static async deleteTransaction(ref: string): Promise<void> {
    await this.request(`/transactions/${ref}`, { method: 'DELETE' });
  }

  // ==========================================
  // Rekening Simpanan (Savings Accounts)
  // ==========================================
  public static async getSavingsAccounts(memberNumber?: string): Promise<SavingsAccount[]> {
    const endpoint = memberNumber ? `/savings-accounts?member_number=${memberNumber}` : '/savings-accounts';
    const res = await this.request(endpoint);
    const rawList = Array.isArray(res.data) ? res.data : [];
    return rawList.map((a: any) => this.transformSavingsAccount(a));
  }

  public static async getSavingsAccount(accountNumber: string): Promise<SavingsAccount> {
    const res = await this.request(`/savings-accounts/${accountNumber}`);
    return this.transformSavingsAccount(res.data);
  }

  public static async createSavingsAccount(memberNumber: string, productId: string): Promise<SavingsAccount> {
    const res = await this.request('/savings-accounts', {
      method: 'POST', body: JSON.stringify({ member_number: memberNumber, product_id: productId }),
    });
    return this.transformSavingsAccount(res.data);
  }

  public static async getPassbookMutation(accountNumber: string): Promise<{
    account: SavingsAccount;
    member: Member;
    transactions: Transaction[];
  }> {
    const res = await this.request(`/savings-accounts/${accountNumber}/mutation`);
    return {
      account: this.transformSavingsAccount(res.account),
      member: this.transformMember(res.member),
      transactions: Array.isArray(res.transactions) ? res.transactions.map((t: any) => this.transformTransaction(t)) : [],
    };
  }

  // ==========================================
  // Transaksi Setoran & Penarikan Tabungan
  // ==========================================
  public static async getTransactions(params?: { member_number?: string; type?: string }): Promise<Transaction[]> {
    const query = new URLSearchParams();
    if (params?.member_number) query.append('member_number', params.member_number);
    if (params?.type) query.append('type', params.type);

    const endpoint = `/transactions${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await this.request(endpoint);
    // Laravel paginate returns { data: { data: [...] } } or { data: [...] }
    const list = res.data?.data ? res.data.data : (Array.isArray(res.data) ? res.data : []);
    return list.map((t: any) => this.transformTransaction(t));
  }

  public static async deposit(payload: {
    accountNumber: string;
    amount: number;
    description?: string;
    tellerName: string;
  }): Promise<{
    success: boolean;
    transaction: Transaction;
    updatedAccount: SavingsAccount;
    updatedMember: Member;
    message: string;
  }> {
    const res = await this.request('/transactions/deposit', {
      method: 'POST',
      body: JSON.stringify({
        account_number: payload.accountNumber,
        amount: payload.amount,
        description: payload.description || 'Setoran tabungan syariah',
        teller_name: payload.tellerName,
      }),
    });

    return {
      success: true,
      transaction: this.transformTransaction(res.transaction),
      updatedAccount: this.transformSavingsAccount(res.updated_account),
      updatedMember: this.transformMember(res.updated_member),
      message: res.message,
    };
  }

  public static async withdraw(payload: {
    accountNumber: string;
    amount: number;
    description?: string;
    tellerName: string;
  }): Promise<{
    success: boolean;
    transaction: Transaction;
    updatedAccount: SavingsAccount;
    updatedMember: Member;
    message: string;
  }> {
    const res = await this.request('/transactions/withdraw', {
      method: 'POST',
      body: JSON.stringify({
        account_number: payload.accountNumber,
        amount: payload.amount,
        description: payload.description || 'Penarikan tabungan syariah',
        teller_name: payload.tellerName,
      }),
    });

    return {
      success: true,
      transaction: this.transformTransaction(res.transaction),
      updatedAccount: this.transformSavingsAccount(res.updated_account),
      updatedMember: this.transformMember(res.updated_member),
      message: res.message,
    };
  }

  public static async getTransactionReceipt(referenceNumber: string): Promise<any> {
    return this.request(`/transactions/${referenceNumber}/receipt`);
  }

  // ==========================================
  // Gadai Syariah (Rahn)
  // ==========================================
  public static async getPawns(params?: { member_number?: string; status?: string }): Promise<PawnPledge[]> {
    const query = new URLSearchParams();
    if (params?.member_number) query.append('member_number', params.member_number);
    if (params?.status) query.append('status', params.status);

    const endpoint = `/pawns${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await this.request(endpoint);
    const rawList = Array.isArray(res.data) ? res.data : [];
    return rawList.map((p: any) => this.transformPawn(p));
  }

  public static async disbursePawn(payload: {
    memberNumber: string;
    itemType: string;
    itemDescription: string;
    estimatedValue: number;
    loanAmount: number;
    ujrahFeePerMonth: number;
    tenorMonths: number;
    tellerName: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    pawn: PawnPledge;
    transaction: Transaction;
    message: string;
  }> {
    const res = await this.request('/pawns/disburse', {
      method: 'POST',
      body: JSON.stringify({
        member_number: payload.memberNumber,
        item_type: payload.itemType,
        item_description: payload.itemDescription,
        estimated_value: payload.estimatedValue,
        loan_amount: payload.loanAmount,
        ujrah_fee_per_month: payload.ujrahFeePerMonth,
        tenor_months: payload.tenorMonths,
        teller_name: payload.tellerName,
        notes: payload.notes || 'Akad Rahn & Ijarah Titipan sah',
      }),
    });

    return {
      success: true,
      pawn: this.transformPawn(res.pawn),
      transaction: this.transformTransaction(res.transaction),
      message: res.message,
    };
  }

  public static async payPawnUjrah(pawnNumber: string, payload: {
    amount: number;
    tellerName: string;
  }): Promise<{ success: boolean; transaction: Transaction; message: string }> {
    const res = await this.request(`/pawns/${pawnNumber}/pay-ujrah`, {
      method: 'POST',
      body: JSON.stringify({
        amount: payload.amount,
        teller_name: payload.tellerName,
      }),
    });

    return {
      success: true,
      transaction: this.transformTransaction(res.transaction),
      message: res.message,
    };
  }

  public static async redeemPawn(pawnNumber: string, payload: {
    tellerName: string;
  }): Promise<{ success: boolean; pawn: PawnPledge; transaction: Transaction; message: string }> {
    const res = await this.request(`/pawns/${pawnNumber}/redeem`, {
      method: 'POST',
      body: JSON.stringify({
        teller_name: payload.tellerName,
      }),
    });

    return {
      success: true,
      pawn: this.transformPawn(res.pawn),
      transaction: this.transformTransaction(res.transaction),
      message: res.message,
    };
  }

  // ==========================================
  // Kredit Barang Syariah (Murabahah)
  // ==========================================
  public static async getCommodityFinancings(params?: { member_number?: string; status?: string }): Promise<CommodityFinancing[]> {
    const query = new URLSearchParams();
    if (params?.member_number) query.append('member_number', params.member_number);
    if (params?.status) query.append('status', params.status);

    const endpoint = `/commodity-financings${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await this.request(endpoint);
    const rawList = Array.isArray(res.data) ? res.data : [];
    return rawList.map((c: any) => this.transformCommodity(c));
  }

  public static async disburseCommodityFinancing(payload: {
    memberNumber: string;
    itemName: string;
    itemCategory: string;
    purchasePrice: number;
    downPayment: number;
    marginPercentage: number;
    tenorMonths: number;
    tellerName: string;
  }): Promise<{
    success: boolean;
    credit: CommodityFinancing;
    transaction: Transaction;
    message: string;
  }> {
    const res = await this.request('/commodity-financings/disburse', {
      method: 'POST',
      body: JSON.stringify({
        member_number: payload.memberNumber,
        item_name: payload.itemName,
        item_category: payload.itemCategory,
        purchase_price: payload.purchasePrice,
        down_payment: payload.downPayment,
        margin_percentage: payload.marginPercentage,
        tenor_months: payload.tenorMonths,
        teller_name: payload.tellerName,
      }),
    });

    return {
      success: true,
      credit: this.transformCommodity(res.credit),
      transaction: this.transformTransaction(res.transaction),
      message: res.message,
    };
  }

  public static async payFinancingInstallment(financingNumber: string, payload: {
    amount: number;
    tellerName: string;
  }): Promise<{
    success: boolean;
    credit: CommodityFinancing;
    transaction: Transaction;
    message: string;
  }> {
    const res = await this.request(`/commodity-financings/${financingNumber}/pay-installment`, {
      method: 'POST',
      body: JSON.stringify({
        amount: payload.amount,
        teller_name: payload.tellerName,
      }),
    });

    return {
      success: true,
      credit: this.transformCommodity(res.credit),
      transaction: this.transformTransaction(res.transaction),
      message: res.message,
    };
  }

  // ==========================================
  // Notifikasi
  // ==========================================
  public static async getNotifications(params?: { limit?: number; unread_only?: boolean }): Promise<NotificationItem[]> {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.unread_only) query.append('unread_only', '1');

    const endpoint = `/notifications${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await this.request(endpoint);
    const rawList = Array.isArray(res.data) ? res.data : [];
    return rawList.map((n: any) => this.transformNotification(n));
  }

  public static async markNotificationRead(id: string | number): Promise<void> {
    await this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  public static async markAllNotificationsRead(): Promise<void> {
    await this.request('/notifications/mark-all-read', { method: 'POST' });
  }

  // ==========================================
  // AI-Native Sharia Advisory & Marhun Appraisal
  // ==========================================
  public static async auditContract(contractType: string, contractDetails: Record<string, any>) {
    return this.request('/ai/audit-sharia', {
      method: 'POST',
      body: JSON.stringify({
        contract_type: contractType,
        contract_details: contractDetails,
      }),
    });
  }

  public static async estimateMarhun(itemType: string, itemDescription: string, initialEstimate: number) {
    return this.request('/ai/estimate-marhun', {
      method: 'POST',
      body: JSON.stringify({
        item_type: itemType,
        item_description: itemDescription,
        initial_estimate: initialEstimate,
      }),
    });
  }

  // ==========================================
  // Data Model Transformers (Laravel <-> React)
  // ==========================================
  public static transformMember(m: any): Member {
    if (!m) return {} as Member;
    return {
      id: m.id ? String(m.id) : (m.member_number || 'MBR-DEFAULT'),
      memberNumber: m.member_number || m.memberNumber || 'AG0001',
      nik: m.nik || '',
      fullName: m.full_name || m.fullName || 'Nasabah',
      email: m.email || '',
      phone: m.phone || '',
      password: m.password || undefined,
      address: m.address || '',
      occupation: m.occupation || 'Wirausaha / Mandiri',
      status: m.status || 'aktif',
      joinDate: m.join_date ? m.join_date.split('T')[0] : (m.joinDate || new Date().toISOString().split('T')[0]),
      totalSavings: typeof m.total_savings === 'number' ? m.total_savings : parseFloat(m.total_savings || m.totalSavings || '0'),
      activePawnCount: m.active_pawn_count ?? m.activePawnCount ?? (Array.isArray(m.pawn_pledges) ? m.pawn_pledges.filter((p: any) => p.status === 'aktif').length : 0),
      activeCreditCount: m.active_credit_count ?? m.activeCreditCount ?? (Array.isArray(m.commodity_financings) ? m.commodity_financings.filter((c: any) => c.status === 'berjalan').length : 0),
      notes: m.notes || undefined,
    };
  }

  public static transformSavingsProduct(p: any): SavingsProduct {
    return {
      id: String(p.id || p.code || 'PRD-001'),
      code: p.code || 'PRD-001',
      name: p.name || 'Produk Simpanan',
      akad: (p.akad === 'mudharabah' ? 'mudharabah' : 'wadiah'),
      description: p.description || '',
      minInitialDeposit: typeof p.min_initial_deposit === 'number' ? p.min_initial_deposit : parseFloat(p.min_initial_deposit || p.minInitialDeposit || '50000'),
      minBalance: typeof p.min_balance === 'number' ? p.min_balance : parseFloat(p.min_balance || p.minBalance || '20000'),
      adminFee: typeof p.admin_fee === 'number' ? p.admin_fee : parseFloat(p.admin_fee || p.adminFee || '0'),
      profitSharingRatio: p.profit_sharing_ratio || p.profitSharingRatio || undefined,
      isActive: p.is_active !== undefined ? Boolean(p.is_active) : (p.isActive ?? true),
    };
  }

  public static transformSavingsAccount(a: any): SavingsAccount {
    return {
      id: a.account_number || a.id || `ACC-${Date.now()}`,
      memberNumber: a.member_number || a.memberNumber || 'AG0001',
      productId: String(a.product_id || a.productId || 'PRD-001'),
      productName: a.product_name || a.productName || (a.product?.name || 'Simpanan Sukarela Wadiah'),
      akad: (a.akad === 'mudharabah' ? 'mudharabah' : 'wadiah'),
      balance: typeof a.balance === 'number' ? a.balance : parseFloat(a.balance || '0'),
      openedAt: a.opened_at ? a.opened_at.split('T')[0] : (a.openedAt || new Date().toISOString().split('T')[0]),
      status: a.status || 'active',
    };
  }

  public static transformPawn(p: any): PawnPledge {
    const loanAmt = typeof p.loan_amount === 'number' ? p.loan_amount : parseFloat(p.loan_amount || p.loanAmount || '0');
    const estVal = typeof p.estimated_value === 'number' ? p.estimated_value : parseFloat(p.estimated_value || p.estimatedValue || '0');
    const monthlyUjrah = typeof p.ujrah_fee_per_month === 'number' ? p.ujrah_fee_per_month : parseFloat(p.ujrah_fee_per_month || p.monthlyUjrah || '0');

    return {
      id: p.pawn_number || String(p.id),
      pawnCode: p.pawn_number || p.pawnCode || 'RAHN-001',
      memberNumber: p.member_number || p.memberNumber || 'AG0001',
      memberName: p.member_name || p.memberName || 'Anggota',
      itemType: (p.item_type || p.itemType || 'emas_batangan') as any,
      itemDescription: p.item_description || p.itemDescription || '',
      estimatedValue: estVal,
      loanAmount: loanAmt,
      monthlyUjrah: monthlyUjrah,
      periodMonths: parseInt(p.tenor_months || p.periodMonths || '4', 10),
      startDate: p.start_date ? p.start_date.split('T')[0] : (p.startDate || new Date().toISOString().split('T')[0]),
      dueDate: p.due_date ? p.due_date.split('T')[0] : (p.dueDate || new Date().toISOString().split('T')[0]),
      status: p.status === 'lunas' ? 'ditebus' : (p.status || 'aktif'),
      paidUjrahTotal: Number(p.paid_ujrah_total ?? p.paidUjrahTotal ?? 0),
      notes: p.notes || '',
    };
  }

  public static transformCommodity(c: any): CommodityFinancing {
    const purchaseCost = typeof c.purchase_price === 'number' ? c.purchase_price : parseFloat(c.purchase_price || c.purchaseCost || '0');
    const marginAmount = typeof c.margin_amount === 'number' ? c.margin_amount : parseFloat(c.margin_amount || c.marginAmount || '0');
    const downPayment = typeof c.down_payment === 'number' ? c.down_payment : parseFloat(c.down_payment || c.downPayment || '0');
    const totalFinancing = typeof c.total_financing === 'number' ? c.total_financing : parseFloat(c.total_financing || c.financingAmount || '0');
    const monthlyInstallment = typeof c.monthly_installment === 'number' ? c.monthly_installment : parseFloat(c.monthly_installment || c.monthlyInstallment || '0');
    const remainingBalance = typeof c.remaining_amount === 'number' ? c.remaining_amount : parseFloat(c.remaining_amount || c.remainingBalance || '0');
    const tenorMonths = parseInt(c.tenor_months || c.tenorMonths || '12', 10);
    const paidAmount = typeof c.paid_amount === 'number' ? c.paid_amount : parseFloat(c.paid_amount || '0');
    const paidCount = monthlyInstallment > 0 ? Math.min(tenorMonths, Math.round(paidAmount / monthlyInstallment)) : 0;
    const startDate = c.start_date ? c.start_date.split('T')[0] : (c.startDate || new Date().toISOString().split('T')[0]);
    const installments = Array.from({ length: tenorMonths }, (_, i) => {
      const due = new Date(`${startDate}T12:00:00`);
      due.setMonth(due.getMonth() + i + 1);
      return {
        id: `${c.financing_number}-${i + 1}`,
        installmentNo: i + 1,
        dueDate: due.toISOString().split('T')[0],
        amount: monthlyInstallment,
        principalPortion: tenorMonths ? Math.round((purchaseCost - downPayment) / tenorMonths) : 0,
        marginPortion: tenorMonths ? Math.round(marginAmount / tenorMonths) : 0,
        status: i < paidCount ? 'lunas' as const : 'belum_bayar' as const,
      };
    });

    return {
      id: c.financing_number || String(c.id),
      contractNumber: c.financing_number || c.contractNumber || 'MRB-001',
      memberNumber: c.member_number || c.memberNumber || 'AG0001',
      memberName: c.member_name || c.memberName || 'Anggota',
      itemCategory: (c.item_category || c.itemCategory || 'alat_usaha') as any,
      itemName: c.item_name || c.itemName || '',
      purchaseCost,
      marginAmount,
      sellingPrice: purchaseCost + marginAmount,
      downPayment,
      financingAmount: totalFinancing,
      tenorMonths,
      monthlyInstallment,
      remainingBalance,
      paidInstallmentsCount: paidCount,
      startDate,
      status: c.status === 'menunggak' ? 'macet' : (c.status || 'berjalan'),
      installments,
    };
  }

  public static transformTransaction(t: any): Transaction {
    const amt = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount || '0');
    const types: Record<string, Transaction['type']> = {
      pencairan_gadai: 'gadai_pencairan', pelunasan_gadai: 'gadai_tebus', biaya_ujrah: 'gadai_ujrah',
      pencairan_kredit: 'kredit_pencairan', angsuran_kredit: 'kredit_angsuran',
    };
    return {
      id: t.reference_number || String(t.id),
      referenceNumber: t.reference_number || t.referenceNumber || `TRX-${Date.now()}`,
      memberNumber: t.member_number || t.memberNumber || 'AG0001',
      memberName: t.member_name || t.memberName || 'Anggota',
      type: types[t.type] || t.type || 'setoran',
      akad: (t.akad || 'wadiah') as any,
      amount: amt,
      notes: t.description || t.notes || 'Transaksi Syariah',
      tellerId: t.teller_id ? String(t.teller_id) : (t.tellerId || 'TLR-01'),
      tellerName: t.teller_name || t.tellerName || 'Teller Syariah',
      createdAt: t.transaction_date || t.created_at || t.createdAt || new Date().toISOString(),
      status: t.status || 'success',
      paymentMethod: 'tunai',
      receiptCode: t.reference_number || t.receiptCode || `KWT-${Date.now()}`,
    };
  }

  public static transformNotification(n: any): NotificationItem {
    return {
      id: String(n.id || `NTF-${Date.now()}`),
      title: n.title || 'Notifikasi',
      message: n.message || '',
      category: n.category || 'sistem',
      timestamp: n.created_at || n.timestamp || new Date().toISOString(),
      read: Boolean(n.read),
      targetMemberNumber: n.target_member_number || n.targetMemberNumber || undefined,
    };
  }
}
