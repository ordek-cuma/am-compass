// Fact row (mfact, spec §5.16) + stat card (spec §5.8) + attachment list (spec §5.12).
import type { ReactNode } from 'react'
import { DlIcon } from './icons'
import { useUi } from './ui-context'

export type FieldStatus = 'have' | 'partial' | 'add'

export function MetaRow({ label, status, value }: { label: ReactNode; status: FieldStatus; value?: string | number | null }) {
  const ph = value == null
  return (
    <div className="meta-row">
      <span className="k">
        <span className={`sdot ${status}`} />
        {label}
      </span>
      <span className={`v ${ph ? 'ph' : ''}`}>{ph ? 'To add' : value}</span>
    </div>
  )
}

// Plain key/value row (no status dot) — used in the Company Details panel.
export function PlainRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="meta-row">
      <span className="k">{label}</span>
      <span className="v">{value}</span>
    </div>
  )
}

export function StatCard({ label, value, cls }: { label: string; value: ReactNode; cls?: 'pos' | 'neg' }) {
  return (
    <div className="statc">
      <div className="l">{label}</div>
      <div className={`v${cls ? ' ' + cls : ''}`}>{value}</div>
    </div>
  )
}

export interface Attachment {
  name: string
  fmt: string
  meta: string
  file?: string // public path → real preview + download (crawled file)
  edgarUrl?: string
}

// Document attachment rows: click row → preview, click download icon → download (stops propagation).
// When `file` is set, preview/download act on the real crawled file.
export function AttachList({ items }: { items: Attachment[] }) {
  const { openPreview, downloadDoc } = useUi()
  return (
    <div className="attachList">
      {items.map((d, i) => (
        <div
          key={`${d.name}-${i}`}
          className={`attach${i === 0 ? ' on' : ''}`}
          onClick={() => openPreview(d.name, d.fmt, d.meta, { file: d.file, edgarUrl: d.edgarUrl })}
        >
          <span className={`fmt ${d.fmt.toLowerCase()}`}>{d.fmt}</span>
          <div className="ad">
            <div className="an">
              {d.name}
              {d.file ? (
                <span className="badge live" style={{ marginLeft: 8 }}>crawled</span>
              ) : d.edgarUrl ? (
                <span className="badge system" style={{ marginLeft: 8 }}>source</span>
              ) : null}
            </div>
            <div className="am">{d.meta}</div>
          </div>
          <span
            className="dlb"
            onClick={(e) => {
              e.stopPropagation()
              downloadDoc(d.name, d.fmt, d.file ? `/${d.file}` : undefined)
            }}
          >
            <DlIcon />
          </span>
        </div>
      ))}
    </div>
  )
}
