/**
 * Activity Ticker Types & JSend API Envelope
 * Feature 004: Front-of-House Trust, Engagement & Social Proof Suite
 */

export type ActivityEventType = 'enrollment' | 'countdown_alert' | 'bulletin';

export interface ActivityEvent {
  id: string; // e.g. "evt_ord_9f8b2c1d3e4a"
  type: ActivityEventType;
  text_ar: string;
  text_en: string;
  highlight_label_ar: string;
  highlight_label_en: string;
  timestamp: string; // ISO 8601 UTC string
}

export interface ActivityFeedMeta {
  total: number;
  has_live_orders: boolean;
  polled_at: string; // ISO 8601 UTC string
}

export interface ActivityFeedResponse {
  status: 'success';
  data: {
    events: ActivityEvent[];
    meta: ActivityFeedMeta;
  };
}
