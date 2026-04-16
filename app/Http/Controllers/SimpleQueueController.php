<?php

namespace App\Http\Controllers;

use App\Models\QueueTicket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class SimpleQueueController extends Controller
{
    public function customer(Request $request): View
    {
        return view('simple-queue.customer', [
            'generatedTicketNumber' => session('generated_ticket'),
        ]);
    }

    public function takeTicket(Request $request): RedirectResponse
    {
        $ticket = QueueTicket::create([
            'customer_id' => $request->user()->id,
            'service_type' => QueueTicket::SERVICE_GENERAL,
            'priority' => QueueTicket::PRIORITY_NORMAL,
            'status' => QueueTicket::STATUS_WAITING,
        ]);

        return redirect()
            ->route('simple-queue.customer')
            ->with('generated_ticket', $ticket->ticket_number);
    }

    public function staff(): View
    {
        return view('simple-queue.staff', [
            'currentCalledTicket' => $this->currentCalledTicket(),
        ]);
    }

    public function callNext(Request $request): RedirectResponse
    {
        $nextTicket = QueueTicket::query()
            ->where('status', QueueTicket::STATUS_WAITING)
            ->orderBy('queue_number')
            ->first();

        if (! $nextTicket) {
            return redirect()
                ->route('simple-queue.staff')
                ->with('status', 'No waiting tickets.');
        }

        $nextTicket->update([
            'status' => QueueTicket::STATUS_CALLED,
            'called_at' => now(),
            'assigned_to' => $request->user()->id,
        ]);

        return redirect()
            ->route('simple-queue.staff')
            ->with('status', "Called {$nextTicket->ticket_number}.");
    }

    public function display(): View
    {
        return view('simple-queue.display', [
            'currentCalledTicket' => $this->currentCalledTicket(),
        ]);
    }

    private function currentCalledTicket(): ?QueueTicket
    {
        return QueueTicket::query()
            ->whereIn('status', [QueueTicket::STATUS_CALLED, QueueTicket::STATUS_SERVING])
            ->orderByDesc('called_at')
            ->orderByDesc('queue_number')
            ->first();
    }
}
