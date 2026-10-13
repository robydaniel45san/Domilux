import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

export type Tone = 'gray' | 'green' | 'yellow' | 'red' | 'blue' | 'purple'

const tones: Record<Tone, string> = {
  gray: 'bg-neutral-100 text-neutral-700',
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
}

export const Badge = ({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) => (
  <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>
)

export const PageHeader = ({ title, desc, actions }: { title: string; desc?: string; actions?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
      {desc && <p className="mt-1 text-sm text-neutral-500">{desc}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
)

export const Card = ({ title, action, children, className = '', pad = true }: { title?: string; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) => (
  <section className={`rounded-xl border border-neutral-200 bg-white shadow-sm ${className}`}>
    {(title || action) && (
      <header className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3.5">
        {title && <h2 className="font-semibold text-neutral-800">{title}</h2>}
        {action}
      </header>
    )}
    <div className={pad ? 'p-5' : ''}>{children}</div>
  </section>
)

export const Stat = ({ label, value, sub, icon, tone = 'blue' }: { label: string; value: string; sub?: string; icon: ReactNode; tone?: Tone }) => (
  <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span>
    <div className="min-w-0">
      <p className="truncate text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="truncate text-2xl font-bold text-neutral-900">{value}</p>
      {sub && <p className="truncate text-xs text-neutral-500">{sub}</p>}
    </div>
  </div>
)

export function Modal({ open, onClose, title, children, wide, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:p-6" onClick={onClose}>
      <div className={`my-auto w-full ${wide ? 'max-w-4xl' : 'max-w-xl'} rounded-xl bg-white shadow-xl`} onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-lg font-bold text-neutral-900">{title}</h2>
          <button aria-label="Cerrar" onClick={onClose} className="cursor-pointer rounded p-1 text-neutral-500 hover:bg-neutral-100"><X size={20} /></button>
        </header>
        <div className="p-5">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-neutral-200 px-5 py-4">{footer}</footer>}
      </div>
    </div>
  )
}

export const Field = ({ label, hint, children, className = '' }: { label: string; hint?: string; children: ReactNode; className?: string }) => (
  <label className={`block text-sm ${className}`}>
    <span className="mb-1 block font-medium text-neutral-700">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-neutral-500">{hint}</span>}
  </label>
)

export const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${checked ? 'bg-brand' : 'bg-neutral-300'}`}
  >
    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
  </button>
)

export const Empty = ({ children }: { children: ReactNode }) => <p className="py-10 text-center text-sm text-neutral-500">{children}</p>

export const TH = ({ children, className = '' }: { children?: ReactNode; className?: string }) => (
  <th className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 ${className}`}>{children}</th>
)
export const TD = ({ children, className = '' }: { children?: ReactNode; className?: string }) => <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>

export const Table = ({ children }: { children: ReactNode }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[640px] border-collapse text-sm">{children}</table>
  </div>
)

export const fmtDate = (iso: string, withTime = false) =>
  new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) })

export function downloadCsv(name: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const blob = new Blob(['﻿' + rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

export const inputCls = 'input'
