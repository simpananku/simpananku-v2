<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PawnPledge extends Model
{
    use HasFactory;

    protected $fillable = [
        'pawn_number',
        'member_number',
        'member_name',
        'item_type',
        'item_description',
        'estimated_value',
        'loan_amount',
        'ujrah_fee_per_month',
        'tenor_months',
        'start_date',
        'due_date',
        'status',
        'notes',
    ];

    protected $casts = [
        'estimated_value' => 'decimal:2',
        'loan_amount' => 'decimal:2',
        'ujrah_fee_per_month' => 'decimal:2',
        'tenor_months' => 'integer',
        'start_date' => 'date',
        'due_date' => 'date',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class, 'member_number', 'member_number');
    }
}
