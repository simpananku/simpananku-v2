<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'title',
        'message',
        'category',
        'target_member_number',
        'read',
        'created_at',
    ];

    protected $casts = [
        'read' => 'boolean',
        'created_at' => 'datetime',
    ];
}
