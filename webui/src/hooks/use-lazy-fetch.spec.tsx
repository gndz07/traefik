import { renderHook } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { act } from 'react-dom/test-utils'

import useLazyFetch from './use-lazy-fetch'

import { server as mswServer } from 'mocks/server'
import { HttpError } from 'utils/fetcher'

describe('hooks/use-lazy-fetch', () => {
  describe('useLazyFetch', () => {
    const MOCK_RESPONSE = [{ error: 'Error message' }, { status: 500 }]

    describe('server error', () => {
      test('query should reject', async () => {
        mswServer.use(http.post('/api/test', () => HttpResponse.json(...MOCK_RESPONSE), { once: true }))

        const { result } = renderHook(() => useLazyFetch('/api/test', { method: 'POST' }))

        const [query] = result.current

        await act(async () => {
          await expect(query()).rejects.toThrow(HttpError)
        })
      })
      test('error should match', async () => {
        mswServer.use(http.post('/api/test', () => HttpResponse.json(...MOCK_RESPONSE), { once: true }))

        const { result } = renderHook(() => useLazyFetch('/api/test', { method: 'POST' }))

        const [query] = result.current

        await act(async () => {
          await expect(query()).rejects.toThrow(HttpError) // NB: state is already updated once promise resolves
        })

        const [, { error }] = result.current

        expect(error).toBeInstanceOf(HttpError)
        expect(error && error.message).toBe('Error message')
        expect(error && error.response.status).toBe(500)
      })
    })

    describe('success', () => {
      const MOCK_RESPONSE = [{ success: true }, { status: 200 }]
      test('data and statusCode should match, global params', async () => {
        mswServer.use(http.post('/api/test', () => HttpResponse.json(...MOCK_RESPONSE), { once: true }))

        const { result } = renderHook(() => useLazyFetch<{ success?: boolean }>('/api/test', { method: 'POST' }))

        const [query] = result.current

        await act(async () => {
          await query() // NB: state is already updated once promise resolves
        })

        const [, { data, error, statusCode }] = result.current

        expect(error).toBeNull()
        expect(data?.success).toBe(true)
        expect(statusCode).toBe(200)
      })
      test('data and statusCode should match, params on call', async () => {
        mswServer.use(http.post('/api/test', () => HttpResponse.json(...MOCK_RESPONSE), { once: true }))

        const { result } = renderHook(() => useLazyFetch<{ success?: boolean }>())

        const [query] = result.current

        await act(async () => {
          await query('/api/test', { method: 'POST' }) // NB: state is already updated once promise resolves
        })

        const [, { data, error, statusCode }] = result.current

        expect(error).toBeNull()
        expect(data?.success).toBe(true)
        expect(statusCode).toBe(200)
      })
      test('data and statusCode should match, url on call, globalOptions', async () => {
        mswServer.use(http.post('/api/test', () => HttpResponse.json(...MOCK_RESPONSE), { once: true }))

        const { result } = renderHook(() => useLazyFetch<{ success?: boolean }>(undefined, { method: 'POST' }))

        const [query] = result.current

        await act(async () => {
          await query('/api/test') // NB: state is already updated once promise resolves
        })

        const [, { data, error, statusCode }] = result.current

        expect(error).toBeNull()
        expect(data?.success).toBe(true)
        expect(statusCode).toBe(200)
      })
      test('data and statusCode should match, global url, options on call', async () => {
        mswServer.use(http.post('/api/test', () => HttpResponse.json(...MOCK_RESPONSE), { once: true }))

        const { result } = renderHook(() => useLazyFetch<{ success?: boolean }>('/api/test'))

        const [query] = result.current

        await act(async () => {
          await query({ method: 'POST' }) // NB: state is already updated once promise resolves
        })

        const [, { data, error, statusCode }] = result.current

        expect(error).toBeNull()
        expect(data?.success).toBe(true)
        expect(statusCode).toBe(200)
      })
      test('data and statusCode should match, url override on call', async () => {
        mswServer.use(http.post('/api/test', () => HttpResponse.json(...MOCK_RESPONSE), { once: true }))

        const { result } = renderHook(() => useLazyFetch<{ success?: boolean }>('/api/other', { method: 'POST' }))

        const [query] = result.current

        await act(async () => {
          await query('/api/test') // NB: state is already updated once promise resolves
        })

        const [, { data, error, statusCode }] = result.current

        expect(error).toBeNull()
        expect(data?.success).toBe(true)
        expect(statusCode).toBe(200)
      })
      test('data and statusCode should match, options override on call', async () => {
        mswServer.use(http.post('/api/test', () => HttpResponse.json(...MOCK_RESPONSE), { once: true }))

        const { result } = renderHook(() => useLazyFetch<{ success?: boolean }>('/api/test', { method: 'POST' }))

        const [query] = result.current

        await act(async () => {
          await query({ method: 'POST' }) // NB: state is already updated once promise resolves
        })

        const [, { data, error, statusCode }] = result.current

        expect(error).toBeNull()
        expect(data?.success).toBe(true)
        expect(statusCode).toBe(200)
      })
    })

    describe('memoization', () => {
      const MOCK_RESPONSE = [{ success: true }, { status: 200 }]
      test('metadata should not change on simple rerender', async () => {
        mswServer.use(http.post('/api/test', () => HttpResponse.json(...MOCK_RESPONSE), { once: true }))

        const { result, rerender } = renderHook(
          ({ globalUrl, globalOptions }) => useLazyFetch<{ success?: boolean }>(globalUrl, globalOptions),
          { initialProps: { globalUrl: '/api/test', globalOptions: { method: 'POST' } } },
        )

        const [, metadataBefore] = result.current

        rerender({ globalUrl: '/api/test', globalOptions: { method: 'POST' } })

        const [, metadataAfter] = result.current

        expect(metadataBefore).toBe(metadataAfter)
      })
      test('fetch fn should not change on simple rerender', async () => {
        mswServer.use(http.post('/api/test', () => HttpResponse.json(...MOCK_RESPONSE), { once: true }))

        const { result, rerender } = renderHook(
          ({ globalUrl, globalOptions }) => useLazyFetch<{ success?: boolean }>(globalUrl, globalOptions),
          { initialProps: { globalUrl: '/api/test', globalOptions: { method: 'POST' } } },
        )

        const [queryBefore] = result.current

        rerender({ globalUrl: '/api/test', globalOptions: { method: 'POST' } })

        const [queryAfter] = result.current

        expect(queryBefore).toBe(queryAfter)
      })
      describe('globalUrl', () => {
        test('fetch fn should not change when globalUrl changes', async () => {
          const { result, rerender } = renderHook(
            ({ globalUrl, globalOptions }) => useLazyFetch<{ success?: boolean }>(globalUrl, globalOptions),
            { initialProps: { globalUrl: '/api/test', globalOptions: { method: 'POST' } } },
          )

          const [queryBefore] = result.current

          rerender({ globalUrl: '/api/otherTest', globalOptions: { method: 'POST' } })

          const [queryAfter] = result.current

          expect(queryBefore).toBe(queryAfter)
        })
        test('fetch fn should be up to date, when globalUrl changes', async () => {
          mswServer.use(http.post('/api/test', () => HttpResponse.json(...MOCK_RESPONSE), { once: true }))
          mswServer.use(http.post('/api/otherTest', () => HttpResponse.json(...MOCK_RESPONSE), { once: true }))

          const { result, rerender } = renderHook(
            ({ globalUrl, globalOptions }) => useLazyFetch<{ success?: boolean }>(globalUrl, globalOptions),
            { initialProps: { globalUrl: '/api/test', globalOptions: { method: 'POST' } } },
          )

          const [queryBefore] = result.current

          await act(async () => {
            await queryBefore() // NB: state is already updated once promise resolves
          })

          rerender({ globalUrl: '/api/otherTest', globalOptions: { method: 'POST' } })

          const [queryAfter] = result.current

          expect(queryBefore).toBe(queryAfter)
        })
      })
      describe('globalOptions', () => {
        test('fetch fn should not change when globalOptions are reinstanciated', async () => {
          const { result, rerender } = renderHook(
            ({ globalUrl, globalOptions }) => useLazyFetch<{ success?: boolean }>(globalUrl, globalOptions),
            { initialProps: { globalUrl: '/api/test', globalOptions: { method: 'POST' } } },
          )

          const [queryBefore] = result.current

          rerender({ globalUrl: '/api/test', globalOptions: { method: 'GET' } })

          const [queryAfter] = result.current

          expect(queryBefore.toString()).toBe(queryAfter.toString())
        })
        test('fetch fn should be up to date, when globalOptions are reinstanciated', async () => {
          mswServer.use(http.get('/api/test', () => HttpResponse.json(...MOCK_RESPONSE), { once: true }))
          mswServer.use(http.post('/api/test', () => HttpResponse.json(...MOCK_RESPONSE), { once: true }))

          const { result, rerender } = renderHook(
            ({ globalUrl, globalOptions }) => useLazyFetch<{ success?: boolean }>(globalUrl, globalOptions),
            { initialProps: { globalUrl: '/api/test', globalOptions: { method: 'POST' } } },
          )

          const [queryBefore] = result.current

          await act(async () => {
            await queryBefore() // NB: state is already updated once promise resolves
          })

          rerender({ globalUrl: '/api/test', globalOptions: { method: 'GET' } })

          const [queryAfter] = result.current

          expect(queryBefore.toString()).toBe(queryAfter.toString())
        })
      })
      test('fetch fn should not change after fetch', async () => {
        mswServer.use(http.post('/api/test', () => HttpResponse.json(...MOCK_RESPONSE), { once: true }))

        const { result } = renderHook(
          ({ globalUrl, globalOptions }) => useLazyFetch<{ success?: boolean }>(globalUrl, globalOptions),
          { initialProps: { globalUrl: '/api/test', globalOptions: { method: 'POST' } } },
        )

        const [queryBefore] = result.current

        await act(async () => {
          await queryBefore() // NB: state is already updated once promise resolves
        })

        const [queryAfter] = result.current

        expect(queryBefore).toBe(queryAfter)
      })
    })
  })
})
