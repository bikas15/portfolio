import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createHash, timingSafeEqual } from 'node:crypto'

const eventNames = new Map([
  ['bugs-finder', 'Opened Bugs Finder'],
  ['hostel-hub', 'Opened Hostel Hub'],
])
const savedNoteLabel = 'Saved a scratchpad note'
const visibleActivity = new Set([...eventNames.values(), savedNoteLabel])
const localHosts = new Set(['127.0.0.1', 'localhost', '[::1]'])
const emptyState = { note: '', updatedAt: null, activity: [] }
const storeDirectory = fileURLToPath(new URL('../.workbench/', import.meta.url))
const storePath = fileURLToPath(new URL('../.workbench/workspace.json', import.meta.url))
const adminPath = '/api/workbench/admin/database'

const demoMessages = [{
  name: 'Demo visitor',
  email: 'visitor@example.com',
  phone: '',
  message: 'I’d like to know more about your portfolio projects.',
}]

function digest(value) {
  return createHash('sha256').update(value).digest()
}

function respond(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  response.end(JSON.stringify(value))
}

function requestError(status, message) {
  return Object.assign(new Error(message), { status })
}

async function readBody(request) {
  if (request.headers['content-type']?.split(';')[0] !== 'application/json') {
    throw requestError(415, 'Send JSON.')
  }
  let size = 0
  const chunks = []
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length
    if (size > 16_384) {
      request.resume()
      throw requestError(413, 'Request is too large.')
    }
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw requestError(400, 'Invalid JSON.')
  }
}

export function workbenchBackend() {
  let operations = Promise.resolve()
  const adminPassword = process.env.DESK_ADMIN_PASSWORD
  const adminDigest = adminPassword ? digest(adminPassword) : null
  let failedLogins = []

  async function readAdminDatabase(request, response) {
    if (!adminDigest) return respond(response, 503, { error: 'The local admin password has not been configured.' })
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST')
      return respond(response, 405, { error: 'Sign in to read the database.' })
    }

    const { username, password } = (await readBody(request)) ?? {}
    const now = Date.now()
    failedLogins = failedLogins.filter(time => now - time < 60_000)
    if (failedLogins.length >= 5) {
      response.setHeader('Retry-After', String(Math.ceil((failedLogins[0] + 60_000 - now) / 1000)))
      return respond(response, 429, { error: 'Too many failed attempts. Try again in a minute.' })
    }

    if (username !== 'bikas' || typeof password !== 'string' || !timingSafeEqual(digest(password), adminDigest)) {
      failedLogins.push(now)
      return respond(response, 401, { error: 'Incorrect username or password.' })
    }
    failedLogins = []

    await operations
    const { note, updatedAt, activity } = await loadState()
    return respond(response, 200, {
      workbenchSessions: updatedAt || activity.length ? [{ note, updatedAt, activity }] : [],
      contactMessages: demoMessages,
    })
  }

  async function loadState() {
    try {
      const state = JSON.parse(await readFile(storePath, 'utf8'))
      return { ...state, activity: state.activity.filter(({ label }) => visibleActivity.has(label)) }
    } catch (error) {
      if (error.code === 'ENOENT') return emptyState
      throw error
    }
  }

  function updateState(change) {
    const operation = operations.then(async () => {
      const value = change(await loadState(), new Date().toISOString())
      await mkdir(storeDirectory, { recursive: true })
      await writeFile(storePath + '.tmp', JSON.stringify(value), 'utf8')
      await rename(storePath + '.tmp', storePath)
      return value
    })
    operations = operation.catch(() => {})
    return operation
  }

  function addActivity(state, label, at) {
    return [{ label, at }, ...state.activity].slice(0, 30)
  }

  async function handle(request, response, next, adminEnabled = false) {
    const path = request.url?.split('?')[0]
    if (!path?.startsWith('/api/workbench/')) return next()
    try {
      const destination = new URL('http://' + request.headers.host)
      const origin = request.headers.origin
      if (!localHosts.has(destination.hostname) || (origin && origin !== destination.origin)) {
        return respond(response, 403, { error: 'Open the local Workbench to access its server.' })
      }

      if (path === adminPath && adminEnabled) {
        if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.socket.remoteAddress)) {
          return respond(response, 403, { error: 'Open the admin demo from this computer.' })
        }
        return await readAdminDatabase(request, response)
      }

      if (path === '/api/workbench/state' && request.method === 'GET') {
        await operations
        return respond(response, 200, await loadState())
      }

      if (path === '/api/workbench/note' && request.method === 'PUT') {
        const { note, updatedAt } = (await readBody(request)) ?? {}
        if (typeof note !== 'string' || note.length > 3000) throw requestError(400, 'Enter a note up to 3000 characters.')
        const value = await updateState((state, at) => {
          if (state.updatedAt !== updatedAt) throw requestError(409, 'The note changed in another tab. Reload before saving.')
          return { note, updatedAt: at, activity: addActivity(state, savedNoteLabel, at) }
        })
        return respond(response, 200, value)
      }

      if (path === '/api/workbench/activity' && request.method === 'POST') {
        const { event } = (await readBody(request)) ?? {}
        const label = eventNames.get(event)
        if (!label) throw requestError(400, 'Unknown workspace event.')
        const value = await updateState((state, at) => ({ ...state, activity: addActivity(state, label, at) }))
        return respond(response, 200, { activity: value.activity })
      }

      return respond(response, 404, { error: 'Endpoint not found.' })
    } catch (error) {
      if (!error.status) console.error('Workbench API:', error.message)
      return respond(response, error.status ?? 500, { error: error.status ? error.message : 'Could not read or save workspace data.' })
    }
  }

  return {
    name: 'local-workbench-backend',
    configureServer(server) {
      server.middlewares.use((request, response, next) => handle(request, response, next, true))
    },
    configurePreviewServer(server) { server.middlewares.use(handle) },
  }
}
