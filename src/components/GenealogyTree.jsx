import React, { useState } from 'react'
import { ChevronRight, ChevronDown, User } from 'lucide-react'
import { byId, childrenOf } from '../data/network'
import { RUN } from '../lib/engine'
import { rankByKey, ACTIVE_PV_REQUIREMENT } from '../data/plan'
import { money, num } from '../lib/format'
import { Tag } from './ui'

// A real back-office genealogy is a lazily-expanded tree, not a graphic. At a
// few thousand nodes any "pretty" whole-org visualisation stops being usable,
// and what operators actually need is: who is under this person, are they
// qualified, and what volume are they carrying.

function Node({ id, level, onSelect, selectedId, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  const d = byId[id]
  const v = RUN.volume[id]
  const q = RUN.qualification[id]
  const kids = childrenOf[id] ?? []
  const rank = rankByKey[q.paidAsRank]

  return (
    <li>
      <div
        className={`group flex items-center gap-2 rounded-md py-1.5 pr-2 ${
          selectedId === id ? 'bg-gold-500/10' : 'hover:bg-ink-700/40'
        }`}
        style={{ paddingLeft: `${level * 16}px` }}
      >
        <button
          onClick={() => setOpen((o) => !o)}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-ivory-faint ${
            kids.length ? 'hover:bg-ink-600 hover:text-ivory' : 'invisible'
          }`}
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>

        <button onClick={() => onSelect(id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              q.active ? 'bg-sage-400' : 'bg-ink-500'
            }`}
            title={q.active ? 'Active this period' : `Below ${ACTIVE_PV_REQUIREMENT} PV — will be compressed`}
          />
          <span className={`truncate text-sm ${q.active ? 'text-ivory' : 'text-ivory-faint'}`}>
            {d.name}
          </span>
          {kids.length > 0 && (
            <span className="shrink-0 text-[10px] text-ivory-faint">({num(kids.length)})</span>
          )}
        </button>

        <span className="tnum hidden shrink-0 font-mono text-[11px] text-ivory-faint sm:block">
          {rank.name}
        </span>
        <span className="tnum w-16 shrink-0 text-right font-mono text-[11px] text-ivory-dim">
          {v.pv} PV
        </span>
        <span className="tnum hidden w-20 shrink-0 text-right font-mono text-[11px] text-gold-400 md:block">
          {num(v.gv)} GV
        </span>
      </div>

      {open && kids.length > 0 && (
        <ul>
          {kids.map((c) => (
            <Node key={c} id={c} level={level + 1} onSelect={onSelect} selectedId={selectedId} />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function GenealogyTree({ rootId, onSelect, selectedId }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 border-b border-ink-600 pb-2 pr-2 text-[10px] uppercase tracking-wide text-ivory-faint">
        <span className="flex-1 pl-7">Distributor</span>
        <span className="hidden sm:block">Paid-as</span>
        <span className="w-16 text-right">PV</span>
        <span className="hidden w-20 text-right md:block">GV</span>
      </div>
      <ul className="max-h-[520px] overflow-y-auto">
        <Node id={rootId} level={0} onSelect={onSelect} selectedId={selectedId} defaultOpen />
      </ul>
    </div>
  )
}

export function NodeDetail({ id }) {
  const d = byId[id]
  const v = RUN.volume[id]
  const q = RUN.qualification[id]
  const e = RUN.earnings[id]
  if (!d) return null
  const rank = rankByKey[q.paidAsRank]
  const recognised = rankByKey[d.recognisedRank]
  const total = e.unilevel + e.fast_start + e.matching + e.pool + e.retail - e.clawback

  return (
    <div className="rounded-lg border border-ink-600 bg-ink-900 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-600/40 bg-gold-500/10 text-gold-400">
          <User size={16} />
        </span>
        <div className="min-w-0">
          <div className="truncate font-display text-base text-ivory">{d.name}</div>
          <div className="tnum font-mono text-[11px] text-ivory-faint">{d.id} · joined {d.joinedAt}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Tag tone={q.active ? 'ok' : 'roll'}>
          {q.active ? 'Active' : 'Not qualified — compresses'}
        </Tag>
        <Tag tone="neutral">Paid-as {rank.name}</Tag>
        {recognised && rankByKey[d.recognisedRank] !== rank && (
          <Tag tone="warn" title="Title is held for life; pay is re-qualified every period">
            Recognised {recognised.name}
          </Tag>
        )}
        <Tag tone={d.kyc === 'verified' ? 'ok' : d.kyc === 'pending' ? 'warn' : 'bad'}>
          KYC {d.kyc}
        </Tag>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-ink-700 pt-4 text-center">
        {[
          ['PV', v.pv],
          ['GV', num(v.gv)],
          ['Active legs', q.activeLegs],
        ].map(([k, val]) => (
          <div key={k}>
            <dd className="tnum font-mono text-base text-ivory">{val}</dd>
            <dt className="text-[10px] uppercase tracking-wide text-ivory-faint">{k}</dt>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-ink-700 pt-3">
        <span className="text-xs text-ivory-faint">Earned this period</span>
        <span className="tnum font-mono text-sm text-gold-400">{money(total)}</span>
      </div>
      <div className="mt-1 text-[11px] text-ivory-faint">
        Pays {rank.depth} level{rank.depth === 1 ? '' : 's'} deep at paid-as rank.
      </div>
    </div>
  )
}
