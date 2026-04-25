<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Service Provider Dashboard') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-5">
                    <p class="text-sm text-gray-500">{{ __('Upcoming reservations') }}</p>
                    <p class="mt-2 text-2xl font-bold text-gray-900">{{ $stats['upcoming'] }}</p>
                </div>
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-5">
                    <p class="text-sm text-gray-500">{{ __('Called') }}</p>
                    <p class="mt-2 text-2xl font-bold text-blue-600">{{ $stats['called'] }}</p>
                </div>
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-5">
                    <p class="text-sm text-gray-500">{{ __('Serving now') }}</p>
                    <p class="mt-2 text-2xl font-bold text-indigo-600">{{ $stats['serving'] }}</p>
                </div>
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-5">
                    <p class="text-sm text-gray-500">{{ __('Completed today') }}</p>
                    <p class="mt-2 text-2xl font-bold text-emerald-600">{{ $stats['completed_today'] }}</p>
                </div>
            </div>

            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">{{ __('Upcoming Reservations') }}</h3>
                        <p class="text-sm text-gray-600">{{ __('Manage statuses for your customer reservations.') }}</p>
                    </div>
                    <a
                        href="{{ route('queue.index') }}"
                        class="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                    >
                        {{ __('Open Reservation Board') }}
                    </a>
                </div>

                <div class="mt-4 overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-200 text-left text-gray-500">
                                <th class="py-2 pr-4">{{ __('Ticket #') }}</th>
                                <th class="py-2 pr-4">{{ __('Customer') }}</th>
                                <th class="py-2 pr-4">{{ __('Service') }}</th>
                                <th class="py-2 pr-4">{{ __('Priority') }}</th>
                                <th class="py-2 pr-4">{{ __('Status') }}</th>
                                <th class="py-2 pr-4">{{ __('Action') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($upcomingReservations as $ticket)
                                <tr class="border-b border-gray-100">
                                    <td class="py-3 pr-4 font-semibold text-gray-900">{{ $ticket->ticket_number }}</td>
                                    <td class="py-3 pr-4 text-gray-700">{{ $ticket->customer?->name ?? '-' }}</td>
                                    <td class="py-3 pr-4 text-gray-700">{{ str($ticket->service_type)->title() }}</td>
                                    <td class="py-3 pr-4 text-gray-700">{{ ucfirst($ticket->priority) }}</td>
                                    <td class="py-3 pr-4 text-gray-700">{{ ucfirst($ticket->status) }}</td>
                                    <td class="py-3 pr-4">
                                        <form method="POST" action="{{ route('queue.update-status', $ticket) }}" class="flex items-center gap-2">
                                            @csrf
                                            @method('PATCH')
                                            <select
                                                name="status"
                                                class="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            >
                                                @foreach ([\App\Models\QueueTicket::STATUS_CALLED, \App\Models\QueueTicket::STATUS_SERVING, \App\Models\QueueTicket::STATUS_COMPLETED] as $status)
                                                    <option value="{{ $status }}" @selected($ticket->status === $status)>{{ ucfirst($status) }}</option>
                                                @endforeach
                                            </select>
                                            <button
                                                type="submit"
                                                class="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                                            >
                                                {{ __('Update') }}
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="6" class="py-6 text-center text-gray-500">
                                        {{ __('No upcoming reservations.') }}
                                    </td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900">{{ __('Recently Completed') }}</h3>
                <div class="mt-4 overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-200 text-left text-gray-500">
                                <th class="py-2 pr-4">{{ __('Ticket #') }}</th>
                                <th class="py-2 pr-4">{{ __('Customer') }}</th>
                                <th class="py-2 pr-4">{{ __('Service') }}</th>
                                <th class="py-2 pr-4">{{ __('Completed at') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($recentCompleted as $ticket)
                                <tr class="border-b border-gray-100">
                                    <td class="py-3 pr-4 font-semibold text-gray-900">{{ $ticket->ticket_number }}</td>
                                    <td class="py-3 pr-4 text-gray-700">{{ $ticket->customer?->name ?? '-' }}</td>
                                    <td class="py-3 pr-4 text-gray-700">{{ str($ticket->service_type)->title() }}</td>
                                    <td class="py-3 pr-4 text-gray-700">{{ optional($ticket->completed_at)->format('Y-m-d H:i') }}</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="4" class="py-6 text-center text-gray-500">
                                        {{ __('No completed reservations yet.') }}
                                    </td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>
