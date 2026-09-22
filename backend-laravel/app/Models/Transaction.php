<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference_number',
        'account_id',
        'member_number',
        'member_name',
        'type',
        'akad',
        'amount',
        'balance_after',
        'description',
        'teller_name',
        'teller_id',
        'payment_method',
        'status',
        'transaction_date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'transaction_date' => 'datetime',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class, 'member_number', 'member_number');
    }

    public function account()
    {
        return $this->belongsTo(SavingsAccount::class, 'account_id', 'account_number');
    }
}
