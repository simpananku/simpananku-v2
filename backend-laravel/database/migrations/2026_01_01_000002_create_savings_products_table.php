<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('savings_products', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name');
            $table->enum('akad', ['wadiah', 'mudharabah']);
            $table->text('description')->nullable();
            $table->decimal('min_initial_deposit', 15, 2)->default(50000);
            $table->decimal('min_balance', 15, 2)->default(20000);
            $table->decimal('admin_fee', 15, 2)->default(0)->comment('Bebas riba / 0 admin fee untuk wadiah yad dhamanah');
            $table->string('profit_sharing_ratio', 30)->nullable()->comment('Contoh rasio nisbah: 70:30 (Nasabah : Pengelola)');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('savings_products');
    }
};
