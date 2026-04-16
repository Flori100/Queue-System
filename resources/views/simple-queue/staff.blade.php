<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Staff Queue Control') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="mx-auto max-w-3xl space-y-6 sm:px-6 lg:px-8">
            @if (session('status'))
                <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                    {{ session('status') }}
                </div>
            @endif

            <div class="rounded-lg border border-gray-200 bg-white p-8 shadow-sm text-center">
                <h3 class="text-2xl font-semibold text-gray-900">Queue Control</h3>

                <form method="POST" action="{{ route('simple-queue.call-next') }}" class="mt-6">
                    @csrf
                    <button
                        type="submit"
                        class="rounded-lg bg-emerald-600 px-8 py-4 text-xl font-semibold text-white hover:bg-emerald-500"
                    >
                        Call Next
                    </button>
                </form>

                <div class="mt-10">
                    <p class="text-sm font-medium uppercase tracking-wide text-gray-500">Current Called Ticket</p>
                    <p class="mt-2 text-5xl font-extrabold text-emerald-700">
                        {{ $currentCalledTicket?->ticket_number ?? '-' }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>
