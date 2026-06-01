<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Member extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_code',
        'name',
        'phone',
        'email',
        'bi_number',
        'delegation_id',
        'status',
        'registered_at',
        'registered_by',
    ];

    protected function casts(): array
    {
        return ['registered_at' => 'date'];
    }

    public function delegation(): BelongsTo
    {
        return $this->belongsTo(Delegation::class);
    }

    public function registrar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by');
    }

    public function candidates(): HasMany
    {
        return $this->hasMany(Candidate::class);
    }

    public function electionVoters(): HasMany
    {
        return $this->hasMany(ElectionVoter::class);
    }
}
