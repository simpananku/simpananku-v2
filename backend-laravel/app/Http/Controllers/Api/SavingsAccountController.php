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
    public function store(Request $request)
    {
        $data = $request->validate([
            'member_number' => 'required|exists:members,member_number',
            'product_id' => 'required|exists:savings_products,id',
        ]);
        $product = SavingsProduct::findOrFail($data['product_id']);
        abort_unless($product->is_active, 422, 'Produk simpanan tidak aktif.');
        $account = SavingsAccount::firstOrCreate(
            ['member_number' => $data['member_number'], 'product_id' => $product->id],
            ['account_number' => 'ACC-' . now()->format('Ymd') . '-' . strtoupper(\Illuminate\Support\Str::random(10)),
             'product_name' => $product->name, 'akad' => $product->akad, 'balance' => 0,
             'opened_at' => now()->toDateString(), 'status' => 'active']
        );
        return response()->json(['success' => true, 'data' => $account], $account->wasRecentlyCreated ? 201 : 200);
    }

    public function index(Request $request)
    {
        $query = SavingsAccount::with(['member', 'product']);
        if ($request->user()->role === 'nasabah') $query->where('member_number', $request->user()->member_id);

        if ($request->filled('member_number')) {
            $query->where('member_number', $request->member_number);
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    public function show(Request $request, $accountNumber)
    {
        $account = SavingsAccount::with(['member', 'product', 'transactions'])
            ->where('account_number', $accountNumber)
            ->firstOrFail();
        abort_if($request->user()->role === 'nasabah' && $request->user()->member_id !== $account->member_number, 403);

        return response()->json([
            'success' => true,
            'data' => $account,
        ]);
    }

    /**
     * Mutasi Buku Tabungan Digital (Passbook)
     */
    public function mutation(Request $request, $accountNumber)
    {
        $account = SavingsAccount::where('account_number', $accountNumber)->firstOrFail();
        abort_if($request->user()->role === 'nasabah' && $request->user()->member_id !== $account->member_number, 403);
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
