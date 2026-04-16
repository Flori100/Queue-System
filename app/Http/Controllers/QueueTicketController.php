<?php

namespace App\Http\Controllers;

use App\Models\QueueTicket;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class QueueTicketController extends Controller
{
    public function index(Request $request): View
    {
        $user = $request->user();

        $query = QueueTicket::query()->with(['customer:id,name', 'serviceProvider:id,name']);

        if ($user->role === User::ROLE_CUSTOMER) {
            $query->where('customer_id', $user->id);
        } elseif ($user->role === User::ROLE_SERVICE_PROVIDER) {
            $query->where('service_provider_id', $user->id);
        }

        $tickets = $query->latest()->paginate(15);
        $summaryScope = QueueTicket::query();

        if ($user->role === User::ROLE_CUSTOMER) {
            $summaryScope->where('customer_id', $user->id);
        }

        $summary = [
            'waiting' => (clone $summaryScope)->where('status', QueueTicket::STATUS_WAITING)->count(),
            'called' => (clone $summaryScope)->where('status', QueueTicket::STATUS_CALLED)->count(),
            'serving' => (clone $summaryScope)->where('status', QueueTicket::STATUS_SERVING)->count(),
            'completed_today' => (clone $summaryScope)
                ->where('status', QueueTicket::STATUS_COMPLETED)
                ->whereDate('completed_at', now()->toDateString())
                ->count(),
        ];

        return view('queue.index', [
            'tickets' => $tickets,
            'summary' => $summary,
            'currentUser' => $user,
            'canCreateTickets' => $user->role === User::ROLE_CUSTOMER,
            'canManageTickets' => $user->role === User::ROLE_SERVICE_PROVIDER,
            'serviceProviders' => User::query()
                ->where('role', User::ROLE_SERVICE_PROVIDER)
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->role !== User::ROLE_CUSTOMER) {
            abort(403);
        }

        $payload = $request->validate([
            'service_provider_id' => ['required', Rule::exists('users', 'id')],
            'service_type' => ['required', Rule::in(QueueTicket::SERVICES)],
            'notes' => ['nullable', 'string', 'max:500'],
            'priority' => ['required', Rule::in(QueueTicket::PRIORITIES)],
        ]);

        $serviceProvider = User::query()
            ->whereKey($payload['service_provider_id'])
            ->where('role', User::ROLE_SERVICE_PROVIDER)
            ->firstOrFail();

        $ticket = QueueTicket::create([
            'customer_id' => $user->id,
            'service_provider_id' => $serviceProvider->id,
            'service_type' => $payload['service_type'],
            'status' => QueueTicket::STATUS_WAITING,
            'priority' => $payload['priority'],
            'notes' => $payload['notes'] ?? null,
        ]);

        return redirect()
            ->route('queue.index')
            ->with('status', "Ticket {$ticket->ticket_number} created.");
    }

    public function update(Request $request, QueueTicket $ticket): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user->role === User::ROLE_SERVICE_PROVIDER, 403);
        abort_unless($ticket->service_provider_id === $user->id, 403);

        $payload = $request->validate([
            'status' => ['required', Rule::in([
                QueueTicket::STATUS_CALLED,
                QueueTicket::STATUS_SERVING,
                QueueTicket::STATUS_COMPLETED,
            ])],
        ]);

        if ($ticket->service_provider_id !== $user->id) {
            abort(403);
        }

        if ($ticket->isFinalized()) {
            return redirect()->route('queue.index')->with('status', "Ticket {$ticket->ticket_number} is already finalized.");
        }

        $status = $payload['status'];
        $attributes = ['status' => $status];

        if ($status === QueueTicket::STATUS_CALLED) {
            $attributes['called_at'] = now();
        }

        if ($status === QueueTicket::STATUS_SERVING) {
            $attributes['served_at'] = now();
            $attributes['called_at'] = $ticket->called_at ?? now();
        }

        if ($status === QueueTicket::STATUS_COMPLETED) {
            $attributes['completed_at'] = now();
            $attributes['served_at'] = $ticket->served_at ?? now();
        }

        $ticket->update($attributes);

        return redirect()->route('queue.index')->with('status', "Ticket {$ticket->ticket_number} updated.");
    }

    public function destroy(Request $request, QueueTicket $ticket): RedirectResponse
    {
        $user = $request->user();

        if ($user->role === User::ROLE_CUSTOMER) {
            abort_if($ticket->customer_id !== $user->id, 403);

            abort_if(
                ! in_array($ticket->status, [QueueTicket::STATUS_WAITING, QueueTicket::STATUS_CALLED], true),
                403,
                'Ticket cannot be cancelled once service has started.'
            );
        } else {
            abort_unless($user->role === User::ROLE_SERVICE_PROVIDER, 403);
            abort_unless($ticket->service_provider_id === $user->id, 403);
        }

        if ($ticket->isFinalized()) {
            return redirect()->route('queue.index')->with('status', "Ticket {$ticket->ticket_number} is already finalized.");
        }

        $ticket->update([
            'status' => QueueTicket::STATUS_CANCELLED,
            'completed_at' => now(),
        ]);

        return redirect()->route('queue.index')->with('status', "Ticket {$ticket->ticket_number} cancelled.");
    }
}
