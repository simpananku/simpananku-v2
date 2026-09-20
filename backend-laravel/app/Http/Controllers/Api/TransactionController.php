<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\SavingsAccount;
use App\Models\Member;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = Transaction::orderBy('transaction_date', 'desc');
        if ($request->user()->role === 'nasabah') $query->where('member_number', $request->user()->member_id);

        if ($request->filled('member_number')) {
            $query->where('member_number', $request->member_number);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    /**
     * Transaksi Setoran Tunai Tabungan Syariah.
     */
    public function deposit(Request $request)
    {
        $validated = $request->validate([
            'account_number' => 'required|string',
            'amount' => 'required|numeric|min:10000',
            'description' => 'nullable|string',
            'teller_name' => 'required|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $account = SavingsAccount::where('account_number', $validated['account_number'])
                ->lockForUpdate()
                ->firstOrFail();

            $member = Member::where('member_number', $account->member_number)->firstOrFail();
            if ($account->status !== 'active' || ($account->balance == 0 && $validated['amount'] < $account->product->min_initial_deposit)) {
                return response()->json(['success' => false, 'message' => 'Rekening tidak aktif atau setoran awal di bawah minimum produk.'], 422);
            }

            // Tambah Saldo
            $newBalance = $account->balance + $validated['amount'];
            $account->balance = $newBalance;
            $account->save();

            // Refresh Saldo Total Anggota
            $member->refreshTotalSavings();

            // Buat Record Transaksi
            $refNumber = 'TRX-' . now()->format('Ymd') . '-' . rand(1000, 9999);
            $tx = Transaction::create([
                'reference_number' => $refNumber,
                'account_id' => $account->account_number,
                'member_number' => $member->member_number,
                'member_name' => $member->full_name,
                'type' => 'setoran',
                'amount' => $validated['amount'],
                'balance_after' => $newBalance,
                'description' => $validated['description'] ?? 'Setoran tabungan syariah',
                'teller_name' => $validated['teller_name'],
                'status' => 'success',
                'transaction_date' => now(),
            ]);

            // Kirim Notifikasi Real-time
            Notification::create([
                'title' => 'Setoran Tabungan Berhasil',
                'message' => "Alhamdulillah, setoran Rp " . number_format($validated['amount'], 0, ',', '.') . " pada rekening {$account->product_name} telah dibukukan. Saldo baru: Rp " . number_format($newBalance, 0, ',', '.'),
                'category' => 'simpanan',
                'target_member_number' => $member->member_number,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Setoran syariah berhasil diproses.',
                'transaction' => $tx,
                'updated_account' => $account,
                'updated_member' => $member->fresh(),
            ]);
        });
    }

    /**
     * Transaksi Penarikan Tunai Tabungan Syariah.
     */
    public function withdraw(Request $request)
    {
        $validated = $request->validate([
            'account_number' => 'required|string',
            'amount' => 'required|numeric|min:10000',
            'description' => 'nullable|string',
            'teller_name' => 'required|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $account = SavingsAccount::where('account_number', $validated['account_number'])
                ->lockForUpdate()
                ->firstOrFail();

            $member = Member::where('member_number', $account->member_number)->firstOrFail();
            $product = $account->product;
            $minBalance = $product ? $product->min_balance : 20000;

            if (($account->balance - $validated['amount']) < $minBalance) {
                return response()->json([
                    'success' => false,
                    'message' => "Saldo tidak mencukupi. Saldo minimum mengendap adalah Rp " . number_format($minBalance, 0, ',', '.'),
                ], 422);
            }

            // Kurangi Saldo
            $newBalance = $account->balance - $validated['amount'];
            $account->balance = $newBalance;
            $account->save();

            // Refresh Saldo Total Anggota
            $member->refreshTotalSavings();

            // Buat Record Transaksi
            $refNumber = 'TRX-' . now()->format('Ymd') . '-' . rand(1000, 9999);
            $tx = Transaction::create([
                'reference_number' => $refNumber,
                'account_id' => $account->account_number,
                'member_number' => $member->member_number,
                'member_name' => $member->full_name,
                'type' => 'penarikan',
                'amount' => $validated['amount'],
                'balance_after' => $newBalance,
                'description' => $validated['description'] ?? 'Penarikan tunai tabungan syariah',
                'teller_name' => $validated['teller_name'],
                'status' => 'success',
                'transaction_date' => now(),
            ]);

            // Kirim Notifikasi Real-time
            Notification::create([
                'title' => 'Penarikan Tabungan Berhasil',
                'message' => "Penarikan Rp " . number_format($validated['amount'], 0, ',', '.') . " berhasil. Sisa saldo rekening {$account->product_name}: Rp " . number_format($newBalance, 0, ',', '.'),
                'category' => 'simpanan',
                'target_member_number' => $member->member_number,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Penarikan syariah berhasil diproses.',
                'transaction' => $tx,
                'updated_account' => $account,
                'updated_member' => $member->fresh(),
            ]);
        });
    }

    /**
     * Cetak Lembar Kwitansi Transaksi Sah.
     */
    public function receipt(Request $request, $referenceNumber)
    {
        $tx = Transaction::where('reference_number', $referenceNumber)->firstOrFail();
        abort_if($request->user()->role === 'nasabah' && $request->user()->member_id !== $tx->member_number, 403);
        $member = Member::where('member_number', $tx->member_number)->first();

        return response()->json([
            'success' => true,
            'institution' => [
                'name' => config('app.name'),
                'motto' => 'Amanah, Berkah, & Murni Syariah',
                'city' => env('INSTITUTION_CITY', 'Bandung'),
            ],
            'transaction' => $tx,
            'member' => $member,
        ]);
    }
}
