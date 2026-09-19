<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SavingsAccount;
use App\Models\SavingsProduct;
use App\Models\Member;
use App\Models\Transaction;
use Illuminate\Http\Request;

class SavingsAccountController extends Controller
{
    public function index(Request $request)
    {
        $query = SavingsAccount::with(['member', 'product']);

        if ($request->filled('member_number')) {
            $query->where('member_number', $request->member_number);
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    public function show($accountNumber)
    {
        $account = SavingsAccount::with(['member', 'product', 'transactions'])
            ->where('account_number', $accountNumber)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $account,
        ]);
    }

    /**
     * Mutasi Buku Tabungan Digital (Passbook)
     */
    public function mutation($accountNumber)
    {
        $account = SavingsAccount::where('account_number', $accountNumber)->firstOrFail();
        $member = Member::where('member_number', $account->member_number)->first();
        $transactions = Transaction::where('account_id', $accountNumber)
            ->orderBy('transaction_date', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'account' => $account,
            'member' => $member,
            'transactions' => $transactions,
        ]);
    }
}
