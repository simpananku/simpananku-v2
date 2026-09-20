<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommodityFinancing;
use App\Models\Member;
use App\Models\Transaction;
use App\Models\Notification;
use App\Services\ShariaValidationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommodityFinancingController extends Controller
{
    protected ShariaValidationService $shariaService;

    public function __construct(ShariaValidationService $shariaService)
    {
        $this->shariaService = $shariaService;
    }

    public function index(Request $request)
    {
        $query = CommodityFinancing::orderBy('created_at', 'desc');
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
     * Pengajuan & Realisasi Akad Kredit Barang Syariah (Murabahah).
     */
    public function disburse(Request $request)
    {
        $validated = $request->validate([
            'member_number' => 'required|exists:members,member_number',
            'item_name' => 'required|string|max:255',
            'item_category' => 'required|string|max:100',
            'purchase_price' => 'required|numeric|min:500000',
            'down_payment' => 'required|numeric|min:0',
            'margin_percentage' => 'required|numeric|min:0|max:50',
            'tenor_months' => 'required|integer|min:1|max:60',
            'teller_name' => 'required|string',
        ]);

        $marginAmount = ($validated['purchase_price'] - $validated['down_payment']) * ($validated['margin_percentage'] / 100);
        $totalFinancing = ($validated['purchase_price'] - $validated['down_payment']) + $marginAmount;
        $monthlyInstallment = ceil($totalFinancing / $validated['tenor_months']);

        $check = $this->shariaService->validateMurabahah(
            $validated['purchase_price'],
            $validated['down_payment'],
            $marginAmount,
            $validated['tenor_months']
        );

        if (! $check['valid']) {
            return response()->json([
                'success' => false,
                'message' => 'Akad Murabahah tidak memenuhi parameter syariah.',
                'errors' => $check['errors'],
            ], 422);
        }

        return DB::transaction(function () use ($validated, $marginAmount, $totalFinancing, $monthlyInstallment) {
            $member = Member::where('member_number', $validated['member_number'])->firstOrFail();
            $financingNumber = 'MRB-' . now()->format('Ymd') . '-' . rand(100, 999);

            $credit = CommodityFinancing::create([
                'financing_number' => $financingNumber,
                'member_number' => $member->member_number,
                'member_name' => $member->full_name,
                'item_name' => $validated['item_name'],
                'item_category' => $validated['item_category'],
                'purchase_price' => $validated['purchase_price'],
                'down_payment' => $validated['down_payment'],
                'margin_percentage' => $validated['margin_percentage'],
                'margin_amount' => $marginAmount,
                'total_financing' => $totalFinancing,
                'tenor_months' => $validated['tenor_months'],
                'monthly_installment' => $monthlyInstallment,
                'paid_amount' => 0,
                'remaining_amount' => $totalFinancing,
                'start_date' => now()->toDateString(),
                'end_date' => now()->addMonths($validated['tenor_months'])->toDateString(),
                'status' => 'berjalan',
            ]);

            // Catat Transaksi Pembelian Barang Akad Murabahah
            $refNumber = 'TRX-' . now()->format('Ymd') . '-' . rand(1000, 9999);
            $tx = Transaction::create([
                'reference_number' => $refNumber,
                'account_id' => $credit->financing_number,
                'member_number' => $member->member_number,
                'member_name' => $member->full_name,
                'type' => 'pencairan_kredit',
                'amount' => $validated['purchase_price'],
                'balance_after' => 0,
                'description' => "Pengadaan barang Murabahah ({$validated['item_name']})",
                'teller_name' => $validated['teller_name'],
                'status' => 'success',
                'transaction_date' => now(),
            ]);

            $member->refreshTotalSavings();

            Notification::create([
                'title' => 'Pembiayaan Murabahah Disetujui',
                'message' => "Akad jual-beli kredit barang {$validated['item_name']} ({$financingNumber}) telah disahkan. Angsuran bulanan tetap: Rp " . number_format($monthlyInstallment, 0, ',', '.'),
                'category' => 'kredit',
                'target_member_number' => $member->member_number,
            ]);

            return response()->json([
                'success' => true,
                'message' => "Pembiayaan kredit barang {$financingNumber} berhasil direalisasikan.",
                'credit' => $credit,
                'transaction' => $tx,
            ], 201);
        });
    }

    /**
     * Pembayaran Angsuran Bulanan Murabahah (Tanpa Denda Keterlambatan Berbunga).
     */
    public function payInstallment(Request $request, $financingNumber)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:10000',
            'teller_name' => 'required|string',
        ]);

        return DB::transaction(function () use ($validated, $financingNumber) {
            $credit = CommodityFinancing::where('financing_number', $financingNumber)->firstOrFail();
            $member = Member::where('member_number', $credit->member_number)->firstOrFail();

            $newPaid = $credit->paid_amount + $validated['amount'];
            $newRemaining = max(0, $credit->total_financing - $newPaid);
            $newStatus = ($newRemaining <= 0) ? 'lunas' : 'berjalan';

            $credit->update([
                'paid_amount' => $newPaid,
                'remaining_amount' => $newRemaining,
                'status' => $newStatus,
            ]);

            $refNumber = 'TRX-' . now()->format('Ymd') . '-' . rand(1000, 9999);
            $tx = Transaction::create([
                'reference_number' => $refNumber,
                'account_id' => $credit->financing_number,
                'member_number' => $member->member_number,
                'member_name' => $member->full_name,
                'type' => 'angsuran_kredit',
                'amount' => $validated['amount'],
                'balance_after' => $newRemaining,
                'description' => "Pembayaran cicilan Murabahah {$credit->item_name} ({$credit->financing_number})",
                'teller_name' => $validated['teller_name'],
                'status' => 'success',
                'transaction_date' => now(),
            ]);

            $member->refreshTotalSavings();

            Notification::create([
                'title' => 'Pembayaran Angsuran Diterima',
                'message' => "Alhamdulillah, angsuran Rp " . number_format($validated['amount'], 0, ',', '.') . " untuk {$credit->item_name} telah diterima. Sisa kewajiban: Rp " . number_format($newRemaining, 0, ',', '.'),
                'category' => 'kredit',
                'target_member_number' => $member->member_number,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pembayaran angsuran syariah berhasil diproses.',
                'credit' => $credit,
                'transaction' => $tx,
            ]);
        });
    }
}
