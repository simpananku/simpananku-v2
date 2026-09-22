<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommodityFinancing;
use App\Models\Member;
use App\Models\PawnPledge;
use App\Models\SavingsProduct;
use App\Models\SavingsAccount;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ManagementController extends Controller
{
    public function deleteMember(string $memberNumber)
    {
        $member = Member::where('member_number', $memberNumber)->firstOrFail();
        abort_if($member->savingsAccounts()->where('balance', '>', 0)->exists() || $member->transactions()->exists() || $member->pawnPledges()->exists() || $member->commodityFinancings()->exists(), 422, 'Anggota dengan saldo, transaksi, atau akad tercatat tidak dapat dihapus.');
        DB::transaction(function () use ($member) {
            $member->user?->tokens()->delete();
            if ($member->user) DB::table('sessions')->where('user_id', $member->user->id)->delete();
            $member->user?->delete();
            $member->savingsAccounts()->delete();
            $member->delete();
        });
        return response()->json(['success' => true]);
    }

    public function resetMemberPassword(Request $request, string $memberNumber)
    {
        $data = $request->validate(['password' => 'required|string|min:8']);
        $member = Member::where('member_number', $memberNumber)->firstOrFail();
        abort_unless($member->user, 404, 'Akun login anggota tidak ditemukan.');
        $member->user->update(['password' => $data['password']]);
        $member->user->tokens()->delete();
        DB::table('sessions')->where('user_id', $member->user->id)->delete();
        return response()->json(['success' => true]);
    }

    public function deleteProduct(SavingsProduct $product)
    {
        $product->update(['is_active' => false]);
        $product->delete();
        return response()->json(['success' => true]);
    }

    public function updatePawn(Request $request, string $number)
    {
        $pawn = PawnPledge::where('pawn_number', $number)->firstOrFail();
        $data = $request->validate([
            'item_type' => 'sometimes|required|string|max:50',
            'item_description' => 'sometimes|required|string',
            'estimated_value' => 'sometimes|required|numeric|min:0',
            'loan_amount' => 'sometimes|required|numeric|min:0',
            'ujrah_fee_per_month' => 'sometimes|required|numeric|min:0',
            'tenor_months' => 'sometimes|required|integer|min:1',
            'due_date' => 'sometimes|required|date',
            'status' => ['sometimes', Rule::in(['aktif', 'lunas', 'dilelang', 'jatuh_tempo'])],
            'notes' => 'nullable|string',
        ]);
        $pawn->update($data);
        $pawn->member?->refreshTotalSavings();
        return response()->json(['success' => true, 'data' => $pawn]);
    }

    public function deletePawn(string $number)
    {
        $pawn = PawnPledge::where('pawn_number', $number)->firstOrFail();
        abort_if($pawn->status === 'aktif', 422, 'Akad gadai aktif harus diselesaikan sebelum dihapus.');
        $member = $pawn->member;
        $pawn->delete();
        $member?->refreshTotalSavings();
        return response()->json(['success' => true]);
    }

    public function updateCredit(Request $request, string $number)
    {
        $credit = CommodityFinancing::where('financing_number', $number)->firstOrFail();
        $data = $request->validate([
            'item_name' => 'sometimes|required|string|max:255',
            'item_category' => 'sometimes|required|string|max:50',
            'purchase_price' => 'sometimes|required|numeric|min:0',
            'down_payment' => 'sometimes|required|numeric|min:0',
            'margin_amount' => 'sometimes|required|numeric|min:0',
            'tenor_months' => 'sometimes|required|integer|min:1',
            'status' => ['sometimes', Rule::in(['berjalan', 'lunas', 'menunggak'])],
        ]);
        $cost = $data['purchase_price'] ?? (float) $credit->purchase_price;
        $margin = $data['margin_amount'] ?? (float) $credit->margin_amount;
        $down = $data['down_payment'] ?? (float) $credit->down_payment;
        $tenor = $data['tenor_months'] ?? $credit->tenor_months;
        abort_if($down > $cost + $margin, 422, 'Uang muka melebihi harga jual.');
        $data['margin_percentage'] = $cost > 0 ? round($margin / $cost * 100, 2) : 0;
        $data['total_financing'] = $cost + $margin - $down;
        $data['monthly_installment'] = round($data['total_financing'] / $tenor, 2);
        $data['remaining_amount'] = max(0, $data['total_financing'] - (float) $credit->paid_amount);
        $credit->update($data);
        $credit->member?->refreshTotalSavings();
        return response()->json(['success' => true, 'data' => $credit]);
    }

    public function deleteCredit(string $number)
    {
        $credit = CommodityFinancing::where('financing_number', $number)->firstOrFail();
        abort_if($credit->remaining_amount > 0, 422, 'Pembiayaan dengan sisa tagihan tidak dapat dihapus.');
        $member = $credit->member;
        $credit->delete();
        $member?->refreshTotalSavings();
        return response()->json(['success' => true]);
    }

    public function updateTransaction(Request $request, string $ref)
    {
        $data = $request->validate([
            'description' => 'nullable|string',
            'amount' => 'sometimes|required|numeric|min:1',
            'type' => ['sometimes', Rule::in(['setoran', 'penarikan', 'pencairan_gadai', 'pelunasan_gadai', 'biaya_ujrah', 'pencairan_kredit', 'angsuran_kredit'])],
            'akad' => ['sometimes', Rule::in(['wadiah', 'mudharabah', 'rahn', 'murabahah', 'ijarah', 'qardh'])],
            'payment_method' => ['sometimes', Rule::in(['tunai', 'transfer', 'qris', 'autodebet'])],
            'status' => ['sometimes', Rule::in(['success', 'pending', 'cancelled'])],
        ]);
        return DB::transaction(function () use ($ref, $data) {
            $tx = Transaction::where('reference_number', $ref)->lockForUpdate()->firstOrFail();
            $oldStatus = $tx->status;
            $newStatus = $data['status'] ?? $oldStatus;
            $financialDataChanged = (isset($data['amount']) && (float) $data['amount'] !== (float) $tx->amount)
                || (isset($data['type']) && $data['type'] !== $tx->type);

            if ($oldStatus === 'success' && ($newStatus !== 'success' || $financialDataChanged)) {
                $this->reverseTransactionEffect($tx);
            }

            $tx->fill($data);

            if ($newStatus === 'success' && ($oldStatus !== 'success' || $financialDataChanged)) {
                $this->applyTransactionEffect($tx);
            }

            $tx->save();
            return response()->json(['success' => true, 'data' => $tx->fresh()]);
        });
    }

    public function deleteTransaction(string $ref)
    {
        return DB::transaction(function () use ($ref) {
            $tx = Transaction::where('reference_number', $ref)->lockForUpdate()->firstOrFail();
            if ($tx->status === 'success') $this->reverseTransactionEffect($tx);
            $tx->delete();
            return response()->json(['success' => true]);
        });
    }

    private function reverseTransactionEffect(Transaction $tx): void
    {
        $this->adjustTransactionEffect($tx, -1);
    }

    private function applyTransactionEffect(Transaction $tx): void
    {
        $this->adjustTransactionEffect($tx, 1);
    }

    private function adjustTransactionEffect(Transaction $tx, int $direction): void
    {
        $amount = (float) $tx->amount;
        if (in_array($tx->type, ['setoran', 'penarikan'], true)) {
            $account = SavingsAccount::where('account_number', $tx->account_id)->lockForUpdate()->firstOrFail();
            $delta = $tx->type === 'setoran' ? $amount : -$amount;
            $newBalance = (float) $account->balance + ($direction * $delta);
            abort_if($newBalance < 0, 422, 'Koreksi transaksi membuat saldo rekening menjadi negatif.');
            $account->update(['balance' => $newBalance]);
            $account->member?->refreshTotalSavings();
            return;
        }

        if ($tx->type === 'angsuran_kredit') {
            $credit = CommodityFinancing::where('financing_number', $tx->account_id)->lockForUpdate()->firstOrFail();
            $paid = max(0, (float) $credit->paid_amount + ($direction * $amount));
            $remaining = max(0, (float) $credit->total_financing - $paid);
            $credit->update([
                'paid_amount' => $paid,
                'remaining_amount' => $remaining,
                'status' => $remaining <= 0 ? 'lunas' : 'berjalan',
            ]);
            return;
        }

        if ($tx->type === 'pelunasan_gadai') {
            $pawn = PawnPledge::where('pawn_number', $tx->account_id)->lockForUpdate()->first();
            if ($pawn) $pawn->update(['status' => $direction > 0 ? 'lunas' : 'aktif']);
        }
    }
}
