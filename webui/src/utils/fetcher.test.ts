import { HttpResponse, http } from 'msw'
import * as statuses from 'statuses'

import { server as mswServer } from '../mocks/server'

import fetcher from './fetcher'

const INVALID_JSON_BODY_ERROR = `Unexpected token 'e', "text_body" is not valid JSON`

const TEXT_BODY = 'text_body'
const OBJECT_BODY = { object: 'body' }
const NEXT_PAGE = '3'
const COUNT = '10'

describe('fetcher', () => {
  describe('return values', () => {
    describe('When response is OK', () => {
      describe('And Content-Type is text/plain', () => {
        test('Data should be string, body string', async () => {
          mswServer.use(http.get('/whatever', () => HttpResponse.text(TEXT_BODY), { once: true }))
          const { data } = await fetcher('/whatever', { method: 'GET' })
          expect(data).toBe(TEXT_BODY)
        })
        test('Data should be stringified object, body object', async () => {
          mswServer.use(http.get('/whatever', () => HttpResponse.text(JSON.stringify(OBJECT_BODY)), { once: true }))
          const { data } = await fetcher('/whatever', { method: 'GET' })
          expect(data).toBe(JSON.stringify(OBJECT_BODY))
        })
        test('NextPage should be returned', async () => {
          mswServer.use(
            http.get('/whatever', () => HttpResponse.text('', { headers: { 'X-Next-Page': NEXT_PAGE } }), {
              once: true,
            }),
          )
          const { nextPage } = await fetcher('/whatever', { method: 'GET' })
          expect(nextPage).toBe(NEXT_PAGE)
        })
        test('Count should be returned', async () => {
          mswServer.use(
            http.get('/whatever', () => HttpResponse.text('', { headers: { 'X-Total-Count': COUNT } }), { once: true }),
          )
          const { count } = await fetcher('/whatever', { method: 'GET' })
          expect(count).toBe(COUNT)
        })
        test('FetchResponse should be returned', async () => {
          mswServer.use(http.get('/whatever', () => HttpResponse.text(''), { once: true }))
          const { fetchResponse } = await fetcher('/whatever', { method: 'GET' })
          expect(fetchResponse).toBeDefined()
        })
      })
      describe('And Content-Type is application/json', () => {
        const CONTENT_TYPE = 'application/json'
        test('should throw, body string', async () => {
          mswServer.use(
            http.get('/whatever', () => HttpResponse.text(TEXT_BODY, { headers: { 'Content-Type': CONTENT_TYPE } }), {
              once: true,
            }),
          )
          await expect(fetcher('/whatever', { method: 'GET' })).rejects.toThrow(INVALID_JSON_BODY_ERROR)
        })
        test('Data should be returned as object, body object', async () => {
          mswServer.use(http.get('/whatever', () => HttpResponse.json(OBJECT_BODY), { once: true }))
          const { data } = await fetcher('/whatever', { method: 'GET' })
          expect(data).toEqual(OBJECT_BODY)
        })
        test('NextPage should be returned', async () => {
          mswServer.use(
            http.get('/whatever', () => HttpResponse.json({}, { headers: { 'X-Next-Page': NEXT_PAGE } }), {
              once: true,
            }),
          )
          const { nextPage } = await fetcher('/whatever', { method: 'GET' })
          expect(nextPage).toBe(NEXT_PAGE)
        })
        test('Count should be returned', async () => {
          mswServer.use(
            http.get('/whatever', () => HttpResponse.json({}, { headers: { 'X-Total-Count': COUNT } }), { once: true }),
          )
          const { count } = await fetcher('/whatever', { method: 'GET' })
          expect(count).toBe(COUNT)
        })
        test('FetchResponse should be returned', async () => {
          mswServer.use(http.get('/whatever', () => HttpResponse.json({}), { once: true }))
          const { fetchResponse } = await fetcher('/whatever', { method: 'GET' })
          expect(fetchResponse).toBeDefined()
        })
      })
      describe('And Content-Type is other', () => {
        const OTHER_CONTENT_TYPES = [
          'text/html',
          'audio/mpeg',
          'video/mp4',
          'image/jpeg',
          'application/pdf',
          'multipart/form-data',
        ]
        test.each(OTHER_CONTENT_TYPES)('Data should not be returned for Content-Type %s', async (contentType) => {
          mswServer.use(
            http.get('/whatever', () => HttpResponse.json(OBJECT_BODY, { headers: { 'Content-Type': contentType } }), {
              once: true,
            }),
          )
          const { data } = await fetcher('/whatever', { method: 'GET' })
          expect(data).toBeUndefined()
        })
        test.each(OTHER_CONTENT_TYPES)('NextPage should be returned for Content-Type %s', async (contentType) => {
          mswServer.use(
            http.get(
              '/whatever',
              () =>
                HttpResponse.json(undefined, {
                  headers: { 'Content-Type': contentType, 'X-Next-Page': NEXT_PAGE },
                }),
              { once: true },
            ),
          )
          const { nextPage } = await fetcher('/whatever', { method: 'GET' })
          expect(nextPage).toBe(NEXT_PAGE)
        })
        test.each(OTHER_CONTENT_TYPES)('Count should be returned for Content-Type %s', async (contentType) => {
          mswServer.use(
            http.get(
              '/whatever',
              () =>
                HttpResponse.json(undefined, {
                  headers: { 'Content-Type': contentType, 'X-Total-Count': COUNT },
                }),
              { once: true },
            ),
          )
          const { count } = await fetcher('/whatever', { method: 'GET' })
          expect(count).toBe(COUNT)
        })
        test.each(OTHER_CONTENT_TYPES)('FetchResponse should be returned for Content-Type %s', async (contentType) => {
          mswServer.use(
            http.get(
              '/whatever',
              () =>
                HttpResponse.json(undefined, {
                  headers: { 'Content-Type': contentType },
                }),
              { once: true },
            ),
          )
          const { fetchResponse } = await fetcher('/whatever', { method: 'GET' })
          expect(fetchResponse).toBeDefined()
        })
      })
      describe('And statusText is No Content', () => {
        const STATUS = 204
        test('should return undefined data without throwing', async () => {
          mswServer.use(http.get('/whatever', () => HttpResponse.json(undefined, { status: STATUS }), { once: true }))
          const { data } = await fetcher('/whatever', { method: 'GET' })
          expect(data).toBeUndefined()
        })
      })
    })
  })
  describe('When response is KO', () => {
    const STATUSES = [400, 401, 402, 403, 404, 405, 409, 500]
    describe.each(STATUSES)('status %i', (status) => {
      test('should throw error message statusText', async () => {
        mswServer.use(
          http.get('/whatever', () => HttpResponse.json({}, { status }), {
            once: true,
          }),
        )
        await expect(() => fetcher('/whatever', { method: 'GET' })).rejects.toThrow(statuses.message[status])
      })
      describe('And Content-Type is application/json', () => {
        test('should throw error message from body, error in body', async () => {
          const ERROR_MESSAGE = 'mock error'
          mswServer.use(
            http.get('/whatever', () => HttpResponse.json({ error: ERROR_MESSAGE }, { status }), {
              once: true,
            }),
          )
          await expect(() => fetcher('/whatever', { method: 'GET' })).rejects.toThrow(ERROR_MESSAGE)
        })
        test('should throw error message statusText, no error in body', async () => {
          mswServer.use(
            http.get('/whatever', () => HttpResponse.json({}, { status }), {
              once: true,
            }),
          )
          await expect(() => fetcher('/whatever', { method: 'GET' })).rejects.toThrow(statuses.message[status])
        })
      })
    })
  })
})
