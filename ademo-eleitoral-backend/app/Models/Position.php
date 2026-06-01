<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Position extends Model
{
    use HasFactory;

    protected $fillable = ['organ_id', 'name', 'description', 'status'];

    public function organ(): BelongsTo
    {
        return $this->belongsTo(Organ::class);
    }

    public function elections(): HasMany
    {
        return $this->hasMany(Election::class);
    }

    public function candidates(): HasMany
    {
        return $this->hasMany(Candidate::class);
    }
}
