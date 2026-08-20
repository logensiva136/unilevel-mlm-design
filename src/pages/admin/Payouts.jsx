import React, { useState } from 'react'
import { Check, X, ShieldAlert, Clock } from 'lucide-react'
import { Card, SectionHeading, Stat, Table, Row, Cell, Tag, Button, Note } from '../../components/ui'
import { distributors } from '../../data/network'
import { RUN, totalEarnings } from '../../lib/engine'
import { money, num } from '../../lib/format'

// Withdrawal requests, seeded from real earners so the amounts are plausible.
const seed = distributors
  .map((d) => ({ d, earned: totalEarnings(d.id) }))
  .filter((r) => r.earned > 120)
  .sort((a, b) => b.earned - a.earned)
  .slice(0, 12)
  .map((r, i) => ({
    id: `WD-${88200 + i}`,
    distributorId: r.d.id,
    name: r.d.name,
    kyc: r.d.kyc,
    amount: Math.round(r.earned * (0.4 + ((i * 13) % 50) / 100) * 100) / 100,
    method: ['Maybank ••4821', 'CIMB ••7745', 'DuitNow ID', 'Public Bank ••1180'][i % 4],
    requested: `2026-09-${String(1 + (i % 9)).padStart(2, '0')}`,
    status: 'pending',
  }))

export default function Payouts() {
  const [reqs, setReqs] = useState(seed)
  const decide = (id, status) => setReqs((p) => p.map((r) => (r.id === id ? { ...r, status } : r)))

  const pending = reqs.filter((r) => r.status === 'pending')
  const held = pending.filter((r) => r.kyc !== 'verified')
  const releasable = pending.filter((r) => r.kyc === 'verified')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Pending requests" value={num(pending.length)} tone="warn" />
        <Stat label="Releasable" value={money(releasable.reduce((s, r) => s + r.amount, 0))} tone="sage" sub={`${num(releasable.length)} verified`} />
        <Stat label="Held on KYC" value={money(held.reduce((s, r) => s + r.amount, 0))} tone="rose" sub={`${num(held.length)} unverified`} />
        <Stat label="Approved" value={num(reqs.filter((r) => r.status === 'approved').length)} tone="sage" />
      </div>

      <Card className="p-5">
        <SectionHeading
          eyebrow="Finance"
          title="Withdrawal queue"
          note="Separate from the commission run on purpose: the run decides what someone earned, this decides when the money physically leaves. Keeping the two apart means a payment problem never silently rewrites an earnings record."
        />
        <Note tone="warn">
          <span className="flex items-start gap-2">
            <ShieldAlert size={13} className="mt-0.5 shrink-0" />
            Requests from distributors without verified identity cannot be released. Approve the
            verification first — do not approve the payment around it.
          </span>
        </Note>

        <div className="mt-4">
          <Table minWidth={860} columns={[
            { label: 'Request' }, { label: 'Distributor' }, { label: 'KYC' }, { label: 'Destination' },
            { label: 'Requested' }, { label: 'Amount', align: 'right' }, { label: 'Status' }, { label: 'Decision' },
          ]}>
            {reqs.map((r) => {
              const blocked = r.kyc !== 'verified'
              return (
                <Row key={r.id}>
                  <Cell mono tone="dim">{r.id}</Cell>
                  <Cell>
                    <div className="text-ivory">{r.name}</div>
                    <div className="tnum font-mono text-[10px] text-ivory-faint">{r.distributorId}</div>
                  </Cell>
                  <Cell><Tag tone={r.kyc === 'verified' ? 'ok' : r.kyc === 'pending' ? 'warn' : 'bad'}>{r.kyc}</Tag></Cell>
                  <Cell tone="dim" className="text-xs">{r.method}</Cell>
                  <Cell mono tone="faint">{r.requested}</Cell>
                  <Cell align="right" mono tone="gold">{money(r.amount)}</Cell>
                  <Cell>
                    <Tag tone={r.status === 'approved' ? 'ok' : r.status === 'rejected' ? 'bad' : blocked ? 'bad' : 'warn'}>
                      {blocked && r.status === 'pending' ? 'held' : r.status}
                    </Tag>
                  </Cell>
                  <Cell>
                    {r.status === 'pending' ? (
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="ok" icon={Check} disabled={blocked} onClick={() => decide(r.id, 'approved')}>Approve</Button>
                        <Button size="sm" variant="bad" icon={X} onClick={() => decide(r.id, 'rejected')}>Reject</Button>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-ivory-faint"><Clock size={11} /> Resolved</span>
                    )}
                  </Cell>
                </Row>
              )
            })}
          </Table>
        </div>
      </Card>
    </div>
  )
}
