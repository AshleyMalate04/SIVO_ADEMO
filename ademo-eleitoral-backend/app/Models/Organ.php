<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organ extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description', 'status'];

    public function positions(): HasMany
    {
        return $this->hasMany(Position::class);
    }

    public function elections(): HasMany
    {
        return $this->hasMany(Election::class);
    }
}
