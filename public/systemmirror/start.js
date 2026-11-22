const app = 'https://systemmirror.onrender.com/'
const launch = document.querySelector('#launch')
const cancel = document.querySelector('#cancel')
const panel = document.querySelector('#startup')
const status = document.querySelector('#status')
const elapsed = document.querySelector('#elapsed')
let active

launch.hidden = false
launch.addEventListener('click', async () => {
  const run = new AbortController()
  active = run
  launch.disabled = true
  cancel.hidden = false
  panel.hidden = false
  status.textContent = 'Waiting for the Render server and database.'
  const started = Date.now()
  const tick = () => {
    const seconds = Math.floor((Date.now() - started) / 1000)
    elapsed.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} elapsed`
  }
  tick()
  const timer = setInterval(tick, 1000)
  try {
    while (!run.signal.aborted && Date.now() - started < 100000) {
      try {
        const response = await fetch(new URL('api/health', app), {
          credentials: 'omit',
          cache: 'no-store',
          signal: AbortSignal.any([run.signal, AbortSignal.timeout(8000)]),
        })
        const health = response.ok ? await response.json() : null
        if (!run.signal.aborted && health?.status === 'ok' && health.database === 'connected') {
          status.textContent = 'SystemMirror is ready. Opening the demo.'
          window.location.assign(app)
          return
        }
      } catch {
        // A cold start can return a loading page or time out.
      }
      if (!run.signal.aborted) await new Promise((resolve) => setTimeout(resolve, 2500))
    }
    if (!run.signal.aborted) status.textContent = 'Still waiting for Render. Try again or open Render directly.'
  } finally {
    clearInterval(timer)
    if (active === run) {
      active = undefined
      launch.disabled = false
      cancel.hidden = true
    }
  }
})

cancel.addEventListener('click', () => {
  active?.abort()
  status.textContent = 'Waiting cancelled.'
})
