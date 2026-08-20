import React, { useState } from 'react'
import { Card, SectionHeading, Tag, Note } from '../../components/ui'
import GenealogyTree, { NodeDetail } from '../../components/GenealogyTree'
import { CURRENT_MEMBER_ID } from '../../data/network'
import { RUN, downlineIds } from '../../lib/engine'
import { num, pct } from '../../lib/format'

export default function Genealogy() {
  const [selected, setSelected] = useState(CURRENT_MEMBER_ID)
  const all = downlineIds(CURRENT_MEMBER_ID)
  const active = all.filter((n) => RUN.qualification[n.id].active).length

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="p-5 lg:col-span-2">
        <SectionHeading
          eyebrow="Enrolment tree"
          title="Your organisation"
          note="Unilevel places everyone you personally enrol directly on your level 1 — unlimited width, no spillover, no forced placement. Depth is what's capped, not width."
          action={<Tag tone="neutral">{num(all.length)} in downline</Tag>}
        />
        <div className="mb-4 flex flex-wrap gap-2">
          <Tag tone="ok">{num(active)} active</Tag>
          <Tag tone="roll">{num(all.length - active)} compress</Tag>
          <Tag tone="neutral">{pct(all.length ? active / all.length : 0)} active rate</Tag>
        </div>
        <GenealogyTree rootId={CURRENT_MEMBER_ID} onSelect={setSelected} selectedId={selected} />
      </Card>

      <div className="space-y-4">
        <NodeDetail id={selected} />
        <Note tone="warn">
          A dimmed dot means that person did not meet the personal volume requirement this period.
          They are not removed from your tree — they are bypassed when commission is calculated, and
          their level rolls up to the next qualified person above them.
        </Note>
      </div>
    </div>
  )
}
