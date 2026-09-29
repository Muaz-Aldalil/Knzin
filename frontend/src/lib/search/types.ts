import { z } from 'zod';

export const SORTS = ['relevance', 'newest', 'duration'] as const;
export type SortOption = (typeof SORTS)[number];

export const SearchRequestSchema = z.object({
  query: z.string().min(1).max(300),
  sort: z.enum(SORTS).default('relevance'),
  distinctId: z.string().optional(),
  sessionId: z.string().optional(),
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;

export const ModelHitSchema = z.object({
  courseSlug: z.string(),
  partNumber: z.number().int().min(1).max(6),
  kind: z.enum(['video', 'lesson']),
  reason: z.string(),
  rank: z.number().int(),
  startSeconds: z.number().int().min(0).optional(),
  momentLabel: z.string().optional(),
});

export type ModelHit = z.infer<typeof ModelHitSchema>;

export const SearchResultBaseSchema = z.object({
  lessonTitle: z.string(),
  label: z.string(),
  partNumber: z.number(),
  courseTitle: z.string(),
  courseSlug: z.string(),
  durationSeconds: z.number(),
  keyPoints: z.array(z.string()),
  reason: z.string(),
  href: z.string(),
  rank: z.number(),
});

export const VideoSearchResultSchema = SearchResultBaseSchema.extend({
  kind: z.literal('video'),
  startSeconds: z.number(),
  momentLabel: z.string(),
});

export const LessonSearchResultSchema = SearchResultBaseSchema.extend({
  kind: z.literal('lesson'),
});

export const SearchResultSchema = z.discriminatedUnion('kind', [
  VideoSearchResultSchema,
  LessonSearchResultSchema,
]);

export type SearchResult = z.infer<typeof SearchResultSchema>;

export const SearchResponseSchema = z.object({
  query: z.string(),
  sort: z.enum(SORTS),
  count: z.number(),
  courseCount: z.number(),
  reply: z.string(),
  results: z.array(SearchResultSchema),
});

export type SearchResponse = z.infer<typeof SearchResponseSchema>;
