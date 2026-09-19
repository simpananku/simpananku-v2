<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('savings_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('account_number', 30)->unique()->comment('Contoh: ACC-2026-0001');
            $table->string('member_number', 20)->index()->comment('Relasi ke members.member_number');
            $table->foreignId('product_id')->constrained('savings_products')->onDelete('cascade');
            $table->string('product_name');
            $table->enum('akad', ['wadiah', 'mudharabah']);
            $table->decimal('balance', 15, 2)->default(0);
            $table->date('opened_at');
            $table->enum('status', ['active', 'dormant', 'closed'])->default('active');
            $table->timestamps();

            $table->foreign('member_number')->references('member_number')->on('members')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('savings_accounts');
    }
};
