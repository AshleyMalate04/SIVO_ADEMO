<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'access_code',
        'email',
        'phone',
        'password',
        'role',
        'status',
        'delegation_id',
        'last_login_at',
        'password_changed_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'last_login_at' => 'datetime',
            'password_changed_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isActive(): bool
    {
        return $this->status === 'ACTIVE';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'ADMIN';
    }

    public function isCommission(): bool
    {
        return in_array($this->role, ['COMMISSION', 'COMISSAO'], true);
    }

    public function isFiscal(): bool
    {
        return $this->role === 'FISCAL';
    }

    public function isVoter(): bool
    {
        return in_array($this->role, ['VOTER', 'ELEITOR'], true);
    }

    public function linkedMember(): ?Member
    {
        if (! $this->isVoter()) {
            return null;
        }

        // A conta do eleitor e criada com o codigo do membro como access_code.
        // Email e telefone nao sao identificadores seguros nem necessariamente unicos.
        return Member::query()
            ->where('member_code', $this->access_code)
            ->first();
    }

    public function delegation(): BelongsTo
    {
        return $this->belongsTo(Delegation::class);
    }

    public function createdElections(): HasMany
    {
        return $this->hasMany(Election::class, 'created_by');
    }

    public function electionTeams(): HasMany
    {
        return $this->hasMany(ElectionTeam::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function setting(): HasOne
    {
        return $this->hasOne(Setting::class);
    }
}
