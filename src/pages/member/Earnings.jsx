import React, { useState } from 'react'
import { Card, SectionHeading, Table, Row, Cell, Tag, Note } from '../../components/ui'
import CompressionTrace from '../../components/CompressionTrace'
import { CURRENT_MEMBER_ID, byId, productBySku, orders } from '../../data/network'
import { RUN, payingOrdersFor } from '../../lib/engine'
import { money, rate } from '../../lib/format'
import { PERIOD } from '../../data/plan'

const orderById = Object.fromEntries(orders.map((o) => [o.id, o]))

export default function Earnings() {
  const paying = payingOrdersFor(CURRENT_MEMBER_ID)
  const [open, setOpen] = useState(paying[0]?.trace.orderId ?? null)

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <SectionHeading
          eyebrow={`${PERIOD.label} run`}
          title="Every order that paid you"
          note="Commission is traceable to an individual sale. Select any row to see exactly how that order's volume travelled up to you — including who was bypassed on the way."
        />
        <Table minWidth={720} columns={[
          { label: 'Order' }, { label: 'Product' }, { label: 'Placed by' },
          { label: 'CV', align: 'right' }, { label: 'Paid at' }, { label: 'You earned', align: 'right' },
        ]}>
          {paying.map(({ trace, hop }) => {
            const o = orderById[trace.orderId]
            const isOpen = open === trace.orderId
            return (
              <Row key={trace.orderId}>
                <Cell>
                  <button onClick={() => setOpen(isOpen ? null : trace.orderId)} className="tnum font-mono text-xs text-gold-400 hover:underline">
                    {trace.orderId}
                  </button>
                </Cell>
                <Cell tone="dim" className="text-xs">{productBySku[o?.sku]?.name}</Cell>
                <Cell tone="dim">{byId[trace.buyerId]?.name}</Cell>
                <Cell align="right" mono tone="dim">{trace.cv}</Cell>
                <Cell mono tone="dim">L{hop.level} · {rate(hop.rate)}</Cell>
                <Cell align="right" mono tone="gold">{money(hop.amount)}</Cell>
              </Row>
            )
          })}
        </Table>
        {paying.length === 0 && (
          <Note tone="warn">No orders in your downline paid you this period.</Note>
        )}
      </Card>

      {open && (
        <Card className="p-5">
          <SectionHeading
            eyebrow="Audit trail"
            title="Compression trace"
            note="This is the answer to the question every distributor eventually asks: why did this pay at the level it did?"
            action={<Tag tone="warn">Order {open}</Tag>}
          />
          <CompressionTrace orderId={open} highlightId={CURRENT_MEMBER_ID} />
        </Card>
      )}
    </div>
  )
}
