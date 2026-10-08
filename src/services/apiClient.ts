// Simulated API client with realistic latency and error behavior

const SIMULATED_LATENCY_MS = 180

export async function mockFetch<T>(data: T, delayMs: number = SIMULATED_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(structuredClone(data))
    }, delayMs)
  })
}

export class ApiError extends Error {
  statusCode: number
  code: string

  constructor(message: string, statusCode: number = 400, code: string = 'BAD_REQUEST') {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
  }
}
