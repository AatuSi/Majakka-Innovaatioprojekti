// End-to-end checks of the frontend's connection to a running backend, made
// through the same generated client and error helpers the app uses.
//
//   npm run test:api
//
// API_URL (default http://localhost:8000) picks the backend and FRONTEND_ORIGIN
// (default http://localhost:3000) the origin CORS must allow. The run creates a
// throwaway user and deletes it again, so point it at a development or test
// backend, never production.

import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer as createHttpServer } from 'node:http'
import { createServer } from 'node:net'
import type { AddressInfo, Server, Socket } from 'node:net'

import {
  createUser,
  deleteUser,
  getIalaLight,
  healthCheck,
  listIalaLights,
  login,
} from '../src/client'
import { client } from '../src/client/client.gen'
import { createClient, createConfig } from '../src/client/client'
import { checkApiConnection } from '../src/api/connection'
import { getApiErrorMessage, parseApiError } from '../src/api/errors'

const API_URL = process.env.API_URL ?? 'http://localhost:8000'
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000'
const MISSING_ID = '00000000-0000-0000-0000-000000000000'

const username = `api-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const password = 'api-test-password'

let token: string | undefined
let userId: string | undefined

before(async () => {
  client.setConfig({ baseUrl: API_URL, auth: () => token })

  const connection = await checkApiConnection()
  if (!connection.ok) {
    throw new Error(
      `No working backend at ${API_URL} (${connection.reason}). Start it first, see backend/README.md.`,
    )
  }
})

after(async () => {
  if (userId && token) {
    await deleteUser({ path: { user_id: userId } })
  }
})

describe('connection', () => {
  test('health endpoint answers through the generated client', async () => {
    const result = await healthCheck()

    assert.equal(result.response?.status, 200)
    assert.deepEqual(result.data, { status: 'ok', database: 'ok' })
    assert.deepEqual(await checkApiConnection(), { ok: true })
  })

  test('CORS lets the frontend origin call the API with a token', async () => {
    const preflight = await fetch(`${API_URL}/iala-lights`, {
      method: 'OPTIONS',
      headers: {
        Origin: FRONTEND_ORIGIN,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization',
      },
    })

    assert.equal(preflight.status, 200)
    assert.equal(
      preflight.headers.get('access-control-allow-origin'),
      FRONTEND_ORIGIN,
    )
    assert.match(
      preflight.headers.get('access-control-allow-headers') ?? '',
      /authorization/i,
    )
  })

  test('CORS does not admit an unknown origin', async () => {
    const response = await fetch(`${API_URL}/health`, {
      headers: { Origin: 'https://not-majakka.example' },
    })

    assert.equal(response.headers.get('access-control-allow-origin'), null)
  })

  test('a server that does not answer is reported as unreachable', async () => {
    // Bind a port, then free it, so nothing is listening there.
    const closed = await listen(createServer())
    const { port } = closed.address() as AddressInfo
    await close(closed)

    const connection = await checkApiConnection({
      client: createClient(createConfig({ baseUrl: `http://127.0.0.1:${port}` })),
    })

    assert.equal(connection.ok, false)
    assert.equal(connection.reason, 'network')
    assert.equal(
      connection.message,
      'Palvelimeen ei saatu yhteyttä. Tarkista verkkoyhteys ja yritä uudelleen.',
    )
  })

  test('an API whose database is down is reported as such', async () => {
    // Answers like the real /health does when its database is unreachable.
    const degraded = await listen(
      createHttpServer((_request, response) => {
        response.writeHead(503, { 'Content-Type': 'application/json' })
        response.end(JSON.stringify({ status: 'error', database: 'unavailable' }))
      }),
    )
    const { port } = degraded.address() as AddressInfo

    try {
      const connection = await checkApiConnection({
        client: createClient(createConfig({ baseUrl: `http://127.0.0.1:${port}` })),
      })

      assert.equal(connection.ok, false)
      assert.equal(connection.reason, 'database')
    } finally {
      await close(degraded)
    }
  })

  test('a server that hangs is reported as a timeout', async () => {
    // Accepts connections but never responds.
    const sockets = new Set<Socket>()
    const silent = await listen(createServer((socket) => sockets.add(socket)))
    const { port } = silent.address() as AddressInfo

    try {
      const connection = await checkApiConnection({
        timeoutMs: 300,
        client: createClient(createConfig({ baseUrl: `http://127.0.0.1:${port}` })),
      })

      assert.equal(connection.ok, false)
      assert.equal(connection.reason, 'timeout')
    } finally {
      for (const socket of sockets) socket.destroy()
      await close(silent)
    }
  })
})

describe('authentication', () => {
  test('a protected endpoint without a token is refused with a Finnish message', async () => {
    const result = await listIalaLights()

    assert.equal(result.response?.status, 401)
    assert.equal(getApiErrorMessage(result), 'Kirjaudu sisään jatkaaksesi.')
  })

  test('registering creates a user', async () => {
    const result = await createUser({ body: { username, password } })

    assert.equal(result.response?.status, 201)
    assert.ok(result.data)
    assert.equal(result.data.username, username)
    assert.equal(result.data.role, 'user')
    userId = result.data.id
  })

  test('registering the same name again is a conflict', async () => {
    const result = await createUser({ body: { username, password } })

    assert.equal(result.response?.status, 409)
    assert.equal(parseApiError(result).detail, 'Username already exists')
    assert.equal(
      getApiErrorMessage(result, {
        byDetail: { 'Username already exists': 'Käyttäjätunnus on jo käytössä.' },
      }),
      'Käyttäjätunnus on jo käytössä.',
    )
  })

  test('invalid fields come back as field errors', async () => {
    const result = await createUser({ body: { username: '', password } })

    assert.equal(result.response?.status, 422)
    assert.ok('username' in parseApiError(result).fieldErrors)
  })

  test('a wrong password is refused', async () => {
    const result = await login({ body: { username, password: 'wrong' } })

    assert.equal(result.response?.status, 401)
    assert.equal(parseApiError(result).detail, 'Invalid credentials')
  })

  test('logging in returns a bearer token', async () => {
    const result = await login({ body: { username, password } })

    assert.equal(result.response?.status, 200)
    assert.ok(result.data)
    assert.equal(result.data.token_type, 'bearer')
    assert.ok(result.data.access_token)
    token = result.data.access_token
  })
})

describe('authenticated requests', () => {
  test('the token is sent and protected data is returned', async () => {
    assert.ok(token, 'needs the token from the login test')
    const result = await listIalaLights()

    assert.equal(result.request?.headers.get('Authorization'), `Bearer ${token}`)
    assert.equal(result.response?.status, 200)
    assert.ok(Array.isArray(result.data))
  })

  test('a missing item maps to a Finnish not-found message', async () => {
    const result = await getIalaLight({ path: { light_id: MISSING_ID } })

    assert.equal(result.response?.status, 404)
    assert.equal(getApiErrorMessage(result), 'Pyydettyä tietoa ei löytynyt.')
  })

  test('an invalid token is refused', async () => {
    const result = await listIalaLights({ auth: () => 'not-a-real-token' })

    assert.equal(result.response?.status, 401)
    assert.equal(parseApiError(result).detail, 'Invalid token')
  })
})

function listen<T extends Server>(server: T): Promise<T> {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

function close(server: Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()))
}
