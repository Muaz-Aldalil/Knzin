<?php

namespace App\Channels;

use Illuminate\Database\QueryException;
use Illuminate\Notifications\Channels\DatabaseChannel as BaseDatabaseChannel;
use Illuminate\Notifications\Notification;

class DatabaseChannel extends BaseDatabaseChannel
{
    /**
     * Send the given notification safely under concurrent execution.
     *
     * @param  mixed  $notifiable
     * @param  \Illuminate\Notifications\Notification  $notification
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function send($notifiable, Notification $notification)
    {
        try {
            return parent::send($notifiable, $notification);
        } catch (QueryException $e) {
            // Check for duplicate key / unique constraint violation
            // SQLSTATE 23000: MySQL 1062, SQLite 19 / UNIQUE constraint failed, Postgres 23505
            $isDuplicate = $e->getCode() === '23000'
                || str_contains($e->getMessage(), '1062')
                || str_contains($e->getMessage(), 'UNIQUE constraint failed')
                || str_contains($e->getMessage(), 'duplicate key value');

            if ($isDuplicate) {
                // Return existing record so downstream callers have an idempotent model
                return $notifiable->routeNotificationFor('database', $notification)
                    ->where('id', $notification->id)
                    ->first();
            }

            throw $e;
        }
    }
}
