<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Customer Queue') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="mx-auto max-w-3xl space-y-6 sm:px-6 lg:px-8">
            <div class="rounded-lg border border-gray-200 bg-white p-8 shadow-sm text-center">
                <h3 class="text-2xl font-semibold text-gray-900">Take a Queue Ticket</h3>

                <form method="POST" action="{{ route('simple-queue.take-ticket') }}" class="mt-6">
                    @csrf
                    <button
                        type="submit"
                        class="rounded-lg bg-indigo-600 px-8 py-4 text-xl font-semibold text-white hover:bg-indigo-500"
                    >
                        Take Ticket
                    </button>
                </form>

                <div class="mt-10">
                    <p class="text-sm font-medium uppercase tracking-wide text-gray-500">Generated Ticket Number</p>
                    <p class="mt-2 text-5xl font-extrabold text-indigo-700">
                        {{ $generatedTicketNumber ?? '-' }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>
