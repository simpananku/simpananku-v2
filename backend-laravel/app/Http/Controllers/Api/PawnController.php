<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PawnPledge;
use App\Models\Member;
use App\Models\Transaction;
use App\Models\Notification;
use App\Services\ShariaValidationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PawnController extends Controller
{
    protected ShariaValidationService $shariaService;

    public function __construct(ShariaValidationService $shariaService)
    {
        $this->shariaService = $shariaService;
    }

    public function index(Request $request)
    {
        $query = PawnPledge::withSum(['transactions as paid_ujrah_total' => fn ($q) => $q->where('type', 'biaya_ujrah')], 'amount')->orderBy('created_at', 'desc');
        if ($request->user()->role === 'nasabah') $query->where('member_number', $request->user()->member_id);

        if ($request->filled('member_number')) {
            $query->where('member_number', $request->member_number);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    /**
     * Pencairan Akad Gadai Syariah (Rahn).
     */
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
            'notes' => 'nullable|string',
        ]);

        // Verifikasi Kepatuhan Syariah Rahn
        $check = $this->shariaService->validateRahn(
            $validated['estimated_value'],
            $validated['loan_amount'],
            $validated['ujrah_fee_per_month']
        );

        if (! $check['valid']) {
            return response()->json([
                'success' => false,
                'message' => 'Ketentuan Gadai tidak memenuhi parameter syariah.',
                'errors' => $check['errors'],
            ], 422);
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
                'notes' => $validated['notes'] ?? 'Akad Rahn & Ijarah Titipan Marhun sah',
            ]);

            // Catat Transaksi Pengeluaran Kas Pencairan Pinjaman
            $refNumber = 'TRX-' . now()->format('Ymd') . '-' . rand(1000, 9999);
            $tx = Transaction::create([
                'reference_number' => $refNumber,
                'account_id' => $pawn->pawn_number,
                'member_number' => $member->member_number,
                'member_name' => $member->full_name,
                'type' => 'pencairan_gadai',
                'amount' => $validated['loan_amount'],
                'balance_after' => 0,
                'description' => "Pencairan pinjaman Gadai Syariah ({$validated['item_type']})",
                'teller_name' => $validated['teller_name'],
                'status' => 'success',
                'transaction_date' => now(),
            ]);

            $member->refreshTotalSavings();

            Notification::create([
                'title' => 'Pencairan Gadai Syariah Berhasil',
                'message' => "Akad Rahn nomor {$pawnNumber} telah disetujui. Dana qardh Rp " . number_format($validated['loan_amount'], 0, ',', '.') . " telah diserahkan.",
                'category' => 'gadai',
                'target_member_number' => $member->member_number,
            ]);

            return response()->json([
                'success' => true,
                'message' => "Akad Gadai Syariah {$pawnNumber} berhasil dibukukan.",
                'pawn' => $pawn,
                'transaction' => $tx,
            ], 201);
        });
    }

    /**
     * Pembayaran Biaya Ujrah Pemeliharaan Marhun.
     */
    public function payUjrah(Request $request, $pawnNumber)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1000',
            'teller_name' => 'required|string',
        ]);

        return DB::transaction(function () use ($validated, $pawnNumber) {
            $pawn = PawnPledge::where('pawn_number', $pawnNumber)->firstOrFail();
            $member = Member::where('member_number', $pawn->member_number)->firstOrFail();

            $refNumber = 'TRX-' . now()->format('Ymd') . '-' . rand(1000, 9999);
            $tx = Transaction::create([
                'reference_number' => $refNumber,
                'account_id' => $pawn->pawn_number,
                'member_number' => $member->member_number,
                'member_name' => $member->full_name,
                'type' => 'biaya_ujrah',
                'amount' => $validated['amount'],
                'balance_after' => 0,
                'description' => "Pembayaran jasa simpan titipan (ujrah) Rahn {$pawn->pawn_number}",
                'teller_name' => $validated['teller_name'],
                'status' => 'success',
                'transaction_date' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pembayaran ujrah berhasil dicatat.',
                'transaction' => $tx,
            ]);
        });
    }

    /**
     * Pelunasan Pinjaman Qardh & Pengambilan Barang Gadai (Marhun).
     */
    public function redeem(Request $request, $pawnNumber)
    {
        $validated = $request->validate([
            'teller_name' => 'required|string',
        ]);

        return DB::transaction(function () use ($validated, $pawnNumber) {
            $pawn = PawnPledge::where('pawn_number', $pawnNumber)->firstOrFail();
            $member = Member::where('member_number', $pawn->member_number)->firstOrFail();

            $pawn->status = 'lunas';
            $pawn->save();

            $refNumber = 'TRX-' . now()->format('Ymd') . '-' . rand(1000, 9999);
            $tx = Transaction::create([
                'reference_number' => $refNumber,
                'account_id' => $pawn->pawn_number,
                'member_number' => $member->member_number,
                'member_name' => $member->full_name,
                'type' => 'pelunasan_gadai',
                'amount' => $pawn->loan_amount,
                'balance_after' => 0,
                'description' => "Pelunasan pokok Gadai Syariah {$pawn->pawn_number} & serah terima marhun",
                'teller_name' => $validated['teller_name'],
                'status' => 'success',
                'transaction_date' => now(),
            ]);

            $member->refreshTotalSavings();

            Notification::create([
                'title' => 'Pelunasan Gadai Syariah Selesai',
                'message' => "Alhamdulillah, akad Rahn {$pawnNumber} telah lunas. Barang jaminan ({$pawn->item_description}) siap diserahterimakan.",
                'category' => 'gadai',
                'target_member_number' => $member->member_number,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Gadai syariah berhasil dilunasi.',
                'pawn' => $pawn,
                'transaction' => $tx,
            ]);
        });
    }
}
