import { useEffect, useRef, useState } from 'react'

const collections = [
  { key: 'workbenchSessions', label: 'Workspace sessions', source: 'Local data' },
  { key: 'contactMessages', label: 'Contact messages', source: 'Sample data' },
]

export default function DatabasePanel({ connect, local }) {
  const [session, setSession] = useState(null)
  const [records, setRecords] = useState(null)
  const [selected, setSelected] = useState(collections[0].key)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const mount = useRef(null)

  useEffect(() => {
    const current = new AbortController()
    mount.current = current.signal
    return () => current.abort()
  }, [])

  useEffect(() => {
    if (!session) return
    const timer = setTimeout(() => {
      setSession(null)
      setRecords(null)
      setError('Session expired. Sign in again.')
    }, session.expiresInMs)
    return () => {
      clearTimeout(timer)
      session.lock()
    }
  }, [session])

  useEffect(() => {
    if (!session) return
    let active = true
    session.read(selected, page).then(result => {
      if (active) setRecords(result)
    }).catch(error => {
      if (!active) return
      if (error.status === 401) setSession(null)
      setError(error.message)
    })
    return () => { active = false }
  }, [session, selected, page])

  function navigate(collection, targetPage) {
    setRecords(null)
    setError('')
    setSelected(collection)
    setPage(targetPage)
  }

  async function unlock(event) {
    event.preventDefault()
    if (pending) return
    const field = event.currentTarget.elements.password
    const password = field.value
    field.value = ''
    const signal = mount.current
    setPending(true)
    setError('')
    try {
      const result = await connect({ username: 'bikas', password })
      if (signal.aborted) result.lock()
      else {
        navigate(collections[0].key, 1)
        setSession(result)
      }
    } catch (error) {
      if (!signal.aborted) setError(error.message)
    } finally {
      if (!signal.aborted) setPending(false)
    }
  }

  if (!session) return <form className="database-login" onSubmit={unlock}>
    <p className="database-eyebrow">{local ? 'Local demo' : 'Bikas Desk'}</p>
    <h3>Admin only</h3>
    <p>Sign in to browse records in read-only mode.</p>
    <label htmlFor="database-user">Username</label>
    <input id="database-user" name="username" value="bikas" readOnly autoComplete="username" />
    <label htmlFor="database-password">Password</label>
    <input id="database-password" name="password" type="password" autoComplete="off" maxLength={256} required />
    <button className="feature-link" type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
    {error && <p className="database-error" role="alert">{error}</p>}
  </form>

  const collection = collections.find(item => item.key === selected)
  return <div className="database-view">
    <div className="database-heading">
      <div><p className="database-eyebrow">{local ? 'Local demo' : 'MongoDB'} · Read-only</p><h3>Database records</h3></div>
      <button className="soft-button" type="button" onClick={() => { setSession(null); setRecords(null); setError('') }}>Lock</button>
    </div>
    <div className="panel-actions" role="group" aria-label="Collections">
      {collections.map(({ key, label }) => <button className="soft-button" type="button" key={key} aria-pressed={key === selected}
        onClick={() => { if (key !== selected) navigate(key, 1) }}>{label}</button>)}
    </div>
    {error && <p className="database-error" role="alert">{error}</p>}
    {!records && !error && <p role="status">Loading records…</p>}
    {records && <>
      <p className="database-source">{local ? collection.source : 'Page ' + page} · {records.documents.length === 1 ? '1 record' : records.documents.length + ' records'}</p>
      {records.documents.map((document, index) => <pre className="database-record" key={index}>{JSON.stringify(document, null, 2)}</pre>)}
      {records.documents.length === 0 && <p>No records on this page.</p>}
    </>}
    {(page > 1 || records?.hasNext) && <div className="panel-actions" aria-label="Pages">
      <button className="soft-button" type="button" disabled={page === 1} onClick={() => navigate(selected, page - 1)}>Previous</button>
      <button className="soft-button" type="button" disabled={!records?.hasNext} onClick={() => navigate(selected, page + 1)}>Next</button>
    </div>}
  </div>
}
