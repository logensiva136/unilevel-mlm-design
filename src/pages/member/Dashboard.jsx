import React from 'react'
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { Card, SectionHeading, Stat, Tag, Bar, Note, Table, Row, Cell } from '../../components/ui'
import { RUN, levelBreakdown } from '../../lib/engine'
import { CURRENT_MEMBER_ID, byId } from '../../data/network'
import { rankByKey, RANKS, rankIndex, ACTIVE_PV_REQUIREMENT, PERIOD, INCOME_STREAMS } from '../../data/plan'
import { money, num, pct, rate } from '../../lib/format'

export default function Dashboard() {
  const id = CURRENT_MEMBER_ID
  const me = byId[id]
  const v = RUN.volume[id]
  const q = RUN.qualification[id]
  const e = RUN.earnings[id]
  const paidAs = rankByKey[q.paidAsRank]
  const recognised = rankByKey[me.recognisedRank]
  const next = RANKS[rankIndex[q.paidAsRank] + 1]
  const rows = levelBreakdown(id)
  const total = e.unilevel + e.fast_start + e.matching + e.pool + e.retail - e.clawback

  // The gap between the title you hold and the title you're being paid at is
  // the number that actually determines this month's cheque.
  const demoted = rankIndex[me.recognisedRank] > rankIndex[q.paidAsRank]

  return (
    <div className="space-y-6">
      {/* Qualification is the first thing a distributor needs to see, because
          everything else is downstream of it. */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-gold-500">
              {PERIOD.label} · closes {PERIOD.closes}
            </div>
            <h2 className="font-display text-2xl font-medium text-ivory">
              {q.active ? 'Qualified this period' : 'Not qualified this period'}
            </h2>
            <p className="mt-1 text-sm text-ivory-dim">
              Paying <span className="text-gold-400">{paidAs.depth} levels</span> deep as{' '}
              <span className="text-gold-400">{paidAs.name}</span>.
              {demoted && (
                <>
                  {' '}You hold the {recognised.name} title, but pay is re-qualified every period.
                </>
              )}
            </p>
          </div>
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-full border ${
              q.active ? 'border-sage-600/50 bg-sage-500/10 text-sage-400' : 'border-rose-500/50 bg-rose-500/10 text-rose-400'
            }`}
          >
            {q.active ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <div className="mb-1.5 flex items-baseline justify-between text-xs">
              <span className="text-ivory-faint">Personal volume</span>
              <span className="tnum font-mono text-ivory">{v.pv} / {ACTIVE_PV_REQUIREMENT} PV</span>
            </div>
            <Bar value={v.pv} max={ACTIVE_PV_REQUIREMENT} tone={v.pv >= ACTIVE_PV_REQUIREMENT ? 'sage' : 'rose'} />
          </div>
          {next && (
            <>
              <div>
                <div className="mb-1.5 flex items-baseline justify-between text-xs">
                  <span className="text-ivory-faint">Group volume → {next.name}</span>
                  <span className="tnum font-mono text-ivory">{num(v.gv)} / {num(next.gv)}</span>
                </div>
                <Bar value={v.gv} max={next.gv} tone="gold" />
              </div>
              <div>
                <div className="mb-1.5 flex items-baseline justify-between text-xs">
                  <span className="text-ivory-faint">Active legs → {next.name}</span>
                  <span className="tnum font-mono text-ivory">{q.activeLegs} / {next.legs}</span>
                </div>
                <Bar value={q.activeLegs} max={next.legs} tone="gold" />
              </div>
            </>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Earned this period" value={money(total)} tone="gold" sub={`Pays ${PERIOD.paysOn}`} />
        <Stat label="Group volume" value={num(v.gv)} tone="plain" sub="PV across your whole downline" />
        <Stat label="Active legs" value={q.activeLegs} tone="sage" sub="Frontline lines that qualified" />
        <Stat label="Personal volume" value={`${v.pv} PV`} tone={q.active ? 'sage' : 'rose'} sub={`${v.orderCount} order${v.orderCount === 1 ? '' : 's'}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-2">
          <SectionHeading
            eyebrow="Statement"
            title="Where the money came from"
            note="A unilevel plan is never one commission. Each stream rewards a different behaviour."
          />
          <div className="space-y-3">
            {[
              ['unilevel', e.unilevel, 'gold'],
              ['fast_start', e.fast_start, 'sage'],
              ['matching', e.matching, 'sage'],
              ['pool', e.pool, 'gold'],
              ['retail', e.retail, 'sage'],
            ].map(([key, amount, tone]) => (
              <div key={key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-ivory">{INCOME_STREAMS[key].label}</span>
                  <span className="tnum shrink-0 font-mono text-xs text-gold-400">{money(amount)}</span>
                </div>
                <div className="mt-1"><Bar value={amount} max={Math.max(total, 1)} tone={tone} height="h-1.5" /></div>
                <p className="mt-1 text-[11px] leading-relaxed text-ivory-faint">{INCOME_STREAMS[key].note}</p>
              </div>
            ))}
            {e.clawback > 0 && (
              <div className="border-t border-ink-700 pt-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-rose-400">Clawback</span>
                  <span className="tnum font-mono text-xs text-rose-400">−{money(e.clawback)}</span>
                </div>
                <p className="mt-1 text-[11px] text-ivory-faint">
                  Fast start reversed on orders refunded inside the cooling-off window.
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-3">
          <SectionHeading
            eyebrow="Unilevel"
            title="Level by level"
            note="Members counted here are your raw downline. What you were actually paid reflects compression — inactive uplines are bypassed, so volume can pay you at a shallower level than the tree suggests."
            action={<Tag tone="warn">{paidAs.depth} of 7 levels unlocked</Tag>}
          />
          <Table minWidth={480} columns={[
            { label: 'Level' }, { label: 'Rate' }, { label: 'Members' },
            { label: 'Active' }, { label: 'CV', align: 'right' }, { label: 'Paid to you', align: 'right' },
          ]}>
            {rows.map((r) => {
              const locked = r.level > paidAs.depth
              return (
                <Row key={r.level}>
                  <Cell mono tone={locked ? 'faint' : undefined}>L{r.level}</Cell>
                  <Cell mono tone={locked ? 'faint' : 'gold'}>{rate(r.rate)}</Cell>
                  <Cell mono tone="dim">{num(r.members)}</Cell>
                  <Cell mono tone={r.active ? 'sage' : 'faint'}>{num(r.active)}</Cell>
                  <Cell align="right" mono tone="dim">{num(r.cv)}</Cell>
                  <Cell align="right" mono tone={r.earned > 0 ? 'gold' : 'faint'}>
                    {r.earned > 0 ? money(r.earned) : locked ? 'Locked' : '—'}
                  </Cell>
                </Row>
              )
            })}
          </Table>
          {paidAs.depth < 7 && (
            <div className="mt-4">
              <Note tone="warn">
                Levels {paidAs.depth + 1}–7 carry {num(rows.slice(paidAs.depth).reduce((s, r) => s + r.cv, 0))} CV
                that you are not paid on, because your paid-as rank unlocks {paidAs.depth} levels.
                Rank up to reach it.
              </Note>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <SectionHeading eyebrow="Disclosure" title="How your result compares" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Distributors earning anything" value={pct(RUN.earnerRate)} tone="dim" hint="Across the whole company this period." />
          <Stat label="Distributors active" value={pct(RUN.activeRate)} tone="dim" hint={`Met the ${ACTIVE_PV_REQUIREMENT} PV requirement.`} />
          <Stat label="Your share of company CV" value={pct(v.gv ? v.gv / (RUN.companyCv || 1) : 0)} tone="dim" hint="Your group volume against total commissionable volume." />
        </div>
        <div className="mt-4">
          <Note>
            <span className="flex items-start gap-2">
              <Clock size={13} className="mt-0.5 shrink-0" />
              <span>
                Most people in any direct selling organisation earn little or nothing — that is a
                structural fact, not a reflection of this company. Published income disclosure is a
                licence condition, and these are the real figures from this period's run.
              </span>
            </span>
          </Note>
        </div>
      </Card>
    </div>
  )
}
