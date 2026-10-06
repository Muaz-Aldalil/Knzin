import { NextRequest, NextResponse } from 'next/server';
import { SearchRequestSchema } from '@/lib/search/types';
import { searchCatalog, groundHits } from '@/lib/search/ground';
import { SEARCH_SYSTEM_PROMPT } from '@/lib/search/system-prompt';
import { captureServerEvent } from '@/lib/posthog-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// In-memory sliding-window IP rate limiter to protect OpenAI API credits from denial-of-wallet attacks
const searchRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { allowedLlm: boolean; blocked: boolean } {
  const now = Date.now();
  const entry = searchRateLimits.get(ip);

  // Proactive cleanup to prevent unbounded map memory growth
  if (searchRateLimits.size > 1000) {
    for (const [key, value] of searchRateLimits.entries()) {
      if (now > value.resetAt) searchRateLimits.delete(key);
    }
  }

  if (!entry || now > entry.resetAt) {
    searchRateLimits.set(ip, { count: 1, resetAt: now + 60_000 });
    return { allowedLlm: true, blocked: false };
  }

  entry.count++;

  // More than 60 requests per minute is abusive traffic
  if (entry.count > 60) {
    return { allowedLlm: false, blocked: true };
  }

  // More than 15 requests per minute bypasses LLM and falls back to deterministic catalog search
  if (entry.count > 15) {
    return { allowedLlm: false, blocked: false };
  }

  return { allowedLlm: true, blocked: false };
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = SearchRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid search request parameters', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    // Prioritize trusted proxy headers; for forwarded chains use the closest proxy hop
    const clientIp =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-real-ip') ||
      req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ||
      '127.0.0.1';
    const rateStatus = checkRateLimit(clientIp);

    if (rateStatus.blocked) {
      return NextResponse.json(
        { error: 'Too many search requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const { query, sort, distinctId, sessionId } = parseResult.data;

    let response;

    // Check if OpenAI key exists for LLM-powered stage 1 grounding and rate limit allows LLM
    if (process.env.OPENAI_API_KEY && rateStatus.allowedLlm) {
      try {
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: SEARCH_SYSTEM_PROMPT },
              {
                role: 'user',
                content: `Find vocational learning moments for query: "${query}". Output a JSON array of hits adhering to: [{ "courseSlug": string, "partNumber": number, "kind": "video"|"lesson", "reason": string, "rank": number, "startSeconds"?: number, "momentLabel"?: string }]`,
              },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
          }),
        });

        if (openaiRes.ok) {
          const data = await openaiRes.json();
          const content = data.choices?.[0]?.message?.content;
          const parsed = JSON.parse(content || '{}');
          const hits = Array.isArray(parsed) ? parsed : parsed.hits || parsed.results || [];
          if (hits.length > 0) {
            response = groundHits(query, hits, sort);
          }
        }
      } catch (err) {
        console.warn('[Search API] OpenAI call failed, falling back to deterministic grounding:', err);
      }
    }

    // Fallback or default: High-speed deterministic catalog matcher
    if (!response) {
      response = searchCatalog(query, sort);
    }

    // Telemetry: Capture search_performed on server with flush
    await captureServerEvent({
      event: 'search_performed',
      distinctId: distinctId || 'anonymous',
      properties: {
        query,
        sort,
        results_count: response.count,
        courses_count: response.courseCount,
        session_id: sessionId,
      },
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[Search API Error]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing search.' },
      { status: 500 }
    );
  }
}
