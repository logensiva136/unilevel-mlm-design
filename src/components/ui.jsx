import React from 'react'

export function Card({ children, className = '', rules = false }) {
  return (
    <div className={`rounded-lg border border-ink-600 bg-ink-800/60 ${rules ? 'ledger-rules' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function SectionHeading({ eyebrow, title, note, action }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        {eyebrow && <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-gold-500">{eyebrow}</div>}
        <h2 className="font-display text-xl font-medium text-ivory">{title}</h2>
        {note && <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ivory-faint">{note}</p>}
      </div>
      {action}
    </div>
  )
}

export function Stat({ label, value, sub, tone = 'gold', hint }) {
  const tones = {
    gold: 'text-gold-400',
    sage: 'text-sage-400',
    rose: 'text-rose-400',
    plain: 'text-ivory',
    dim: 'text-ivory-dim',
  }
  return (
    <div className="rounded-lg border border-ink-600 bg-ink-800/60 p-4">
      <div className="text-[11px] uppercase tracking-[0.12em] text-ivory-faint">{label}</div>
      <div className={`tnum mt-2 font-display text-2xl font-medium ${tones[tone]}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-ivory-dim">{sub}</div>}
      {hint && <div className="mt-2 text-[11px] leading-relaxed text-ivory-faint">{hint}</div>}
    </div>
  )
}

const TONES = {
  ok: 'border-sage-600/50 bg-sage-500/10 text-sage-400',
  warn: 'border-gold-600/50 bg-gold-500/10 text-gold-400',
  bad: 'border-rose-500/50 bg-rose-500/10 text-rose-400',
  roll: 'border-[#d99b5f]/50 bg-[#d99b5f]/10 text-[#d99b5f]',
  lost: 'border-[#7a6f8f]/50 bg-[#7a6f8f]/10 text-[#9b90ad]',
  neutral: 'border-ink-500 bg-ink-700 text-ivory-dim',
}

export function Tag({ children, tone = 'neutral', title }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${TONES[tone]}`}>
      {children}
    </span>
  )
}

export function Dot({ tone = 'neutral' }) {
  const c = { ok: 'bg-sage-400', warn: 'bg-gold-400', bad: 'bg-rose-400', neutral: 'bg-ivory-faint' }
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${c[tone]}`} />
}

export function Bar({ value, max, tone = 'gold', height = 'h-2' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const c = { gold: 'bg-gold-500', sage: 'bg-sage-500', rose: 'bg-rose-500', roll: 'bg-[#d99b5f]', lost: 'bg-[#7a6f8f]' }
  return (
    <div className={`${height} w-full overflow-hidden rounded-full bg-ink-700`}>
      <div className={`h-full rounded-full ${c[tone]}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Table({ columns, children, minWidth = 720 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-ink-600 text-left text-[11px] uppercase tracking-[0.1em] text-ivory-faint">
            {columns.map((c, i) => (
              <th key={i} className={`py-2 pr-4 font-medium ${c.align === 'right' ? 'text-right' : ''}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function Row({ children }) {
  return <tr className="border-b border-ink-700/60 last:border-0 hover:bg-ink-700/30">{children}</tr>
}

export function Cell({ children, align, mono, tone, className = '' }) {
  const tones = { gold: 'text-gold-400', sage: 'text-sage-400', rose: 'text-rose-400', dim: 'text-ivory-dim', faint: 'text-ivory-faint' }
  return (
    <td className={`py-2.5 pr-4 ${align === 'right' ? 'text-right' : ''} ${mono ? 'tnum font-mono text-xs' : ''} ${tones[tone] ?? 'text-ivory'} ${className}`}>
      {children}
    </td>
  )
}

export function Note({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'border-ink-600 bg-ink-900 text-ivory-dim',
    warn: 'border-gold-600/40 bg-gold-500/5 text-gold-400',
    bad: 'border-rose-500/40 bg-rose-500/5 text-rose-400',
    ok: 'border-sage-600/40 bg-sage-500/5 text-sage-400',
  }
  return (
    <div className={`rounded-md border px-3 py-2.5 text-xs leading-relaxed ${tones[tone]}`}>{children}</div>
  )
}

export function Button({ children, onClick, variant = 'primary', disabled, icon: Icon, size = 'md' }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-40'
  const sizes = { md: 'px-4 py-2.5 text-sm', sm: 'px-2.5 py-1.5 text-xs' }
  const variants = {
    primary: 'bg-gold-500 text-ink-950 hover:bg-gold-400',
    ghost: 'border border-ink-600 text-ivory-dim hover:border-ink-500 hover:text-ivory',
    ok: 'border border-sage-600/50 text-sage-400 hover:bg-sage-500/10',
    bad: 'border border-rose-500/50 text-rose-400 hover:bg-rose-500/10',
  }
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]}`}>
      {Icon && <Icon size={size === 'sm' ? 12 : 15} />}
      {children}
    </button>
  )
}
