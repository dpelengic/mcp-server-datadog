import { v2 } from '@datadog/datadog-api-client'
import { describe, it, expect } from 'vitest'
import { createDatadogConfig } from '../../src/utils/datadog'
import { createEventsToolHandlers } from '../../src/tools/events/tool'
import { createMockToolRequest } from '../helpers/mock'
import { http, HttpResponse } from 'msw'
import { setupServer } from '../helpers/msw'
import { baseUrl } from '../helpers/datadog'

const eventsV2Endpoint = `${baseUrl}/v2/events/search`

describe('Events Tool', () => {
  if (!process.env.DATADOG_API_KEY || !process.env.DATADOG_APP_KEY) {
    throw new Error('DATADOG_API_KEY and DATADOG_APP_KEY must be set')
  }

  const datadogConfig = createDatadogConfig({
    apiKeyAuth: process.env.DATADOG_API_KEY,
    appKeyAuth: process.env.DATADOG_APP_KEY,
    site: process.env.DATADOG_SITE,
  })

  const apiInstanceV2 = new v2.EventsApi(datadogConfig)
  const toolHandlers = createEventsToolHandlers(apiInstanceV2)

  describe('search_events', () => {
    const server = setupServer(
      http.post(eventsV2Endpoint, async () => {
        return HttpResponse.json({
          data: [
            {
              attributes: {
                attributes: {
                  aggregation_key: 'test_agg',
                  date_happened: 1746625697000,
                  device_name: 'test-device',
                  duration: 0,
                  event_object: 'Test Event Object',
                  priority: 'normal',
                  service: 'test-service',
                  status: 'info',
                  tags: ['test:tag'],
                  timestamp: 1746625697000,
                  title: 'Test Event',
                },
                message: 'Test event message',
                tags: ['env:test'],
                timestamp: '2025-05-07T11:00:00.000Z',
              },
              id: 'test-id',
              type: 'event',
            },
          ],
          meta: {
            page: {
              after: 'cursor-id',
            },
          },
          links: {
            next: 'next-url',
          },
        })
      }),
    )

    it('should search events with default parameters', async () => {
      server.listen()

      const response = await toolHandlers.search_events(
        createMockToolRequest('search_events', {}),
      )

      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Test event message'),
          },
          {
            type: 'text',
            text: expect.stringContaining('cursor-id'),
          },
        ],
      })

      server.close()
    })

    it('should search events with custom parameters', async () => {
      server.listen()

      const response = await toolHandlers.search_events(
        createMockToolRequest('search_events', {
          query: 'test',
          from: '2025-05-07T10:00:00+01:00',
          to: '2025-05-07T11:00:00+01:00',
          options: {
            timezone: 'America/New_York',
          },
          sort: '-timestamp',
          limit: 5,
          cursor: 'prev-cursor',
        }),
      )

      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Test event message'),
          },
          {
            type: 'text',
            text: expect.stringContaining('cursor-id'),
          },
        ],
      })

      server.close()
    })
  })
})
