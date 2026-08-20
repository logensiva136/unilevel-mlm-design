import React, { useState } from 'react'
import { ArrowDownToLine, ShieldCheck, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { Card, SectionHeading, Stat, Note, Button, Table, Row, Cell, Tag } from '../../components/ui'
import { CURRENT_MEMBER_ID, byId } from '../../data/network'
import { RUN, totalEarnings } from '../../lib/engine'
import { money } from '../../lib/format'
import { PERIOD, CURRENCY } from '../../data/plan'

export default function Wallet() {
  const id = CURRENT_MEMBER_ID
  const me = byId[id]
  const e = RUN.earnings[id]
  const earned = totalEarnings(id)
  const [amount, setAmount] = useState('')

  // Earned is not the same as available. A commission run has to be approved
  // and released before it becomes withdrawable, and KYC gates the payout.
  const released = 4180.0
  const pending = earned
  const kycOk = me.kyc === 'verified'

  const ledger = [
    { date: '2026-08-10', desc: 'Payout released — July 2026 run', type: 'credit', amount: 4180.0 },
    { date: '2026-08-04', desc: 'Withdrawal to Maybank ••4821', type: 'debit', amount: 3000.0 },
    { date: '2026-07-10', desc: 'Payout released — June 2026 run', type: 'credit', amount: 3620.5 },
    { date: '2026-07-06', desc: 'Clawback — SO-500412 refunded in cooling-off', type: 'debit', amount: 42.0 },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4">
        <Card className="p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ivory-faint">Available to withdraw</div>
          <div className="tnum mt-2 font-display text-4xl font-medium text-gold-400">{money(released)}</div>
          <div className="mt-3 flex items-center justify-between border-t border-ink-700 pt-3 text-xs">
            <span className="text-ivory-faint">Accrued, {PERIOD.label}</span>
            <span className="tnum font-mono text-ivory-dim">{money(pending)}</span>
          </div>
          <p className="mt-1 text-[11px] text-ivory-faint">
            Accrued earnings become available only after the {PERIOD.label} run is approved and
            released on {PERIOD.paysOn}.
          </p>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck size={15} className={kycOk ? 'text-sage-400' : 'text-rose-400'} />
            <span className="text-sm text-ivory">Identity verification</span>
            <Tag tone={kycOk ? 'ok' : 'bad'}>{me.kyc}</Tag>
          </div>
          <p className="text-[11px] leading-relaxed text-ivory-faint">
            Payouts cannot be released without verified identity. Commission continues to accrue
            while verification is outstanding — it is the withdrawal that is blocked, not the earning.
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <SectionHeading eyebrow="Withdraw" title="Request a payout" />
        <label className="mb-1 block text-[11px] uppercase tracking-wide text-ivory-faint">Amount ({CURRENCY})</label>
        <input
          value={amount}
          onChange={(ev) => setAmount(ev.target.value)}
          placeholder="0.00"
          className="tnum w-full rounded-md border border-ink-600 bg-ink-900 px-3 py-2.5 font-mono text-ivory placeholder:text-ivory-faint focus:outline-none"
        />
        <label className="mb-1 mt-3 block text-[11px] uppercase tracking-wide text-ivory-faint">Destination</label>
        <select className="w-full rounded-md border border-ink-600 bg-ink-900 px-3 py-2.5 text-sm text-ivory-dim focus:outline-none">
          <option>Maybank ••4821</option>
          <option>DuitNow ID ••4821</option>
        </select>
        <div className="mt-4">
          <Button icon={ArrowDownToLine} disabled={!kycOk}>Request withdrawal</Button>
        </div>
        <p className="mt-2 text-[11px] text-ivory-faint">
          Requests enter the payout queue and are released by the finance desk. UI only — nothing is submitted.
        </p>
      </Card>

      <Card className="p-5" rules>
        <SectionHeading eyebrow="Ledger" title="Wallet history" />
        <Table minWidth={320} columns={[{ label: 'Entry' }, { label: 'Amount', align: 'right' }]}>
          {ledger.map((t, i) => (
            <Row key={i}>
              <Cell>
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                    t.type === 'credit' ? 'border-sage-600/40 bg-sage-500/10 text-sage-400' : 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                  }`}>
                    {t.type === 'credit' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-xs text-ivory">{t.desc}</div>
                    <div className="tnum font-mono text-[10px] text-ivory-faint">{t.date}</div>
                  </div>
                </div>
              </Cell>
              <Cell align="right" mono tone={t.type === 'credit' ? 'sage' : 'rose'}>
                {t.type === 'credit' ? '+' : '−'}{money(t.amount)}
              </Cell>
            </Row>
          ))}
        </Table>
      </Card>
    </div>
  )
}
