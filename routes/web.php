<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\QueueTicketController;
use App\Http\Controllers\SimpleQueueController;
use App\Http\Controllers\ProfileController;
use App\Support\RoleRedirector;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route(RoleRedirector::routeNameFor(auth()->user()));
    }

    return view('welcome');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'customer'])
        ->middleware('role:customer')
        ->name('dashboard');

    Route::get('/admin/dashboard', [DashboardController::class, 'admin'])
        ->middleware('role:admin')
        ->name('admin.dashboard');

    Route::get('/staff/dashboard', [DashboardController::class, 'staff'])
        ->middleware('role:staff')
        ->name('staff.dashboard');

    Route::get('/reception/dashboard', [DashboardController::class, 'reception'])
        ->middleware('role:receptionist')
        ->name('reception.dashboard');

    Route::prefix('queue')->group(function () {
        Route::get('/', [QueueTicketController::class, 'index'])->name('queue.index');
        Route::post('/', [QueueTicketController::class, 'store'])
            ->middleware('role:customer')
            ->name('queue.store');
        Route::patch('/{ticket}/status', [QueueTicketController::class, 'update'])
            ->middleware('role:staff,receptionist,admin')
            ->name('queue.update-status');
        Route::patch('/{ticket}/cancel', [QueueTicketController::class, 'destroy'])
            ->middleware('role:customer,staff,receptionist,admin')
            ->name('queue.cancel');
    });

    Route::prefix('simple-queue')->name('simple-queue.')->group(function () {
        Route::get('/customer', [SimpleQueueController::class, 'customer'])
            ->middleware('role:customer')
            ->name('customer');
        Route::post('/customer/take-ticket', [SimpleQueueController::class, 'takeTicket'])
            ->middleware('role:customer')
            ->name('take-ticket');

        Route::get('/staff', [SimpleQueueController::class, 'staff'])
            ->middleware('role:staff,receptionist,admin')
            ->name('staff');
        Route::post('/staff/call-next', [SimpleQueueController::class, 'callNext'])
            ->middleware('role:staff,receptionist,admin')
            ->name('call-next');
    });
});

Route::get('/simple-queue/display', [SimpleQueueController::class, 'display'])
    ->name('simple-queue.display');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
