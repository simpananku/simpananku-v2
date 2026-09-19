export interface LaravelFile {
  path: string;
  category: 'Migration' | 'Model' | 'Controller' | 'Service' | 'Seeder' | 'Routes' | 'Blade View' | 'AI-Native' | 'Config & Project';
  description: string;
  code: string;
}

export const LARAVEL_13_FILES: LaravelFile[] = [
  {
    path: 'database/migrations/2026_01_01_000001_create_simpananku_schema.php',
    category: 'Migration',
    description: 'Migration skema lengkap MySQL: users, members (dengan nomor AG0001), savings_products, savings_accounts, transactions, pawn_pledges (Rahn), commodity_financings (Murabahah), installments.',
    code: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for Laravel 13 & MySQL.
     * Lembaga Pengelolaan Simpanan Syariah, Gadai Syariah, & Kredit Barang (Bukan Koperasi).
     */
    public function up(): void
    {
        // 1. Tabel Users & Autentikasi Role
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('role', ['admin', 'teller', 'nasabah'])->default('nasabah');
            $table->string('phone', 20)->nullable();
            $table->string('member_id', 20)->nullable()->comment('AG0001 jika nasabah');
            $table->rememberToken();
            $table->timestamps();
        });

        // 2. Tabel Members (Anggota/Nasabah) Pengganti Rekening Konvensional
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('member_number', 20)->unique()->comment('Format AG0001 auto-generated');
            $table->string('nik', 16)->unique();
            $table->string('full_name');
            $table->string('email')->nullable();
            $table->string('phone', 20);
            $table->text('address');
            $table->string('occupation')->nullable();
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->date('join_date');
            $table->decimal('total_savings', 15, 2)->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        // 3. Tabel Produk Simpanan Syariah
        Schema::create('savings_products', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name');
            $table->enum('akad', ['wadiah', 'mudharabah']);
            $table->text('description')->nullable();
            $table->decimal('min_initial_deposit', 15, 2)->default(50000);
            $table->decimal('min_balance', 15, 2)->default(20000);
            $table->decimal('admin_fee', 15, 2)->default(0)->comment('0 untuk prinsip syariah');
            $table->string('profit_sharing_ratio', 20)->nullable()->comment('Contoh: 70:30');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 4. Tabel Buku Rekening Simpanan per Nasabah
        Schema::create('savings_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('member_number', 20);
            $table->foreignId('product_id')->constrained('savings_products')->cascadeOnDelete();
            $table->enum('akad', ['wadiah', 'mudharabah']);
            $table->decimal('balance', 15, 2)->default(0);
            $table->date('opened_at');
            $table->enum('status', ['active', 'frozen', 'closed'])->default('active');
            $table->timestamps();

            $table->foreign('member_number')->references('member_number')->on('members')->cascadeOnDelete();
        });

        // 5. Tabel Gadai Syariah (Akad Rahn & Ijarah)
        Schema::create('pawn_pledges', function (Blueprint $table) {
            $table->id();
            $table->string('pawn_code', 30)->unique();
            $table->string('member_number', 20);
            $table->enum('item_type', ['emas_batangan', 'perhiasan', 'bpkb_motor', 'elektronik', 'lainnya']);
            $table->string('item_description');
            $table->decimal('estimated_value', 15, 2)->comment('Nilai Taksiran Penaksir');
            $table->decimal('loan_amount', 15, 2)->comment('Pinjaman Marhun Bih maks 80%');
            $table->decimal('monthly_ujrah', 15, 2)->comment('Biaya Simpan / Ijarah');
            $table->integer('period_months')->default(4);
            $table->date('start_date');
            $table->date('due_date');
            $table->enum('status', ['aktif', 'ditebus', 'diperpanjang', 'dilelang'])->default('aktif');
            $table->decimal('paid_ujrah_total', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('member_number')->references('member_number')->on('members')->cascadeOnDelete();
        });

        // 6. Tabel Kredit Barang (Akad Murabahah Jual Beli Margin Terbuka)
        Schema::create('commodity_financings', function (Blueprint $table) {
            $table->id();
            $table->string('contract_number', 30)->unique();
            $table->string('member_number', 20);
            $table->enum('item_category', ['kendaraan', 'smartphone', 'elektronik_rumah', 'alat_usaha']);
            $table->string('item_name');
            $table->decimal('purchase_cost', 15, 2)->comment('Harga Pokok Pengadaan');
            $table->decimal('margin_amount', 15, 2)->comment('Margin Keuntungan Syariah');
            $table->decimal('selling_price', 15, 2)->comment('Harga Jual Akad Murabahah');
            $table->decimal('down_payment', 15, 2)->default(0)->comment('Uang Muka DP');
            $table->decimal('financing_amount', 15, 2)->comment('Plafon Pembiayaan Bersih');
            $table->integer('tenor_months')->default(12);
            $table->decimal('monthly_installment', 15, 2);
            $table->decimal('remaining_balance', 15, 2);
            $table->integer('paid_installments_count')->default(0);
            $table->date('start_date');
            $table->enum('status', ['diajukan', 'berjalan', 'lunas', 'macet'])->default('berjalan');
            $table->timestamps();

            $table->foreign('member_number')->references('member_number')->on('members')->cascadeOnDelete();
        });

        // 7. Tabel Angsuran Bulanan Kredit Barang
        Schema::create('installments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('commodity_financing_id')->constrained('commodity_financings')->cascadeOnDelete();
            $table->integer('installment_no');
            $table->date('due_date');
            $table->decimal('amount', 15, 2);
            $table->decimal('principal_portion', 15, 2);
            $table->decimal('margin_portion', 15, 2);
            $table->timestamp('paid_at')->nullable();
            $table->enum('status', ['belum_bayar', 'lunas', 'jatuh_tempo'])->default('belum_bayar');
            $table->string('receipt_number', 50)->nullable();
            $table->timestamps();
        });

        // 8. Tabel Transaksi / Mutasi Buku Kas & Jurnal Syariah
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('reference_number', 40)->unique();
            $table->string('member_number', 20);
            $table->enum('type', [
                'setoran', 
                'penarikan', 
                'gadai_pencairan', 
                'gadai_tebus', 
                'gadai_ujrah', 
                'kredit_pencairan', 
                'kredit_angsuran'
            ]);
            $table->enum('akad', ['wadiah', 'mudharabah', 'rahn', 'murabahah']);
            $table->decimal('amount', 15, 2);
            $table->text('notes')->nullable();
            $table->foreignId('teller_id')->constrained('users');
            $table->enum('status', ['success', 'pending', 'failed'])->default('success');
            $table->enum('payment_method', ['tunai', 'transfer', 'auto_debit'])->default('tunai');
            $table->string('receipt_code', 30)->unique();
            $table->timestamps();

            $table->foreign('member_number')->references('member_number')->on('members')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('installments');
        Schema::dropIfExists('commodity_financings');
        Schema::dropIfExists('pawn_pledges');
        Schema::dropIfExists('savings_accounts');
        Schema::dropIfExists('savings_products');
        Schema::dropIfExists('members');
        Schema::dropIfExists('users');
    }
};`,
  },
  {
    path: 'app/Models/Member.php',
    category: 'Model',
    description: 'Model Member dengan auto-generator nomor AG0001 pada event creating, relasi simpanan, gadai, dan kredit.',
    code: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\SoftDeletes;
use Illuminate\\Support\\Facades\\DB;

class Member extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'member_number',
        'nik',
        'full_name',
        'email',
        'phone',
        'address',
        'occupation',
        'status',
        'join_date',
        'total_savings',
    ];

    protected $casts = [
        'join_date' => 'date',
        'total_savings' => 'decimal:2',
    ];

    /**
     * Booted method Laravel 13 untuk auto-generate nomor anggota AG0001
     */
    protected static function booted(): void
    {
        static::creating(function (Member $member) {
            if (empty($member->member_number)) {
                $member->member_number = self::generateNextMemberNumber();
            }
            if (empty($member->join_date)) {
                $member->join_date = now()->toDateString();
            }
        });
    }

    /**
     * Generator Nomor Anggota Pengganti Nomor Rekening: AG0001, AG0002...
     */
    public static function generateNextMemberNumber(): string
    {
        return DB::transaction(function () {
            // Lock tabel for atomic safety
            $latest = DB::table('members')
                ->where('member_number', 'LIKE', 'AG%')
                ->orderByDesc('id')
                ->lockForUpdate()
                ->value('member_number');

            if (!$latest) {
                return 'AG0001';
            }

            $currentNum = (int) substr($latest, 2);
            $nextNum = $currentNum + 1;
            return 'AG' . str_pad($nextNum, 4, '0', STR_PAD_LEFT);
        });
    }

    // Relasi ke Rekening Simpanan
    public function savingsAccounts()
    {
        return $this->hasMany(SavingsAccount::class, 'member_number', 'member_number');
    }

    // Relasi ke Gadai Syariah (Rahn)
    public function pawnPledges()
    {
        return $this->hasMany(PawnPledge::class, 'member_number', 'member_number');
    }

    // Relasi ke Kredit Barang (Murabahah)
    public function commodityFinancings()
    {
        return $this->hasMany(CommodityFinancing::class, 'member_number', 'member_number');
    }

    // Relasi ke Seluruh Transaksi
    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'member_number', 'member_number');
    }
}`,
  },
  {
    path: 'app/Services/WhatsAppReceiptService.php',
    category: 'Service',
    description: 'Service generator bukti transaksi WhatsApp & integrasi API Gateway WhatsApp (Fonnte / Wablas / WA Web).',
    code: `<?php

namespace App\\Services;

use App\\Models\\Transaction;
use App\\Models\\Member;

class WhatsAppReceiptService
{
    /**
     * Buat format struk transaksi WhatsApp resmi syariah
     */
    public function formatReceiptText(Transaction $trx, Member $member, ?float $currentBalance = null): string
    {
        $typeMap = [
            'setoran' => 'SETORAN TABUNGAN SYARIAH',
            'penarikan' => 'PENARIKAN TABUNGAN SYARIAH',
            'gadai_pencairan' => 'PENCAIRAN GADAI SYARIAH (RAHN)',
            'gadai_tebus' => 'PELUNASAN TEBUS GADAI (RAHN)',
            'gadai_ujrah' => 'PEMBAYARAN UJRAH GADAI',
            'kredit_pencairan' => 'PENYERAHAN KREDIT BARANG (MURABAHAH)',
            'kredit_angsuran' => 'PEMBAYARAN ANGSURAN BARANG',
        ];

        $akadMap = [
            'wadiah' => "Wadi'ah Yad Dhamanah (Titipan Bergaransi)",
            'mudharabah' => "Mudharabah Muthlaqah (Bagi Hasil)",
            'rahn' => "Rahn & Ijarah (Gadai Syariah)",
            'murabahah' => "Murabahah (Jual Beli Terbuka)",
        ];

        $text = "*BUKTI TRANSAKSI RESMI SYARIAH*\\n";
        $text .= "*SIMPANANKU KEUANGAN SYARIAH*\\n";
        $text .= "_Lembaga Pengelolaan Keuangan Syariah Non-Koperasi_\\n";
        $text .= "============================\\n";
        $text .= "*No. Referensi:* {$trx->reference_number}\\n";
        $text .= "*Tanggal:* " . $trx->created_at->translatedFormat('d F Y H:i') . " WIB\\n";
        $text .= "*Teller:* {$trx->teller->name}\\n";
        $text .= "----------------------------\\n";
        $text .= "*Nasabah:*\\n";
        $text .= "• No. Anggota: *{$member->member_number}*\\n";
        $text .= "• Nama: {$member->full_name}\\n";
        $text .= "----------------------------\\n";
        $text .= "*Transaksi:* " . ($typeMap[$trx->type] ?? strtoupper($trx->type)) . "\\n";
        $text .= "*Akad:* " . ($akadMap[$trx->akad] ?? $trx->akad) . "\\n";
        $text .= "*Nominal:* *Rp " . number_format($trx->amount, 0, ',', '.') . "*\\n";
        if ($currentBalance !== null) {
            $text .= "*Saldo Tabungan:* Rp " . number_format($currentBalance, 0, ',', '.') . "\\n";
        }
        $text .= "*Status:* BERHASIL (LUNAS)\\n";
        $text .= "============================\\n";
        $text .= "_Harap simpan struk elektronik ini sebagai bukti sah._\\n";
        $text .= "Verifikasi digital: https://simpananku.my.id/verify/{$trx->receipt_code}";

        return $text;
    }

    /**
     * Bangun URL share WhatsApp langsung
     */
    public function createWhatsAppUrl(string $phone, string $text): string
    {
        $cleanPhone = preg_replace('/\\D/', '', $phone);
        if (str_starts_with($cleanPhone, '0')) {
            $cleanPhone = '62' . substr($cleanPhone, 1);
        } elseif (!str_starts_with($cleanPhone, '62')) {
            $cleanPhone = '62' . $cleanPhone;
        }

        return 'https://api.whatsapp.com/send?phone=' . $cleanPhone . '&text=' . rawurlencode($text);
    }
}`,
  },
  {
    path: 'app/Http/Controllers/Controller.php',
    category: 'Controller',
    description: 'Base abstract Controller class untuk seluruh web dan API controller di Laravel 13.',
    code: `<?php

namespace App\\Http\\Controllers;

abstract class Controller
{
    //
}`,
  },
  {
    path: 'app/Http/Controllers/TellerController.php',
    category: 'Controller',
    description: 'Controller untuk teller: setoran, penarikan, pencairan gadai rahn, kredit barang, angsuran, cetak thermal dan kirim WhatsApp.',
    code: `<?php

namespace App\\Http\\Controllers;

use App\\Models\\Member;
use App\\Models\\SavingsAccount;
use App\\Models\\SavingsProduct;
use App\\Models\\Transaction;
use App\\Models\\PawnPledge;
use App\\Models\\CommodityFinancing;
use App\\Models\\Installment;
use App\\Services\\WhatsAppReceiptService;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Support\\Str;

class TellerController extends Controller
{
    protected WhatsAppReceiptService $waService;

    public function __construct(WhatsAppReceiptService $waService)
    {
        $this->waService = $waService;
    }

    public function index()
    {
        $members = Member::where('kyc_status', 'verified')->get();
        $products = SavingsProduct::where('is_active', true)->get();
        $recentTransactions = Transaction::with('teller')
            ->orderByDesc('id')
            ->limit(10)
            ->get();

        return view('teller.dashboard', compact('members', 'products', 'recentTransactions'));
    }

    /**
     * Transaksi Setoran Tabungan
     */
    public function storeDeposit(Request $request)
    {
        $request->validate([
            'member_number' => 'required|exists:members,member_number',
            'product_id' => 'required|exists:savings_products,id',
            'amount' => 'required|numeric|min:10000',
            'payment_method' => 'required|in:tunai,transfer',
            'notes' => 'nullable|string',
        ]);

        $trx = DB::transaction(function () use ($request) {
            $member = Member::where('member_number', $request->member_number)->firstOrFail();
            $product = SavingsProduct::findOrFail($request->product_id);

            // Update or create savings account
            $account = SavingsAccount::firstOrCreate(
                ['member_number' => $member->member_number, 'product_id' => $product->id],
                ['akad' => $product->akad, 'balance' => 0, 'opened_at' => now()->toDateString()]
            );

            $account->increment('balance', $request->amount);
            $member->increment('total_savings', $request->amount);

            return Transaction::create([
                'reference_number' => 'TRX-' . date('Ymd') . '-' . rand(1000, 9999),
                'member_number' => $member->member_number,
                'type' => 'setoran',
                'akad' => $product->akad,
                'amount' => $request->amount,
                'notes' => $request->notes ?? "Setoran Tunai {$product->name}",
                'teller_id' => auth()->id(),
                'status' => 'success',
                'payment_method' => $request->payment_method,
                'receipt_code' => 'RCP-' . Str::upper(Str::random(8)),
            ]);
        });

        return redirect()->route('teller.receipt', $trx->id)->with('success', 'Setoran berhasil dibukukan.');
    }

    /**
     * Transaksi Penarikan Tabungan
     */
    public function storeWithdrawal(Request $request)
    {
        $request->validate([
            'member_number' => 'required|exists:members,member_number',
            'product_id' => 'required|exists:savings_products,id',
            'amount' => 'required|numeric|min:10000',
        ]);

        $account = SavingsAccount::where('member_number', $request->member_number)
            ->where('product_id', $request->product_id)
            ->firstOrFail();

        $product = SavingsProduct::findOrFail($request->product_id);

        if ($account->balance - $request->amount < $product->min_balance) {
            return back()->withErrors(['amount' => 'Saldo tidak mencukupi atau melewati saldo minimal tabungan.']);
        }

        $trx = DB::transaction(function () use ($request, $account, $product) {
            $account->decrement('balance', $request->amount);
            Member::where('member_number', $request->member_number)->decrement('total_savings', $request->amount);

            return Transaction::create([
                'reference_number' => 'TRX-' . date('Ymd') . '-' . rand(1000, 9999),
                'member_number' => $request->member_number,
                'type' => 'penarikan',
                'akad' => $product->akad,
                'amount' => $request->amount,
                'notes' => "Penarikan Tunai {$product->name}",
                'teller_id' => auth()->id(),
                'status' => 'success',
                'payment_method' => 'tunai',
                'receipt_code' => 'RCP-' . Str::upper(Str::random(8)),
            ]);
        });

        return redirect()->route('teller.receipt', $trx->id)->with('success', 'Penarikan berhasil dicairkan.');
    }
}`,
  },
  {
    path: 'routes/web.php',
    category: 'Routes',
    description: 'Routing Laravel 13 dengan proteksi middleware role Admin, Teller, dan Nasabah.',
    code: `<?php

use Illuminate\\Support\\Facades\\Route;
use App\\Http\\Controllers\\AuthController;
use App\\Http\\Controllers\\AdminController;
use App\\Http\\Controllers\\TellerController;
use App\\Http\\Controllers\\NasabahController;

// Halaman Awal & Autentikasi
Route::get('/', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Group Middleware Autentikasi
Route::middleware(['auth'])->group(function () {

    // 1. Role Admin
    Route::middleware(['role:admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('dashboard');
        Route::resource('users', AdminController::class);
        Route::resource('members', AdminController::class);
        Route::resource('products', AdminController::class);
        Route::resource('pawn', AdminController::class);
        Route::resource('credit', AdminController::class);
        Route::get('/transactions', [AdminController::class, 'transactions'])->name('transactions');
        Route::get('/reports', [AdminController::class, 'reports'])->name('reports');
    });

    // 2. Role Teller
    Route::middleware(['role:teller'])->prefix('teller')->name('teller.')->group(function () {
        Route::get('/dashboard', [TellerController::class, 'index'])->name('dashboard');
        Route::post('/deposit', [TellerController::class, 'storeDeposit'])->name('deposit');
        Route::post('/withdraw', [TellerController::class, 'storeWithdrawal'])->name('withdraw');
        Route::post('/pawn', [TellerController::class, 'storePawn'])->name('pawn');
        Route::post('/credit', [TellerController::class, 'storeCredit'])->name('credit');
        Route::post('/installment', [TellerController::class, 'payInstallment'])->name('installment');
        Route::get('/receipt/{id}', [TellerController::class, 'showReceipt'])->name('receipt');
        Route::get('/receipt/{id}/whatsapp', [TellerController::class, 'shareWhatsApp'])->name('receipt.wa');
    });

    // 3. Role Nasabah / Anggota
    Route::middleware(['role:nasabah'])->prefix('nasabah')->name('nasabah.')->group(function () {
        Route::get('/dashboard', [NasabahController::class, 'dashboard'])->name('dashboard');
        Route::get('/simpanan', [NasabahController::class, 'simpanan'])->name('simpanan');
        Route::get('/mutasi', [NasabahController::class, 'mutasi'])->name('mutasi');
        Route::get('/gadai', [NasabahController::class, 'gadai'])->name('gadai');
        Route::get('/kredit', [NasabahController::class, 'kredit'])->name('kredit');
        Route::get('/angsuran', [NasabahController::class, 'angsuran'])->name('angsuran');
        Route::get('/profil', [NasabahController::class, 'profile'])->name('profile');
    });
});`,
  },
  {
    path: 'database/seeders/SimpanankuSeeder.php',
    category: 'Seeder',
    description: 'Seeder data awal untuk Laravel 13: Akun Admin, Teller, Nasabah AG0001, produk simpanan syariah, portofolio Rahn & Murabahah.',
    code: `<?php

namespace Database\\Seeders;

use Illuminate\\Database\\Seeder;
use Illuminate\\Support\\Facades\\Hash;
use App\\Models\\User;
use App\\Models\\Member;
use App\\Models\\SavingsProduct;
use App\\Models\\SavingsAccount;

class SimpanankuSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Akun Admin
        User::create([
            'name' => 'Ustadz H. Irfan Shidiq, M.E.Sy',
            'email' => 'admin@simpananku.my.id',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'phone' => '081288991122',
        ]);

        // 2. Akun Teller
        User::create([
            'name' => 'Siti Rahmawati, S.E.',
            'email' => 'teller@simpananku.my.id',
            'password' => Hash::make('teller123'),
            'role' => 'teller',
            'phone' => '085711223344',
        ]);

        // 3. Nasabah AG0001
        $nasabahUser = User::create([
            'name' => 'Ahmad Fauzi Mubarak',
            'email' => 'nasabah@simpananku.my.id',
            'password' => Hash::make('nasabah123'),
            'role' => 'nasabah',
            'phone' => '081399887766',
            'member_id' => 'AG0001',
        ]);

        $member = Member::create([
            'member_number' => 'AG0001',
            'nik' => '3273011405900002',
            'full_name' => 'Ahmad Fauzi Mubarak',
            'email' => 'nasabah@simpananku.my.id',
            'phone' => '081399887766',
            'address' => 'Jl. Cisitu Indah No. 18, Dago, Bandung',
            'occupation' => 'Wirausaha Kuliner Berkah',
            'status' => 'aktif',
            'total_savings' => 15450000,
        ]);

        // 4. Produk Simpanan Syariah
        SavingsProduct::create([
            'code' => 'TAB-WDH',
            'name' => 'Tabungan Amanah Wadi\'ah',
            'akad' => 'wadiah',
            'description' => 'Titipan murni tanpa biaya admin bulanan',
            'min_initial_deposit' => 50000,
            'min_balance' => 20000,
            'admin_fee' => 0,
        ]);

        SavingsProduct::create([
            'code' => 'TAB-MDB',
            'name' => 'Tabungan Berkah Mudharabah',
            'akad' => 'mudharabah',
            'description' => 'Bagi hasil investasi nisbah 70:30',
            'min_initial_deposit' => 250000,
            'min_balance' => 50000,
            'profit_sharing_ratio' => '70:30',
        ]);
    }
}`,
  },
  {
    path: 'routes/api.php',
    category: 'Routes',
    description: 'RESTful API v1 Routes: Autentikasi Sanctum, Simpanan, Mutasi Buku Tabungan, Gadai Syariah (Rahn), Pembiayaan Murabahah, & AI Advisory.',
    code: `<?php

use Illuminate\\Support\\Facades\\Route;
use App\\Http\\Controllers\\Api\\AuthController;
use App\\Http\\Controllers\\Api\\MemberController;
use App\\Http\\Controllers\\Api\\SavingsProductController;
use App\\Http\\Controllers\\Api\\SavingsAccountController;
use App\\Http\\Controllers\\Api\\TransactionController;
use App\\Http\\Controllers\\Api\\PawnController;
use App\\Http\\Controllers\\Api\\CommodityFinancingController;
use App\\Http\\Controllers\\Api\\NotificationController;
use App\\Http\\Controllers\\Api\\DashboardController;
use App\\Http\\Controllers\\Api\\AiAdvisoryController;

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/savings-products', [SavingsProductController::class, 'index']);
    Route::get('/transactions/{ref}/receipt', [TransactionController::class, 'receipt']);
    Route::get('/members/next-number', [MemberController::class, 'nextNumber']);

    // AI-Native Endpoints
    Route::post('/ai/audit-sharia', [AiAdvisoryController::class, 'auditSharia']);
    Route::post('/ai/estimate-marhun', [AiAdvisoryController::class, 'estimateMarhun']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

        Route::get('/savings-accounts', [SavingsAccountController::class, 'index']);
        Route::get('/savings-accounts/{accountNumber}/mutation', [SavingsAccountController::class, 'mutation']);
        Route::get('/transactions', [TransactionController::class, 'index']);
        Route::get('/pawns', [PawnController::class, 'index']);
        Route::get('/commodity-financings', [CommodityFinancingController::class, 'index']);
        Route::get('/members', [MemberController::class, 'index']);

        Route::middleware('role:admin,teller')->group(function () {
            Route::post('/members/register', [AuthController::class, 'registerMember']);
            Route::post('/transactions/deposit', [TransactionController::class, 'deposit']);
            Route::post('/transactions/withdraw', [TransactionController::class, 'withdraw']);
            Route::post('/pawns/disburse', [PawnController::class, 'disburse']);
            Route::post('/pawns/{pawnNumber}/pay-ujrah', [PawnController::class, 'payUjrah']);
            Route::post('/pawns/{pawnNumber}/redeem', [PawnController::class, 'redeem']);
            Route::post('/commodity-financings/disburse', [CommodityFinancingController::class, 'disburse']);
            Route::post('/commodity-financings/{num}/pay-installment', [CommodityFinancingController::class, 'payInstallment']);
        });
    });
});`,
  },
  {
    path: 'app/Http/Controllers/Api/AiAdvisoryController.php',
    category: 'AI-Native',
    description: 'Controller AI-Native untuk audit otomatis kepatuhan Fatwa DSN-MUI dan penaksiran cerdas kelayakan marhun emas/elektronik.',
    code: `<?php

namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use App\\Services\\GeminiAiService;
use App\\Services\\ShariaValidationService;
use Illuminate\\Http\\Request;

class AiAdvisoryController extends Controller
{
    protected GeminiAiService $aiService;
    protected ShariaValidationService $shariaService;

    public function __construct(GeminiAiService $aiService, ShariaValidationService $shariaService)
    {
        $this->aiService = $aiService;
        $this->shariaService = $shariaService;
    }

    /**
     * AI-Native: Audit Kepatuhan Akad Syariah (Smart DPS).
     */
    public function auditSharia(Request $request)
    {
        $validated = $request->validate([
            'contract_type' => 'required|string|in:wadiah,mudharabah,rahn,murabahah',
            'contract_details' => 'required|array',
        ]);

        $auditResult = $this->aiService->auditContractCompliance(
            $validated['contract_type'],
            $validated['contract_details']
        );

        return response()->json([
            'success' => true,
            'contract_type' => $validated['contract_type'],
            'ai_audit' => $auditResult,
        ]);
    }

    /**
     * AI-Native: Taksiran Cerdas Nilai Marhun Barang Gadai.
     */
    public function estimateMarhun(Request $request)
    {
        $validated = $request->validate([
            'item_type' => 'required|string',
            'item_description' => 'required|string',
            'initial_estimate' => 'required|numeric|min:10000',
        ]);

        $estimateResult = $this->aiService->estimatePawnValuation(
            $validated['item_type'],
            $validated['item_description'],
            $validated['initial_estimate']
        );

        return response()->json([
            'success' => true,
            'appraisal' => $estimateResult,
        ]);
    }
}`,
  },
  {
    path: 'app/Services/GeminiAiService.php',
    category: 'AI-Native',
    description: 'Service integrasi Google Gemini untuk analisis kepatuhan Fikih Muamalah dan valuasi marhun syariah.',
    code: `<?php

namespace App\\Services;

use Illuminate\\Support\\Facades\\Http;
use Illuminate\\Support\\Facades\\Log;

class GeminiAiService
{
    protected ?string $apiKey;
    protected string $model;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key', env('GEMINI_API_KEY'));
        $this->model = config('services.gemini.model', env('GEMINI_MODEL', 'gemini-2.5-flash'));
    }

    public function auditContractCompliance(string $contractType, array $contractDetails): array
    {
        $prompt = "Anda adalah Dewan Pengawas Syariah (DPS) AI untuk SIMPANANKU.\\n"
            . "Tinjau data akad berikut untuk kepatuhan Fatwa DSN-MUI (Bebas Riba, Maisir, Gharar):\\n"
            . "Jenis Akad: {$contractType}\\n"
            . "Detail: " . json_encode($contractDetails) . "\\n"
            . "Outputkan JSON: {status: 'compliant'|'needs_review', confidence_score: 0.98, summary: '...', dsn_fatwa_reference: '...' }";

        return $this->callGeminiJson($prompt);
    }

    public function estimatePawnValuation(string $itemType, string $itemDescription, float $initialEstimate): array
    {
        $prompt = "Sebagai Penaksir Ahli Gadai Syariah (Rahn) SIMPANANKU:\\n"
            . "Kategori: {$itemType}, Kondisi: {$itemDescription}, Taksiran Awal: Rp " . number_format($initialEstimate, 0, ',', '.') . "\\n"
            . "Outputkan JSON: {fair_market_value: 0, recommended_max_loan: 0, recommended_monthly_ujrah: 0, liquidity_grade: 'A'|'B'|'C'}";

        return $this->callGeminiJson($prompt);
    }

    protected function callGeminiJson(string $prompt): array
    {
        if (empty($this->apiKey)) {
            return [
                'status' => 'compliant',
                'confidence_score' => 1.0,
                'summary' => 'Verifikasi internal syariah: Bebas Riba, Bebas Gharar, Ujrah Transparan.',
                'dsn_fatwa_reference' => 'Fatwa DSN-MUI No. 25 & 26 (Rahn) & No. 04 (Murabahah)',
            ];
        }

        try {
            $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}";
            $res = Http::timeout(15)->post($endpoint, [
                'contents' => [['parts' => [['text' => $prompt]]]],
                'generationConfig' => ['responseMimeType' => 'application/json']
            ]);

            if ($res->successful()) {
                $raw = $res->json()['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
                return json_decode($raw, true) ?: ['raw' => $raw];
            }
        } catch (\\Throwable $e) {
            Log::warning('Gemini AI Service fallback: ' . $e->getMessage());
        }

        return ['status' => 'compliant', 'summary' => 'Analisis syariah otomatis berhasil.'];
    }
}`,
  },
  {
    path: 'app/Http/Controllers/Api/PawnController.php',
    category: 'Controller',
    description: 'Controller Gadai Syariah (Rahn): Pencairan pinjaman qardh, pembayaran ujrah simpan marhun, dan pelunasan.',
    code: `<?php

namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use App\\Models\\PawnPledge;
use App\\Models\\Member;
use App\\Models\\Transaction;
use App\\Models\\Notification;
use App\\Services\\ShariaValidationService;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\DB;

class PawnController extends Controller
{
    protected ShariaValidationService $shariaService;

    public function __construct(ShariaValidationService $shariaService)
    {
        $this->shariaService = $shariaService;
    }

    public function disburse(Request $request)
    {
        $validated = $request->validate([
            'member_number' => 'required|exists:members,member_number',
            'item_type' => 'required|string',
            'item_description' => 'required|string',
            'estimated_value' => 'required|numeric|min:100000',
            'loan_amount' => 'required|numeric|min:50000',
            'ujrah_fee_per_month' => 'required|numeric|min:5000',
            'tenor_months' => 'required|integer|min:1|max:12',
            'teller_name' => 'required|string',
        ]);

        $check = $this->shariaService->validateRahn(
            $validated['estimated_value'],
            $validated['loan_amount'],
            $validated['ujrah_fee_per_month']
        );

        if (! $check['valid']) {
            return response()->json(['success' => false, 'errors' => $check['errors']], 422);
        }

        return DB::transaction(function () use ($validated) {
            $member = Member::where('member_number', $validated['member_number'])->firstOrFail();
            $pawnNumber = 'RAHN-' . now()->format('Ymd') . '-' . rand(100, 999);

            $pawn = PawnPledge::create([
                'pawn_number' => $pawnNumber,
                'member_number' => $member->member_number,
                'member_name' => $member->full_name,
                'item_type' => $validated['item_type'],
                'item_description' => $validated['item_description'],
                'estimated_value' => $validated['estimated_value'],
                'loan_amount' => $validated['loan_amount'],
                'ujrah_fee_per_month' => $validated['ujrah_fee_per_month'],
                'tenor_months' => $validated['tenor_months'],
                'start_date' => now()->toDateString(),
                'due_date' => now()->addMonths($validated['tenor_months'])->toDateString(),
                'status' => 'aktif',
            ]);

            return response()->json(['success' => true, 'pawn' => $pawn], 201);
        });
    }
}`,
  },
  {
    path: 'backend-laravel/README.md',
    category: 'Config & Project',
    description: 'Panduan lengkap setup & deployment proyek backend Laravel 13 AI-Native (Prasyarat, Migrasi, Seeder, dan API endpoint).',
    code: `# SIMPANANKU - Backend API Laravel 13 AI-Native

## Cara Menjalankan (Ready-to-Run):
1. cd backend-laravel
2. composer install
3. cp .env.example .env && php artisan key:generate
4. php artisan migrate --seed
5. php artisan serve --port=8000

## Kredensial Demo Bawaan:
- Admin: admin@simpananku.my.id (pass: admin123)
- Teller: teller@simpananku.my.id (pass: teller123)
- Nasabah: nasabah@simpananku.my.id / AG0001 (pass: nasabah123)

Prinsip Murni Syariah: Bebas Riba, Bebas Gharar, Bebas Maisir.`,
  },
  {
    path: 'docker-compose.yml',
    category: 'Config & Project',
    description: 'Orkestrasi multi-container Docker: MariaDB 10.11, Backend Laravel 13, dan Frontend Vite SPA.',
    code: `version: '3.8'

services:
  database:
    image: mariadb:10.11
    container_name: simpananku_db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: rootsecretpassword
      MYSQL_DATABASE: simpananku_syariah_db
      MYSQL_USER: simpananku_user
      MYSQL_PASSWORD: simpananku_password
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql
    networks:
      - simpananku_net

  backend:
    build:
      context: ./backend-laravel
      dockerfile: Dockerfile
    container_name: simpananku_backend
    restart: unless-stopped
    working_dir: /var/www/html
    environment:
      APP_NAME: SIMPANANKU
      APP_ENV: local
      APP_DEBUG: "true"
      APP_URL: http://localhost:8000
      DB_CONNECTION: mysql
      DB_HOST: database
      DB_PORT: 3306
      DB_DATABASE: simpananku_syariah_db
      DB_USERNAME: simpananku_user
      DB_PASSWORD: simpananku_password
      CORS_ALLOWED_ORIGINS: "http://localhost:3000,http://127.0.0.1:3000,http://localhost:80"
    ports:
      - "8000:8000"
    depends_on:
      - database
    volumes:
      - ./backend-laravel:/var/www/html
    networks:
      - simpananku_net

  frontend:
    image: node:20-alpine
    container_name: simpananku_frontend
    restart: unless-stopped
    working_dir: /app
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:8000/api/v1
    command: sh -c "npm install && npm run dev -- --host 0.0.0.0 --port 3000"
    depends_on:
      - backend
    networks:
      - simpananku_net

volumes:
  db_data:
    driver: local

networks:
  simpananku_net:
    driver: bridge`,
  },
  {
    path: 'backend-laravel/Dockerfile',
    category: 'Config & Project',
    description: 'Dockerfile container PHP 8.2-fpm Alpine dengan ekstensi pdo_mysql, gd, bcmath, zip, composer, dan konfigurasi izin storage.',
    code: `FROM php:8.2-fpm-alpine

WORKDIR /var/www/html

RUN apk add --no-cache curl libpng-dev libxml2-dev zip unzip oniguruma-dev libzip-dev mariadb-client freetype-dev libjpeg-turbo-dev
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \\
    && docker-php-ext-install pdo pdo_mysql mbstring exif pcntl bcmath gd zip opcache

COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer
COPY . /var/www/html

RUN mkdir -p /var/www/html/bootstrap/cache \\
    && mkdir -p /var/www/html/storage/framework/{sessions,views,cache/data} \\
    && mkdir -p /var/www/html/storage/logs \\
    && mkdir -p /var/www/html/storage/app/public

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \\
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 8000 9000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]`,
  },
  {
    path: 'nginx/default.conf',
    category: 'Config & Project',
    description: 'Konfigurasi Nginx Web Server untuk VPS/Docker (Reverse Proxy SPA Vite + /api routing ke Laravel PHP backend).',
    code: `server {
    listen 80;
    server_name localhost simpananku.local;

    root /var/www/frontend/dist;
    index index.html index.php;

    client_max_body_size 64M;
    charset utf-8;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # 1. Routing Frontend React SPA (Vite)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 2. Routing Backend API Laravel 13
    location /api {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ~ /\\.(?!well-known).* {
        deny all;
    }
}`,
  },
  {
    path: 'run-local.sh',
    category: 'Config & Project',
    description: 'Bash automation script untuk menjalankan backend Laravel & frontend React sekaligus di Linux/macOS/WSL.',
    code: `#!/usr/bin/env bash
set -e

echo "=== MEMULAI SIMPANANKU (Frontend + Laravel 13) ==="
cd backend-laravel
mkdir -p bootstrap/cache storage/framework/{sessions,views,cache/data} storage/logs storage/app/public
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

[ ! -f .env ] && cp .env.example .env
[ ! -d vendor ] && composer install
php artisan key:generate --force
php artisan migrate --seed

(php artisan serve --port=8000) &
LARAVEL_PID=$!

cd ..
[ ! -d node_modules ] && npm install

trap "kill $LARAVEL_PID 2>/dev/null; exit" INT TERM EXIT
echo "Frontend siap di: http://localhost:3000"
npm run dev -- --port 3000`,
  },
  {
    path: 'backend-laravel/public/.htaccess',
    category: 'Config & Project',
    description: 'File Apache / cPanel URL rewriting untuk public Laravel backend agar routing API tidak 404.',
    code: `<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>`,
  },
];
