import React, { useState } from 'react'
import { Save, AlertTriangle, Info } from 'lucide-react'
import { Card, SectionHeading, Table, Row, Cell, Note, Button, Tag, Bar } from '../../components/ui'
import { LEVEL_RATES, RANKS, ACTIVE_PV_REQUIREMENT, COMPLIANCE, PLAN_VERSION, POOL_RATE, FAST_START_RATE } from '../../data/plan'
import { RUN } from '../../lib/engine'
import { money, num, pct, rate } from '../../lib/format'

export default function PlanConfig() {
  const [levels, setLevels] = useState(LEVEL_RATES.map((l) => ({ ...l, pct: l.rate * 100 })))
  const [pv, setPv] = useState(ACTIVE_PV_REQUIREMENT)
  const [dirty, setDirty] = useState(false)

  const totalPct = levels.reduce((s, l) => s + Number(l.pct || 0), 0)
  const allStreams = totalPct / 100 + POOL_RATE + 0.05 // + pool + est. matching
  const overCeiling = allStreams > COMPLIANCE.payoutRatioCeiling

  // What-if: scale the actual run's paid unilevel by the change in total rate.
  const baseline = LEVEL_RATES.reduce((s, l) => s + l.rate, 0) * 100
  const projected = baseline ? RUN.totals.unilevel * (totalPct / baseline) : 0
  const delta = projected - RUN.totals.unilevel

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <SectionHeading
          eyebrow={`Version ${PLAN_VERSION}`}
          title="Compensation plan"
          note="Changing these numbers changes what every distributor earns. In production a plan edit creates a new immutable version, is scheduled to a future period boundary, and never retroactively alters a run that has already been released."
          action={<Tag tone={overCeiling ? 'bad' : 'ok'}>{pct(allStreams)} designed exposure</Tag>}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 text-[11px] uppercase tracking-[0.12em] text-ivory-faint">Unilevel level rates</div>
            <Table minWidth={320} columns={[{ label: 'Level' }, { label: 'Rate on CV' }, { label: 'Projected', align: 'right' }]}>
              {levels.map((l, i) => (
                <Row key={l.level}>
                  <Cell mono>L{l.level}</Cell>
                  <Cell>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number" min={0} max={30} step={0.5} value={l.pct}
                        onChange={(e) => {
                          const v = [...levels]; v[i] = { ...v[i], pct: Number(e.target.value) }
                          setLevels(v); setDirty(true)
                        }}
                        className="tnum w-16 rounded-md border border-ink-600 bg-ink-900 px-2 py-1.5 font-mono text-xs text-gold-400 focus:outline-none"
                      />
                      <span className="text-xs text-ivory-faint">%</span>
                    </div>
                  </Cell>
                  <Cell align="right" mono tone="dim">
                    {money(RUN.companyCv * (l.pct / 100))}
                  </Cell>
                </Row>
              ))}
            </Table>
            <div className="mt-3 flex items-center justify-between rounded-md border border-ink-600 bg-ink-900 px-3 py-2 text-sm">
              <span className="text-ivory-dim">Total unilevel exposure</span>
              <span className={`tnum font-mono ${totalPct > 30 ? 'text-rose-400' : 'text-gold-400'}`}>{totalPct.toFixed(1)}%</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="mb-2 text-[11px] uppercase tracking-[0.12em] text-ivory-faint">Qualification</div>
              <label className="mb-1 block text-xs text-ivory-dim">Personal volume required to be active</label>
              <div className="flex items-center gap-2">
                <input type="number" value={pv} onChange={(e) => { setPv(Number(e.target.value)); setDirty(true) }}
                  className="tnum w-24 rounded-md border border-ink-600 bg-ink-900 px-2 py-2 font-mono text-sm text-ivory focus:outline-none" />
                <span className="text-xs text-ivory-faint">PV per period</span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-ivory-faint">
                This single number is the most powerful lever in the plan. Raise it and more people
                fall out of qualification, compression increases, and payout concentrates upward.
                Lower it and payout broadens but total exposure rises.
              </p>
            </div>

            <div>
              <div className="mb-2 text-[11px] uppercase tracking-[0.12em] text-ivory-faint">Fixed-budget streams</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-ivory-dim">Leadership pool</span><span className="tnum font-mono text-gold-400">{rate(POOL_RATE)} of company CV</span></div>
                <div className="flex justify-between"><span className="text-ivory-dim">Fast start</span><span className="tnum font-mono text-gold-400">{rate(FAST_START_RATE)} of first-order CV</span></div>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-ivory-faint">
                A pool is a fixed percentage split among qualifiers rather than a per-head payment,
                so top-end cost can never run away as the organisation grows.
              </p>
            </div>

            <div className="rounded-md border border-ink-600 bg-ink-900 p-3">
              <div className="text-[11px] uppercase tracking-wide text-ivory-faint">What-if against this period</div>
              <div className="tnum mt-1 font-display text-xl text-gold-400">{money(projected)}</div>
              <div className={`tnum mt-0.5 text-xs ${delta > 0 ? 'text-rose-400' : delta < 0 ? 'text-sage-400' : 'text-ivory-faint'}`}>
                {delta === 0 ? 'No change' : `${delta > 0 ? '+' : ''}${money(delta)} vs the run as calculated`}
              </div>
            </div>
          </div>
        </div>

        {overCeiling && (
          <div className="mt-4">
            <Note tone="bad">
              <span className="flex items-start gap-2">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                Designed exposure of {pct(allStreams)} exceeds the {pct(COMPLIANCE.payoutRatioCeiling, 0)} internal
                ceiling. A plan that pays out more than it can fund from margin is the mechanism by
                which these businesses fail — this is a hard stop, not a warning.
              </span>
            </Note>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <Button icon={Save} disabled={!dirty || overCeiling}>Save as new version</Button>
          {dirty && <span className="text-xs text-ivory-faint">Would create version {PLAN_VERSION.split('.')[0]}.{String(Number(PLAN_VERSION.split('.')[1]) + 1).padStart(2, '0')}, effective next period. UI only.</span>}
        </div>
      </Card>

      <Card className="p-5">
        <SectionHeading eyebrow="Ladder" title="Rank thresholds and unlocked depth" note="Depth is the lever that controls cost at the top of the plan. Granting deep levels cheaply is how a plan becomes unfundable." />
        <Table minWidth={640} columns={[
          { label: 'Rank' }, { label: 'PV', align: 'right' }, { label: 'GV', align: 'right' },
          { label: 'Active legs', align: 'right' }, { label: 'Levels', align: 'right' },
          { label: 'Matching', align: 'right' }, { label: 'Pool' }, { label: 'Qualifiers', align: 'right' },
        ]}>
          {RANKS.filter((r) => r.key !== 'member').map((r) => {
            const count = Object.values(RUN.qualification).filter((q) => q.paidAsRank === r.key).length
            return (
              <Row key={r.key}>
                <Cell>{r.name}</Cell>
                <Cell align="right" mono tone="dim">{r.pv}</Cell>
                <Cell align="right" mono tone="dim">{num(r.gv)}</Cell>
                <Cell align="right" mono tone="dim">{r.legs}</Cell>
                <Cell align="right" mono tone="gold">{r.depth}</Cell>
                <Cell align="right" mono tone={r.matching ? 'gold' : 'faint'}>{r.matching ? rate(r.matching) : '—'}</Cell>
                <Cell>{r.pool ? <Tag tone="ok">Yes</Tag> : <span className="text-xs text-ivory-faint">—</span>}</Cell>
                <Cell align="right" mono tone="dim">{num(count)}</Cell>
              </Row>
            )
          })}
        </Table>
        <div className="mt-3 flex items-start gap-2 text-[11px] text-ivory-faint">
          <Info size={12} className="mt-0.5 shrink-0" />
          Qualifier counts are recomputed live from this period's run, so you can see immediately
          whether a threshold is reachable or has been set somewhere nobody can get to.
        </div>
      </Card>
    </div>
  )
}
