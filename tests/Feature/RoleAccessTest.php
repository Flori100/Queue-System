<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_service_provider_can_access_provider_dashboard(): void
    {
        $provider = User::factory()->create(['role' => User::ROLE_SERVICE_PROVIDER]);

        $this->actingAs($provider)
            ->get(route('provider.dashboard'))
            ->assertOk();
    }

    public function test_customer_cannot_access_provider_dashboard(): void
    {
        $customer = User::factory()->create(['role' => User::ROLE_CUSTOMER]);

        $this->actingAs($customer)
            ->get(route('provider.dashboard'))
            ->assertForbidden();
    }

    public function test_users_are_redirected_to_provider_dashboard_after_login(): void
    {
        $provider = User::factory()->create(['role' => User::ROLE_SERVICE_PROVIDER]);

        $response = $this->post('/login', [
            'email' => $provider->email,
            'password' => 'password',
        ]);

        $response->assertRedirect('/provider/dashboard');
    }
}
