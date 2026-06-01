<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VoteReceipt extends Model
{
    use HasFactory;

    protected $fillable = ['election_id', 'voter_hash', 'public_code'];

    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }
}
