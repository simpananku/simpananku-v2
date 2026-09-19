<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('member_number', 20)->unique()->comment('Format resmi AG0001, AG0002, dst.');
            $table->string('nik', 16)->unique();
            $table->string('full_name');
            $table->string('email')->nullable();
            $table->string('phone', 25);
            $table->text('address');
            $table->string('occupation')->nullable();
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->date('join_date');
            $table->decimal('total_savings', 15, 2)->default(0)->comment('Akumulasi saldo seluruh rekening simpanan syariah');
            $table->unsignedInteger('active_pawn_count')->default(0);
            $table->unsignedInteger('active_credit_count')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
