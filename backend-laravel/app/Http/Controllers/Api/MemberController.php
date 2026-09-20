<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MemberController extends Controller
{
    /**
     * Tampilkan daftar anggota (nasabah) syariah.
     */
    public function index(Request $request)
    {
        $query = Member::with(['savingsAccounts', 'pawnPledges', 'commodityFinancings']);
        if ($request->user()->role === 'nasabah') {
            $query->where('member_number', $request->user()->member_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('member_number', 'like', "%{$search}%")
                  ->orWhere('nik', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $members = $query->orderBy('member_number', 'asc')->get();

        return response()->json([
            'success' => true,
            'count' => $members->count(),
            'data' => $members,
        ]);
    }

    /**
     * Tampilkan detail satu anggota beserta ringkasan keuangannya.
     */
    public function show(Request $request, $memberNumber)
    {
        abort_if($request->user()->role === 'nasabah' && $request->user()->member_id !== $memberNumber, 403);
        $member = Member::with(['savingsAccounts', 'transactions', 'pawnPledges', 'commodityFinancings'])
            ->where('member_number', $memberNumber)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $member,
        ]);
    }

    /**
     * Perbarui data nasabah.
     */
    public function update(Request $request, $memberNumber)
    {
        $member = Member::where('member_number', $memberNumber)->firstOrFail();

        $validated = $request->validate([
            'nik' => ['sometimes', 'required', 'string', 'size:16', \Illuminate\Validation\Rule::unique('members')->ignore($member->id)],
            'full_name' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|max:25',
            'email' => 'nullable|email|unique:users,email,' . ($member->user?->id ?? 'NULL'),
            'address' => 'sometimes|required|string',
            'occupation' => 'nullable|string|max:100',
            'status' => 'sometimes|in:aktif,nonaktif',
        ]);

        $member->update($validated);

        // Update corresponding user record if exists
        User::where('member_id', $memberNumber)->update([
            'name' => $member->full_name,
            'phone' => $member->phone,
            'email' => $member->email ?: User::where('member_id', $memberNumber)->value('email'),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Data anggota {$memberNumber} berhasil diperbarui.",
            'data' => $member,
        ]);
    }

    /**
     * Dapatkan nomor anggota berikutnya (AG0001, AG0002, dst).
     */
    public function nextNumber()
    {
        $lastMember = Member::withTrashed()->orderBy('id', 'desc')->first();
        $nextSeq = 1;
        if ($lastMember && preg_match('/AG(\d+)/', $lastMember->member_number, $matches)) {
            $nextSeq = intval($matches[1]) + 1;
        }
        $nextFormatted = 'AG' . str_pad($nextSeq, 4, '0', STR_PAD_LEFT);

        return response()->json([
            'success' => true,
            'next_member_number' => $nextFormatted,
        ]);
    }
}
