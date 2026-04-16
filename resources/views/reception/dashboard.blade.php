<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Reception Dashboard') }}
        </h2>
    </x-slot>

    <div class="py-12" x-data="{ section: 'intake' }">
        <div class="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">Waiting</p>
                    <p class="mt-1 text-2xl font-semibold text-amber-700">{{ $stats['waiting'] }}</p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">Called</p>
                    <p class="mt-1 text-2xl font-semibold text-blue-700">{{ $stats['called'] }}</p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">Serving</p>
                    <p class="mt-1 text-2xl font-semibold text-indigo-700">{{ $stats['serving'] }}</p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">Completed Today</p>
                    <p class="mt-1 text-2xl font-semibold text-emerald-700">{{ $stats['completed_today'] }}</p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">Cancelled Today</p>
                    <p class="mt-1 text-2xl font-semibold text-red-700">{{ $stats['cancelled_today'] }}</p>
                </div>
            </div>

            <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div class="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        @click="section = 'intake'"
                        :class="section === 'intake' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'"
                        class="rounded-md px-3 py-1.5 text-sm font-medium"
                    >Intake Queue</button>
                    <button
                        type="button"
                        @click="section = 'called'"
                        :class="section === 'called' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'"
                        class="rounded-md px-3 py-1.5 text-sm font-medium"
                    >Called Queue</button>
                    <a
                        href="{{ route('queue.index') }}"
                        class="ml-auto inline-flex items-center rounded-md bg-gray-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-700"
                    >Full Queue Board</a>
                </div>
            </div>

            <section x-show="section === 'intake'" x-cloak class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900">Intake Queue (Waiting)</h3>
                    <p class="text-sm text-gray-500">Call the next customers and set priority as needed.</p>
                </div>

                <div class="overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-200 text-left text-gray-500">
                                <th class="px-3 py-2">Ticket</th>
                                <th class="px-3 py-2">Service</th>
                                <th class="px-3 py-2">Priority</th>
                                <th class="px-3 py-2">Customer</th>
                                <th class="px-3 py-2">Created</th>
                                <th class="px-3 py-2">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($waitingTickets as $ticket)
                                <tr class="border-b border-gray-100">
                                    <td class="px-3 py-2 font-medium text-gray-900">{{ $ticket->ticket_number }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ str($ticket->service_type)->title() }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ ucfirst($ticket->priority) }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ $ticket->customer?->name }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ $ticket->created_at->format('H:i') }}</td>
                                    <td class="px-3 py-2">
                                        <form method="POST" action="{{ route('queue.update-status', $ticket) }}" class="flex items-center gap-2">
                                            @csrf
                                            @method('PATCH')
                                            <input type="hidden" name="status" value="{{ \App\Models\QueueTicket::STATUS_CALLED }}">
                                            <button type="submit" class="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-500">Call</button>
                                        </form>
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="6" class="px-3 py-6 text-center text-gray-500">No waiting tickets.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </section>

            <section x-show="section === 'called'" x-cloak class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900">Called Tickets</h3>
                    <p class="text-sm text-gray-500">Cancel no-shows or let staff pick these up.</p>
                </div>

                <div class="overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-200 text-left text-gray-500">
                                <th class="px-3 py-2">Ticket</th>
                                <th class="px-3 py-2">Service</th>
                                <th class="px-3 py-2">Priority</th>
                                <th class="px-3 py-2">Customer</th>
                                <th class="px-3 py-2">Assigned Staff</th>
                                <th class="px-3 py-2">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($calledTickets as $ticket)
                                <tr class="border-b border-gray-100">
                                    <td class="px-3 py-2 font-medium text-gray-900">{{ $ticket->ticket_number }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ str($ticket->service_type)->title() }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ ucfirst($ticket->priority) }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ $ticket->customer?->name }}</td>
                                    <td class="px-3 py-2 text-gray-700">{{ $ticket->assignedStaff?->name ?? '-' }}</td>
                                    <td class="px-3 py-2">
                                        <form method="POST" action="{{ route('queue.cancel', $ticket) }}">
                                            @csrf
                                            @method('PATCH')
                                            <button type="submit" class="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-500">Cancel / No-show</button>
                                        </form>
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="6" class="px-3 py-6 text-center text-gray-500">No called tickets.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    </div>
</x-app-layout>
