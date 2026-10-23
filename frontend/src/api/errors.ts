/**
 * Turns a failed API call into something the UI can show.
 *
 * The generated client fails in one of two ways:
 * - with throwOnError it throws the parsed error body (e.g. { detail }), or
 *   the fetch error itself when the server could not be reached. The HTTP
 *   status is not part of what is thrown.
 * - without it, it resolves to { error, response }, which keeps the status.
 *
 * Both are accepted here; pass the whole result when the status matters:
 *
 *   const result = await listQuizzes()
 *   if (result.error) setError(getApiErrorMessage(result))
 */

export type ApiErrorKind =
  | 'network' // no response: server down, offline, blocked by CORS
  | 'timeout'
  | 'aborted' // cancelled on purpose, usually nothing to show
  | 'http' // the server answered with an error status
  | 'unknown'

export type ApiError = {
  kind: ApiErrorKind
  /** HTTP status, when the response was available. */
  status?: number
  /** FastAPI's detail string, e.g. "Invalid credentials". */
  detail?: string
  /** Request fields FastAPI rejected (422), by field name. */
  fieldErrors: Record<string, string>
}

export type ApiErrorMessages = {
  /** Messages for specific statuses, e.g. { 404: 'Tietovisaa ei löytynyt.' } */
  byStatus?: Partial<Record<number, string>>
  /** Messages for specific detail strings, e.g. { 'Username already exists': … } */
  byDetail?: Record<string, string>
}

const defaultMessages = {
  network:
    'Palvelimeen ei saatu yhteyttä. Tarkista verkkoyhteys ja yritä uudelleen.',
  timeout: 'Palvelin ei vastannut ajoissa. Yritä uudelleen.',
  aborted: 'Pyyntö peruttiin.',
  unknown: 'Jokin meni vikaan. Yritä uudelleen.',
  server: 'Palvelimella tapahtui virhe. Yritä hetken kuluttua uudelleen.',
}

const statusMessages: Record<number, string> = {
  400: 'Pyyntöä ei voitu käsitellä. Tarkista tiedot ja yritä uudelleen.',
  401: 'Kirjaudu sisään jatkaaksesi.',
  403: 'Sinulla ei ole oikeutta tähän toimintoon.',
  404: 'Pyydettyä tietoa ei löytynyt.',
  409: 'Tieto on ristiriidassa olemassa olevan tiedon kanssa.',
  413: 'Lähetetty tieto on liian suuri.',
  422: 'Osa tiedoista ei kelpaa. Tarkista kentät ja yritä uudelleen.',
  429: 'Liian monta pyyntöä. Odota hetki ja yritä uudelleen.',
}

export function parseApiError(failure: unknown): ApiError {
  const isResult =
    isObject(failure) && 'error' in failure && 'response' in failure
  const error = isResult ? failure.error : failure
  const response =
    isResult && failure.response instanceof Response
      ? failure.response
      : undefined

  if (error instanceof DOMException && error.name === 'AbortError') {
    return { kind: 'aborted', fieldErrors: {} }
  }

  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return { kind: 'timeout', fieldErrors: {} }
  }

  // fetch rejects with a TypeError when no response arrives at all.
  if (response === undefined && error instanceof TypeError) {
    return { kind: 'network', fieldErrors: {} }
  }

  const detail = isObject(error) ? error.detail : undefined

  return {
    kind: response ? 'http' : 'unknown',
    status: response?.status,
    detail: typeof detail === 'string' ? detail : undefined,
    fieldErrors: Array.isArray(detail) ? collectFieldErrors(detail) : {},
  }
}

/** A Finnish message for the failure, never the backend's raw English text. */
export function getApiErrorMessage(
  failure: unknown,
  messages: ApiErrorMessages = {},
): string {
  const error = parseApiError(failure)

  if (error.detail !== undefined && messages.byDetail?.[error.detail]) {
    return messages.byDetail[error.detail]
  }

  if (error.status !== undefined) {
    const byStatus =
      messages.byStatus?.[error.status] ?? statusMessages[error.status]
    if (byStatus) return byStatus
    if (error.status >= 500) return defaultMessages.server
  }

  if (error.kind === 'http') return defaultMessages.unknown
  return defaultMessages[error.kind]
}

// FastAPI 422 bodies: { detail: [{ loc: ['body', 'username'], msg, type }] }
function collectFieldErrors(items: Array<unknown>): Record<string, string> {
  const fieldErrors: Record<string, string> = {}

  for (const item of items) {
    if (!isObject(item) || !Array.isArray(item.loc)) continue

    const field = item.loc[item.loc.length - 1]
    if (typeof field !== 'string' && typeof field !== 'number') continue

    const name = String(field)
    if (!(name in fieldErrors)) {
      fieldErrors[name] = typeof item.msg === 'string' ? item.msg : ''
    }
  }

  return fieldErrors
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
