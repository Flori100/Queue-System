<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Customer Dashboard') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-5">
                    <p class="text-sm text-gray-500">{{ __('Open tickets') }}</p>
                    <p class="mt-2 text-2xl font-bold text-gray-900">{{ $counts['open'] }}</p>
                </div>
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-5">
                    <p class="text-sm text-gray-500">{{ __('Waiting tickets') }}</p>
                    <p class="mt-2 text-2xl font-bold text-amber-600">{{ $counts['waiting'] }}</p>
                </div>
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-5">
                    <p class="text-sm text-gray-500">{{ __('Completed tickets') }}</p>
                    <p class="mt-2 text-2xl font-bold text-emerald-600">{{ $counts['completed'] }}</p>
                </div>
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-5">
                    <p class="text-sm text-gray-500">{{ __('Last ticket number') }}</p>
                    <p class="mt-2 text-2xl font-bold text-indigo-600">{{ $counts['last_ticket'] ?? __('None') }}</p>
                </div>
            </div>

            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">{{ __('Create Queue Ticket') }}</h3>
                        <p class="text-sm text-gray-600">{{ __('Create a ticket directly from your dashboard.') }}</p>
                    </div>
                    <a
                        href="{{ route('queue.index') }}"
                        class="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                    >
                        {{ __('Open Full Queue Board') }}
                    </a>
                </div>

                <form method="POST" action="{{ route('queue.store') }}" class="mt-4 grid gap-4 md:grid-cols-3">
                    @csrf

                    <div>
                        <x-input-label for="service_type" :value="__('Service')" />
                        <select
                            id="service_type"
                            name="service_type"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        >
                            @foreach ($services as $service)
                                <option value="{{ $service }}" @selected(old('service_type') === $service)>
                                    {{ str($service)->title() }}
                                </option>
                            @endforeach
                        </select>
                        <x-input-error :messages="$errors->get('service_type')" class="mt-2" />
                    </div>

                    <div>
                        <x-input-label for="priority" :value="__('Priority')" />
                        <select
                            id="priority"
                            name="priority"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        >
                            @foreach ($priorities as $priority)
                                <option value="{{ $priority }}" @selected(old('priority', \App\Models\QueueTicket::PRIORITY_NORMAL) === $priority)>
                                    {{ ucfirst($priority) }}
                                </option>
                            @endforeach
                        </select>
                        <x-input-error :messages="$errors->get('priority')" class="mt-2" />
                    </div>

                    <div class="md:col-span-3">
                        <x-input-label for="notes" :value="__('Notes (optional)')" />
                        <textarea
                            id="notes"
                            name="notes"
                            rows="3"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >{{ old('notes') }}</textarea>
                        <x-input-error :messages="$errors->get('notes')" class="mt-2" />
                    </div>

                    <div class="md:col-span-3">
                        <x-primary-button>{{ __('Create Ticket') }}</x-primary-button>
                    </div>
                </form>
            </div>

            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900">{{ __('My Recent Tickets') }}</h3>
                    <span class="text-sm text-gray-500">{{ $tickets->count() }} {{ __('shown') }}</span>
                </div>

                <div class="mt-4 overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-200 text-left text-gray-500">
                                <th class="py-2 pr-4">{{ __('Ticket #') }}</th>
                                <th class="py-2 pr-4">{{ __('Service') }}</th>
                                <th class="py-2 pr-4">{{ __('Priority') }}</th>
                                <th class="py-2 pr-4">{{ __('Status') }}</th>
                                <th class="py-2 pr-4">{{ __('Assigned Staff') }}</th>
                                <th class="py-2 pr-4">{{ __('Created') }}</th>
                                <th class="py-2 pr-4">{{ __('Action') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($tickets as $ticket)
                                <tr class="border-b border-gray-100">
                                    <td class="py-3 pr-4 font-semibold text-gray-900">{{ $ticket->ticket_number }}</td>
                                    <td class="py-3 pr-4 text-gray-700">{{ str($ticket->service_type)->title() }}</td>
                                    <td class="py-3 pr-4 text-gray-700">{{ ucfirst($ticket->priority) }}</td>
                                    <td class="py-3 pr-4">
                                        <span @class([
                                            'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                                            'bg-amber-100 text-amber-800' => $ticket->status === \App\Models\QueueTicket::STATUS_WAITING,
                                            'bg-blue-100 text-blue-800' => $ticket->status === \App\Models\QueueTicket::STATUS_CALLED,
                                            'bg-indigo-100 text-indigo-800' => $ticket->status === \App\Models\QueueTicket::STATUS_SERVING,
                                            'bg-emerald-100 text-emerald-800' => $ticket->status === \App\Models\QueueTicket::STATUS_COMPLETED,
                                            'bg-red-100 text-red-800' => $ticket->status === \App\Models\QueueTicket::STATUS_CANCELLED,
                                        ])>
                                            {{ ucfirst($ticket->status) }}
                                        </span>
                                    </td>
                                    <td class="py-3 pr-4 text-gray-700">{{ $ticket->assignedStaff?->name ?? '-' }}</td>
                                    <td class="py-3 pr-4 text-gray-600">{{ $ticket->created_at->format('Y-m-d H:i') }}</td>
                                    <td class="py-3 pr-4">
                                        @if (in_array($ticket->status, [\App\Models\QueueTicket::STATUS_WAITING, \App\Models\QueueTicket::STATUS_CALLED], true))
                                            <form method="POST" action="{{ route('queue.cancel', $ticket) }}">
                                                @csrf
                                                @method('PATCH')
                                                <button
                                                    type="submit"
                                                    class="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
                                                >
                                                    {{ __('Cancel') }}
                                                </button>
                                            </form>
                                        @else
                                            <span class="text-xs text-gray-500">{{ __('Not available') }}</span>
                                        @endif
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="7" class="py-6 text-center text-gray-500">
                                        {{ __('No tickets created yet.') }}
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
