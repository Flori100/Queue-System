<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QueueTicket extends Model
{
    /** @use HasFactory<\Illuminate\Database\Eloquent\Factories\Factory> */
    use HasFactory;

    public const STATUS_WAITING = 'waiting';
    public const STATUS_CALLED = 'called';
    public const STATUS_SERVING = 'serving';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    public const STATUSES = [
        self::STATUS_WAITING,
        self::STATUS_CALLED,
        self::STATUS_SERVING,
        self::STATUS_COMPLETED,
        self::STATUS_CANCELLED,
    ];

    public const PRIORITY_LOW = 'low';
    public const PRIORITY_NORMAL = 'normal';
    public const PRIORITY_HIGH = 'high';

    public const PRIORITIES = [
        self::PRIORITY_LOW,
        self::PRIORITY_NORMAL,
        self::PRIORITY_HIGH,
    ];

    public const SERVICE_GENERAL = 'general';
    public const SERVICE_BILLING = 'billing';
    public const SERVICE_SUPPORT = 'support';
    public const SERVICE_CLAIMS = 'claims';

    public const SERVICES = [
        self::SERVICE_GENERAL,
        self::SERVICE_BILLING,
        self::SERVICE_SUPPORT,
        self::SERVICE_CLAIMS,
    ];

    protected $fillable = [
        'ticket_number',
        'queue_number',
        'customer_id',
        'assigned_to',
        'service_type',
        'priority',
        'status',
        'notes',
        'called_at',
        'served_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'called_at' => 'datetime',
            'served_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (QueueTicket $ticket): void {
            if (empty($ticket->queue_number)) {
                $ticket->queue_number = static::nextQueueNumber();
            }

            if (empty($ticket->ticket_number)) {
                $ticket->ticket_number = 'Q-'.str_pad((string) $ticket->queue_number, 6, '0', STR_PAD_LEFT);
            }

            if (empty($ticket->priority)) {
                $ticket->priority = self::PRIORITY_NORMAL;
            }
        });
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function assignedStaff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function scopeWaiting(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_WAITING);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNotIn('status', [self::STATUS_COMPLETED, self::STATUS_CANCELLED]);
    }

    public function isFinalized(): bool
    {
        return in_array($this->status, [self::STATUS_COMPLETED, self::STATUS_CANCELLED], true);
    }

    public static function nextQueueNumber(): int
    {
        return (int) static::max('queue_number') + 1;
    }
}
