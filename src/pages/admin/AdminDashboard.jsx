import React from 'react'
import { Card, SectionHeading, Stat, Bar, Note, Table, Row, Cell, Tag } from '../../components/ui'
import { RUN } from '../../lib/engine'
import { distributors, orders } from '../../data/network'
import { RANKS, rankByKey, COMPLIANCE, PERIOD, ACTIVE_PV_REQUIREMENT } from '../../data/plan'
import { money, compactMoney, num, pct } from '../../lib/format'

export default function AdminDashboard() {
  const rankCounts = {}
  for (const d of distributors) {
    const k = RUN.qualification[d.id].paidAsRank
    rankCounts[k] = (rankCounts[k] || 0) + 1
  }

  const retailOrders = orders.filter((o) => o.channel === 'retail' && o.status === 'paid')
  const retailCv = retailOrders.reduce((s, o) => s + o.cv, 0)
  const autoshipCv = orders.filter((o) => o.channel === 'autoship' && o.status === 'paid').reduce((s, o) => s + o.cv, 0)
  const refunds = orders.filter((o) => o.status === 'refunded')
  const refundRate = orders.length ? refunds.length / orders.length : 0

  const maxRank = Math.max(...Object.values(rankCounts))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="Distributors" value={num(distributors.length)} tone="plain" sub={`${num(RUN.activeCount)} active`} />
        <Stat label="Active rate" value={pct(RUN.activeRate)} tone={RUN.activeRate > 0.4 ? 'sage' : 'rose'} sub={`Met ${ACTIVE_PV_REQUIREMENT} PV`} />
        <Stat label="Gross sales" value={compactMoney(RUN.companyGross)} tone="plain" sub={PERIOD.label} />
        <Stat label="Commissionable volume" value={compactMoney(RUN.companyCv)} tone="gold" sub={`${pct(RUN.companyCv / RUN.companyGross)} of gross`} />
        <Stat label="Total payout" value={compactMoney(RUN.totalPayout)} tone="gold" sub={`${pct(RUN.payoutRatio)} of CV`} />
        <Stat label="Refund rate" value={pct(refundRate)} tone={refundRate > 0.08 ? 'rose' : 'sage'} sub={`${num(refunds.length)} orders returned`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <SectionHeading
            eyebrow="Field health"
            title="Paid-as rank distribution"
            note="A healthy plan is a pyramid with a wide, genuinely active base. If the base is mostly unqualified, compression is doing the work that recruiting should be."
          />
          <div className="space-y-2.5">
            {RANKS.map((r) => (
              <div key={r.key} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm text-ivory-dim">{r.name}</span>
                <div className="flex-1"><Bar value={rankCounts[r.key] || 0} max={maxRank} tone={r.key === 'member' ? 'rose' : 'sage'} /></div>
                <span className="tnum w-24 shrink-0 text-right font-mono text-xs text-ivory-dim">
                  {num(rankCounts[r.key] || 0)} · {pct((rankCounts[r.key] || 0) / distributors.length, 0)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Note tone={(rankCounts.member || 0) / distributors.length > 0.5 ? 'warn' : 'neutral'}>
              {pct((rankCounts.member || 0) / distributors.length)} of the field is paid-as Member —
              they hold a position but earned nothing this period. This is normal in direct selling
              and is exactly what income disclosure exists to communicate honestly.
            </Note>
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeading
            eyebrow="Revenue quality"
            title="Where volume originates"
            note="The most important number a regulator looks at. Volume from retail customers is sales to people outside the network; autoship is genuine repeat consumption. Both defend the business. Volume driven only by joining does not."
          />
          <div className="space-y-3">
            {[
              ['Retail customer orders', retailCv, 'sage', 'Sold outside the network'],
              ['Autoship / repeat consumption', autoshipCv, 'gold', 'Ongoing product demand'],
              ['Personal purchases', RUN.companyCv - retailCv - autoshipCv, 'roll', 'Distributor self-consumption'],
            ].map(([label, val, tone, note]) => (
              <div key={label}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-ivory">{label}</span>
                  <span className="tnum shrink-0 font-mono text-xs text-gold-400">{pct(val / RUN.companyCv)}</span>
                </div>
                <div className="mt-1"><Bar value={val} max={RUN.companyCv} tone={tone} height="h-1.5" /></div>
                <p className="mt-1 text-[11px] text-ivory-faint">{note} · {num(val)} CV</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <SectionHeading eyebrow="Sustainability" title="Plan exposure" note="Designed exposure versus what the plan actually paid, and where the difference went." />
        <div className="grid gap-4 sm:grid-cols-4">
          <Stat label="Designed unilevel exposure" value={compactMoney(RUN.maxTheoreticalUnilevel)} tone="dim" hint="If every level paid in full at every order." />
          <Stat label="Actually paid" value={compactMoney(RUN.totals.unilevel)} tone="gold" hint={`${pct(RUN.totals.unilevel / RUN.maxTheoreticalUnilevel)} of design.`} />
          <Stat label="Rolled up by compression" value={compactMoney(RUN.rolledUpCv)} tone="dim" hint="Moved to a qualified upline, not saved." />
          <Stat label="Breakage" value={compactMoney(RUN.breakageCv)} tone="dim" hint="Chain ran out of uplines. Never paid." />
        </div>
      </Card>
    </div>
  )
}
