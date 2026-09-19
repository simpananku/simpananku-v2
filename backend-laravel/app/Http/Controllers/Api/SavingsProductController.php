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
        $product->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Produk simpanan berhasil diperbarui.',
            'data' => $product,
        ]);
    }
}
