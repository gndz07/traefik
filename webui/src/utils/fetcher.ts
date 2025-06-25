export class HttpError extends Error {
  public constructor(
    public response: Response,
    message: string,
  ) {
    super(message)

    this.response = response

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, HttpError.prototype)
  }
}

export type DefaultData = string | Record<string, unknown> | Record<string, unknown>[]

export type FetcherResponse<T = DefaultData> = {
  fetchResponse: Response
  data?: T & { error?: string }
  nextPage?: string
  count?: number
}

const fetcher = async <DataType = unknown>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<FetcherResponse<DataType>> => {
  return fetch(input, init).then((res: any) => {
    const contentType = res.headers.get('Content-Type')
    const nextPage = res.headers.get('X-Next-Page')
    const count = res.headers.get('X-Total-Count')
    if (!res.ok) {
      if (contentType && contentType?.includes('application/json')) {
        return res.json().then((data) => {
          res.data = data
          throw new HttpError(res, data?.error || res?.statusText)
        })
      }

      throw new HttpError(res, res?.statusText)
    }

    if (contentType && contentType?.includes('application/json') && res.status !== 204) {
      return res.json().then((data) => ({ fetchResponse: res, data, nextPage, count }))
    }

    if (contentType && contentType?.includes('text/plain')) {
      return res.text().then((data) => ({ fetchResponse: res, data, nextPage, count }))
    }

    return { fetchResponse: res, nextPage, count }
  })
}

export default fetcher
