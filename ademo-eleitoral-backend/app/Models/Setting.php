<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'theme',
        'high_contrast',
        'font_size',
        'email_notifications',
        'system_notifications',
        'whatsapp_notifications',
    ];

    protected function casts(): array
    {
        return [
            'high_contrast' => 'boolean',
            'email_notifications' => 'boolean',
            'system_notifications' => 'boolean',
            'whatsapp_notifications' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
