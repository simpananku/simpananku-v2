<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommodityFinancing extends Model
{
    use HasFactory;

    protected $fillable = [
        'financing_number',
        'member_number',
        'member_name',
        'item_name',
        'item_category',
        'purchase_price',
        'down_payment',
        'margin_percentage',
        'margin_amount',
        'total_financing',
        'tenor_months',
        'monthly_installment',
        'paid_amount',
        'remaining_amount',
        'start_date',
        'end_date',
        'status',
    ];

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'down_payment' => 'decimal:2',
        'margin_percentage' => 'decimal:2',
        'margin_amount' => 'decimal:2',
        'total_financing' => 'decimal:2',
        'tenor_months' => 'integer',
        'monthly_installment' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class, 'member_number', 'member_number');
    }
}
