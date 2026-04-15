<?php

namespace App\Support;

use App\Models\User;

class RoleRedirector
{
    public static function pathFor(?User $user): string
    {
        return match ($user?->role) {
            User::ROLE_ADMIN => '/admin/dashboard',
            User::ROLE_STAFF => '/staff/dashboard',
            User::ROLE_RECEPTIONIST => '/reception/dashboard',
            default => '/dashboard',
        };
    }

    public static function routeNameFor(?User $user): string
    {
        return match ($user?->role) {
            User::ROLE_ADMIN => 'admin.dashboard',
            User::ROLE_STAFF => 'staff.dashboard',
            User::ROLE_RECEPTIONIST => 'reception.dashboard',
            default => 'dashboard',
        };
    }
}
