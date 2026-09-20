<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SavingsAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_number',
        'member_number',
        'product_id',
        'product_name',
        'akad',
        'balance',
        'opened_at',
        'status',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'opened_at' => 'date',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class, 'member_number', 'member_number');
    }

    public function product()
    {
        return $this->belongsTo(SavingsProduct::class, 'product_id')->withTrashed();
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'account_id', 'account_number');
    }
}
