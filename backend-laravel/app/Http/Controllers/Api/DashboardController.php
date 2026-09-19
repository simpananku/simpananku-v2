<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\SavingsAccount;
use App\Models\PawnPledge;
use App\Models\CommodityFinancing;
use App\Models\Transaction;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Ringkasan Metrik Finansial & Operasional Syariah.
     */
    public function stats(Request $request)
    {
        $totalMembers = Member::count();
        $totalSavings = SavingsAccount::where('status', 'active')->sum('balance');
        $activePawnsCount = PawnPledge::where('status', 'aktif')->count();
        $totalPawnLoan = PawnPledge::where('status', 'aktif')->sum('loan_amount');
        $activeFinancingCount = CommodityFinancing::where('status', 'berjalan')->count();
        $totalFinancingRemaining = CommodityFinancing::where('status', 'berjalan')->sum('remaining_amount');

        $recentTransactions = Transaction::orderBy('transaction_date', 'desc')->limit(10)->get();

        return response()->json([
            'success' => true,
            'institution' => [
                'name' => config('app.name'),
                'type' => 'Lembaga Pengelolaan Keuangan Syariah Non-Koperasi',
                'standards' => 'Fatwa DSN-MUI (Bebas Riba, Maisir, & Gharar)',
            ],
            'metrics' => [
                'total_members' => $totalMembers,
                'total_savings' => (float) $totalSavings,
                'active_pawns_count' => $activePawnsCount,
                'total_pawn_loan' => (float) $totalPawnLoan,
                'active_financings_count' => $activeFinancingCount,
                'total_financing_remaining' => (float) $totalFinancingRemaining,
            ],
            'recent_transactions' => $recentTransactions,
        ]);
    }
}
