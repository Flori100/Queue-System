<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Staff Dashboard') }}
        </h2>
    </x-slot>

    <div class="py-12" x-data="{ activeTab: 'assigned' }">
        <div class="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">Assigned Tickets</p>
                    <p class="mt-1 text-2xl font-semibold text-gray-900">{{ $metrics['my_active'] }}</p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">Serving Now</p>
                    <p class="mt-1 text-2xl font-semibold text-indigo-700">{{ $metrics['my_serving'] }}</p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">Called</p>
                    <p class="mt-1 text-2xl font-semibold text-amber-700">{{ $metrics['my_called'] }}</p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">Completed Today</p>
                    <p class="mt-1 text-2xl font-semibold text-emerald-700">{{ $metrics['my_completed_today'] }}</p>
                </div>
            </div>

            <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div class="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        @click="activeTab = 'assigned'"
                        :class="activeTab === 'assigned' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'"
                        class="rounded-md px-3 py-1.5 text-sm font-medium"
                    >Assigned to Me</button>
                    <button
                        type="button"
                        @click="activeTab = 'available'"
                        :class="activeTab === 'available' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'"
                        class="rounded-md px-3 py-1.5 text-sm font-medium"
                    >Available Queue</button>
                    <a
                        href="{{ route('queue.index') }}"
                        class="ml-auto inline-flex items-center rounded-md bg-gray-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-700"
                    >Full Queue Board</a>
                </div>
            </div>

            <section x-show="activeTab === 'assigned'" x-cloak class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900">Assigned Tickets</h3>
                    <p class="text-sm text-gray-500">Tickets currently owned by you.</p>
                </div>

                <div class="overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-200 text-left text-gray-500">
                                <th class="px-3 py-2">Ticket</th>
                                <th class="px-3 py-2">Service</th>
                                <th class="px-3 py-2">Priority</th>
                                <th class="px-3 py-2">Status</th>
                                <th class="px-3 py-2">Customer</th>
                                <th class="px-3 py-2">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($myActiveTickets as $ticket)
                                <tr class="border-b border-gray-100">
                                    <td class="px-3 py-2 font-medium text-gray-900">{{ $ticket->ticket_number }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ str($ticket->service_type)->title() }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ ucfirst($ticket->priority) }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ ucfirst($ticket->status) }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ $ticket->customer?->name }}</td>
                                    <td class="px-3 py-2">
                                        @if ($ticket->status !== \App\Models\QueueTicket::STATUS_COMPLETED)
                                            <form method="POST" action="{{ route('queue.update-status', $ticket) }}" class="flex items-center gap-2">
                                                @csrf
                                                @method('PATCH')
                                                <select name="status" class="rounded-md border-gray-300 text-xs">
                                                    @foreach ([\App\Models\QueueTicket::STATUS_CALLED, \App\Models\QueueTicket::STATUS_SERVING, \App\Models\QueueTicket::STATUS_COMPLETED] as $status)
                                                        <option value="{{ $status }}" @selected($ticket->status === $status)>{{ ucfirst($status) }}</option>
                                                    @endforeach
                                                </select>
                                                <button type="submit" class="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-500">Save</button>
                                            </form>
                                        @endif
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="6" class="px-3 py-6 text-center text-gray-500">No assigned tickets.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </section>

            <section x-show="activeTab === 'available'" x-cloak class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900">Available Queue</h3>
                    <p class="text-sm text-gray-500">Unassigned waiting/called tickets.</p>
                </div>

                <div class="overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-200 text-left text-gray-500">
                                <th class="px-3 py-2">Ticket</th>
                                <th class="px-3 py-2">Service</th>
                                <th class="px-3 py-2">Priority</th>
                                <th class="px-3 py-2">Status</th>
                                <th class="px-3 py-2">Customer</th>
                                <th class="px-3 py-2">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($unassignedQueue as $ticket)
                                <tr class="border-b border-gray-100">
                                    <td class="px-3 py-2 font-medium text-gray-900">{{ $ticket->ticket_number }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ str($ticket->service_type)->title() }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ ucfirst($ticket->priority) }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ ucfirst($ticket->status) }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ $ticket->customer?->name }}</td>
                                    <td class="px-3 py-2">
                                        <form method="POST" action="{{ route('queue.update-status', $ticket) }}" class="flex items-center gap-2">
                                            @csrf
                                            @method('PATCH')
                                            <input type="hidden" name="status" value="{{ \App\Models\QueueTicket::STATUS_SERVING }}">
                                            <button type="submit" class="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500">Take & Serve</button>
                                        </form>
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="6" class="px-3 py-6 text-center text-gray-500">No available tickets right now.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    </div>
</x-app-layout>
