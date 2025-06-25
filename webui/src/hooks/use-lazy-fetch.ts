import { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import fetcher, { DefaultData, FetcherResponse, HttpError } from 'utils/fetcher'

type GlobalOptions = { timeout?: number } & RequestInit

interface LazyFetchResultType<T extends DefaultData> extends Omit<FetcherResponse<T>, 'fetchResponse'> {
  loading?: boolean
  error?: HttpError | null
  statusCode?: number
}

type FetchData<T extends DefaultData> = (
  urlOrOpts?: string | RequestInit,
  opts?: RequestInit,
) => Promise<LazyFetchResultType<T>>

export type LazyFetchResult<T extends DefaultData> = [FetchData<T>, LazyFetchResultType<T>]

const pTimeout = (ms: number, promise: Promise<unknown>): any => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('There seems to be a connection issue. Please try again later or contact support.'))
    }, ms)
    promise.then(resolve, reject)
  })
}

const useUpdatedRef = <T>(toRef: T): MutableRefObject<T> => {
  const ref = useRef(toRef)

  useEffect(() => {
    ref.current = toRef
  }, [ref, toRef])

  return ref
}

const useLazyFetch = <T extends DefaultData>(globalUrl?: string, globalOptions?: GlobalOptions): LazyFetchResult<T> => {
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<HttpError | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusCode, setStatusCode] = useState<number | undefined>(undefined)

  const globalOptionsRef = useUpdatedRef(globalOptions)
  const globalUrlRef = useUpdatedRef(globalUrl)

  const fetchData: FetchData<T> = useCallback(
    async (urlOrOpts, opts) => {
      const url = typeof urlOrOpts === 'string' ? urlOrOpts : globalUrlRef.current

      if (!url) {
        throw new Error('URL must be provided to useLazyFetch')
      }

      let options = {} as GlobalOptions

      if (typeof urlOrOpts === 'object') {
        options = urlOrOpts
      }

      if (typeof urlOrOpts === 'string' && typeof opts === 'object') {
        options = opts
      }

      try {
        setLoading(true)
        setError(null)
        setData(undefined)
        const { current } = globalOptionsRef
        const { timeout = 10000, ...restGlobalOptions } = current || {}
        const res = await pTimeout(timeout, fetcher(url, { ...restGlobalOptions, ...options }))

        setData(res.data)
        setError(null)
        setLoading(false)
        setStatusCode(res?.fetchResponse?.status)

        return {
          data: res.data,
          nextPage: res.nextPage,
          loading: false,
          statusCode: res?.fetchResponse?.status,
        }
      } catch (err: any) {
        setData(undefined)
        setError(err)
        setLoading(false)
        setStatusCode(typeof err?.response?.status === 'number' ? err.response.status : 500)
        throw err
      }
    },
    [globalUrlRef, globalOptionsRef],
  )

  const metadata = useMemo(
    () => ({
      data,
      loading,
      error,
      statusCode,
    }),
    [data, loading, error, statusCode],
  )

  return [fetchData, metadata]
}

export default useLazyFetch
