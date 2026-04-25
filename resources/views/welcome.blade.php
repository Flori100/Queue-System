<x-guest-layout>
    <div class="space-y-8">
        <div class="text-center">
            <h1 class="text-3xl font-bold text-gray-900">Queue Management System</h1>
            <p class="mt-2 text-sm text-gray-600">Book tickets, manage service queues, and route users by role.</p>
        </div>

        <div class="grid gap-4">
            <div class="rounded-lg border border-gray-200 bg-white p-4">
                <h2 class="text-sm font-semibold text-gray-900">Customer</h2>
                <p class="mt-1 text-sm text-gray-600">Create new queue tickets and track status.</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-white p-4">
                <h2 class="text-sm font-semibold text-gray-900">Reception</h2>
                <p class="mt-1 text-sm text-gray-600">Check in queued tickets and assign priorities.</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-white p-4">
                <h2 class="text-sm font-semibold text-gray-900">Staff</h2>
                <p class="mt-1 text-sm text-gray-600">Serve queued tickets and mark progress.</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-white p-4">
                <h2 class="text-sm font-semibold text-gray-900">Admin</h2>
                <p class="mt-1 text-sm text-gray-600">Monitor volume, waiting times, and ticket distribution.</p>
            </div>
        </div>

        <div class="flex items-center justify-center gap-3">
            <a href="{{ route('login') }}" class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Log in</a>
            <a href="{{ route('register') }}" class="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">Register</a>
        </div>
    </div>
</x-guest-layout>
