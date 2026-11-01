import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import ContactMessage from './models/ContactMessage.js'

const app = express()
const port = Number(process.env.PORT) || 3001
const allowedOrigins = (process.env.FRONTEND_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.some((allowedOrigin) => (
      allowedOrigin.startsWith('*.')
        ? origin.endsWith(allowedOrigin.slice(1))
        : origin === allowedOrigin
    )))
  }
}))
app.use(express.json({ limit: '10kb' }))

app.get('/health', (_request, response) => {
  const connected = mongoose.connection.readyState === 1
  response.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'database unavailable'
  })
})

app.post('/api/contact', async (request, response, next) => {
  const { name, email, phone = '', message } = request.body || {}
  const cleanName = typeof name === 'string' ? name.trim() : ''
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const cleanPhone = typeof phone === 'string' ? phone.trim() : null
  const cleanMessage = typeof message === 'string' ? message.trim() : ''

  if (!cleanName || cleanName.length > 100) {
    return response.status(400).json({ message: 'Enter a name of 1 to 100 characters.' })
  }
  if (
    !cleanEmail ||
    cleanEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
  ) {
    return response.status(400).json({ message: 'Enter a valid email address.' })
  }
  if (cleanPhone === null || cleanPhone.length > 30) {
    return response.status(400).json({ message: 'Phone number must be 30 characters or fewer.' })
  }
  if (!cleanMessage || cleanMessage.length > 5000) {
    return response.status(400).json({ message: 'Enter a message of 1 to 5000 characters.' })
  }

  try {
    await ContactMessage.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      message: cleanMessage
    })
    return response.status(201).json({ message: 'Message saved successfully.' })
  } catch (error) {
    return next(error)
  }
})

app.use((error, _request, response, _next) => {
  console.error('Contact API request failed:', error)
  const status = error.status === 413 ? 413 : error.status === 400 ? 400 : 500
  response.status(status).json({
    message: status === 413
      ? 'Request is too large.'
      : status === 400
        ? 'Request body must contain valid JSON.'
        : 'Unable to save your message right now.'
  })
})

async function startServer() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI must be configured before starting the contact API.')
  }

  await mongoose.connect(process.env.MONGODB_URI)
  app.listen(port, () => {
    console.log(`Contact API listening on port ${port}`)
  })
}

startServer().catch((error) => {
  console.error('Failed to start contact API:', error)
  process.exitCode = 1
})
