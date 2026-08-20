import React from 'react'
import { ArrowUp, Check, ChevronsUp, Ban, CircleSlash } from 'lucide-react'
import { byId, productBySku } from '../data/network'
import { RUN } from '../lib/engine'
import { money, rate } from '../lib/format'
import { Tag } from './ui'

// ---------------------------------------------------------------------------
// THE COMPRESSION TRACE
// ---------------------------------------------------------------------------
// This is the single most-disputed artifact in a unilevel business: "why did I
// get paid at level 4 for someone who is 6 people below me?" The answer is
// always compression, and the only way to settle it is to show the walk.
//
// Four outcomes per hop:
//   PAID        — qualified, and their rank unlocks this level
//   COMPRESSED  — not active, bypassed, level NOT consumed (rolls up)
//   BEYOND DEPTH— active, but rank doesn't unlock this level, level IS consumed
//   BREAKAGE    — chain ran out of uplines; remaining levels go unpaid
// ---------------------------------------------------------------------------

const OUTCOME = {
  paid: {
    icon: Check,
    tone: 'ok',
    label: 'Paid',
    ring: 'border-sage-600/60 bg-sage-500/10 text-sage-400',
  },
  compressed: {
    icon: ChevronsUp,
    tone: 'roll',
    label: 'Compressed',
    ring: 'border-[#d99b5f]/60 bg-[#d99b5f]/10 text-[#d99b5f]',
  },
  beyond_depth: {
    icon: Ban,
    tone: 'lost',
    label: 'Beyond depth',
    ring: 'border-[#7a6f8f]/60 bg-[#7a6f8f]/10 text-[#9b90ad]',
  },
  breakage: {
    icon: CircleSlash,
    tone: 'neutral',
    label: 'Breakage',
    ring: 'border-ink-500 bg-ink-700 text-ivory-faint',
  },
}

export default function CompressionTrace({ orderId, highlightId }) {
  const trace = RUN.traces[orderId]
  if (!trace) return <p className="text-sm text-ivory-faint">No trace for this order.</p>

  const buyer = byId[trace.buyerId]
  const order = trace.orderId
  const paidTotal = trace.hops.reduce((s, h) => (h.outcome === 'paid' ? s + h.amount : s), 0)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-ink-600 bg-ink-900 px-4 py-3">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-ivory-faint">Order</div>
          <div className="tnum font-mono text-xs text-ivory">{order}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-ivory-faint">Placed by</div>
          <div className="text-sm text-ivory">{buyer?.name}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-ivory-faint">Commissionable volume</div>
          <div className="tnum font-mono text-xs text-gold-400">{trace.cv} CV</div>
        </div>
        <div className="ml-auto">
          <div className="text-[10px] uppercase tracking-wide text-ivory-faint">Paid out on this order</div>
          <div className="tnum font-display text-lg text-gold-400">{money(paidTotal)}</div>
        </div>
      </div>

      <ol className="relative">
        {/* the spine the volume climbs */}
        <div className="absolute bottom-4 left-[15px] top-4 w-px bg-ink-600" />

        {trace.hops.map((hop, i) => {
          const cfg = OUTCOME[hop.outcome]
          const Icon = cfg.icon
          const person = hop.id ? byId[hop.id] : null
          const isFocus = highlightId && hop.id === highlightId
          return (
            <li key={i} className="relative flex items-start gap-3 py-1.5">
              <span className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${cfg.ring}`}>
                <Icon size={14} strokeWidth={2} />
              </span>
              <div
                className={`flex-1 rounded-md border px-3 py-2 ${
                  isFocus ? 'border-gold-600/50 bg-gold-500/5' : 'border-transparent'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-ivory">
                      {person ? person.name : 'Top of organisation'}
                    </span>
                    {isFocus && <Tag tone="warn">You</Tag>}
                    <Tag tone={cfg.tone}>{cfg.label}</Tag>
                  </div>
                  {hop.outcome === 'paid' ? (
                    <span className="tnum shrink-0 font-mono text-xs text-sage-400">
                      L{hop.level} · {rate(hop.rate)} · {money(hop.amount)}
                    </span>
                  ) : (
                    <span className="tnum shrink-0 font-mono text-[11px] text-ivory-faint">
                      {hop.level ? `L${hop.level}` : '—'}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-ivory-faint">
                  {hop.outcome === 'paid'
                    ? `Qualified at level ${hop.level}.`
                    : hop.outcome === 'compressed'
                      ? `${hop.reason}. Bypassed — level ${hop.level} was not consumed, so it rolls up to the next qualified upline.`
                      : hop.outcome === 'beyond_depth'
                        ? `${hop.reason}. Level ${hop.level} is consumed but goes unpaid.`
                        : 'Chain ended before the level table did. Remaining levels are unpaid breakage.'}
                </p>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="mt-4 flex items-center gap-2 text-[11px] text-ivory-faint">
        <ArrowUp size={12} />
        Volume climbs from the buyer at the bottom toward the top of the organisation.
      </div>
    </div>
  )
}

export function OrderSummaryLine({ orderId }) {
  const t = RUN.traces[orderId]
  if (!t) return null
  const p = productBySku[t.sku]
  return <span className="text-xs text-ivory-faint">{p?.name}</span>
}
