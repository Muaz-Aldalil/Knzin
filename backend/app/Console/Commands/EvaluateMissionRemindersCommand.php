<?php

namespace App\Console\Commands;

use App\Models\CourseEntitlement;
use App\Models\CourseMissionReminder;
use App\Models\CoursePart;
use App\Models\LessonProgress;
use App\Notifications\MissionReminderNotification;
use Carbon\Carbon;
use Illuminate\Console\Command;

class EvaluateMissionRemindersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:evaluate-mission-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Evaluate learner course progress for 3-day inactivity and dispatch mission reminders with 7-day cooldown';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $inactivityCutoff = Carbon::now()->subDays(3);
        $cooldownCutoff = Carbon::now()->subDays(7);

        $activeEntitlements = CourseEntitlement::query()
            ->where('status', 'active')
            ->with(['course', 'user'])
            ->get();

        $processedPairs = [];
        $dispatchedCount = 0;

        foreach ($activeEntitlements as $entitlement) {
            $user = $entitlement->user;
            $course = $entitlement->course;

            if (!$user || !$course) {
                continue;
            }

            $pairKey = "{$user->id}:{$course->id}";
            if (isset($processedPairs[$pairKey])) {
                continue;
            }
            $processedPairs[$pairKey] = true;

            // 1. Get all active lesson parts for this course
            $activePartIds = CoursePart::query()
                ->where('course_id', $course->id)
                ->where('is_active', true)
                ->pluck('id');

            if ($activePartIds->isEmpty()) {
                continue;
            }

            // 2. Check if learner has completed all active parts
            $completedCount = LessonProgress::query()
                ->where('user_id', $user->id)
                ->whereIn('course_part_id', $activePartIds)
                ->where('is_completed', true)
                ->count();

            if ($completedCount >= $activePartIds->count()) {
                // Course completely finished, no mission reminder needed
                continue;
            }

            // 3. Determine last_accessed_at (latest last_watched_at or entitlement created_at)
            $lastWatched = LessonProgress::query()
                ->where('user_id', $user->id)
                ->whereIn('course_part_id', $activePartIds)
                ->max('last_watched_at');

            $lastAccessedAt = $lastWatched
                ? Carbon::parse($lastWatched)
                : $entitlement->created_at;

            // Must have been inactive for at least 3 full days
            if ($lastAccessedAt > $inactivityCutoff) {
                continue;
            }

            // 4. Enforce 7-day minimum repeat cooldown tracked in course_mission_reminders
            $reminder = CourseMissionReminder::query()
                ->where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->first();

            if ($reminder && $reminder->last_reminded_at > $cooldownCutoff) {
                continue;
            }

            // 5. Dispatch reminder & update tracking timestamp
            $user->notify(new MissionReminderNotification($course, $user));

            CourseMissionReminder::updateOrCreate(
                ['user_id' => $user->id, 'course_id' => $course->id],
                ['last_reminded_at' => Carbon::now()]
            );

            $dispatchedCount++;
        }

        $this->info("Processed {$dispatchedCount} course mission reminders.");

        return Command::SUCCESS;
    }
}
