<?php

namespace App\Support;

use App\Models\User;

class RoleRedirector
{
    public static function pathFor(?User $user): string
    {
        return match ($user?->role) {
            User::ROLE_SERVICE_PROVIDER => '/provider/dashboard',
            default => '/dashboard',
        };
    }

    public static function routeNameFor(?User $user): string
    {
        return match ($user?->role) {
            User::ROLE_SERVICE_PROVIDER => 'provider.dashboard',
            default => 'dashboard',
        };
    }
}
