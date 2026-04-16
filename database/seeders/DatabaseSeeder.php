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
            'name' => 'Client User',
            'email' => 'client@example.com',
            'role' => User::ROLE_CUSTOMER,
        ]);

        User::factory()->create([
            'name' => 'Barber One',
            'email' => 'barber1@example.com',
            'role' => User::ROLE_SERVICE_PROVIDER,
        ]);

        User::factory()->create([
            'name' => 'Barber Two',
            'email' => 'barber2@example.com',
            'role' => User::ROLE_SERVICE_PROVIDER,
        ]);
    }
}
