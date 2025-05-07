import { z } from 'zod'

const TimezoneSchema = z.string().default('UTC')
const TimeOffsetSchema = z.number().int()

export const SearchEventsZodSchema = z.object({
  query: z.string().optional().default('*'),
  from: z.string().default('now-15m'),
  to: z.string().default('now'),
  options: z
    .object({
      timeOffset: TimeOffsetSchema.optional(),
      timezone: TimezoneSchema.optional(),
    })
    .optional(),
  sort: z.enum(['timestamp', '-timestamp']).optional().default('timestamp'),
  limit: z.number().int().min(1).optional().default(10),
  cursor: z.string().optional(),
})

export type SearchEventsParams = z.infer<typeof SearchEventsZodSchema>
