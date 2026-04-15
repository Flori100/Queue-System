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
            ->with('assignedStaff:id,name')
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
        ]);
    }

    public function admin(): View
    {
        $today = now()->toDateString();
        $totalTickets = QueueTicket::count();
        $metrics = [
            'total_tickets' => $totalTickets,
            'active_tickets' => QueueTicket::query()
                ->whereNotIn('status', [QueueTicket::STATUS_COMPLETED, QueueTicket::STATUS_CANCELLED])
                ->count(),
            'customers' => User::where('role', User::ROLE_CUSTOMER)->count(),
            'completed_today' => QueueTicket::where('status', QueueTicket::STATUS_COMPLETED)
                ->whereDate('completed_at', $today)
                ->count(),
            'total_users' => User::count(),
        ];

        $serviceBreakdown = collect(QueueTicket::SERVICES)
            ->mapWithKeys(fn (string $service): array => [
                $service => QueueTicket::where('service_type', $service)->count(),
            ]);

        $priorityBreakdown = collect(QueueTicket::PRIORITIES)
            ->mapWithKeys(fn (string $priority): array => [
                $priority => QueueTicket::where('priority', $priority)->count(),
            ]);

        $teamUsers = User::query()
            ->whereIn('role', [User::ROLE_STAFF, User::ROLE_RECEPTIONIST])
            ->get(['id', 'name', 'role']);

        $teamStatusCounts = QueueTicket::query()
            ->whereIn('assigned_to', $teamUsers->pluck('id'))
            ->selectRaw('assigned_to, status, COUNT(*) as total')
            ->groupBy('assigned_to', 'status')
            ->get()
            ->groupBy('assigned_to');

        $teamCompletedToday = QueueTicket::query()
            ->whereIn('assigned_to', $teamUsers->pluck('id'))
            ->where('status', QueueTicket::STATUS_COMPLETED)
            ->whereDate('completed_at', $today)
            ->selectRaw('assigned_to, COUNT(*) as total')
            ->groupBy('assigned_to')
            ->pluck('total', 'assigned_to');

        $teamPerformance = $teamUsers->map(function (User $user) use ($teamStatusCounts, $teamCompletedToday): object {
            $countsByStatus = $teamStatusCounts->get($user->id, collect())->mapWithKeys(
                fn (QueueTicket $row): array => [$row->status => (int) $row->total]
            );

            return (object) [
                'name' => $user->name,
                'role' => $user->role,
                'completed_today' => (int) ($teamCompletedToday[$user->id] ?? 0),
                'serving_now' => (int) ($countsByStatus[QueueTicket::STATUS_SERVING] ?? 0),
                'called_now' => (int) ($countsByStatus[QueueTicket::STATUS_CALLED] ?? 0),
            ];
        });

        $latestTickets = QueueTicket::query()
            ->with(['customer:id,name', 'assignedStaff:id,name'])
            ->latest()
            ->limit(15)
            ->get();

        return view('admin.dashboard', [
            'metrics' => $metrics,
            'totalTickets' => $totalTickets,
            'serviceBreakdown' => $serviceBreakdown,
            'priorityBreakdown' => $priorityBreakdown,
            'teamPerformance' => $teamPerformance,
            'latestTickets' => $latestTickets,
        ]);
    }

    public function staff(Request $request): View
    {
        $staff = $request->user();

        $assignedTickets = QueueTicket::query()
            ->where('assigned_to', $staff->id)
            ->whereNotIn('status', [QueueTicket::STATUS_COMPLETED, QueueTicket::STATUS_CANCELLED])
            ->with('customer:id,name')
            ->orderByRaw("FIELD(status, 'serving', 'called', 'waiting')")
            ->orderBy('queue_number')
            ->get();

        $availableTickets = QueueTicket::query()
            ->whereNull('assigned_to')
            ->whereIn('status', [QueueTicket::STATUS_WAITING, QueueTicket::STATUS_CALLED])
            ->with('customer:id,name')
            ->orderByRaw("FIELD(priority, 'high', 'normal', 'low')")
            ->orderBy('queue_number')
            ->limit(15)
            ->get();

        $stats = [
            'assigned_total' => $assignedTickets->count(),
            'serving' => $assignedTickets->where('status', QueueTicket::STATUS_SERVING)->count(),
            'open_assigned' => $assignedTickets
                ->whereIn('status', [QueueTicket::STATUS_WAITING, QueueTicket::STATUS_CALLED])
                ->count(),
            'completed_today' => QueueTicket::query()
                ->where('assigned_to', $staff->id)
                ->where('status', QueueTicket::STATUS_COMPLETED)
                ->whereDate('completed_at', now()->toDateString())
                ->count(),
        ];

        return view('staff.dashboard', [
            'stats' => $stats,
            'assignedTickets' => $assignedTickets,
            'availableTickets' => $availableTickets,
        ]);
    }

    public function reception(): View
    {
        $waitingTickets = QueueTicket::query()
            ->where('status', QueueTicket::STATUS_WAITING)
            ->with(['customer:id,name', 'assignedStaff:id,name'])
            ->orderByRaw("FIELD(priority, 'high', 'normal', 'low')")
            ->orderBy('queue_number')
            ->limit(20)
            ->get();

        $calledTickets = QueueTicket::query()
            ->where('status', QueueTicket::STATUS_CALLED)
            ->with(['customer:id,name', 'assignedStaff:id,name'])
            ->orderBy('queue_number')
            ->limit(12)
            ->get();

        $stats = [
            'waiting' => QueueTicket::where('status', QueueTicket::STATUS_WAITING)->count(),
            'called' => QueueTicket::where('status', QueueTicket::STATUS_CALLED)->count(),
            'serving' => QueueTicket::where('status', QueueTicket::STATUS_SERVING)->count(),
            'completed_today' => QueueTicket::where('status', QueueTicket::STATUS_COMPLETED)
                ->whereDate('completed_at', now()->toDateString())
                ->count(),
            'cancelled_today' => QueueTicket::where('status', QueueTicket::STATUS_CANCELLED)
                ->whereDate('updated_at', now()->toDateString())
                ->count(),
        ];

        return view('reception.dashboard', [
            'stats' => $stats,
            'waitingTickets' => $waitingTickets,
            'calledTickets' => $calledTickets,
        ]);
    }
}
