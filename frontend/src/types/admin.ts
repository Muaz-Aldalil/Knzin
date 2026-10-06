/**
 * Feature 008: Admin Panel TypeScript Definitions
 */

export type AdminCapability =
  | 'manage_admin_capabilities'
  | 'manage_platform_settings'
  | 'adjudicate_affiliate_coprize'
  | 'issue_kyc_approval'
  | 'issue_draw_audit_approval'
  | 'settle_affiliate_payout';

export interface AdminUser {
  id: number;
  email: string;
  display_name: string;
  status: 'active' | 'suspended';
}

export interface AdminSessionTelemetry {
  created_at: string;
  expires_at: string;
  remaining_seconds: number;
  max_age_minutes: number;
}

export interface AdminSession {
  user: AdminUser;
  capabilities: AdminCapability[];
  session?: AdminSessionTelemetry;
  server_time_utc: string;
}

export interface PlatformSetting {
  key: string;
  value: unknown;
  updated_at: string;
  updated_by: number | null;
}

export interface PlatformSettingsPayload {
  'affiliate.commission_rate_bps': number;
  'affiliate.payout_min_cents': number;
  [key: string]: unknown;
}

export interface AffiliateOverview {
  user_id: number;
  email: string;
  display_name: string;
  available_balance_cents: number;
  pending_balance_cents: number;
  lifetime_earned_cents: number;
  referred_orders_count: number;
  coprize_tickets_count: number;
  created_at: string;
}

export interface AffiliateLedgerEntry {
  id: number;
  user_id: number;
  type: string;
  amount_cents: number;
  status: 'pending' | 'available' | 'cleared' | 'cancelled';
  description: string;
  available_at: string | null;
  created_at: string;
}

export interface PayoutRecord {
  payout_number: string;
  user_id: number;
  amount_cents: number;
  payout_method: string;
  recipient_details: {
    phone?: string;
    account_number?: string;
    account_name?: string;
    [key: string]: string | number | undefined;
  } | null;
  status: 'requested' | 'processing' | 'completed' | 'rejected';
  rejection_reason?: string | null;
  mtcn_reference?: string | null;
  has_receipt: boolean;
  requested_at: string;
  processed_at?: string | null;
}

export interface CoPrizeRecord {
  id: number;
  affiliate_id: number;
  affiliate_email: string;
  draw_id: number;
  draw_title: string;
  draw_title_ar: string;
  draw_title_en: string;
  winning_ticket_serial: string;
  amount_cents: number;
  status: 'pending' | 'available' | 'revoked';
  has_valid_kyc: boolean;
  has_valid_draw_audit: boolean;
  created_at: string;
}

export interface ApprovalRecord {
  id: number;
  type: 'kyc_verification' | 'draw_integrity_audit';
  target_id: number;
  target_type: string;
  approved_by: number;
  status: 'valid' | 'superseded' | 'revoked';
  notes?: string | null;
  created_at: string;
}

export interface PrizeRecord {
  id: number;
  draw_id: number;
  title_ar: string;
  title_en: string;
  category: 'cash' | 'merchandise';
  retail_value_usd_cents: number;
  display_iqd_label?: string | null;
  image_url?: string | null;
  rank_order: number;
}

export interface DrawWinnerRecord {
  id: number;
  draw_id: number | string;
  ticket_id: number;
  winning_ticket_serial: string;
  winner_masked_name?: string | null;
  winner_governorate?: string | null;
  prize_delivered?: boolean;
  stream_recording_url?: string | null;
  drawn_at: string;
}

export interface DrawRecord {
  id: string | number;
  tier: 'hourly' | 'daily' | 'monthly';
  execution_type: 'automated_electronic' | 'live_broadcast';
  title_ar: string;
  title_en: string;
  status: 'upcoming' | 'locked' | 'completed' | 'cancelled';
  effective_status?: string;
  stage?: string;
  is_published: boolean;
  published_at?: string | null;
  published_by_user_id?: string | null;
  server_seed_hash?: string | null;
  seed_committed_at?: string | null;
  server_seed_revealed?: string | null;
  seed_revealed_at?: string | null;
  seed_commitment_hash?: string | null;
  revealed_server_seed?: string | null;
  seed_commitment?: {
    server_seed_hash: string;
    committed_at: string;
  } | null;
  seed_verification?: {
    server_seed_hash: string;
    server_seed_revealed: string | null;
    revealed_at: string | null;
  } | null;
  starts_at: string;
  ends_at: string;
  scheduled_at?: string | null;
  broadcast_url?: string | null;
  prizes?: PrizeRecord[];
  winner?: DrawWinnerRecord | null;
}

export interface UserRecord {
  id: number;
  email: string;
  display_name: string;
  status: 'active' | 'suspended';
  created_at: string;
  capabilities: AdminCapability[];
}

export interface AuditLogRecord {
  id: number;
  admin_id: number;
  admin_email: string;
  action: string;
  capability_used: string;
  ip_address: string;
  request_payload: unknown;
  result: 'success' | 'failure';
  justification?: string | null;
  created_at: string;
}

export interface OutcomeItem {
  title_ar: string;
  title_en: string;
  desc_ar: string;
  desc_en: string;
}

export interface AdminCoursePart {
  id: string;
  course_id: string;
  part_number: number;
  title_ar: string;
  title_en: string;
  description_ar?: string;
  description_en?: string;
  syllabus_ar?: string;
  syllabus_en?: string;
  part_price_cents: number;
  part_promotional_tickets: number;
  display_price_label?: string;
  resource_types?: string[];
  duration_minutes: number;
  is_free: boolean;
  is_active: boolean;
  video_url?: string | null;
  video_storage_path?: string | null;
  pdf_url?: string | null;
  pdf_storage_path?: string | null;
  pdf_title_ar?: string | null;
  pdf_title_en?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AdminCourse {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  cover_image_url?: string;
  bundle_price_cents: number;
  bundle_promotional_tickets: number;
  display_price_label?: string;
  is_active: boolean;
  outcomes?: OutcomeItem[] | null;
  curriculum_summary_ar?: string | null;
  curriculum_summary_en?: string | null;
  parts_count?: number;
  parts?: AdminCoursePart[];
  created_at?: string;
  updated_at?: string;
}

