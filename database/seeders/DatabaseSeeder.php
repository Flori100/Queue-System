<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'role' => User::ROLE_CUSTOMER,
        ]);

        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'role' => User::ROLE_ADMIN,
        ]);

        User::factory()->create([
            'name' => 'Staff User',
            'email' => 'staff@example.com',
            'role' => User::ROLE_STAFF,
        ]);

        User::factory()->create([
            'name' => 'Reception User',
            'email' => 'reception@example.com',
            'role' => User::ROLE_RECEPTIONIST,
        ]);
    }
}
