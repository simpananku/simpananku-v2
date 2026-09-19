<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commodity_financings', function (Blueprint $table) {
            $table->id();
            $table->string('financing_number', 40)->unique()->comment('Contoh: MRB-20260317-001');
            $table->string('member_number', 20)->index();
            $table->string('member_name');
            $table->string('item_name');
            $table->string('item_category', 50)->comment('Kendaraan, Elektronik, Alat Usaha');
            $table->decimal('purchase_price', 15, 2)->comment('Harga Beli Asal Pokok');
            $table->decimal('down_payment', 15, 2)->default(0)->comment('Uang Muka / Urbun');
            $table->decimal('margin_percentage', 6, 2)->comment('Persentase Margin Murabahah Disepakati');
            $table->decimal('margin_amount', 15, 2)->comment('Nominal Keuntungan Murabahah');
            $table->decimal('total_financing', 15, 2)->comment('(Harga Beli - DP) + Margin');
            $table->unsignedInteger('tenor_months')->comment('Durasi Cicilan (Bulan)');
            $table->decimal('monthly_installment', 15, 2)->comment('Angsuran Tetap per Bulan');
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('remaining_amount', 15, 2);
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['berjalan', 'lunas', 'menunggak'])->default('berjalan');
            $table->timestamps();

            $table->foreign('member_number')->references('member_number')->on('members')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commodity_financings');
    }
};
