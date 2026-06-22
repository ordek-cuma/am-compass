// Shared formatting helpers (tabular-friendly).
export const fnum = (n: number) => n.toLocaleString('en-US')
export const fpct = (n: number) => (n > 0 ? '+' : '') + n.toFixed(1) + '%'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export function fdate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

// Normalize a "6.4 MB" style size string to KB for sorting.
export function szKB(s: string): number {
  const m = parseFloat(s) || 0
  return /GB/.test(s) ? m * 1048576 : /MB/.test(s) ? m * 1024 : m
}
