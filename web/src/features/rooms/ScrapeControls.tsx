// Document-fetch triggers — call the local control server (python3 -m
// competitor_ingest.server, proxied at /api). Full = re-fetch every document; New = delta
// (only documents not already in the archive). On success the server re-syncs the web
// snapshot, so a reload surfaces the new docs. ScrapeControls = one competitor;
// RoomFetchControls = every competitor (the Competitor Data Room header).
import { useEffect, useState } from 'react'

type Status = { code: string; name?: string; docs: number; lastCrawl: string | null }

function Spinner() {
  return <span className="scrape-spin" aria-hidden />
}

export function ScrapeControls({ code }: { code: string }) {
  const [busy, setBusy] = useState<'full' | 'new' | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)
  const [status, setStatus] = useState<Status | null>(null)

  useEffect(() => {
    let live = true
    fetch(`/api/status?code=${encodeURIComponent(code)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('offline'))))
      .then((s) => live && setStatus(s))
      .catch(() => live && setOffline(true))
    // A scrape re-syncs the data and reloads the page; surface the result that was stashed
    // before the reload.
    const pending = sessionStorage.getItem(`scrape:${code}`)
    if (pending) {
      sessionStorage.removeItem(`scrape:${code}`)
      try {
        setMsg(JSON.parse(pending).msg)
      } catch {
        /* ignore */
      }
    }
    return () => {
      live = false
    }
  }, [code])

  async function scrape(mode: 'full' | 'new') {
    setBusy(mode)
    setMsg(null)
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, mode }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || res.statusText)
      const data = await res.json()
      const added = data.row?.new ?? 0
      const changed = data.row?.changed ?? 0
      const total = data.summary?.docs ?? data.row?.docs
      const message =
        mode === 'full'
          ? `Full fetch complete · ${total} documents`
          : added > 0
            ? `${added} new document${added > 1 ? 's' : ''} added`
            : changed > 0
              ? `${changed} document${changed > 1 ? 's' : ''} updated`
              : 'Up to date · no new documents'
      // The server re-synced the snapshot; stash the result and reload so the new docs render.
      sessionStorage.setItem(`scrape:${code}`, JSON.stringify({ msg: message }))
      window.location.reload()
    } catch (e) {
      setMsg(`Fetch failed · ${(e as Error)?.message || e}`)
      setBusy(null)
    }
  }

  if (offline) {
    return (
      <div className="scrape-bar off">
        <span className="scrape-hint">
          Fetch server offline — run <code>python3 -m competitor_ingest.server</code> in <code>spike/</code>
        </span>
      </div>
    )
  }

  return (
    <div className="scrape-bar">
      <button className="scrape-btn primary" disabled={!!busy} onClick={() => scrape('full')}>
        {busy === 'full' ? <Spinner /> : null}
        Fetch Full Documents
      </button>
      <button className="scrape-btn" disabled={!!busy} onClick={() => scrape('new')}>
        {busy === 'new' ? <Spinner /> : null}
        Fetch New Documents
      </button>
      {status ? (
        <span className="scrape-meta">
          {status.docs} docs{status.lastCrawl ? ` · last ${status.lastCrawl.slice(0, 10)}` : ''}
        </span>
      ) : null}
      {msg ? <span className={`scrape-msg${msg.startsWith('Fetch failed') ? ' err' : ''}`}>{msg}</span> : null}
    </div>
  )
}

// Room-level fetch: runs the crawl for EVERY competitor (code '*'). Lives in the Competitor
// Data Room header. Full = re-fetch all; New = delta. A full fetch over all players is long —
// the button stays busy until the server finishes, then the page reloads with the new counts.
export function RoomFetchControls() {
  const [busy, setBusy] = useState<'full' | 'new' | null>(null)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    let live = true
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('offline'))))
      .catch(() => live && setOffline(true))
    const pending = sessionStorage.getItem('fetch:*')
    if (pending) sessionStorage.removeItem('fetch:*')
    return () => {
      live = false
    }
  }, [])

  async function fetchAll(mode: 'full' | 'new') {
    if (busy) return
    setBusy(mode)
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: '*', mode }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || res.statusText)
      sessionStorage.setItem('fetch:*', '1')
      window.location.reload()
    } catch {
      setBusy(null)
    }
  }

  if (offline) return null
  return (
    <>
      <button className="btn pri" disabled={!!busy} onClick={() => fetchAll('full')}>
        {busy === 'full' ? <span className="scrape-spin" aria-hidden /> : null}
        Fetch Full Documents
      </button>
      <button className="btn" disabled={!!busy} onClick={() => fetchAll('new')}>
        {busy === 'new' ? <span className="scrape-spin" aria-hidden /> : null}
        Fetch New Documents
      </button>
    </>
  )
}
