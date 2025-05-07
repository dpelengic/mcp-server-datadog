import { ExtendedTool, ToolHandlers } from '../../utils/types'
import { v2 } from '@datadog/datadog-api-client'
import { createToolSchema } from '../../utils/tool'
import { SearchEventsZodSchema } from './schema'

type EventsToolName = 'search_events'

type EventsTool = ExtendedTool<EventsToolName>

export const EVENTS_TOOLS: EventsTool[] = [
  createToolSchema(
    SearchEventsZodSchema,
    'search_events',
    'Search for events in Datadog using advanced filtering',
  ),
] as const

export const createEventsToolHandlers = (
  eventsApiV2: v2.EventsApi,
): ToolHandlers => {
  return {
    async search_events(request) {
      const { query, from, to, options, sort, limit, cursor } =
        request.params.arguments

      const response = await eventsApiV2.searchEvents({
        body: {
          filter: {
            query,
            from,
            to,
          },
          options,
          sort,
          page: {
            limit,
            cursor,
          },
        },
      })

      if (!response.data) {
        throw new Error('No events data returned')
      }

      return {
        content: [
          {
            type: 'text',
            text: `Events search results: ${JSON.stringify(response.data, null, 2)}`,
          },
          {
            type: 'text',
            text: `Pagination info: ${JSON.stringify(response.meta, null, 2)}`,
          },
        ],
      }
    },
  }
}
