import { AnalyticsEvent } from './analytics/events';

interface ServerCaptureParams {
  event: AnalyticsEvent;
  distinctId?: string;
  properties?: Record<string, any>;
}

/**
 * Server-side PostHog event capture with mandatory flush pattern
 */
export async function captureServerEvent({
  event,
  distinctId = 'anonymous',
  properties = {},
}: ServerCaptureParams): Promise<void> {
  const posthogApiKey = process.env.POSTHOG_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

  if (!posthogApiKey) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PostHog Server Dev] Event: "${event}"`, { distinctId, properties });
    }
    return;
  }

  try {
    const payload = {
      api_key: posthogApiKey,
      event,
      distinct_id: distinctId,
      properties: {
        ...properties,
        $lib: 'knzin-nextjs-server',
        timestamp: new Date().toISOString(),
      },
    };

    const res = await fetch(`${posthogHost}/capture/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn(`[PostHog Server] Capture failed with status ${res.status}`);
    }
  } catch (err) {
    console.error('[PostHog Server] Error sending telemetry:', err);
  }
}
