<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Queue Tickets') }}
        </h2>
    </x-slot>

    <div class="py-8">
        <div class="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8">
            @if (session('status'))
                <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                    {{ session('status') }}
                </div>
            @endif

            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900">{{ __('Queue Summary') }}</h3>
                <dl class="mt-4 grid gap-4 sm:grid-cols-4">
                    <div class="rounded-lg border border-gray-200 p-4">
                        <dt class="text-sm text-gray-500">{{ __('Waiting') }}</dt>
                        <dd class="mt-1 text-2xl font-bold text-amber-600">{{ $summary['waiting'] }}</dd>
                    </div>
                    <div class="rounded-lg border border-gray-200 p-4">
                        <dt class="text-sm text-gray-500">{{ __('Called') }}</dt>
                        <dd class="mt-1 text-2xl font-bold text-blue-600">{{ $summary['called'] }}</dd>
                    </div>
                    <div class="rounded-lg border border-gray-200 p-4">
                        <dt class="text-sm text-gray-500">{{ __('Serving') }}</dt>
                        <dd class="mt-1 text-2xl font-bold text-indigo-600">{{ $summary['serving'] }}</dd>
                    </div>
                    <div class="rounded-lg border border-gray-200 p-4">
                        <dt class="text-sm text-gray-500">{{ __('Completed Today') }}</dt>
                        <dd class="mt-1 text-2xl font-bold text-emerald-600">{{ $summary['completed_today'] }}</dd>
                    </div>
                </dl>
            </div>

            @if ($canCreateTickets)
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900">{{ __('Create Ticket') }}</h3>
                    <form method="POST" action="{{ route('queue.store') }}" class="mt-4 grid gap-4 md:grid-cols-3">
                        @csrf

                        <div>
                            <x-input-label for="service" :value="__('Service')" />
                            <select
                                id="service"
                                name="service"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            >
                                @foreach (\App\Models\QueueTicket::SERVICES as $service)
                                    <option value="{{ $service }}" @selected(old('service') === $service)>
                                        {{ str($service)->replace('-', ' ')->title() }}
                                    </option>
                                @endforeach
                            </select>
                            <x-input-error :messages="$errors->get('service')" class="mt-2" />
                        </div>

                        <div>
                            <x-input-label for="priority" :value="__('Priority')" />
                            <select
                                id="priority"
                                name="priority"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            >
                                @foreach (\App\Models\QueueTicket::PRIORITIES as $priority)
                                    <option value="{{ $priority }}" @selected(old('priority', \App\Models\QueueTicket::PRIORITY_NORMAL) === $priority)>
                                        {{ ucfirst($priority) }}
                                    </option>
                                @endforeach
                            </select>
                            <x-input-error :messages="$errors->get('priority')" class="mt-2" />
                        </div>

                        <div class="md:col-span-3">
                            <x-input-label for="notes" :value="__('Notes (Optional)')" />
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
            @endif

            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900">{{ __('Current Queue') }}</h3>
                <div class="mt-4 overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-200 text-left text-gray-500">
                                <th class="py-2 pr-4">{{ __('Reference') }}</th>
                                <th class="py-2 pr-4">{{ __('Queue #') }}</th>
                                <th class="py-2 pr-4">{{ __('Service') }}</th>
                                <th class="py-2 pr-4">{{ __('Priority') }}</th>
                                <th class="py-2 pr-4">{{ __('Status') }}</th>
                                <th class="py-2 pr-4">{{ __('Customer') }}</th>
                                <th class="py-2 pr-4">{{ __('Assigned') }}</th>
                                @if ($canManageTickets)
                                    <th class="py-2 pr-4">{{ __('Actions') }}</th>
                                @elseif ($canCreateTickets)
                                    <th class="py-2 pr-4">{{ __('Action') }}</th>
                                @endif
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($tickets as $ticket)
                                <tr class="border-b border-gray-100">
                                    <td class="py-3 pr-4 font-semibold text-gray-900">{{ $ticket->ticket_number }}</td>
                                    <td class="py-3 pr-4 text-gray-700">{{ $ticket->queue_number }}</td>
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
                                    <td class="py-3 pr-4 text-gray-700">{{ $ticket->customer?->name ?? '-' }}</td>
                                    <td class="py-3 pr-4 text-gray-700">{{ $ticket->assignedUser?->name ?? '-' }}</td>
                                    @if ($canManageTickets)
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
                                    @elseif ($canCreateTickets)
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
                                            @endif
                                        </td>
                                    @endif
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="{{ $canManageTickets || $canCreateTickets ? 8 : 7 }}" class="py-6 text-center text-gray-500">
                                        {{ __('No queue tickets yet.') }}
                                    </td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>

                <div class="mt-4">
                    {{ $tickets->links() }}
                </div>
            </div>
        </div>
    </div>
</x-app-layout>
