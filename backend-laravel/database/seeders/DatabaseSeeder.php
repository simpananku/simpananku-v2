<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Member;
use App\Models\SavingsProduct;
use App\Models\SavingsAccount;
use App\Models\Transaction;
use App\Models\PawnPledge;
use App\Models\CommodityFinancing;
use App\Models\Notification;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with complete Sharia data.
     */
    public function run(): void
    {
        // 1. Seed Users (Admin & Teller)
        $admin = User::create([
            'name' => 'Ustadz H. Irfan Shidiq, S.E.I., M.E.Sy',
            'email' => 'admin@simpananku.my.id',
            'role' => 'admin',
            'phone' => '081288991122',
            'password' => Hash::make('admin123'),
        ]);

        $teller = User::create([
            'name' => 'Siti Rahmawati, S.E. (Teller Syariah)',
            'email' => 'teller@simpananku.my.id',
            'role' => 'teller',
            'phone' => '085711223344',
            'password' => Hash::make('teller123'),
        ]);

        // 2. Seed Savings Products
        $wadiah = SavingsProduct::create([
            'code' => 'PRD-001',
            'name' => 'Simpanan Sukarela Wadiah (Titipan Murni)',
            'akad' => 'wadiah',
            'description' => 'Titipan murni (Yad Dhamanah) bebas biaya administrasi bulanan, dapat disetor dan ditarik tunai sewaktu-waktu.',
            'min_initial_deposit' => 50000,
            'min_balance' => 20000,
            'admin_fee' => 0,
            'is_active' => true,
        ]);

        $mudharabah = SavingsProduct::create([
            'code' => 'PRD-002',
            'name' => 'Simpanan Berjangka Mudharabah Berkah',
            'akad' => 'mudharabah',
            'description' => 'Investasi syariah dengan nisbah bagi hasil transparan 70:30 (Nasabah : Lembaga). Dana dikelola pada sektor riil halal.',
            'min_initial_deposit' => 500000,
            'min_balance' => 100000,
            'admin_fee' => 0,
            'profit_sharing_ratio' => '70:30',
            'is_active' => true,
        ]);

        $haji = SavingsProduct::create([
            'code' => 'PRD-003',
            'name' => 'Simpanan Qurban & Umrah Barakah',
            'akad' => 'wadiah',
            'description' => 'Tabungan terencana untuk persiapan ibadah qurban tahunan atau keberangkatan umrah baitullah.',
            'min_initial_deposit' => 100000,
            'min_balance' => 50000,
            'admin_fee' => 0,
            'is_active' => true,
        ]);

        // 3. Seed Members & Accounts
        $membersData = [
            [
                'member_number' => 'AG0001',
                'nik' => '3273011405900002',
                'full_name' => 'Ahmad Fauzi Mubarak',
                'email' => 'nasabah@simpananku.my.id',
                'phone' => '081399887766',
                'address' => 'Jl. Cisitu Indah No. 18, Dago, Coblong, Kota Bandung',
                'occupation' => 'Wirausaha Kuliner Berkah',
                'join_date' => '2025-02-15',
                'accounts' => [
                    ['prod' => $wadiah, 'balance' => 5450000],
                    ['prod' => $mudharabah, 'balance' => 10000000],
                ],
            ],
            [
                'member_number' => 'AG0002',
                'nik' => '3273022508920004',
                'full_name' => 'Khadijah Nurul Aini',
                'email' => 'khadijah@simpananku.my.id',
                'phone' => '082155667788',
                'address' => 'Komplek Permata Buah Batu Blok C-12, Bandung',
                'occupation' => 'Pendidik / Guru Madrasah',
                'join_date' => '2025-03-01',
                'accounts' => [
                    ['prod' => $wadiah, 'balance' => 8250000],
                    ['prod' => $haji, 'balance' => 3500000],
                ],
            ],
            [
                'member_number' => 'AG0003',
                'nik' => '3273031001850007',
                'full_name' => 'Bambang Trihatmojo',
                'email' => 'bambang@gmail.com',
                'phone' => '081977665544',
                'address' => 'Jl. Gegerkalong Tonggoh No. 45, Sukasari, Bandung',
                'occupation' => 'Pedagang Grosir Sembako',
                'join_date' => '2025-04-10',
                'accounts' => [
                    ['prod' => $wadiah, 'balance' => 2100000],
                ],
            ],
        ];

        foreach ($membersData as $m) {
            $member = Member::create([
                'member_number' => $m['member_number'],
                'nik' => $m['nik'],
                'full_name' => $m['full_name'],
                'email' => $m['email'],
                'phone' => $m['phone'],
                'address' => $m['address'],
                'occupation' => $m['occupation'],
                'status' => 'aktif',
                'join_date' => $m['join_date'],
                'total_savings' => 0,
            ]);

            // Buat User Nasabah
            User::create([
                'name' => $member->full_name,
                'email' => $member->email,
                'role' => 'nasabah',
                'phone' => $member->phone,
                'member_id' => $member->member_number,
                'password' => Hash::make('nasabah123'),
            ]);

            // Buat Rekening Simpanan
            $total = 0;
            foreach ($m['accounts'] as $accInfo) {
                $p = $accInfo['prod'];
                $bal = $accInfo['balance'];
                $total += $bal;

                SavingsAccount::create([
                    'account_number' => 'ACC-' . $member->member_number . '-' . $p->code,
                    'member_number' => $member->member_number,
                    'product_id' => $p->id,
                    'product_name' => $p->name,
                    'akad' => $p->akad,
                    'balance' => $bal,
                    'opened_at' => $m['join_date'],
                    'status' => 'active',
                ]);
            }

            $member->total_savings = $total;
            $member->save();
        }

        // 4. Seed Pawn Pledges (Rahn)
        PawnPledge::create([
            'pawn_number' => 'RAHN-20250501-001',
            'member_number' => 'AG0001',
            'member_name' => 'Ahmad Fauzi Mubarak',
            'item_type' => 'Emas Batangan Antam',
            'item_description' => 'Emas LM Antam 25 Gram Kadar 99.99% Bersertifikat Asli',
            'estimated_value' => 32500000,
            'loan_amount' => 25000000,
            'ujrah_fee_per_month' => 175000,
            'tenor_months' => 4,
            'start_date' => '2025-05-01',
            'due_date' => '2025-09-01',
            'status' => 'aktif',
            'notes' => 'Barang marhun tersimpan aman dalam khazanah brankas anti-api.',
        ]);

        // 5. Seed Commodity Financings (Murabahah)
        CommodityFinancing::create([
            'financing_number' => 'MRB-20250610-001',
            'member_number' => 'AG0001',
            'member_name' => 'Ahmad Fauzi Mubarak',
            'item_name' => 'Mesin Espresso Commercial 2-Group Rancilio',
            'item_category' => 'Peralatan Usaha',
            'purchase_price' => 35000000,
            'down_payment' => 5000000,
            'margin_percentage' => 10.00,
            'margin_amount' => 3000000,
            'total_financing' => 33000000,
            'tenor_months' => 12,
            'monthly_installment' => 2750000,
            'paid_amount' => 5500000,
            'remaining_amount' => 27500000,
            'start_date' => '2025-06-10',
            'end_date' => '2026-06-10',
            'status' => 'berjalan',
        ]);

        // 6. Seed Sample Transactions
        Transaction::create([
            'reference_number' => 'TRX-20250610-0081',
            'account_id' => 'ACC-AG0001-PRD-001',
            'member_number' => 'AG0001',
            'member_name' => 'Ahmad Fauzi Mubarak',
            'type' => 'setoran',
            'amount' => 2000000,
            'balance_after' => 5450000,
            'description' => 'Setoran tunai tabungan Wadiah',
            'teller_name' => 'Siti Rahmawati, S.E. (Teller Syariah)',
            'status' => 'success',
            'transaction_date' => '2025-06-10 10:15:00',
        ]);

        // 7. Seed Notifications
        Notification::create([
            'title' => 'Sistem Backend Laravel 13 AI-Native Aktif',
            'message' => 'Backend API Laravel 13 siap melayani operasional Simpanan, Gadai Rahn, dan Pembiayaan Murabahah sesuai standar DSN-MUI.',
            'category' => 'sistem',
            'target_member_number' => null,
            'read' => false,
            'created_at' => now(),
        ]);

        // Refresh counts
        foreach (Member::all() as $m) {
            $m->refreshTotalSavings();
        }
    }
}
