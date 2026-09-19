<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\SavingsProductController;
use App\Http\Controllers\Api\SavingsAccountController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\PawnController;
use App\Http\Controllers\Api\CommodityFinancingController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AiAdvisoryController;

/*
|--------------------------------------------------------------------------
| SIMPANANKU API Routes (Laravel 13 AI-Native)
|--------------------------------------------------------------------------
| Mendukung Sistem Simpanan Tabungan, Gadai Syariah (Rahn), & Kredit Barang (Murabahah)
*/

Route::prefix('v1')->group(function () {

    // === Public & Auth Routes ===
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/savings-products', [SavingsProductController::class, 'index']);
    Route::get('/transactions/{ref}/receipt', [TransactionController::class, 'receipt']);
    Route::get('/members/next-number', [MemberController::class, 'nextNumber']);

    // === AI-Native Advisory (Public/Demo accessible) ===
    Route::post('/ai/audit-sharia', [AiAdvisoryController::class, 'auditSharia']);
    Route::post('/ai/estimate-marhun', [AiAdvisoryController::class, 'estimateMarhun']);

    // === Protected Routes (Bearer Token via Laravel Sanctum) ===
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        // Notifikasi Real-time
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);

        // Rekening Simpanan & Mutasi Buku Tabungan
        Route::get('/savings-accounts', [SavingsAccountController::class, 'index']);
        Route::get('/savings-accounts/{accountNumber}', [SavingsAccountController::class, 'show']);
        Route::get('/savings-accounts/{accountNumber}/mutation', [SavingsAccountController::class, 'mutation']);

        // Transaksi Umum
        Route::get('/transactions', [TransactionController::class, 'index']);

        // Gadai Syariah (Rahn)
        Route::get('/pawns', [PawnController::class, 'index']);

        // Kredit Barang Syariah (Murabahah)
        Route::get('/commodity-financings', [CommodityFinancingController::class, 'index']);

        // Data Anggota
        Route::get('/members', [MemberController::class, 'index']);
        Route::get('/members/{memberNumber}', [MemberController::class, 'show']);

        // === Admin & Teller Specific Operations ===
        Route::middleware('role:admin,teller')->group(function () {
            // Pendaftaran Anggota Baru
            Route::post('/members/register', [AuthController::class, 'registerMember']);
            Route::put('/members/{memberNumber}', [MemberController::class, 'update']);

            // Setor & Tarik Tabungan
            Route::post('/transactions/deposit', [TransactionController::class, 'deposit']);
            Route::post('/transactions/withdraw', [TransactionController::class, 'withdraw']);

            // Operasional Gadai (Rahn)
            Route::post('/pawns/disburse', [PawnController::class, 'disburse']);
            Route::post('/pawns/{pawnNumber}/pay-ujrah', [PawnController::class, 'payUjrah']);
            Route::post('/pawns/{pawnNumber}/redeem', [PawnController::class, 'redeem']);

            // Operasional Kredit Barang (Murabahah)
            Route::post('/commodity-financings/disburse', [CommodityFinancingController::class, 'disburse']);
            Route::post('/commodity-financings/{financingNumber}/pay-installment', [CommodityFinancingController::class, 'payInstallment']);
        });

        // === Admin Only Operations ===
        Route::middleware('role:admin')->group(function () {
            Route::post('/savings-products', [SavingsProductController::class, 'store']);
            Route::put('/savings-products/{id}', [SavingsProductController::class, 'update']);
        });
    });
});
