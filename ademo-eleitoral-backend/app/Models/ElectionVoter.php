<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ElectionVoter extends Model
{
    use HasFactory;

    protected $fillable = [
        'election_id',
        'member_id',
        'delegation_id',
        'status',
        'voting_mode',
        'has_voted',
        'voted_at',
        'voter_hash',
    ];

    protected function casts(): array
    {
        return [
            'has_voted' => 'boolean',
            'voted_at' => 'datetime',
        ];
    }

    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function delegation(): BelongsTo
    {
        return $this->belongsTo(Delegation::class);
    }
}
