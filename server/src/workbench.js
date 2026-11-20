import { createHash } from 'node:crypto'
import express from 'express'
import mongoose from 'mongoose'

const eventLabels = new Map([
  ['bugs-finder', 'Opened Bugs Finder'],
  ['hostel-hub', 'Opened Hostel Hub'],
])
const emptyWorkspace = { note: '', updatedAt: null, activity: [] }
const retention = 90 * 24 * 60 * 60 * 1000
const schema = new mongoose.Schema({
  _id: String,
  note: { type: String, default: '' },
  updatedAt: { type: String, default: null },
  activity: [{ _id: false, label: String, at: String }],
  expiresAt: { type: Date, expires: 0 },
}, { versionKey: false, collection: 'workbenchSessions' })
const Workspace = mongoose.model('WorkbenchSession', schema)

function publicFields(document) {
  return document ? { note: document.note, updatedAt: document.updatedAt, activity: document.activity } : emptyWorkspace
}

function recentActivity(label, at) {
  return { activity: { $each: [{ label, at }], $position: 0, $slice: 30 } }
}

export function createWorkbenchRouter(allowedOrigins, store = Workspace) {
  const router = express.Router()
  const requests = new Map()
  let bucketMinute = -1
  let writes = 0

  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store')
    if (request.headers.origin && !allowedOrigins.includes(request.headers.origin)) {
      return response.status(403).json({ error: 'Open the workbench from the portfolio.' })
    }
    const token = /^Bearer ([a-f0-9]{64})$/.exec(request.get('Authorization') || '')?.[1]
    if (!token) return response.status(401).json({ error: 'No valid workspace key.' })

    const key = createHash('sha256').update(token).digest('hex')
    const minute = Math.floor(Date.now() / 60_000)
    if (bucketMinute !== minute) {
      requests.clear()
      writes = 0
      bucketMinute = minute
    }
    const write = request.method !== 'GET'
    const used = requests.get(key) ?? 0
    if (used >= 30 || (write && writes >= 120) || (!requests.has(key) && requests.size >= 2000)) {
      response.set('Retry-After', '60')
      return response.status(429).json({ error: 'Too many workspace requests. Try again in a minute.' })
    }
    requests.set(key, used + 1)
    if (write) writes += 1
    request.workspaceKey = key
    next()
  })

  router.use(express.json({ limit: '20kb' }))

  router.get('/state', async (request, response, next) => {
    try {
      const document = await store.findById(request.workspaceKey).lean()
      response.json(publicFields(document))
    } catch (error) { next(error) }
  })

  router.put('/note', async (request, response, next) => {
    const { note, updatedAt } = request.body ?? {}
    const previousTime = typeof updatedAt === 'string' ? Date.parse(updatedAt) : NaN
    if (typeof note !== 'string' || note.length > 3000 ||
        (updatedAt !== null && (typeof updatedAt !== 'string' || updatedAt.length !== 24 || !Number.isFinite(previousTime)))) {
      return response.status(400).json({ error: 'Enter a note up to 3000 characters and refresh before saving.' })
    }
    const currentTime = Date.now()
    const at = new Date(Math.max(currentTime, (previousTime || 0) + 1)).toISOString()
    try {
      const document = await store.findOneAndUpdate(
        { _id: request.workspaceKey, updatedAt },
        { $set: { note, updatedAt: at, expiresAt: new Date(currentTime + retention) },
          $push: recentActivity('Saved a scratchpad note', at) },
        { new: true, upsert: updatedAt === null },
      ).lean()
      if (document) return response.json(publicFields(document))
      return response.status(409).json({ error: 'The note changed in another tab. Reload before saving.' })
    } catch (error) {
      if (error.code === 11000) return response.status(409).json({ error: 'The note changed in another tab. Reload before saving.' })
      return next(error)
    }
  })

  router.post('/activity', async (request, response, next) => {
    const label = eventLabels.get(request.body?.event)
    if (!label) return response.status(400).json({ error: 'Unknown workspace event.' })
    const now = new Date()
    try {
      const document = await store.findOneAndUpdate(
        { _id: request.workspaceKey },
        { $set: { expiresAt: new Date(now.getTime() + retention) }, $push: recentActivity(label, now.toISOString()) },
        { new: true, upsert: true },
      ).lean()
      return response.json({ activity: document.activity })
    } catch (error) { return next(error) }
  })

  router.use((_request, response) => response.status(404).json({ error: 'Workspace endpoint not found.' }))
  router.use((error, _request, response, _next) => {
    if (error.status === 400 || error.status === 413) {
      return response.status(error.status).json({ error: 'Invalid or oversized workspace request.' })
    }
    console.error('Workbench request failed:', error.code || error.name)
    return response.status(500).json({ error: 'Could not read or save workspace data.' })
  })
  return router
}
