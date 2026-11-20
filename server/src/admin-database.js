import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import express from 'express'
import ContactMessage from './models/ContactMessage.js'
import { Workspace } from './workbench.js'

const username = 'bikas'
const pageSize = 20
const sessionDuration = 10 * 60_000
const attemptsWindow = 60_000
const collections = new Map([
  ['workbenchSessions', { model: Workspace, fields: 'note updatedAt activity expiresAt -_id', sort: { expiresAt: -1, _id: -1 } }],
  ['contactMessages', { model: ContactMessage, fields: 'name email phone message createdAt -_id', sort: { _id: -1 } }],
])

function digest(value) {
  return createHash('sha256').update(value).digest()
}

export function createAdminDatabaseRouter(allowedOrigins, password) {
  const router = express.Router()
  const passwordDigest = typeof password === 'string' && password.length >= 18 && password.length <= 256
    ? digest(password)
    : null
  const sessions = new Map()
  let failures = []

  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store')
    if (!passwordDigest) return response.status(503).json({ error: 'Database admin is awaiting server configuration.' })
    if (request.headers.origin && !allowedOrigins.includes(request.headers.origin)) {
      return response.status(403).json({ error: 'Open Database from Bikas Desk.' })
    }
    next()
  })

  router.post('/login', express.json({ limit: '2kb' }), (request, response) => {
    const now = Date.now()
    failures = failures.filter(time => now - time < attemptsWindow)
    if (failures.length >= 8) {
      response.set('Retry-After', String(Math.ceil((failures[0] + attemptsWindow - now) / 1000)))
      return response.status(429).json({ error: 'Too many attempts. Try again in a minute.' })
    }
    const { username: submittedUser, password: submittedPassword } = request.body ?? {}
    if (submittedUser !== username || typeof submittedPassword !== 'string' || submittedPassword.length > 256 ||
        !timingSafeEqual(digest(submittedPassword), passwordDigest)) {
      failures.push(now)
      return response.status(401).json({ error: 'Incorrect username or password.' })
    }

    for (const [key, expiresAt] of sessions) {
      if (expiresAt <= now) sessions.delete(key)
    }
    if (sessions.size >= 10) sessions.delete(sessions.keys().next().value)
    const token = randomBytes(32).toString('hex')
    sessions.set(digest(token).toString('hex'), now + sessionDuration)
    response.json({ token, expiresInMs: sessionDuration })
  })

  router.use((request, response, next) => {
    const token = /^Bearer ([a-f0-9]{64})$/.exec(request.get('Authorization') ?? '')?.[1]
    const key = token && digest(token).toString('hex')
    if (!key || (sessions.get(key) ?? 0) <= Date.now()) {
      if (key) sessions.delete(key)
      return response.status(401).json({ error: 'Sign in to read the database.' })
    }
    request.adminSession = key
    next()
  })

  router.delete('/session', (request, response) => {
    sessions.delete(request.adminSession)
    response.json({ locked: true })
  })

  router.get('/records/:collection', async (request, response, next) => {
    const collection = collections.get(request.params.collection)
    const page = Number(request.query.page ?? 1)
    const offset = (page - 1) * pageSize
    if (!collection) return response.status(404).json({ error: 'Collection not found.' })
    if (!Number.isInteger(page) || page < 1 || !Number.isSafeInteger(offset)) {
      return response.status(400).json({ error: 'Invalid page.' })
    }
    try {
      const documents = await collection.model.find({}, collection.fields)
        .sort(collection.sort).skip(offset).limit(pageSize + 1).maxTimeMS(5000).lean()
      return response.json({ documents: documents.slice(0, pageSize), hasNext: documents.length > pageSize })
    } catch (error) {
      return next(error)
    }
  })

  router.use((_request, response) => response.status(404).json({ error: 'Endpoint not found.' }))
  router.use((error, _request, response, _next) => {
    if (error.status === 400 || error.status === 413) return response.status(error.status).json({ error: 'Invalid login request.' })
    console.error('Database admin request failed:', error.name, error.code)
    return response.status(500).json({ error: 'Could not read database records.' })
  })

  return router
}
