export type AnalyticsEvent =
  | 'catalog_viewed'
  | 'course_viewed'
  | 'lesson_viewed'
  | 'video_played'
  | 'video_progress'
  | 'lesson_completed'
  | 'search_performed'
  | 'search_result_opened'
  | 'part_checkout_started'
  | 'bundle_checkout_started';

export interface BaseEventProps {
  distinct_id?: string;
  session_id?: string;
  timestamp?: string;
}

export interface VideoPlayedProps extends BaseEventProps {
  course_slug: string;
  part_number: number;
  start_seconds: number;
  duration_seconds: number;
}

export interface VideoProgressProps extends BaseEventProps {
  course_slug: string;
  part_number: number;
  milestone_percent: 25 | 50 | 75 | 95;
  measurement: 'elapsed_time';
}

export interface SearchPerformedProps extends BaseEventProps {
  query: string;
  sort: string;
  results_count: number;
  courses_count: number;
}

export interface SearchResultOpenedProps extends BaseEventProps {
  query: string;
  course_slug: string;
  part_number: number;
  result_kind: 'video' | 'lesson';
  rank: number;
  start_seconds?: number;
}
