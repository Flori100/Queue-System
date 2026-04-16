<?php

namespace Tests\Feature;

use App\Models\QueueTicket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QueueTicketTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_create_queue_ticket(): void
    {
        $customer = User::factory()->create(['role' => User::ROLE_CUSTOMER]);

        $this
            ->actingAs($customer)
            ->post(route('queue.store'), [
                'service_type' => QueueTicket::SERVICE_BILLING,
                'priority' => QueueTicket::PRIORITY_HIGH,
                'notes' => 'Need billing assistance',
            ]);

        $this->assertDatabaseHas('queue_tickets', [
            'customer_id' => $customer->id,
            'service_type' => QueueTicket::SERVICE_BILLING,
            'priority' => QueueTicket::PRIORITY_HIGH,
            'status' => QueueTicket::STATUS_WAITING,
        ]);
    }

    public function test_staff_can_update_ticket_status(): void
    {
        $staff = User::factory()->create(['role' => User::ROLE_STAFF]);
        $customer = User::factory()->create(['role' => User::ROLE_CUSTOMER]);
        $ticket = QueueTicket::create([
            'customer_id' => $customer->id,
            'service_type' => QueueTicket::SERVICE_GENERAL,
            'priority' => QueueTicket::PRIORITY_NORMAL,
            'status' => QueueTicket::STATUS_WAITING,
        ]);

        $response = $this
            ->actingAs($staff)
            ->patch(route('queue.update-status', $ticket), [
                'status' => QueueTicket::STATUS_SERVING,
            ]);

        $response->assertRedirect(route('queue.index'));

        $this->assertDatabaseHas('queue_tickets', [
            'id' => $ticket->id,
            'status' => QueueTicket::STATUS_SERVING,
            'assigned_to' => $staff->id,
        ]);
    }

    public function test_customer_cannot_view_other_customer_tickets(): void
    {
        $owner = User::factory()->create(['role' => User::ROLE_CUSTOMER]);
        $other = User::factory()->create(['role' => User::ROLE_CUSTOMER]);

        $ownerTicket = QueueTicket::create([
            'customer_id' => $owner->id,
            'service_type' => QueueTicket::SERVICE_SUPPORT,
            'priority' => QueueTicket::PRIORITY_NORMAL,
            'status' => QueueTicket::STATUS_WAITING,
        ]);

        $otherTicket = QueueTicket::create([
            'customer_id' => $other->id,
            'service_type' => QueueTicket::SERVICE_CLAIMS,
            'priority' => QueueTicket::PRIORITY_LOW,
            'status' => QueueTicket::STATUS_WAITING,
        ]);

        $response = $this->actingAs($owner)->get(route('queue.index'));

        $response->assertOk();
        $response->assertSee($ownerTicket->ticket_number);
        $response->assertDontSee($otherTicket->ticket_number);
    }
}
