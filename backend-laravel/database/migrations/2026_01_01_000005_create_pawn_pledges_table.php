<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pawn_pledges', function (Blueprint $table) {
            $table->id();
            $table->string('pawn_number', 40)->unique()->comment('Contoh: RAHN-20260317-001');
            $table->string('member_number', 20)->index();
            $table->string('member_name');
            $table->string('item_type', 50)->comment('Emas, BPKB Kendaraan, Elektronik');
            $table->text('item_description');
            $table->decimal('estimated_value', 15, 2)->comment('Nilai Taksiran Marhun oleh Penaksir');
            $table->decimal('loan_amount', 15, 2)->comment('Uang Pinjaman Qardh (maks. 80-85% taksiran)');
            $table->decimal('ujrah_fee_per_month', 15, 2)->comment('Biaya Jasa Titip Marhun per bulan (bukan bunga)');
            $table->unsignedInteger('tenor_months')->default(4);
            $table->date('start_date');
            $table->date('due_date');
            $table->enum('status', ['aktif', 'lunas', 'dilelang', 'jatuh_tempo'])->default('aktif');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('member_number')->references('member_number')->on('members')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pawn_pledges');
    }
};
