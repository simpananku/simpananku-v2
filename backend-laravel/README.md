# SIMPANANKU - Backend API Laravel 13 AI-Native

Backend RESTful API berbasis **Laravel 13** dan berarsitektur **AI-Native** untuk mendukung ekosistem **SIMPANANKU**: Sistem Pengelolaan Simpanan Tabungan Syariah, Gadai Syariah (*Rahn*), dan Kredit Barang Syariah (*Murabahah Bi Tsaman 'Aajil*) tanpa bunga/riba.

---

## 🌟 Fitur Utama & Kepatuhan Syariah (DSN-MUI)

1. **Simpanan Tabungan Syariah**:
   - **Akad Wadiah Yad Dhamanah**: Titipan murni tanpa biaya administrasi bulanan yang menggerus pokok (*zero admin fee*).
   - **Akad Mudharabah Muthlaqah**: Investasi bagi hasil dengan nisbah keuntungan transparan (misal 70:30) yang disalurkan ke sektor riil halal.
   - Penomoran Anggota Terstandarisasi: Format urut **AG0001**, **AG0002**, dst.
   - Mutasi Buku Tabungan Digital & Cetak Kwitansi Transaksi.

2. **Gadai Syariah (*Rahn & Ijarah Titipan*)**:
   - Akad *Qardh* (pinjaman kebajikan) dan *Rahn* (penahanan barang jaminan/marhun).
   - Biaya *Ujrah* (jasa simpan/pemeliharaan) dihitung berdasarkan spesifikasi taksiran fisik marhun, **BUKAN** dari persentase uang pinjaman (menghindari riba *qardh bi za'idah*).
   - Pencairan pinjaman hingga 80-85% taksiran, pembayaran ujrah berkala, dan pelunasan gadai untuk pengambilan kembali barang jaminan.

3. **Kredit Barang Syariah (*Murabahah*)**:
   - Jual-beli barang/komoditas dengan keterbukaan harga beli pokok dan margin keuntungan yang disepakati di awal akad.
   - Cicilan bulanan flat tanpa sistem bunga berbunga dan tanpa denda bunga keterlambatan.

4. **Kecerdasan Buatan (AI-Native Integration)**:
   - **Sharia Smart Contract Checker**: Verifikasi kepatuhan teks akad terhadap Fatwa DSN-MUI secara otomatis via Gemini AI.
   - **Smart Marhun Appraisal**: Estimasi nilai wajar pasar dan rekomendasi plafon pinjaman gadai berbasis AI.

---

## 📂 Struktur Direktori Proyek

```text
backend-laravel/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   ├── AiAdvisoryController.php
│   │   │   ├── AuthController.php
│   │   │   ├── CommodityFinancingController.php
│   │   │   ├── DashboardController.php
│   │   │   ├── MemberController.php
│   │   │   ├── NotificationController.php
│   │   │   ├── PawnController.php
│   │   │   ├── SavingsAccountController.php
│   │   │   ├── SavingsProductController.php
│   │   │   └── TransactionController.php
│   │   └── Middleware/
│   │       └── EnsureUserRole.php
│   ├── Models/
│   │   ├── CommodityFinancing.php
│   │   ├── Member.php
│   │   ├── Notification.php
│   │   ├── PawnPledge.php
│   │   ├── SavingsAccount.php
│   │   ├── SavingsProduct.php
│   │   ├── Transaction.php
│   │   └── User.php
│   └── Services/
│       ├── GeminiAiService.php
│       └── ShariaValidationService.php
├── bootstrap/
│   └── app.php (Laravel 13 Modern Bootstrap)
├── config/
│   ├── app.php
│   ├── auth.php
│   ├── cors.php
│   ├── database.php
│   └── sanctum.php
├── database/
│   ├── migrations/
│   │   ├── 0001_01_01_000000_create_users_table.php
│   │   ├── 2026_01_01_000001_create_members_table.php
│   │   ├── 2026_01_01_000002_create_savings_products_table.php
│   │   ├── 2026_01_01_000003_create_savings_accounts_table.php
│   │   ├── 2026_01_01_000004_create_transactions_table.php
│   │   ├── 2026_01_01_000005_create_pawn_pledges_table.php
│   │   ├── 2026_01_01_000006_create_commodity_financings_table.php
│   │   ├── 2026_01_01_000007_create_notifications_table.php
│   │   └── 2026_01_01_000008_create_personal_access_tokens_table.php
│   └── seeders/
│       └── DatabaseSeeder.php
├── routes/
│   ├── api.php
│   ├── console.php
│   └── web.php
├── .env.example
├── artisan
├── composer.json
└── README.md
```

---

## 🚀 Panduan Instalasi & Menjalankan (Ready-to-Run)

### 1. Prasyarat Sistem
- PHP >= 8.2 dengan ekstensi `pdo_mysql`, `openssl`, `mbstring`, `curl`
- Composer 2.x
- MySQL 8.0+ atau MariaDB 10.4+ (atau SQLite untuk uji coba lokal kilat)

### 2. Pemasangan Dependensi & Pembuatan Folder Cache/Storage
Buka terminal dan masuk ke folder `backend-laravel`:
```bash
cd backend-laravel
composer install
```

> **Catatan Windows / Laragon**:
> Jika muncul pesan `The ...\bootstrap\cache directory must be present and writable`, pastikan folder `bootstrap/cache` dan `storage` telah dibuat:
>
> Di **Windows Command Prompt (cmd)**:
> ```cmd
> mkdir bootstrap\cache
> mkdir storage\app\public
> mkdir storage\framework\cache\data
> mkdir storage\framework\sessions
> mkdir storage\framework\views
> mkdir storage\logs
> ```
> Atau di **Git Bash / PowerShell / Terminal**:
> ```bash
> mkdir -p bootstrap/cache storage/framework/{sessions,views,cache/data} storage/logs storage/app/public
> ```

### 3. Konfigurasi Lingkungan (.env)
Salin berkas `.env.example` ke `.env`:
```bash
cp .env.example .env
php artisan key:generate
```

Sesuaikan kredensial basis data di dalam `.env`:
```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=simpananku_syariah_db
DB_USERNAME=root
DB_PASSWORD=

# Kunci Gemini AI untuk fitur AI-Native (Opsional, ada fallback cerdas otomatis)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Eksekusi Migrasi & Data Uji (Seeder)
Jalankan migrasi skema tabel beserta seluruh akun demo dan data syariah:
```bash
php artisan migrate --seed
```

### 5. Jalankan Server Pengembangan
```bash
php artisan serve --port=8000
```
API akan aktif pada: `http://localhost:8000`

---

## 🔑 Akun Uji Coba Terdaftar (Hasil Seeder)

| Peran | Nama Pengguna / Email | Kata Sandi | Keterangan |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@simpananku.my.id` | `admin123` | Akses penuh audit syariah, produk, & laporan |
| **Teller Kasir** | `teller@simpananku.my.id` | `teller123` | Layanan setoran, penarikan, gadai, & kredit |
| **Nasabah 1** | `nasabah@simpananku.my.id` (AG0001) | `nasabah123` | Saldo tabungan, 1 akad Rahn aktif, 1 Murabahah |
| **Nasabah 2** | `khadijah@simpananku.my.id` (AG0002) | `nasabah123` | Tabungan Wadiah & Tabungan Qurban/Haji |
| **Nasabah 3** | `bambang@gmail.com` (AG0003) | `nasabah123` | Tabungan Sukarela Wadiah |

---

## 📡 Daftar Endpoint API (v1)

### Otentikasi & Profil
- `POST /api/v1/auth/login` - Masuk sistem (Email / No. Anggota / No. HP + Password)
- `GET /api/v1/auth/me` - Ambil profil pengguna login
- `POST /api/v1/auth/logout` - Keluar & hapus token Sanctum
- `POST /api/v1/members/register` - Pendaftaran anggota baru (*Teller / Admin*)

### Simpanan & Tabungan
- `GET /api/v1/savings-products` - Daftar produk simpanan
- `GET /api/v1/savings-accounts` - Daftar rekening tabungan
- `GET /api/v1/savings-accounts/{accountNumber}/mutation` - Mutasi buku tabungan digital
- `POST /api/v1/transactions/deposit` - Setoran tunai syariah
- `POST /api/v1/transactions/withdraw` - Penarikan tunai tabungan
- `GET /api/v1/transactions/{ref}/receipt` - Data kwitansi resmi transaksi

### Gadai Syariah (Rahn)
- `GET /api/v1/pawns` - Daftar transaksi gadai
- `POST /api/v1/pawns/disburse` - Akad baru & pencairan qardh gadai
- `POST /api/v1/pawns/{pawnNumber}/pay-ujrah` - Pembayaran jasa titip marhun
- `POST /api/v1/pawns/{pawnNumber}/redeem` - Pelunasan pinjaman & serah terima barang

### Kredit Barang Syariah (Murabahah)
- `GET /api/v1/commodity-financings` - Daftar pembiayaan barang
- `POST /api/v1/commodity-financings/disburse` - Realisasi pengadaan barang cicil
- `POST /api/v1/commodity-financings/{financingNumber}/pay-installment` - Bayar angsuran

### AI-Native Intelligence
- `POST /api/v1/ai/audit-sharia` - Audit otomatis teks & ketentuan akad via AI
- `POST /api/v1/ai/estimate-marhun` - Taksiran cerdas kelayakan marhun emas/elektronik

---

## 🔗 Menghubungkan Frontend React dengan Laravel Backend

Pada berkas `.env` aplikasi frontend React, arahkan URL API ke server Laravel:
```ini
VITE_API_URL=http://localhost:8000/api/v1
```
Frontend React yang telah dibangun akan langsung berkomunikasi dengan endpoint Laravel 13 ini secara otomatis!
