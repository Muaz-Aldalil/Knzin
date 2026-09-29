/**
 * Promotional Draws Domain Contracts & Types
 * Complies with Feature 003 spec, plan, and JSON contracts.
 */

export type DrawTier = 'hourly' | 'daily' | 'monthly';

export type DrawExecutionType = 'automated_electronic' | 'live_broadcast';

export type DrawStatus = 'upcoming' | 'active' | 'locked' | 'completed';

export type PrizeCategory = 'cash' | 'merchandise';

export interface PrizeItem {
  title: string;
  description?: string | null;
  category: PrizeCategory;
  valuation_usd: number;
  display_iqd_label: string;
  image_url: string;
}

export interface DrawItem {
  id: string;
  tier: DrawTier;
  execution_type: DrawExecutionType;
  title: string;
  status: DrawStatus;
  starts_at: string; // ISO 8601 UTC
  ends_at: string;   // ISO 8601 UTC
  badge_label: string;
  broadcast_url?: string | null;
  total_eligible_tickets?: number;
  prize: PrizeItem;
}

export interface ActiveDrawsData {
  server_time_utc: string; // ISO 8601 UTC reference timestamp
  draws: DrawItem[];
}

export interface ActiveDrawsResponse {
  status: 'success' | 'fail' | 'error';
  data: ActiveDrawsData;
  message?: string;
}

export interface ConcludedDrawWinner {
  winning_ticket_serial: string;
  masked_name: string;
  governorate: string;
  prize_delivered: boolean;
}

export interface ConcludedDrawItem {
  id: string;
  tier: DrawTier;
  title: string;
  concluded_at: string; // ISO 8601 UTC
  broadcast_replay_url?: string | null;
  prize: {
    title: string;
    valuation_usd: number;
    display_iqd_label: string;
    image_url: string;
  };
  winner: ConcludedDrawWinner;
}

export interface ConcludedDrawsData {
  draws: ConcludedDrawItem[];
}

export interface ConcludedDrawsResponse {
  status: 'success' | 'fail' | 'error';
  data: ConcludedDrawsData;
  message?: string;
}

export interface CountdownTimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isLocked: boolean;
  totalSeconds: number;
}
