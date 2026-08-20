import React from 'react'
import { Check, Lock, Info } from 'lucide-react'
import { Card, SectionHeading, Table, Row, Cell, Tag, Note, Bar } from '../../components/ui'
import { CURRENT_MEMBER_ID, byId } from '../../data/network'
import { RUN } from '../../lib/engine'
import { RANKS, rankIndex, rankByKey } from '../../data/plan'
import { num, rate } from '../../lib/format'

export default function Rank() {
  const id = CURRENT_MEMBER_ID
  const me = byId[id]
  const v = RUN.volume[id]
  const q = RUN.qualification[id]
  const paidIdx = rankIndex[q.paidAsRank]
  const recogIdx = rankIndex[me.recognisedRank]

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <SectionHeading
          eyebrow="Two ranks, not one"
          title="Recognised title vs paid-as rank"
          note="You keep a title once you've earned it — that's recognition. What you are paid on is re-qualified from scratch every period. Confusing the two is the most common source of commission disputes in the field."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-ink-600 bg-ink-900 p-4">
            <div className="text-[10px] uppercase tracking-wide text-ivory-faint">Recognised</div>
            <div className="mt-1 font-display text-2xl text-ivory">{rankByKey[me.recognisedRank].name}</div>
            <p className="mt-1 text-[11px] text-ivory-faint">Highest rank ever achieved. Held for life.</p>
          </div>
          <div className={`rounded-md border p-4 ${paidIdx < recogIdx ? 'border-gold-600/50 bg-gold-500/5' : 'border-ink-600 bg-ink-900'}`}>
            <div className="text-[10px] uppercase tracking-wide text-ivory-faint">Paid as, this period</div>
            <div className="mt-1 font-display text-2xl text-gold-400">{rankByKey[q.paidAsRank].name}</div>
            <p className="mt-1 text-[11px] text-ivory-faint">
              Determines your commission and unlocks {rankByKey[q.paidAsRank].depth} levels of depth.
            </p>
          </div>
        </div>
        {paidIdx < recogIdx && (
          <div className="mt-4">
            <Note tone="warn">
              You are being paid one or more ranks below your title this period because a
              qualification is unmet. Meet it before the period closes and pay reverts automatically.
            </Note>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <SectionHeading
          eyebrow="Ladder"
          title="Rank requirements"
          note="Every requirement must be met in the same period — they are not cumulative across months. Requiring active legs alongside volume is deliberate: it stops one large downline from carrying a rank on its own."
        />
        <Table minWidth={640} columns={[
          { label: '' }, { label: 'Rank' }, { label: 'PV', align: 'right' }, { label: 'GV', align: 'right' },
          { label: 'Active legs', align: 'right' }, { label: 'Levels paid', align: 'right' }, { label: 'Matching', align: 'right' },
        ]}>
          {RANKS.filter((r) => r.key !== 'member').map((r) => {
            const i = rankIndex[r.key]
            const achieved = i <= paidIdx
            const isCurrent = i === paidIdx
            return (
              <Row key={r.key}>
                <Cell>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                    achieved ? 'border-gold-500 bg-gold-500/15 text-gold-400' : 'border-ink-500 bg-ink-800 text-ivory-faint'
                  }`}>
                    {achieved ? <Check size={11} /> : <Lock size={10} />}
                  </span>
                </Cell>
                <Cell>
                  <span className="flex items-center gap-2">
                    <span className={achieved ? 'text-ivory' : 'text-ivory-dim'}>{r.name}</span>
                    {isCurrent && <Tag tone="warn">Paid as</Tag>}
                    {r.pool && <Tag tone="ok">Pool</Tag>}
                  </span>
                </Cell>
                <Cell align="right" mono tone={v.pv >= r.pv ? 'sage' : 'faint'}>{r.pv}</Cell>
                <Cell align="right" mono tone={v.gv >= r.gv ? 'sage' : 'faint'}>{num(r.gv)}</Cell>
                <Cell align="right" mono tone={q.activeLegs >= r.legs ? 'sage' : 'faint'}>{r.legs}</Cell>
                <Cell align="right" mono tone="gold">{r.depth}</Cell>
                <Cell align="right" mono tone={r.matching ? 'gold' : 'faint'}>{r.matching ? rate(r.matching) : '—'}</Cell>
              </Row>
            )
          })}
        </Table>
      </Card>

      <Card className="p-5">
        <SectionHeading eyebrow="Depth" title="What each rank actually unlocks" note="Depth is the real prize in a unilevel plan. Volume seven levels down is worthless to you if your rank only pays four." />
        <div className="space-y-2.5">
          {RANKS.filter((r) => r.depth > 0).map((r) => (
            <div key={r.key} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm text-ivory-dim">{r.name}</span>
              <div className="flex flex-1 gap-1">
                {Array.from({ length: 7 }, (_, i) => (
                  <span
                    key={i}
                    className={`h-5 flex-1 rounded-sm ${
                      i < r.depth
                        ? rankIndex[r.key] === paidIdx ? 'bg-gold-400' : 'bg-gold-600/50'
                        : 'bg-ink-700'
                    }`}
                    title={`Level ${i + 1}`}
                  />
                ))}
              </div>
              <span className="tnum w-8 shrink-0 text-right font-mono text-xs text-ivory-faint">{r.depth}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2 text-[11px] text-ivory-faint">
          <Info size={12} className="mt-0.5 shrink-0" />
          Compression can still carry deep volume up to you at a shallow level — but only if the
          people between you and it are unqualified. It is not a substitute for rank.
        </div>
      </Card>
    </div>
  )
}
