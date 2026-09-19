<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SavingsProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'akad',
        'description',
        'min_initial_deposit',
        'min_balance',
        'admin_fee',
        'profit_sharing_ratio',
        'is_active',
    ];

    protected $casts = [
        'min_initial_deposit' => 'decimal:2',
        'min_balance' => 'decimal:2',
        'admin_fee' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function accounts()
    {
        return $this->hasMany(SavingsAccount::class, 'product_id');
    }
}
