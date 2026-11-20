import { useEffect, useRef, useState } from 'react'
import './Workbench.css'
import brandLogo from '../bikaslogo.png'
import { deskUrl, portfolioAsset } from './portfolioPaths.js'
import { caseStudies as projects } from './portfolioProjects.js'
import DatabasePanel from './DatabasePanel.jsx'

const localWorkbench = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
const databaseEnabled = !localWorkbench || import.meta.env.DEV
const panels = [
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'notes', label: 'Scratchpad' },
  { id: 'contact', label: 'Contact' },
  { id: 'activity', label: 'Activity' },
  ...(databaseEnabled ? [{ id: 'database', label: 'Database' }] : []),
]

const compactDesk = '(max-width: 800px), (max-height: 480px) and (max-width: 1000px)'
const initialWindows = [{ id: 'about', x: 0, y: 0, mode: 'normal' }]
const nepalClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kathmandu', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})
const nepalDate = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kathmandu', day: '2-digit', month: '2-digit', year: 'numeric',
})

function DeskClock({ enabled }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!enabled) return
    let timer
    function update() {
      clearTimeout(timer)
      const current = new Date()
      setNow(current)
      timer = setTimeout(update, 60_000 - current.getTime() % 60_000)
    }
    update()
    document.addEventListener('visibilitychange', update)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', update)
    }
  }, [enabled])

  return <time className="desktop-clock" dateTime={now.toISOString()} title="Nepal time (NPT)">
    <span>{nepalClock.format(now)}</span>
    <span className="desktop-clock-date">{nepalDate.format(now)}</span>
  </time>
}

function AppIcon({ name }) {
  return <span className={'app-icon app-icon--' + name} aria-hidden="true"><i /></span>
}

function DeskAppSearch({ enabled, onOpen }) {
  const [query, setQuery] = useState('')
  const dialog = useRef(null)
  const searchInput = useRef(null)
  const results = useRef(null)
  const term = query.trim().toLowerCase()
  const matches = panels.filter(panel => panel.label.toLowerCase().includes(term) || panel.id.includes(term))

  function showSearch() {
    if (!dialog.current.open) dialog.current.showModal()
    searchInput.current?.focus()
  }

  useEffect(() => {
    if (!enabled) {
      dialog.current?.close()
      return
    }
    function openOnShortcut(event) {
      if (event.defaultPrevented || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') return
      event.preventDefault()
      showSearch()
    }
    window.addEventListener('keydown', openOnShortcut)
    return () => window.removeEventListener('keydown', openOnShortcut)
  }, [enabled])

  function launch(id) {
    dialog.current.close()
    onOpen(id)
    requestAnimationFrame(() => document.getElementById('title-' + id)?.focus({ preventScroll: true }))
  }

  return <>
    <button className="desk-search-trigger" type="button" aria-label="Search apps" title="Search apps (Ctrl or Command + K)" aria-haspopup="dialog"
      onClick={showSearch}>
      <span className="desk-search-icon" aria-hidden="true" /><span>Search apps</span>
    </button>
    <dialog className="desk-search-dialog" aria-labelledby="desk-search-title" ref={dialog} onClose={() => setQuery('')}>
      <div className="desk-search-heading">
        <h2 id="desk-search-title">Find an app</h2>
        <button className="soft-button" type="button" onClick={() => dialog.current.close()}>Close</button>
      </div>
      <form onSubmit={event => { event.preventDefault(); if (matches.length) launch(matches[0].id) }}>
        <input ref={searchInput} type="search" value={query} onChange={event => setQuery(event.target.value)} aria-label="App name" placeholder="Search by app name"
          onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); results.current?.querySelector('button')?.focus() } }} />
      </form>
      {matches.length > 0 ? <ul className="desk-search-results" ref={results}>
        {matches.map(panel => <li key={panel.id}><button type="button" onClick={() => launch(panel.id)}>
          <AppIcon name={panel.id} />{panel.label}
        </button></li>)}
      </ul> : <p role="status">No matching apps.</p>}
    </dialog>
  </>
}

const hostedApi = import.meta.env.VITE_CONTACT_API_URL?.trim().replace(/\/+$/, '') || 'https://bikas-portfolio-contact-api.onrender.com'
const workbenchEndpoint = localWorkbench ? portfolioAsset('api/workbench/') : hostedApi + '/api/workbench/'
let workspaceKey

function browserWorkspaceKey() {
  if (workspaceKey) return workspaceKey
  const storageKey = 'bikas-desk-workspace-key'
  try { workspaceKey = localStorage.getItem(storageKey) } catch { /* A private browser may disable storage. */ }
  if (/^[a-f0-9]{64}$/.test(workspaceKey ?? '')) return workspaceKey
  workspaceKey = Array.from(crypto.getRandomValues(new Uint8Array(32)), value => value.toString(16).padStart(2, '0')).join('')
  try { localStorage.setItem(storageKey, workspaceKey) } catch { /* The key remains available until reload. */ }
  return workspaceKey
}

async function workspaceRequest(path, method = 'GET', data) {
  const headers = {}
  if (data) headers['Content-Type'] = 'application/json'
  if (!localWorkbench) headers.Authorization = 'Bearer ' + browserWorkspaceKey()
  const response = await fetch(workbenchEndpoint + path, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  })
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Workspace server unavailable.')
  const value = await response.json()
  if (!response.ok) throw new Error(value.error)
  return value
}

async function adminRequest(path, { method = 'GET', data, token } = {}) {
  const headers = {}
  if (data) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = 'Bearer ' + token
  const response = await fetch(workbenchEndpoint + 'admin/' + path, {
    method, headers, body: data ? JSON.stringify(data) : undefined,
    credentials: 'omit', cache: 'no-store', redirect: 'error',
  })
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Database server unavailable.')
  const value = await response.json()
  if (!response.ok) throw Object.assign(new Error(value.error), { status: response.status })
  return value
}

async function connectDatabase(credentials) {
  if (localWorkbench) {
    const snapshot = await adminRequest('database', { method: 'POST', data: credentials })
    return {
      expiresInMs: 10 * 60_000,
      read: async collection => ({ documents: snapshot[collection], hasNext: false }),
      lock: () => {},
    }
  }
  const { token, expiresInMs } = await adminRequest('login', { method: 'POST', data: credentials })
  return {
    expiresInMs,
    read: (collection, page) => adminRequest('records/' + collection + '?page=' + page, { token }),
    lock: () => { void adminRequest('session', { method: 'DELETE', token }).catch(() => {}) },
  }
}

export default function Workbench({ animation, enabled, onLightMode }) {
  const [windows, setWindows] = useState(initialWindows)
  const [projectIndex, setProjectIndex] = useState(0)
  const [command, setCommand] = useState('')
  const [history, setHistory] = useState([])
  const [workspace, setWorkspace] = useState(null)
  const [note, setNote] = useState('')
  const [serverMessage, setServerMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [focusCommand, setFocusCommand] = useState(false)
  const input = useRef(null)
  const stage = useRef(null)
  const drag = useRef(null)
  const active = windows.findLast(item => item.mode !== 'minimized')?.id
  const project = projects[projectIndex]


  function openWindow(id) {
    setWindows(current => {
      const existing = current.find(item => item.id === id)
      const offset = (current.length % 4) * 26
      const window = existing ? { ...existing, mode: existing.mode === 'minimized' ? 'normal' : existing.mode }
        : { id, x: offset, y: offset, mode: 'normal' }
      return [...current.filter(item => item.id !== id), window]
    })
  }

  function setWindowMode(id, mode) {
    setWindows(current => current.map(item => item.id === id ? { ...item, mode } : item))
  }

  function startDrag(event, item) {
    if (event.button !== 0 || item.mode !== 'normal' || event.target.closest('button') || matchMedia(compactDesk).matches) return
    const bounds = stage.current.getBoundingClientRect()
    const box = event.currentTarget.parentElement.getBoundingClientRect()
    drag.current = { id: item.id, fromX: event.clientX, fromY: event.clientY, x: item.x, y: item.y,
      minX: bounds.left - box.left, maxX: bounds.right - box.right,
      minY: bounds.top - box.top, maxY: bounds.bottom - box.bottom }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveWindow(event) {
    const current = drag.current
    if (!current) return
    const x = current.x + Math.max(current.minX, Math.min(current.maxX, event.clientX - current.fromX))
    const y = current.y + Math.max(current.minY, Math.min(current.maxY, event.clientY - current.fromY))
    setWindows(items => items.map(item => item.id === current.id ? { ...item, x, y } : item))
  }

  useEffect(() => {
    let current = true
    workspaceRequest('state').then(value => {
      if (!current) return
      setWorkspace(value)
      setNote(value.note)
    }).catch(error => { if (current) setServerMessage(error.message) })
    return () => { current = false }
  }, [])

  useEffect(() => {
    if (!enabled) return
    function handleShortcut(event) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input, textarea, [contenteditable], dialog[open]')) return
      if (event.key === '/') {
        event.preventDefault()
        openWindow('terminal')
        setFocusCommand(true)
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [enabled])

  useEffect(() => {
    if (!focusCommand || active !== 'terminal') return
    input.current?.focus()
    setFocusCommand(false)
  }, [active, focusCommand])

  function submitCommand(event) {
    event.preventDefault()
    const value = command.trim().toLowerCase()
    if (!value) return
    setCommand('')
    if (value === 'clear') {
      setHistory([])
      return
    }
    const destination = panels.find(({ id }) => id === value)
    if (destination) openWindow(destination.id)
    const reply = destination ? 'Opened ' + destination.label + '.'
      : value === 'help' ? 'projects · about · contact · notes · activity · clear'
        : 'Unknown command. Type help.'
    setHistory(current => [...current.slice(-2), { value, reply }])
  }

  async function recordEvent(event) {
    if (!workspace) return
    try {
      const value = await workspaceRequest('activity', 'POST', { event })
      setWorkspace(current => ({ ...current, activity: value.activity }))
    } catch (error) {
      setServerMessage(error.message)
    }
  }

  async function saveNote(event) {
    event.preventDefault()
    setSaving(true)
    setServerMessage('')
    try {
      const value = await workspaceRequest('note', 'PUT', { note, updatedAt: workspace.updatedAt })
      setWorkspace(value)
      setServerMessage(localWorkbench ? 'Saved to the local server.' : 'Saved to this browser’s workspace.')
    } catch (error) {
      setServerMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  return <div className="desktop" data-theme="dark" data-animation={animation || undefined}>
    <header className="desktop-top">
      <a className="desktop-brand" href={deskUrl}><span className="desktop-logo" aria-hidden="true"><span><img src={brandLogo} alt="" /></span></span>Bikas Desk</a>
      <div className="desktop-top-actions">
        <span className="local-state" role="status"><i className={workspace ? 'ready' : ''} />{workspace ? (localWorkbench ? 'Local server online' : 'Workspace online') : serverMessage || 'Connecting'}</span>
        <DeskAppSearch enabled={enabled && !animation} onOpen={openWindow} />
        <button className="theme-switch" type="button" title="Return to the portfolio" onClick={onLightMode}><span aria-hidden="true" />Lights on</button>
        <DeskClock enabled={enabled} />
      </div>
    </header>

    <main className="desktop-stage" ref={stage} aria-label="Bikas Desk">
      <nav className="desktop-launcher" aria-label="Desktop apps">
        <span className="desktop-launcher-label" aria-hidden="true">Apps</span>
        {panels.map(panel => <button type="button" className="desktop-app" key={panel.id} onClick={() => openWindow(panel.id)}>
          <AppIcon name={panel.id} /><span>{panel.label}</span>
        </button>)}
        <a className="desktop-app" href={portfolioAsset('Bikas-Banjade-CV.pdf')} target="_blank" rel="noreferrer"><AppIcon name="resume" /><span>Resume</span></a>
      </nav>

      {windows.map((item, index) => {
        const panel = panels.find(({ id }) => id === item.id)
        return <section key={item.id} hidden={item.mode === 'minimized'} data-active={active === item.id}
          className={'desk-window desk-window--' + item.mode} aria-labelledby={'title-' + item.id}
          style={{ '--window-x': item.x + 'px', '--window-y': item.y + 'px', zIndex: index + 1 }}
          onPointerDown={() => { if (active !== item.id) openWindow(item.id) }}>
          <header className="window-bar" onPointerDown={event => startDrag(event, item)} onPointerMove={moveWindow} onPointerUp={() => { drag.current = null }} onLostPointerCapture={() => { drag.current = null }}>
            <AppIcon name={panel.id} />
            <h2 id={'title-' + item.id} tabIndex={-1}>{panel.id === 'about' ? 'About Bikas' : panel.label}</h2>
            <div className="window-controls">
              <button type="button" aria-label={'Minimize ' + panel.label} title="Minimize" onClick={() => setWindowMode(item.id, 'minimized')}>−</button>
              <button type="button" className="window-expand" aria-label={(item.mode === 'maximized' ? 'Restore ' : 'Maximize ') + panel.label} title={item.mode === 'maximized' ? 'Restore' : 'Maximize'} onClick={() => setWindowMode(item.id, item.mode === 'maximized' ? 'normal' : 'maximized')}>{item.mode === 'maximized' ? '❐' : '□'}</button>
              <button type="button" aria-label={'Close ' + panel.label} title="Close" onClick={() => setWindows(current => current.filter(window => window.id !== item.id))}>×</button>
            </div>
          </header>

          <div className={'window-body window-body--' + item.id}>
            {item.id === 'about' && <>
              <div className="about-banner">
                <div>
                  <p className="desk-about-role">Software Engineering Student · NCIT</p>
                  <h1>Bikas <span>Banjade<span aria-hidden="true">.</span></span></h1>
                </div>
                <img src={portfolioAsset('portfolio/perfil.jpg')} alt="Portrait of Bikas Banjade" width="559" height="485" />
              </div>
              <p className="desk-about-summary">I’m from Pyuthan, Nepal. I build full-stack web apps, from the interfaces people use to the APIs that power them.</p>
              <div className="panel-actions">
                <button className="feature-link" type="button" onClick={() => openWindow('projects')}>View projects</button>
                <a className="soft-button" href={portfolioAsset('Bikas-Banjade-CV.pdf')} target="_blank" rel="noreferrer">Resume</a>
                <a className="soft-button" href="https://github.com/bikas15" target="_blank" rel="noreferrer">GitHub</a>
              </div>
            </>}
            {item.id === 'projects' && <>
              <div className="project-switcher" role="group" aria-label="Choose a project">
                {projects.map(({ id, title }, projectNumber) => <button className="soft-button" type="button" key={id} aria-pressed={projectNumber === projectIndex} onClick={() => { setProjectIndex(projectNumber); recordEvent(id) }}>{title}</button>)}
              </div>
              <article className="project-feature">
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
                <p className="project-stack">{project.stack.join(' · ')}</p>
                <figure className="desk-project-preview">
                  <img src={portfolioAsset(project.image)} alt={project.imageAlt} width={project.imageWidth} height={project.imageHeight} loading="lazy" decoding="async" />
                  <figcaption>
                    <span>{project.caption}</span>
                    {project.attribution && <a href={project.attribution.url} target="_blank" rel="noreferrer">{project.attribution.label}</a>}
                  </figcaption>
                </figure>
                <div className="panel-actions">
                  <a className="feature-link" href={portfolioAsset('#' + project.id)}>Case study</a>
                  <a className="soft-button" href={project.demo} target="_blank" rel="noreferrer">Live demo</a>
                  <a className="soft-button" href={project.source} target="_blank" rel="noreferrer">GitHub</a>
                  {project.presentation && <a className="soft-button" href={portfolioAsset(project.presentation)} target="_blank" rel="noreferrer">Slides</a>}
                </div>
              </article>
            </>}
            {item.id === 'contact' && <>
              <h3>Get in touch</h3>
              <div className="panel-actions">
                <a className="feature-link" href="mailto:bikashbanjade15@gmail.com">Email me</a>
                <a className="soft-button" href={portfolioAsset('#contact')}>Contact form</a>
              </div>
            </>}
            {item.id === 'notes' && <form className="scratchpad" onSubmit={saveNote}>
              <label htmlFor="workspace-note">{localWorkbench ? 'Local notes' : 'Notes for this browser'}</label>
              <textarea id="workspace-note" value={note} onChange={event => setNote(event.target.value)} maxLength={3000} rows={7} disabled={!workspace} />
              <div className="panel-actions"><button className="feature-link" type="submit" disabled={!workspace || saving || note === workspace.note}>{saving ? 'Saving…' : 'Save note'}</button><span className="save-status" role="status">{serverMessage}</span></div>
            </form>}
            {item.id === 'terminal' && <>
              <p>Type <code>help</code> to list commands. Press <kbd>/</kbd> from the desktop to open Terminal.</p>
              <div className="command-history" aria-live="polite">
                {history.map(({ value, reply }, position) => <div key={position}><span>{value}</span><p>{reply}</p></div>)}
              </div>
              <form className="command-form" onSubmit={submitCommand}>
                <span aria-hidden="true">›</span>
                <input ref={input} value={command} onChange={event => setCommand(event.target.value)} aria-label="Workbench command" placeholder="help" maxLength={100} spellCheck={false} autoComplete="off" />
                <button type="submit">Run</button>
              </form>
            </>}
            {item.id === 'activity' && (workspace?.activity.length ? <ul className="activity-list">
              {workspace.activity.map(({ label, at }, position) => <li key={at + position}><span>{label}</span><time dateTime={at}>{new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></li>)}
            </ul> : <p>{workspace ? 'Project views and note saves will appear here.' : 'Activity is available when the workspace connects.'}</p>)}
            {databaseEnabled && item.id === 'database' && enabled && <DatabasePanel connect={connectDatabase} local={localWorkbench} />}
          </div>
        </section>
      })}
    </main>

    <nav className="desktop-dock" aria-label="App dock">
      {panels.map(panel => {
        const open = windows.find(item => item.id === panel.id)
        return <button type="button" key={panel.id} aria-label={'Open ' + panel.label} title={panel.label}
          data-open={Boolean(open)} aria-pressed={active === panel.id} onClick={() => openWindow(panel.id)}><AppIcon name={panel.id} /></button>
      })}
    </nav>
  </div>
}
