<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Candidate extends Model
{
    use HasFactory;

    protected $appends = ['photo_url', 'document_url'];

    protected $fillable = [
        'election_id',
        'member_id',
        'position_id',
        'biography',
        'proposal',
        'photo_path',
        'document_path',
        'status',
    ];


    public function getPhotoUrlAttribute(): ?string
    {
        return $this->publicFileUrl($this->photo_path);
    }

    public function getDocumentUrlAttribute(): ?string
    {
        return $this->publicFileUrl($this->document_path);
    }

    private function publicFileUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://') || str_starts_with($path, 'data:')) {
            return $path;
        }

        return url(Storage::url($path));
    }

    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }
}
