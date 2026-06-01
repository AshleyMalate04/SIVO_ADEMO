<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Distrit extends Model
{
    use HasFactory;

    protected $table = 'distrit';

    protected $fillable = ['province_id', 'name', 'code', 'status'];

    public function province(): BelongsTo
    {
        return $this->belongsTo(Province::class);
    }

    public function delegations(): HasMany
    {
        return $this->hasMany(Delegation::class, 'district_id');
    }
}
