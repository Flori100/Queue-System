<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use App\Models\QueueTicket;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'role'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public const ROLE_SERVICE_PROVIDER = 'service_provider';

    public const ROLE_CUSTOMER = 'customer';

    public const ROLES = [
        self::ROLE_SERVICE_PROVIDER,
        self::ROLE_CUSTOMER,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function dashboardRouteName(): string
    {
        return match ($this->role) {
            self::ROLE_SERVICE_PROVIDER => 'provider.dashboard',
            default => 'dashboard',
        };
    }

    public function queueTickets(): HasMany
    {
        return $this->hasMany(QueueTicket::class, 'customer_id');
    }

    public function reservationsAsProvider(): HasMany
    {
        return $this->hasMany(QueueTicket::class, 'service_provider_id');
    }
}
