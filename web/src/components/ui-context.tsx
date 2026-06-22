// App-wide UI services: format-aware document preview modal + download toast.
// Mirrors openPreview / downloadDoc / closePreview from the reference build.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { DlIcon, FileMiniIcon } from './icons'

interface DocRef {
  file?: string // same-origin public path → real iframe preview + real download
  edgarUrl?: string // source URL → "Open at SEC"
}
interface PreviewState extends DocRef {
  name: string
  fmt: string
  meta?: string
}

interface UiApi {
  openPreview: (name: string, fmt: string, meta?: string, ref?: DocRef) => void
  downloadDoc: (name: string, fmt?: string, href?: string) => void
}

function triggerDownload(href: string, name: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = name
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

const UiContext = createContext<UiApi | null>(null)

export function useUi(): UiApi {
  const ctx = useContext(UiContext)
  if (!ctx) throw new Error('useUi must be used within <UiProvider>')
  return ctx
}

function PreviewBody({ fmt }: { fmt: string }) {
  const f = (fmt || '').toUpperCase()
  if (f === 'CSV' || f === 'XLSX') {
    const cells = []
    for (let r = 0; r < 9; r++) for (let i = 0; i < 4; i++) cells.push(<div key={`${r}-${i}`} className={`pc ${r === 0 ? 'hd' : ''}`} />)
    return <div className="pgrid">{cells}</div>
  }
  if (f === 'PPTX') {
    return (
      <div className="slide">
        <div style={{ height: 20, width: '58%', background: 'var(--line-2)', borderRadius: 4 }} />
        {['82%', '74%', '78%'].map((w, i) => (
          <div key={i} className="ph" style={{ width: w }} />
        ))}
      </div>
    )
  }
  if (f === 'ZIP') {
    const files = ['Cover & Index.pdf', 'KYC Form.pdf', 'Beneficial Owners.xlsx', 'Certificate of Incorporation.pdf', 'Authorised Signatories.pdf']
    return (
      <div className="ziplist">
        {files.map((n) => (
          <div key={n} className="zr">
            <FileMiniIcon />
            <span>{n}</span>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="paper">
      <div className="ttl" />
      {[92, 96, 84, 90, 72].map((w, i) => (
        <div key={`a${i}`} className="ph" style={{ width: `${w}%` }} />
      ))}
      <div style={{ height: 16 }} />
      {[88, 94, 80, 86].map((w, i) => (
        <div key={`b${i}`} className="ph" style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

export function UiProvider({ children }: { children: ReactNode }) {
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const [shown, setShown] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [toastShow, setToastShow] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  const closePreview = useCallback(() => {
    setShown(false)
    setTimeout(() => setPreview(null), 180)
  }, [])

  const openPreview = useCallback((name: string, fmt: string, meta?: string, ref?: DocRef) => {
    setPreview({ name, fmt, meta, file: ref?.file, edgarUrl: ref?.edgarUrl })
    requestAnimationFrame(() => setShown(true))
  }, [])

  const downloadDoc = useCallback((name: string, fmt?: string, href?: string) => {
    if (href) triggerDownload(href, name) // real file → real download
    setToastMsg((href ? 'Downloading ' : 'Downloading ') + name + (fmt ? ' · ' + fmt : '') + '…')
    setToastShow(true)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastShow(false), 2600)
  }, [])

  // Escape closes the preview first (drawer is handled in AppShell).
  useEffect(() => {
    if (!preview) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closePreview()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [preview, closePreview])

  return (
    <UiContext.Provider value={{ openPreview, downloadDoc }}>
      {children}
      {preview && (
        <div className={`modal-scrim${shown ? ' show' : ''}`} onClick={(e) => e.target === e.currentTarget && closePreview()}>
          <div className="modal">
            <div className="modal-h">
              <span className={`fmt ${(preview.fmt || '').toLowerCase()}`} style={{ marginTop: 2 }}>
                {preview.fmt}
              </span>
              <div className="mt">
                <div className="mn">{preview.name}</div>
                <div className="mm">{preview.meta || ''}</div>
              </div>
              <button className="modal-x" onClick={closePreview} aria-label="Close preview">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="modal-b" style={preview.file ? { padding: 0, background: 'var(--surface)' } : undefined}>
              {preview.file ? (
                <iframe
                  title={preview.name}
                  src={`/${preview.file}`}
                  sandbox="allow-same-origin allow-popups"
                  style={{ width: '100%', height: '64vh', border: 0, background: '#fff', borderRadius: 'var(--r-lg)' }}
                />
              ) : (
                <PreviewBody fmt={preview.fmt} />
              )}
            </div>
            <div className="modal-f">
              <span className="badge instance">{preview.file ? 'Crawled file' : 'Preview'}</span>
              <span className="sp" />
              {preview.edgarUrl ? (
                <a className="btn" href={preview.edgarUrl} target="_blank" rel="noreferrer">
                  Open at SEC ↗
                </a>
              ) : null}
              <button className="btn" onClick={closePreview}>
                Close
              </button>
              <button
                className="btn pri"
                onClick={() => downloadDoc(preview.name, preview.fmt, preview.file ? `/${preview.file}` : undefined)}
              >
                <DlIcon />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
      {toastMsg && (
        <div className={`toast${toastShow ? ' show' : ''}`}>
          <DlIcon />
          <span>{toastMsg}</span>
        </div>
      )}
    </UiContext.Provider>
  )
}
