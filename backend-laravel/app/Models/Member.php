<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Member extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'member_number',
        'nik',
        'full_name',
        'email',
        'phone',
        'address',
        'occupation',
        'status',
        'join_date',
        'total_savings',
        'active_pawn_count',
        'active_credit_count',
    ];

    protected $casts = [
        'join_date' => 'date',
        'total_savings' => 'decimal:2',
        'active_pawn_count' => 'integer',
        'active_credit_count' => 'integer',
    ];

    public function user()
    {
        return $this->hasOne(User::class, 'member_id', 'member_number');
    }

    public function savingsAccounts()
    {
        return $this->hasMany(SavingsAccount::class, 'member_number', 'member_number');
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'member_number', 'member_number');
    }

    public function pawnPledges()
    {
        return $this->hasMany(PawnPledge::class, 'member_number', 'member_number');
    }

    public function commodityFinancings()
    {
        return $this->hasMany(CommodityFinancing::class, 'member_number', 'member_number');
    }

    /**
     * Recalculate total savings across all member accounts.
     */
    public function refreshTotalSavings(): void
    {
        $this->total_savings = $this->savingsAccounts()->where('status', 'active')->sum('balance');
        $this->active_pawn_count = $this->pawnPledges()->where('status', 'aktif')->count();
        $this->active_credit_count = $this->commodityFinancings()->where('status', 'berjalan')->count();
        $this->save();
    }
}
