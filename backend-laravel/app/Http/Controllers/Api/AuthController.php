<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Member;
use App\Models\SavingsProduct;
use App\Models\SavingsAccount;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Otentikasi Login Pengguna (Admin, Teller, Nasabah).
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string',
            'password' => 'required|string',
        ]);

        // Support login by email OR member number OR phone
        $user = User::where('email', $validated['email'])
            ->orWhere('member_id', $validated['email'])
            ->orWhere('phone', $validated['email'])
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Kombinasi email/nomor anggota dan kata sandi tidak cocok.',
            ], 401);
        }

        // Browser clients use Laravel's HttpOnly session cookie. API clients may use a bearer token.
        if ($request->hasSession()) {
            Auth::guard('web')->login($user);
            $request->session()->regenerate();
            $token = null;
        } else {
            $token = $user->createToken('simpananku_auth_token', ['*'], now()->addHours(12))->plainTextToken;
        }

        $memberData = null;
        if ($user->role === 'nasabah' && $user->member_id) {
            $memberData = Member::where('member_number', $user->member_id)->first();
        }

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil. Ahlan wa sahlan.',
            'token' => $token,
            'user' => [
                'id' => 'USR-' . $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'memberId' => $user->member_id,
            ],
            'member' => $memberData,
        ]);
    }

    /**
     * Ambil profil pengguna saat ini.
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $member = null;

        if ($user->role === 'nasabah' && $user->member_id) {
            $member = Member::where('member_number', $user->member_id)->first();
        }

        return response()->json([
            'success' => true,
            'user' => [
                'id' => 'USR-' . $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'memberId' => $user->member_id,
            ],
            'member' => $member,
        ]);
    }

    /**
     * Logout dan revokasi token Sanctum.
     */
    public function logout(Request $request)
    {
        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        } else {
            $request->user()->currentAccessToken()?->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Berhasil keluar dari sistem.',
        ]);
    }

    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);
        if (! Hash::check($data['current_password'], $request->user()->password)) {
            throw ValidationException::withMessages(['current_password' => 'Kata sandi saat ini tidak sesuai.']);
        }
        $request->user()->update(['password' => $data['password']]);
        $request->user()->tokens()->delete();
        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }
        return response()->json(['success' => true, 'message' => 'Kata sandi diperbarui. Silakan masuk kembali.']);
    }

    /**
     * Registrasi Anggota Baru oleh Teller/Admin.
     */
    public function registerMember(Request $request)
    {
        $validated = $request->validate([
            'nik' => 'required|string|size:16|unique:members,nik',
            'full_name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'required|string|max:25',
            'address' => 'required|string',
            'occupation' => 'nullable|string|max:100',
            'initial_deposit' => 'nullable|numeric|min:0',
            'password' => 'nullable|string|min:8',
        ]);

        return DB::transaction(function () use ($validated) {
            // Generate nomor urut AG0001
            $lastMember = Member::withTrashed()->orderBy('id', 'desc')->first();
            $nextSeq = 1;
            if ($lastMember && preg_match('/AG(\d+)/', $lastMember->member_number, $matches)) {
                $nextSeq = intval($matches[1]) + 1;
            }
            $memberNumber = 'AG' . str_pad($nextSeq, 4, '0', STR_PAD_LEFT);

            // Buat Member
            $member = Member::create([
                'member_number' => $memberNumber,
                'nik' => $validated['nik'],
                'full_name' => $validated['full_name'],
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'occupation' => $validated['occupation'] ?? 'Wirausaha / Mandiri',
                'status' => 'aktif',
                'join_date' => now()->toDateString(),
                'total_savings' => $validated['initial_deposit'] ?? 50000,
            ]);

            // Buat User Akun Nasabah
            $plainPassword = $validated['password'] ?? \Illuminate\Support\Str::password(16);
            $user = User::create([
                'name' => $member->full_name,
                'email' => $member->email ?: "{$memberNumber}@simpananku.local",
                'phone' => $member->phone,
                'password' => Hash::make($plainPassword),
                'role' => 'nasabah',
                'member_id' => $memberNumber,
            ]);

            // Buat Rekening Otomatis untuk Seluruh Produk Simpanan yang Aktif
            $products = SavingsProduct::where('is_active', true)->get();
            foreach ($products as $prod) {
                $initialBal = ($prod->code === 'PRD-001') ? ($validated['initial_deposit'] ?? 50000) : 0;
                SavingsAccount::create([
                    'account_number' => 'ACC-' . now()->format('Ymd') . '-' . rand(1000, 9999),
                    'member_number' => $memberNumber,
                    'product_id' => $prod->id,
                    'product_name' => $prod->name,
                    'akad' => $prod->akad,
                    'balance' => $initialBal,
                    'opened_at' => now()->toDateString(),
                    'status' => 'active',
                ]);
            }

            // Kirim Notifikasi
            Notification::create([
                'title' => 'Pendaftaran Anggota Baru Berhasil',
                'message' => "Selamat bergabung {$member->full_name}, nomor anggota resmi Anda adalah {$memberNumber}.",
                'category' => 'anggota',
                'target_member_number' => $memberNumber,
            ]);

            return response()->json([
                'success' => true,
                'message' => "Anggota baru {$member->full_name} ({$memberNumber}) berhasil didaftarkan.",
                'member' => $member,
                'user' => $user,
                'default_password' => $plainPassword,
            ], 201);
        });
    }
}
