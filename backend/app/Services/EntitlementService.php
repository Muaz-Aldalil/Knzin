<?php

namespace App\Services;

use App\Models\Course;
use App\Models\CourseEntitlement;
use App\Models\CoursePart;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EntitlementService
{
    /**
     * Grant course entitlements idempotently upon order fulfillment.
     */
    public function grantAfterFulfillment(Order $order): void
    {
        DB::transaction(function () use ($order) {
            // Pessimistic lock on the order row to serialize concurrent webhooks
            $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->first();
            if (!$lockedOrder) {
                return;
            }

            $order->loadMissing('items');

            foreach ($order->items as $item) {
                if ($item->item_type === 'bundle') {
                    // Check if an active bundle entitlement already exists
                    $existingBundle = CourseEntitlement::where('user_id', $order->user_id)
                        ->where('course_id', $item->course_id)
                        ->whereNull('course_part_id')
                        ->where('status', 'active')
                        ->first();

                    if (!$existingBundle) {
                        try {
                            CourseEntitlement::create([
                                'user_id' => $order->user_id,
                                'course_id' => $item->course_id,
                                'course_part_id' => null,
                                'order_id' => $order->id,
                                'status' => 'active',
                            ]);
                        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
                            Log::info("Bundle entitlement already created concurrently for order {$order->id}");
                        }
                    }
                } elseif ($item->item_type === 'part' && $item->course_part_id) {
                    // Check if an active part entitlement already exists
                    $existingPart = CourseEntitlement::where('user_id', $order->user_id)
                        ->where('course_id', $item->course_id)
                        ->where('course_part_id', $item->course_part_id)
                        ->where('status', 'active')
                        ->first();

                    if (!$existingPart) {
                        try {
                            CourseEntitlement::create([
                                'user_id' => $order->user_id,
                                'course_id' => $item->course_id,
                                'course_part_id' => $item->course_part_id,
                                'order_id' => $order->id,
                                'status' => 'active',
                            ]);
                        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
                            Log::info("Part entitlement already created concurrently for order {$order->id}");
                        }
                    }
                }
            }
        });
    }

    /**
     * Verify whether a user has authorized access to stream or view a course part.
     * Part 1 is always public free preview with zero authentication required.
     * Parts > 1 require verified active entitlement (bundle or modular part).
     */
    public function hasAccess(?User $user, Course $course, CoursePart $part): bool
    {
        // Part 1 is free introductory preview for all visitors
        if ((int) $part->part_number === 1) {
            return true;
        }

        if (!$user) {
            return false;
        }

        return CourseEntitlement::query()
            ->effective($user->id, $course->id, $part->id)
            ->exists();
    }

    /**
     * Revoke entitlements associated with an order (chargeback, cancellation, refund).
     * Preserves separately purchased modular part access.
     */
    public function revokeEntitlements(Order $order): void
    {
        CourseEntitlement::where('order_id', $order->id)
            ->where('status', 'active')
            ->update(['status' => 'revoked']);
    }
}
