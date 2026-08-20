import React, { useMemo, useState } from 'react'
import { Search, Check, Ban, ChevronDown } from 'lucide-react'
import { Card, SectionHeading, Table, Row, Cell, Tag, Button, Note, Stat } from '../../components/ui'
import { distributors } from '../../data/network'
import { RUN } from '../../lib/engine'
import { rankByKey } from '../../data/plan'
import { money, num, pct } from '../../lib/format'
import { totalEarnings } from '../../lib/engine'

export default function Distributors() {
  const [overrides, setOverrides] = useState({})
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const rows = useMemo(() => distributors.map((d) => ({
    ...d,
    kyc: overrides[d.id]?.kyc ?? d.kyc,
    status: overrides[d.id]?.status ?? d.status,
  })), [overrides])

  const filtered = useMemo(() => rows.filter((d) => {
    const matchQ = !query || d.name.toLowerCase().includes(query.toLowerCase()) || d.id.toLowerCase().includes(query.toLowerCase())
    const matchF =
      filter === 'all' ? true :
      filter === 'kyc_pending' ? d.kyc === 'pending' :
      filter === 'kyc_blocked' ? d.kyc !== 'verified' && totalEarnings(d.id) > 0 :
      filter === 'suspended' ? d.status === 'suspended' :
      filter === 'inactive' ? !RUN.qualification[d.id].active : true
    return matchQ && matchF
  }).slice(0, 60), [rows, query, filter])

  const set = (id, patch) => setOverrides((p) => ({ ...p, [id]: { ...p[id], ...patch } }))

  const kycPending = rows.filter((d) => d.kyc === 'pending').length
  const blocked = rows.filter((d) => d.kyc !== 'verified' && totalEarnings(d.id) > 0)
  const blockedValue = blocked.reduce((s, d) => s + totalEarnings(d.id), 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Distributors" value={num(rows.length)} tone="plain" />
        <Stat label="KYC pending" value={num(kycPending)} tone="warn" sub="Awaiting document review" />
        <Stat label="Payout blocked" value={num(blocked.length)} tone="rose" sub="Earning but unverified" />
        <Stat label="Value held" value={money(blockedValue)} tone="rose" sub="Accrued, not releasable" />
      </div>

      <Card className="p-5">
        <SectionHeading
          eyebrow="Field"
          title="Distributor register"
          note="Verification gates the payout, not the earning. Commission continues to accrue for an unverified distributor — withholding it is what protects the company, and suspending the account would be the wrong lever."
        />

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-ink-600 bg-ink-900 px-3 py-2 text-sm">
            <Search size={14} className="text-ivory-faint" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or distributor ID…"
              className="w-full bg-transparent text-ivory placeholder:text-ivory-faint focus:outline-none" />
          </div>
          <div className="relative">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}
              className="appearance-none rounded-md border border-ink-600 bg-ink-900 py-2 pl-3 pr-8 text-sm text-ivory-dim focus:outline-none">
              <option value="all">All distributors</option>
              <option value="kyc_pending">KYC pending</option>
              <option value="kyc_blocked">Payout blocked</option>
              <option value="inactive">Not qualified this period</option>
              <option value="suspended">Suspended</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ivory-faint" />
          </div>
        </div>

        <Table minWidth={900} columns={[
          { label: 'Distributor' }, { label: 'Paid-as' }, { label: 'PV', align: 'right' },
          { label: 'GV', align: 'right' }, { label: 'Earned', align: 'right' },
          { label: 'KYC' }, { label: 'Status' }, { label: 'Actions' },
        ]}>
          {filtered.map((d) => {
            const q = RUN.qualification[d.id]
            const earned = totalEarnings(d.id)
            return (
              <Row key={d.id}>
                <Cell>
                  <div className="text-ivory">{d.name}</div>
                  <div className="tnum font-mono text-[10px] text-ivory-faint">{d.id} · {d.state}</div>
                </Cell>
                <Cell>
                  <Tag tone={q.active ? 'ok' : 'roll'}>{rankByKey[q.paidAsRank].name}</Tag>
                </Cell>
                <Cell align="right" mono tone={q.active ? 'sage' : 'faint'}>{RUN.volume[d.id].pv}</Cell>
                <Cell align="right" mono tone="dim">{num(RUN.volume[d.id].gv)}</Cell>
                <Cell align="right" mono tone={earned > 0 ? 'gold' : 'faint'}>{earned > 0 ? money(earned) : '—'}</Cell>
                <Cell>
                  <Tag tone={d.kyc === 'verified' ? 'ok' : d.kyc === 'pending' ? 'warn' : 'bad'}>{d.kyc}</Tag>
                </Cell>
                <Cell>
                  <Tag tone={d.status === 'active' ? 'ok' : 'bad'}>{d.status}</Tag>
                </Cell>
                <Cell>
                  <div className="flex gap-1.5">
                    {d.kyc !== 'verified' && (
                      <Button size="sm" variant="ok" icon={Check} onClick={() => set(d.id, { kyc: 'verified' })}>Verify</Button>
                    )}
                    {d.status === 'active' ? (
                      <Button size="sm" variant="bad" icon={Ban} onClick={() => set(d.id, { status: 'suspended' })}>Suspend</Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => set(d.id, { status: 'active' })}>Reinstate</Button>
                    )}
                  </div>
                </Cell>
              </Row>
            )
          })}
        </Table>
        {filtered.length === 0 && <div className="py-8 text-center text-sm text-ivory-faint">No distributors match.</div>}
        <p className="mt-3 text-[11px] text-ivory-faint">Showing up to 60 rows. A real register pages server-side.</p>
      </Card>
    </div>
  )
}
