import { healthCheck } from '../client'
import type { Client } from '../client/client'
import { getApiErrorMessage, parseApiError } from './errors'
import type { ApiErrorKind } from './errors'

export type ApiConnection =
  | { ok: true }
  | {
      ok: false
      /** 'database' when the API answers but its database does not. */
      reason: ApiErrorKind | 'database'
      message: string
    }

const DEFAULT_TIMEOUT_MS = 5000

/**
 * Asks the backend's public /health endpoint whether the API and its database
 * can be reached. Never throws; a failure comes back with a Finnish message.
 */
export async function checkApiConnection({
  timeoutMs = DEFAULT_TIMEOUT_MS,
  client,
}: { timeoutMs?: number; client?: Client } = {}): Promise<ApiConnection> {
  const result = await healthCheck({
    client,
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (result.data?.status === 'ok') {
    return { ok: true }
  }

  if (result.response?.status === 503) {
    return {
      ok: false,
      reason: 'database',
      message:
        'Palvelin vastaa, mutta tietokantaan ei saatu yhteyttä. Yritä hetken kuluttua uudelleen.',
    }
  }

  return {
    ok: false,
    reason: parseApiError(result).kind,
    message: getApiErrorMessage(result),
  }
}

/** Development aid: tells the developer in the console when the API is down. */
export async function warnIfApiUnreachable(baseUrl: string) {
  const connection = await checkApiConnection()

  if (!connection.ok) {
    console.warn(
      `[Majakka] The API at ${baseUrl} is not reachable (${connection.reason}). ` +
        'Start the backend (see backend/README.md) or set VITE_API_URL.',
    )
  }
}
