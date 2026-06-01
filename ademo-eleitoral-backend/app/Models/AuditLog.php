<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'election_id',
        'user_id',
        'action',
        'entity',
        'entity_id',
        'details',
        'ip',
        'user_agent',
    ];

    protected function casts(): array
    {
        return ['details' => 'array'];
    }

    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
