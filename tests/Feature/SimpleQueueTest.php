<?php

namespace Tests\Feature;

use App\Models\QueueTicket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SimpleQueueTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_take_ticket_and_see_generated_number(): void
    {
        $customer = User::factory()->create(['role' => User::ROLE_CUSTOMER]);

        $response = $this
            ->actingAs($customer)
            ->post(route('simple-queue.take-ticket'));

        $ticket = QueueTicket::query()->first();

        $response->assertRedirect(route('simple-queue.customer'));
        $response->assertSessionHas('generated_ticket', $ticket?->ticket_number);
        $this->assertDatabaseHas('queue_tickets', [
            'id' => $ticket?->id,
            'customer_id' => $customer->id,
            'status' => QueueTicket::STATUS_WAITING,
        ]);
    }

    public function test_staff_can_call_next_ticket(): void
    {
        $staff = User::factory()->create(['role' => User::ROLE_STAFF]);
        $customer = User::factory()->create(['role' => User::ROLE_CUSTOMER]);

        $firstTicket = QueueTicket::create([
            'customer_id' => $customer->id,
            'service_type' => QueueTicket::SERVICE_GENERAL,
            'priority' => QueueTicket::PRIORITY_NORMAL,
            'status' => QueueTicket::STATUS_WAITING,
        ]);

        QueueTicket::create([
            'customer_id' => $customer->id,
            'service_type' => QueueTicket::SERVICE_GENERAL,
            'priority' => QueueTicket::PRIORITY_NORMAL,
            'status' => QueueTicket::STATUS_WAITING,
        ]);

        $response = $this
            ->actingAs($staff)
            ->post(route('simple-queue.call-next'));

        $response->assertRedirect(route('simple-queue.staff'));
        $this->assertDatabaseHas('queue_tickets', [
            'id' => $firstTicket->id,
            'status' => QueueTicket::STATUS_CALLED,
            'assigned_to' => $staff->id,
        ]);
    }

    public function test_display_shows_current_called_ticket(): void
    {
        $customer = User::factory()->create(['role' => User::ROLE_CUSTOMER]);

        $calledTicket = QueueTicket::create([
            'customer_id' => $customer->id,
            'service_type' => QueueTicket::SERVICE_GENERAL,
            'priority' => QueueTicket::PRIORITY_NORMAL,
            'status' => QueueTicket::STATUS_CALLED,
            'called_at' => now(),
        ]);

        $response = $this->get(route('simple-queue.display'));

        $response->assertOk();
        $response->assertSee('Now Serving');
        $response->assertSee($calledTicket->ticket_number);
    }
}
