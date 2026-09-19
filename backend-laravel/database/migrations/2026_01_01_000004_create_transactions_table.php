<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('reference_number', 40)->unique()->comment('Contoh: TRX-20260317-0001');
            $table->string('account_id', 30)->index()->comment('Menunjuk ke account_number atau rekening');
            $table->string('member_number', 20)->index();
            $table->string('member_name');
            $table->enum('type', ['setoran', 'penarikan', 'pencairan_gadai', 'pelunasan_gadai', 'biaya_ujrah', 'pencairan_kredit', 'angsuran_kredit']);
            $table->decimal('amount', 15, 2);
            $table->decimal('balance_after', 15, 2)->default(0);
            $table->text('description')->nullable();
            $table->string('teller_name');
            $table->string('teller_id')->nullable();
            $table->enum('status', ['success', 'pending', 'cancelled'])->default('success');
            $table->timestamp('transaction_date')->useCurrent();
            $table->timestamps();

            $table->foreign('member_number')->references('member_number')->on('members')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
