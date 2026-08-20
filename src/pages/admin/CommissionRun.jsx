import React, { useState } from 'react'
import { Play, Check, Lock, AlertTriangle, ShieldAlert, RotateCcw } from 'lucide-react'
import { Card, SectionHeading, Stat, Table, Row, Cell, Tag, Note, Button, Bar } from '../../components/ui'
import { RUN } from '../../lib/engine'
import { distributors, byId } from '../../data/network'
import { PERIOD, INCOME_STREAMS, COMPLIANCE, PLAN_VERSION, LEVEL_RATES } from '../../data/plan'
import { money, compactMoney, num, pct } from '../../lib/format'

// ---------------------------------------------------------------------------
// THE COMMISSION RUN
// ---------------------------------------------------------------------------
// Releasing money to the field is the single most sensitive action in a direct
// selling platform. It must be an explicit, permissioned approval with a
// preview stage — never an automatic transfer — so a bad run gets caught
// BEFORE the money leaves rather than after.
// ---------------------------------------------------------------------------

const STAGES = [
  { key: 'open',      label: 'Period open',   note: 'Orders still landing. Volume accrues live.' },
  { key: 'closed',    label: 'Closed',        note: 'Cut-off passed. No further volume counts.' },
  { key: 'calculated',label: 'Calculated',    note: 'Engine has run. Figures are provisional.' },
  { key: 'approved',  label: 'Approved',      note: 'Signed off by finance. Locked for payment.' },
  { key: 'released',  label: 'Released',      note: 'Funds posted to distributor wallets.' },
]

export default function CommissionRun() {
  const [stage, setStage] = useState('calculated')
  const stageIdx = STAGES.findIndex((s) => s.key === stage)

  const top = [...distributors]
    .map((d) => ({ d, e: RUN.earnings[d.id] }))
    .map(({ d, e }) => ({ d, total: e.unilevel + e.fast_start + e.matching + e.pool - e.clawback }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // Pre-release checks. Any of these firing is a reason to hold the run.
  const ratioBreach = RUN.payoutRatio > COMPLIANCE.payoutRatioCeiling
  const recruitBreach = RUN.recruitmentLinkedShare > COMPLIANCE.maxRecruitmentLinkedShare
  const concentration = top[0] ? top[0].total / (RUN.totalPayout || 1) : 0
  const concentrationBreach = concentration > 0.1
  const unverified = distributors.filter((d) => d.kyc !== 'verified' && RUN.earnings[d.id].unilevel > 0).length

  const checks = [
    { label: 'Payout ratio within ceiling', detail: `${pct(RUN.payoutRatio)} of CV against ${pct(COMPLIANCE.payoutRatioCeiling, 0)} ceiling`, ok: !ratioBreach },
    { label: 'Bonus derives primarily from product sales', detail: `${pct(RUN.recruitmentLinkedShare)} of payout is recruitment-linked`, ok: !recruitBreach },
    { label: 'No single earner dominates the run', detail: `Top earner takes ${pct(concentration)} of total payout`, ok: !concentrationBreach },
    { label: 'Earners hold verified identity', detail: `${num(unverified)} earner(s) with incomplete KYC — payout held, accrual continues`, ok: unverified === 0 },
  ]
  const blocking = checks.filter((c) => !c.ok).length

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <SectionHeading
          eyebrow={`Plan version ${PLAN_VERSION}`}
          title={`${PERIOD.label} commission run`}
          note="Every run is stamped with the plan version that produced it, so any historical statement can be recomputed and defended years later."
          action={<Tag tone={stage === 'released' ? 'ok' : 'warn'}>{STAGES[stageIdx].label}</Tag>}
        />

        <ol className="mb-5 flex flex-wrap gap-1">
          {STAGES.map((s, i) => (
            <li key={s.key} className="flex-1 min-w-[120px]">
              <div className={`h-1 rounded-full ${i <= stageIdx ? 'bg-gold-500' : 'bg-ink-700'}`} />
              <div className={`mt-2 text-xs ${i <= stageIdx ? 'text-ivory' : 'text-ivory-faint'}`}>{s.label}</div>
              <div className="mt-0.5 text-[10px] leading-snug text-ivory-faint">{s.note}</div>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap items-center gap-3 border-t border-ink-700 pt-4">
          {stage === 'calculated' && (
            <>
              <Button icon={Check} onClick={() => setStage('approved')} disabled={blocking > 0}>
                Approve run
              </Button>
              <Button variant="ghost" icon={RotateCcw} onClick={() => setStage('closed')}>Recalculate</Button>
              {blocking > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-rose-400">
                  <ShieldAlert size={13} />
                  {blocking} pre-release check{blocking === 1 ? '' : 's'} failing — approval blocked
                </span>
              )}
            </>
          )}
          {stage === 'approved' && (
            <>
              <Button icon={Play} onClick={() => setStage('released')}>Release {money(RUN.totalPayout)} to wallets</Button>
              <Button variant="ghost" onClick={() => setStage('calculated')}>Revoke approval</Button>
            </>
          )}
          {stage === 'released' && (
            <span className="flex items-center gap-2 text-sm text-sage-400">
              <Lock size={14} /> Run released and locked. Adjustments require a manual correction entry.
            </span>
          )}
          {stage === 'closed' && <Button icon={Play} onClick={() => setStage('calculated')}>Calculate</Button>}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Commissionable volume" value={compactMoney(RUN.companyCv)} tone="plain" sub="Total CV in period" />
        <Stat label="Total payout" value={compactMoney(RUN.totalPayout)} tone="gold" sub="Net of clawbacks" />
        <Stat label="Payout ratio" value={pct(RUN.payoutRatio)} tone={ratioBreach ? 'rose' : 'sage'} sub={`Ceiling ${pct(COMPLIANCE.payoutRatioCeiling, 0)}`} />
        <Stat label="Paid distributors" value={num(RUN.earnerCount)} tone="dim" sub={`${pct(RUN.earnerRate)} of the field`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <SectionHeading eyebrow="Pre-release" title="Checks" note="These run before approval is permitted. A failing check holds the money." />
          <ul className="space-y-2.5">
            {checks.map((c) => (
              <li key={c.label} className="flex items-start gap-3 rounded-md border border-ink-700 bg-ink-900 px-3 py-2.5">
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  c.ok ? 'border-sage-600/50 bg-sage-500/10 text-sage-400' : 'border-rose-500/50 bg-rose-500/10 text-rose-400'
                }`}>
                  {c.ok ? <Check size={11} /> : <AlertTriangle size={11} />}
                </span>
                <div>
                  <div className={`text-sm ${c.ok ? 'text-ivory' : 'text-rose-400'}`}>{c.label}</div>
                  <div className="text-[11px] text-ivory-faint">{c.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <SectionHeading eyebrow="Reconciliation" title="Where the exposure went" note="Designed unilevel exposure against what was actually paid. The gap is not profit taken — it is volume the plan never reached." />
          {(() => {
            const max = RUN.maxTheoreticalUnilevel
            const rows = [
              ['Paid to distributors', RUN.totals.unilevel, 'gold'],
              ['Rolled up by compression', RUN.rolledUpCv, 'roll'],
              ['Unpaid — rank depth not unlocked', RUN.depthLostCv, 'lost'],
              ['Unpaid — chain ended (breakage)', RUN.breakageCv, 'lost'],
            ]
            return (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-ivory-faint">Designed exposure at {pct(LEVEL_RATES.reduce((s, l) => s + l.rate, 0), 0)} of CV</span>
                  <span className="tnum font-mono text-ivory">{money(max)}</span>
                </div>
                {rows.map(([label, val, tone]) => (
                  <div key={label}>
                    <div className="flex items-baseline justify-between gap-3 text-xs">
                      <span className="text-ivory-dim">{label}</span>
                      <span className="tnum shrink-0 font-mono text-ivory-faint">{money(val)} · {pct(val / max)}</span>
                    </div>
                    <div className="mt-1"><Bar value={val} max={max} tone={tone} height="h-1.5" /></div>
                  </div>
                ))}
                <Note tone="warn">
                  Compression moves money, it does not save it — that volume was paid, just to
                  someone higher up. Breakage is the real saving, and a large breakage number means
                  a shallow organisation rather than a healthy one.
                </Note>
              </div>
            )
          })()}
        </Card>
      </div>

      <Card className="p-5">
        <SectionHeading eyebrow="Composition" title="Payout by income stream" />
        <Table minWidth={560} columns={[
          { label: 'Stream' }, { label: 'What it rewards' },
          { label: 'Amount', align: 'right' }, { label: 'Share', align: 'right' },
        ]}>
          {Object.entries(RUN.totals)
            .filter(([k]) => k !== 'retail' && k !== 'clawback')
            .sort((a, b) => b[1] - a[1])
            .map(([k, val]) => (
              <Row key={k}>
                <Cell>{INCOME_STREAMS[k].label}</Cell>
                <Cell tone="faint" className="max-w-md text-[11px]">{INCOME_STREAMS[k].note}</Cell>
                <Cell align="right" mono tone="gold">{money(val)}</Cell>
                <Cell align="right" mono tone="dim">{pct(val / (RUN.totalPayout || 1))}</Cell>
              </Row>
            ))}
          <Row>
            <Cell tone="rose">Clawbacks</Cell>
            <Cell tone="faint" className="text-[11px]">Advances reversed on refunded orders.</Cell>
            <Cell align="right" mono tone="rose">−{money(RUN.totals.clawback)}</Cell>
            <Cell align="right" mono tone="dim">—</Cell>
          </Row>
        </Table>
      </Card>

      <Card className="p-5" rules>
        <SectionHeading eyebrow="Exposure" title="Largest earners this run" note="Watch for concentration. A run where one person takes a large share of total payout is a plan-design warning, not a success story." />
        <Table minWidth={520} columns={[
          { label: 'Distributor' }, { label: 'Paid-as' }, { label: 'GV', align: 'right' },
          { label: 'Earned', align: 'right' }, { label: 'Share of run', align: 'right' },
        ]}>
          {top.map(({ d, total }) => (
            <Row key={d.id}>
              <Cell>
                <div>{d.name}</div>
                <div className="tnum font-mono text-[10px] text-ivory-faint">{d.id}</div>
              </Cell>
              <Cell tone="dim" className="text-xs capitalize">{RUN.qualification[d.id].paidAsRank}</Cell>
              <Cell align="right" mono tone="dim">{num(RUN.volume[d.id].gv)}</Cell>
              <Cell align="right" mono tone="gold">{money(total)}</Cell>
              <Cell align="right" mono tone={total / RUN.totalPayout > 0.1 ? 'rose' : 'dim'}>
                {pct(total / (RUN.totalPayout || 1))}
              </Cell>
            </Row>
          ))}
        </Table>
      </Card>
    </div>
  )
}
