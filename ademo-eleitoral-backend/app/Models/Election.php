<?php

namespace App\Models;

use DateTimeInterface;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Election extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'organ_id',
        'position_id',
        'delegation_id',
        'parent_election_id',
        'round_number',
        'starts_at',
        'ends_at',
        'description',
        'allow_blank_vote',
        'status',
        'results_status',
        'results_published_at',
        'results_published_by',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime:Y-m-d H:i:s',
            'ends_at' => 'datetime:Y-m-d H:i:s',
            'allow_blank_vote' => 'boolean',
            'results_published_at' => 'datetime:Y-m-d H:i:s',
        ];
    }

    protected function serializeDate(DateTimeInterface $date): string
    {
        return $date->format('Y-m-d H:i:s');
    }

    public function organ(): BelongsTo
    {
        return $this->belongsTo(Organ::class);
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    public function delegation(): BelongsTo
    {
        return $this->belongsTo(Delegation::class);
    }

    public function parentElection(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_election_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function team(): HasMany
    {
        return $this->hasMany(ElectionTeam::class);
    }

    public function candidates(): HasMany
    {
        return $this->hasMany(Candidate::class);
    }

    public function voters(): HasMany
    {
        return $this->hasMany(ElectionVoter::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }

    public function physicalVoteTotals(): HasMany
    {
        return $this->hasMany(PhysicalVoteTotal::class);
    }
}
