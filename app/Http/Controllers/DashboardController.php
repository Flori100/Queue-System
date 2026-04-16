<?php

namespace App\Http\Controllers;

use App\Models\QueueTicket;
use App\Models\User;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function customer(Request $request): View
    {
        $user = $request->user();

        $recentTickets = QueueTicket::query()
            ->where('customer_id', $user->id)
            ->with('serviceProvider:id,name')
            ->latest()
            ->limit(10)
            ->get();

        $completedTickets = QueueTicket::query()
            ->where('customer_id', $user->id)
            ->where('status', QueueTicket::STATUS_COMPLETED)
            ->whereNotNull('completed_at')
            ->latest('completed_at')
            ->limit(50)
            ->get(['created_at', 'completed_at']);

        $avgWaitMinutes = (int) round(
            $completedTickets
                ->map(fn (QueueTicket $ticket): ?int => $ticket->created_at?->diffInMinutes($ticket->completed_at))
                ->filter()
                ->avg() ?? 0
        );

        $stats = [
            'open' => QueueTicket::query()
                ->where('customer_id', $user->id)
                ->whereNotIn('status', [QueueTicket::STATUS_COMPLETED, QueueTicket::STATUS_CANCELLED])
                ->count(),
            'completed' => QueueTicket::query()
                ->where('customer_id', $user->id)
                ->where('status', QueueTicket::STATUS_COMPLETED)
                ->count(),
            'cancelled' => QueueTicket::query()
                ->where('customer_id', $user->id)
                ->where('status', QueueTicket::STATUS_CANCELLED)
                ->count(),
            'avg_wait_minutes' => $avgWaitMinutes,
        ];

        return view('dashboard', [
            'stats' => $stats,
            'recentTickets' => $recentTickets,
            'services' => QueueTicket::SERVICES,
            'priorities' => QueueTicket::PRIORITIES,
            'serviceProviders' => User::query()
                ->where('role', User::ROLE_SERVICE_PROVIDER)
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function provider(Request $request): View
    {
        $provider = $request->user();

        $upcomingReservations = QueueTicket::query()
            ->where('service_provider_id', $provider->id)
            ->whereNotIn('status', [QueueTicket::STATUS_COMPLETED, QueueTicket::STATUS_CANCELLED])
            ->with('customer:id,name')
            ->orderByRaw(
                "CASE status
                    WHEN '".QueueTicket::STATUS_SERVING."' THEN 1
                    WHEN '".QueueTicket::STATUS_CALLED."' THEN 2
                    WHEN '".QueueTicket::STATUS_WAITING."' THEN 3
                    ELSE 4
                END"
            )
            ->orderBy('queue_number')
            ->get();

        $recentCompleted = QueueTicket::query()
            ->where('service_provider_id', $provider->id)
            ->where('status', QueueTicket::STATUS_COMPLETED)
            ->with('customer:id,name')
            ->latest('completed_at')
            ->limit(10)
            ->get();

        $stats = [
            'upcoming' => $upcomingReservations->count(),
            'serving' => $upcomingReservations->where('status', QueueTicket::STATUS_SERVING)->count(),
            'called' => $upcomingReservations->where('status', QueueTicket::STATUS_CALLED)->count(),
            'completed_today' => QueueTicket::query()
                ->where('service_provider_id', $provider->id)
                ->where('status', QueueTicket::STATUS_COMPLETED)
                ->whereDate('completed_at', now()->toDateString())
                ->count(),
        ];

        return view('provider.dashboard', [
            'stats' => $stats,
            'upcomingReservations' => $upcomingReservations,
            'recentCompleted' => $recentCompleted,
        ]);
    }
}
