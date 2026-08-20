import React from 'react'
import { Repeat, ShoppingBag, Users } from 'lucide-react'
import { Card, SectionHeading, Table, Row, Cell, Tag, Stat, Note } from '../../components/ui'
import { CURRENT_MEMBER_ID, orders, productBySku, byId } from '../../data/network'
import { RUN, downlineIds } from '../../lib/engine'
import { money, num } from '../../lib/format'
import { COMPLIANCE, ACTIVE_PV_REQUIREMENT } from '../../data/plan'

const CHANNEL = {
  autoship: { label: 'Autoship', tone: 'ok', icon: Repeat },
  personal: { label: 'Personal', tone: 'neutral', icon: ShoppingBag },
  retail: { label: 'Retail customer', tone: 'warn', icon: Users },
}

export default function Orders() {
  const id = CURRENT_MEMBER_ID
  const mine = orders.filter((o) => o.distributorId === id)
  const downline = new Set(downlineIds(id).map((n) => n.id))
  const teamOrders = orders.filter((o) => downline.has(o.distributorId)).slice(-25).reverse()
  const v = RUN.volume[id]
  const retailCount = mine.filter((o) => o.channel === 'retail').length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Personal volume" value={`${v.pv} PV`} tone={v.pv >= ACTIVE_PV_REQUIREMENT ? 'sage' : 'rose'} sub={`Requirement ${ACTIVE_PV_REQUIREMENT} PV`} />
        <Stat label="Commissionable volume" value={num(v.cv)} tone="gold" sub="What commission is paid on" />
        <Stat label="Retail sales" value={retailCount} tone="sage" sub="Orders to customers outside the network" />
        <Stat label="Retail profit" value={money(v.retailMargin)} tone="gold" sub="Paid immediately, not in the run" />
      </div>

      <Card className="p-5">
        <SectionHeading
          eyebrow="Your orders"
          title="Personal and customer orders"
          note="PV decides whether you qualify. CV is what percentages are actually paid on. They are deliberately different numbers — commission cannot be funded from the full retail ticket."
        />
        <Table minWidth={680} columns={[
          { label: 'Order' }, { label: 'Product' }, { label: 'Channel' }, { label: 'Date' },
          { label: 'PV', align: 'right' }, { label: 'CV', align: 'right' }, { label: 'Value', align: 'right' },
        ]}>
          {mine.map((o) => {
            const c = CHANNEL[o.channel]
            return (
              <Row key={o.id}>
                <Cell mono tone="dim">{o.id}</Cell>
                <Cell className="text-xs">{productBySku[o.sku]?.name}{o.qty > 1 && ` ×${o.qty}`}</Cell>
                <Cell><Tag tone={c.tone}>{c.label}</Tag></Cell>
                <Cell mono tone="faint">{o.date}</Cell>
                <Cell align="right" mono tone={o.status === 'refunded' ? 'faint' : 'dim'}>{o.pv}</Cell>
                <Cell align="right" mono tone={o.status === 'refunded' ? 'faint' : 'gold'}>{o.cv}</Cell>
                <Cell align="right" mono tone={o.status === 'refunded' ? 'rose' : 'dim'}>
                  {o.status === 'refunded' ? 'Refunded' : money(o.gross)}
                </Cell>
              </Row>
            )
          })}
        </Table>
      </Card>

      <Card className="p-5" rules>
        <SectionHeading eyebrow="Team activity" title="Recent downline orders" note="Volume from these orders is what climbs the tree toward you." />
        <Table minWidth={620} columns={[
          { label: 'Order' }, { label: 'Distributor' }, { label: 'Product' },
          { label: 'Date' }, { label: 'CV', align: 'right' },
        ]}>
          {teamOrders.map((o) => (
            <Row key={o.id}>
              <Cell mono tone="dim">{o.id}</Cell>
              <Cell className="text-xs">{byId[o.distributorId]?.name}</Cell>
              <Cell tone="dim" className="text-xs">{productBySku[o.sku]?.name}</Cell>
              <Cell mono tone="faint">{o.date}</Cell>
              <Cell align="right" mono tone={o.status === 'refunded' ? 'rose' : 'gold'}>
                {o.status === 'refunded' ? 'void' : o.cv}
              </Cell>
            </Row>
          ))}
        </Table>
        <div className="mt-4">
          <Note>
            Orders can be returned within the {COMPLIANCE.coolingOffWorkingDays}-working-day cooling-off
            period. A refunded order produces no volume, and any advance already paid on it is clawed
            back from the sponsor.
          </Note>
        </div>
      </Card>
    </div>
  )
}
