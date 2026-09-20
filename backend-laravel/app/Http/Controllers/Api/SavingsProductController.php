<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SavingsProduct;
use Illuminate\Http\Request;

class SavingsProductController extends Controller
{
    public function index()
    {
        $products = SavingsProduct::all();

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:savings_products,code',
            'name' => 'required|string|max:255',
            'akad' => 'required|in:wadiah,mudharabah',
            'description' => 'nullable|string',
            'min_initial_deposit' => 'required|numeric|min:0',
            'min_balance' => 'required|numeric|min:0',
            'admin_fee' => 'required|numeric|min:0',
            'profit_sharing_ratio' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $product = SavingsProduct::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Produk simpanan syariah berhasil ditambahkan.',
            'data' => $product,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $product = SavingsProduct::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'akad' => 'sometimes|required|in:wadiah,mudharabah',
            'description' => 'nullable|string',
            'min_initial_deposit' => 'sometimes|required|numeric|min:0',
            'min_balance' => 'sometimes|required|numeric|min:0',
            'admin_fee' => 'sometimes|required|numeric|min:0',
            'profit_sharing_ratio' => 'nullable|string|max:30',
            'is_active' => 'sometimes|boolean',
        ]);
        if (isset($validated['akad']) && $validated['akad'] !== $product->akad && $product->accounts()->exists()) {
            return response()->json(['success' => false, 'message' => 'Akad produk dengan rekening aktif tidak dapat diubah.'], 422);
        }
        $product->update($validated);
        if (isset($validated['name'])) $product->accounts()->update(['product_name' => $validated['name']]);

        return response()->json([
            'success' => true,
            'message' => 'Produk simpanan berhasil diperbarui.',
            'data' => $product,
        ]);
    }
}
