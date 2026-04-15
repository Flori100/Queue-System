<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Admin Dashboard') }}
        </h2>
    </x-slot>

    <div class="py-12" x-data="{ tab: 'overview' }">
        <div class="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">Total Tickets</p>
                    <p class="mt-1 text-2xl font-semibold text-gray-900">{{ $metrics['total_tickets'] }}</p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">Active Tickets</p>
                    <p class="mt-1 text-2xl font-semibold text-amber-700">{{ $metrics['active_tickets'] }}</p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">Customers</p>
                    <p class="mt-1 text-2xl font-semibold text-indigo-700">{{ $metrics['customers'] }}</p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">Completed Today</p>
                    <p class="mt-1 text-2xl font-semibold text-emerald-700">{{ $metrics['completed_today'] }}</p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">Total Users</p>
                    <p class="mt-1 text-2xl font-semibold text-red-700">{{ $metrics['total_users'] }}</p>
                </div>
            </div>

            <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div class="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        @click="tab = 'overview'"
                        :class="tab === 'overview' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'"
                        class="rounded-md px-3 py-1.5 text-sm font-medium"
                    >Overview</button>
                    <button
                        type="button"
                        @click="tab = 'team'"
                        :class="tab === 'team' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'"
                        class="rounded-md px-3 py-1.5 text-sm font-medium"
                    >Team Activity</button>
                    <button
                        type="button"
                        @click="tab = 'recent'"
                        :class="tab === 'recent' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'"
                        class="rounded-md px-3 py-1.5 text-sm font-medium"
                    >Recent Tickets</button>
                    <a
                        href="{{ route('queue.index') }}"
                        class="ml-auto inline-flex items-center rounded-md bg-gray-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-700"
                    >Queue Board</a>
                </div>
            </div>

            <section x-show="tab === 'overview'" x-cloak class="grid gap-6 lg:grid-cols-2">
                <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 class="text-lg font-semibold text-gray-900">Service Distribution</h3>
                    <div class="mt-4 space-y-3">
                        @forelse ($serviceBreakdown as $service => $total)
                            <div>
                                <div class="mb-1 flex items-center justify-between text-sm text-gray-700">
                                    <span>{{ str($service)->title() }}</span>
                                    <span>{{ $total }}</span>
                                </div>
                                <div class="h-2 rounded bg-gray-200">
                                    <div
                                        class="h-2 rounded bg-indigo-600"
                                        style="width: {{ $totalTickets > 0 ? max(3, ($total / $totalTickets) * 100) : 0 }}%"
                                    ></div>
                                </div>
                            </div>
                        @empty
                            <p class="text-sm text-gray-500">No service distribution data yet.</p>
                        @endforelse
                    </div>
                </div>

                <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 class="text-lg font-semibold text-gray-900">Priority Breakdown</h3>
                    <div class="mt-4 space-y-3 text-sm">
                        @foreach ($priorityBreakdown as $priority => $total)
                            <div class="flex items-center justify-between rounded border border-gray-200 px-3 py-2">
                                <span class="font-medium text-gray-700">{{ ucfirst($priority) }}</span>
                                <span class="font-semibold text-gray-900">{{ $total }}</span>
                            </div>
                        @endforeach
                    </div>
                </div>
            </section>

            <section x-show="tab === 'team'" x-cloak class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h3 class="text-lg font-semibold text-gray-900">Staff / Reception Activity Today</h3>
                <div class="mt-4 overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-200 text-left text-gray-500">
                                <th class="px-3 py-2">Name</th>
                                <th class="px-3 py-2">Role</th>
                                <th class="px-3 py-2">Completed</th>
                                <th class="px-3 py-2">Serving</th>
                                <th class="px-3 py-2">Called</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($teamPerformance as $member)
                                <tr class="border-b border-gray-100">
                                    <td class="px-3 py-2 font-medium text-gray-900">{{ $member->name }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ ucfirst($member->role) }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ $member->completed_today }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ $member->serving_now }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ $member->called_now }}</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="5" class="px-3 py-6 text-center text-gray-500">No staff/reception activity data.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </section>

            <section x-show="tab === 'recent'" x-cloak class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h3 class="text-lg font-semibold text-gray-900">Latest Queue Events</h3>
                <div class="mt-4 overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-200 text-left text-gray-500">
                                <th class="px-3 py-2">Ticket</th>
                                <th class="px-3 py-2">Customer</th>
                                <th class="px-3 py-2">Service</th>
                                <th class="px-3 py-2">Priority</th>
                                <th class="px-3 py-2">Status</th>
                                <th class="px-3 py-2">Assigned</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($latestTickets as $ticket)
                                <tr class="border-b border-gray-100">
                                    <td class="px-3 py-2 font-medium text-gray-900">{{ $ticket->ticket_number }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ $ticket->customer?->name }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ str($ticket->service_type)->title() }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ ucfirst($ticket->priority) }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ ucfirst($ticket->status) }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ $ticket->assignedStaff?->name ?? '-' }}</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="6" class="px-3 py-6 text-center text-gray-500">No recent ticket activity.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    </div>
</x-app-layout>
