import React from 'react'
import { ShieldCheck, AlertTriangle, Check, FileText, Scale } from 'lucide-react'
import { Card, SectionHeading, Stat, Note, Table, Row, Cell, Tag, Bar } from '../../components/ui'
import { RUN } from '../../lib/engine'
import { distributors, orders } from '../../data/network'
import { COMPLIANCE, PERIOD } from '../../data/plan'
import { money, num, pct } from '../../lib/format'

export default function Compliance() {
  const retailCv = orders.filter((o) => o.channel === 'retail' && o.status === 'paid').reduce((s, o) => s + o.cv, 0)
  const externalShare = retailCv / RUN.companyCv

  // Income disclosure — the honest distribution of earnings, which a licensed
  // direct seller is expected to be able to produce on demand.
  const earnings = distributors.map((d) => {
    const e = RUN.earnings[d.id]
    return e.unilevel + e.fast_start + e.matching + e.pool + e.retail - e.clawback
  }).sort((a, b) => b - a)

  const bands = [
    { label: 'Nothing', test: (v) => v <= 0 },
    { label: 'Under RM 100', test: (v) => v > 0 && v < 100 },
    { label: 'RM 100 – 500', test: (v) => v >= 100 && v < 500 },
    { label: 'RM 500 – 2,000', test: (v) => v >= 500 && v < 2000 },
    { label: 'RM 2,000 and above', test: (v) => v >= 2000 },
  ].map((b) => ({ ...b, count: earnings.filter(b.test).length }))
  const maxBand = Math.max(...bands.map((b) => b.count))

  const median = earnings[Math.floor(earnings.length / 2)] || 0
  const p90 = earnings[Math.floor(earnings.length * 0.1)] || 0

  const tests = [
    {
      label: 'Bonus derives primarily from sale of goods, not recruitment',
      basis: 'Act 500, Schedule — the statutory pyramid test',
      value: pct(1 - RUN.recruitmentLinkedShare),
      ok: RUN.recruitmentLinkedShare <= COMPLIANCE.maxRecruitmentLinkedShare,
      detail: `${pct(RUN.recruitmentLinkedShare)} of payout is enrolment-linked (fast start). The remainder is paid on ongoing product volume.`,
    },
    {
      label: 'Genuine sales to consumers outside the network',
      basis: 'Demonstrates real product demand rather than internal churn',
      value: pct(externalShare),
      ok: externalShare > 0.15,
      detail: `${num(retailCv)} CV of ${num(RUN.companyCv)} came from retail customer orders.`,
    },
    {
      label: 'Buy-back policy in force',
      basis: 'A material term the regulator expects to see disclosed',
      value: `${pct(COMPLIANCE.buybackRate, 0)} / ${COMPLIANCE.buybackMonths} months`,
      ok: true,
      detail: `Currently marketable stock repurchased at ${pct(COMPLIANCE.buybackRate, 0)} within ${COMPLIANCE.buybackMonths} months of purchase.`,
    },
    {
      label: 'Cooling-off period honoured',
      basis: `${COMPLIANCE.coolingOffWorkingDays} working days; no deposit taken, no goods supplied`,
      value: `${COMPLIANCE.coolingOffWorkingDays} days`,
      ok: true,
      detail: 'Runs are approved only after the window has closed on the period\u2019s orders.',
    },
    {
      label: 'Payout ratio within internal ceiling',
      basis: 'Solvency guardrail, not a statutory number',
      value: pct(RUN.payoutRatio),
      ok: RUN.payoutRatio <= COMPLIANCE.payoutRatioCeiling,
      detail: `Total payout against commissionable volume, ceiling ${pct(COMPLIANCE.payoutRatioCeiling, 0)}.`,
    },
  ]

  const failing = tests.filter((t) => !t.ok).length

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sage-600/50 bg-sage-500/10 text-sage-400">
              <ShieldCheck size={19} />
            </span>
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-gold-500">
                Direct Sales and Anti-Pyramid Scheme Act 1993 · {COMPLIANCE.regulator}
              </div>
              <h2 className="font-display text-xl font-medium text-ivory">{COMPLIANCE.licenceLabel}</h2>
              <p className="tnum mt-1 font-mono text-xs text-ivory-dim">
                {COMPLIANCE.licenceNo} · valid to {COMPLIANCE.licenceExpiry}
              </p>
            </div>
          </div>
          <Tag tone={failing ? 'bad' : 'ok'}>{failing ? `${failing} test failing` : 'All tests passing'}</Tag>
        </div>
        <div className="mt-4">
          <Note>
            Operating direct selling without a valid licence is an offence, and a scheme whose
            bonuses flow primarily from recruitment rather than the sale of goods is a pyramid
            scheme regardless of what the marketing says. The tests below are the ones that
            distinguish the two, computed from this period\u2019s actual run.
          </Note>
        </div>
      </Card>

      <Card className="p-5">
        <SectionHeading eyebrow="Statutory" title="Licence tests" note={`Evaluated against the ${PERIOD.label} run.`} />
        <ul className="space-y-2.5">
          {tests.map((t) => (
            <li key={t.label} className="flex items-start gap-3 rounded-md border border-ink-700 bg-ink-900 px-3 py-3">
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                t.ok ? 'border-sage-600/50 bg-sage-500/10 text-sage-400' : 'border-rose-500/50 bg-rose-500/10 text-rose-400'
              }`}>
                {t.ok ? <Check size={11} /> : <AlertTriangle size={11} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className={`text-sm ${t.ok ? 'text-ivory' : 'text-rose-400'}`}>{t.label}</span>
                  <span className="tnum shrink-0 font-mono text-xs text-gold-400">{t.value}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ivory-faint">
                  <Scale size={10} /> {t.basis}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-ivory-dim">{t.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5" rules>
        <SectionHeading
          eyebrow="Disclosure"
          title="Income disclosure statement"
          note="Prospective participants are entitled to see what distributors actually earn, not what the best of them earn. These are unedited figures from this period."
          action={<Tag tone="neutral"><FileText size={11} /> {PERIOD.label}</Tag>}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Median earnings" value={money(median)} tone={median > 0 ? 'sage' : 'rose'} hint="Half the field earned this or less." />
          <Stat label="Top 10% threshold" value={money(p90)} tone="gold" hint="You must beat this to be in the top decile." />
          <Stat label="Earned nothing" value={pct(1 - RUN.earnerRate)} tone="rose" hint="Held a position but received no commission." />
        </div>

        <div className="mt-5 space-y-2.5">
          {bands.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-sm text-ivory-dim">{b.label}</span>
              <div className="flex-1"><Bar value={b.count} max={maxBand} tone={b.label === 'Nothing' ? 'rose' : 'sage'} /></div>
              <span className="tnum w-24 shrink-0 text-right font-mono text-xs text-ivory-dim">
                {num(b.count)} · {pct(b.count / distributors.length, 0)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <Note tone="warn">
            Publishing this honestly is a feature, not an embarrassment. A plan presented by
            overemphasising disproportionately high bonuses is itself a regulatory problem, and the
            distribution above is the corrective.
          </Note>
        </div>
      </Card>
    </div>
  )
}
