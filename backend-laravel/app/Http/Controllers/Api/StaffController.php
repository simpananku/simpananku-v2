<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    public function index()
    {
        return response()->json(['success' => true, 'data' => User::whereIn('role', ['admin', 'teller'])->orderBy('id')->get(['id', 'name', 'email', 'phone', 'role', 'created_at'])]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:25',
            'role' => ['required', Rule::in(['admin', 'teller'])],
            'password' => 'required|string|min:8',
        ]);
        $user = User::create($data);
        return response()->json(['success' => true, 'data' => $user], 201);
    }

    public function update(Request $request, User $user)
    {
        abort_unless(in_array($user->role, ['admin', 'teller']), 404);
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email', Rule::unique('users')->ignore($user->id)],
            'phone' => 'nullable|string|max:25',
            'password' => 'sometimes|required|string|min:8',
        ]);
        $user->update($data);
        if (array_key_exists('password', $data)) {
            $user->tokens()->delete();
            DB::table('sessions')->where('user_id', $user->id)->delete();
        }
        return response()->json(['success' => true, 'data' => $user]);
    }

    public function destroy(Request $request, User $user)
    {
        abort_unless(in_array($user->role, ['admin', 'teller']), 404);
        abort_if($request->user()->is($user), 422, 'Akun yang sedang digunakan tidak dapat dihapus.');
        abort_if($user->role === 'admin' && User::where('role', 'admin')->count() <= 1, 422, 'Administrator terakhir tidak dapat dihapus.');
        $user->tokens()->delete();
        $user->delete();
        return response()->json(['success' => true]);
    }
}
