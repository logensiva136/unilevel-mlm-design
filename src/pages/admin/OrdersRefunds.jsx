import React, { useState } from 'react'
import { Undo2, AlertTriangle } from 'lucide-react'
import { Card, SectionHeading, Table, Row, Cell, Tag, Stat, Note, Button } from '../../components/ui'
import CompressionTrace from '../../components/CompressionTrace'
import { orders, productBySku, byId } from '../../data/network'
import { RUN } from '../../lib/engine'
import { money, num, pct } from '../../lib/format'
import { COMPLIANCE, FAST_START_RATE } from '../../data/plan'

export default function OrdersRefunds() {
  const [trace, setTrace] = useState(null)
  const recent = orders.slice(-40).reverse()
  const refunds = orders.filter((o) => o.status === 'refunded')
  const clawbackValue = refunds.reduce((s, o) => s + o.cv * FAST_START_RATE, 0)
  const gross = orders.filter((o) => o.status === 'paid').reduce((s, o) => s + o.gross, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Orders in period" value={num(orders.length)} tone="plain" />
        <Stat label="Gross sales" value={money(gross)} tone="gold" />
        <Stat label="Refunded" value={num(refunds.length)} tone="rose" sub={pct(refunds.length / orders.length)} />
        <Stat label="Clawback exposure" value={money(clawbackValue)} tone="rose" sub="Advances to reverse" />
      </div>

      <Card className="p-5">
        <SectionHeading
          eyebrow="Compliance"
          title="Cooling-off window"
          note={`Buyers have ${COMPLIANCE.coolingOffWorkingDays} working days to reconsider, during which no deposit may be taken and no goods supplied. Orders returned inside this window produce no volume and reverse any commission already advanced on them.`}
        />
        <Note tone="warn">
          <span className="flex items-start gap-2">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            <span>
              A refund does not simply delete a row. It removes volume that has already climbed the
              tree, which changes the paid-as rank of everyone above it. This is why runs are
              approved after the window closes, not during it.
            </span>
          </span>
        </Note>
      </Card>

      <Card className="p-5" rules>
        <SectionHeading eyebrow="Ledger" title="Order register" note="Select any order to trace how its volume was distributed." />
        <Table minWidth={820} columns={[
          { label: 'Order' }, { label: 'Distributor' }, { label: 'Product' }, { label: 'Channel' },
          { label: 'Date' }, { label: 'PV', align: 'right' }, { label: 'CV', align: 'right' },
          { label: 'Value', align: 'right' }, { label: '' },
        ]}>
          {recent.map((o) => (
            <Row key={o.id}>
              <Cell mono tone="dim">{o.id}</Cell>
              <Cell className="text-xs">{byId[o.distributorId]?.name}</Cell>
              <Cell tone="dim" className="text-xs">{productBySku[o.sku]?.name}</Cell>
              <Cell><Tag tone={o.channel === 'retail' ? 'warn' : o.channel === 'autoship' ? 'ok' : 'neutral'}>{o.channel}</Tag></Cell>
              <Cell mono tone="faint">{o.date}</Cell>
              <Cell align="right" mono tone="dim">{o.pv}</Cell>
              <Cell align="right" mono tone={o.status === 'refunded' ? 'faint' : 'gold'}>{o.cv}</Cell>
              <Cell align="right" mono tone={o.status === 'refunded' ? 'rose' : 'dim'}>
                {o.status === 'refunded' ? 'refunded' : money(o.gross)}
              </Cell>
              <Cell>
                {o.status === 'paid' && (
                  <Button size="sm" variant="ghost" onClick={() => setTrace(o.id)}>Trace</Button>
                )}
              </Cell>
            </Row>
          ))}
        </Table>
      </Card>

      {trace && (
        <Card className="p-5">
          <SectionHeading
            eyebrow="Audit"
            title="Distribution trace"
            note="Exactly who this order paid, and who was bypassed."
            action={<Button size="sm" variant="ghost" icon={Undo2} onClick={() => setTrace(null)}>Close</Button>}
          />
          <CompressionTrace orderId={trace} />
        </Card>
      )}
    </div>
  )
}
