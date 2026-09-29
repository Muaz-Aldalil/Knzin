import { NextRequest, NextResponse } from 'next/server';
import { SearchRequestSchema } from '@/lib/search/types';
import { searchCatalog, groundHits } from '@/lib/search/ground';
import { SEARCH_SYSTEM_PROMPT } from '@/lib/search/system-prompt';
import { captureServerEvent } from '@/lib/posthog-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    const { query, sort, distinctId, sessionId } = parseResult.data;

    let response;

    // Check if OpenAI key exists for LLM-powered stage 1 grounding
    if (process.env.OPENAI_API_KEY) {
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
