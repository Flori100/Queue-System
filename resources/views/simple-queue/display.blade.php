<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Queue Display</title>
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="min-h-screen bg-gray-900 text-white antialiased">
        <main class="flex min-h-screen flex-col items-center justify-center px-6 text-center">
            <p class="text-4xl font-semibold tracking-wide text-gray-300 md:text-6xl">Now Serving</p>
            <p class="mt-8 text-7xl font-extrabold text-emerald-400 md:text-9xl">
                {{ $currentCalledTicket?->ticket_number ?? '-' }}
            </p>
        </main>
    </body>
</html>
