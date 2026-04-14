@extends('layouts.app')

@section('content')
    <main class="mx-auto flex w-full max-w-5xl flex-1 items-center px-6 py-12">
        <section class="grid w-full gap-8 md:grid-cols-2 md:items-center">
            <div class="space-y-6">
                <span class="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
                    Laravel + Tailwind + Alpine.js
                </span>
                <h1 class="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                    Blade-powered starter project
                </h1>
                <p class="text-lg text-slate-600">
                    Your app is configured with Blade templates, Tailwind CSS, and Alpine.js. Bootstrap is not part
                    of this stack.
                </p>
                <div class="flex flex-wrap gap-2">
                    <span class="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700">
                        Blade
                    </span>
                    <span class="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700">
                        Tailwind CSS
                    </span>
                    <span class="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700">
                        Alpine.js
                    </span>
                </div>
                <div class="flex flex-wrap gap-3">
                    <a
                        href="https://laravel.com/docs"
                        target="_blank"
                        class="rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white transition hover:bg-slate-700"
                    >
                        Laravel Docs
                    </a>
                    <a
                        href="https://tailwindcss.com/docs"
                        target="_blank"
                        class="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                        Tailwind Docs
                    </a>
                </div>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" x-data="{ showDetails: false }">
                <h2 class="text-xl font-semibold text-slate-900">Alpine.js demo</h2>
                <p class="mt-2 text-slate-600">
                    Click the button to toggle Blade-rendered content controlled by Alpine state.
                </p>

                <button
                    type="button"
                    class="mt-5 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-500"
                    @click="showDetails = !showDetails"
                >
                    <span x-text="showDetails ? 'Hide stack details' : 'Show stack details'"></span>
                </button>

                <div
                    class="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4 text-indigo-900"
                    x-cloak
                    x-show="showDetails"
                    x-transition
                >
                    <ul class="list-disc space-y-1 pl-5">
                        <li>View layer: Blade templates</li>
                        <li>Styling: Tailwind CSS</li>
                        <li>Interactivity: Alpine.js</li>
                    </ul>
                </div>
            </div>
        </section>
    </main>
@endsection
