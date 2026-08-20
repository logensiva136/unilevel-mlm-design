// ---------------------------------------------------------------------------
// COMMISSION ENGINE
// ---------------------------------------------------------------------------
// A real (if small) unilevel calculator with dynamic compression. Every figure
// shown anywhere in this UI is produced here from the order ledger — nothing is
// hardcoded. This mirrors how an actual commission run works:
//
//   1. Close the period.
//   2. Roll up PV / CV / GV for every distributor.
//   3. Determine ACTIVE status, then PAID-AS rank (re-qualified every period).
//   4. Walk every order up the sponsor tree, COMPRESSING past anyone who
//      doesn't qualify, and pay each qualifying upline at their compressed
//      level — but only within the depth their paid-as rank unlocks.
//   5. Layer the other income streams on top.
//   6. Reconcile: total payout vs total CV = the payout ratio.
//
// The compression step is the one everybody gets wrong. Compression does NOT
// mean "skip the person". It means the skipped person doesn't consume a level,
// so the commission rolls UP to the next qualified distributor above them.
// ---------------------------------------------------------------------------

import {
  ACTIVE_PV_REQUIREMENT,
  LEVEL_RATES,
  RANKS,
  rankIndex,
  FAST_START_RATE,
  FAST_START_WINDOW_DAYS,
  POOL_RATE,
} from '../data/plan'
import { distributors, byId, childrenOf, orders, firstOrderOf } from '../data/network'

const levelRate = Object.fromEntries(LEVEL_RATES.map((l) => [l.level, l.rate]))
const MAX_LEVEL = LEVEL_RATES.length

function daysBetween(a, b) {
  return (new Date(b) - new Date(a)) / 86400000
}

function isWithinEnrolmentWindow(joinedAt, orderDate) {
  const d = daysBetween(joinedAt, orderDate)
  return d >= 0 && d <= FAST_START_WINDOW_DAYS
}

// --- 2. Volume rollup -------------------------------------------------------

function rollupVolume() {
  const vol = {}
  for (const d of distributors) {
    vol[d.id] = { pv: 0, cv: 0, gv: 0, retailMargin: 0, orderCount: 0, refundedCv: 0 }
  }

  for (const o of orders) {
    const v = vol[o.distributorId]
    if (!v) continue
    if (o.status === 'refunded') {
      v.refundedCv += o.cv
      continue // refunded orders generate neither PV nor commission
    }
    v.pv += o.pv
    v.cv += o.cv
    v.orderCount += 1
    if (o.channel === 'retail') v.retailMargin += o.retailMargin ?? 0
  }

  // GV = own PV plus the PV of the entire downline, computed bottom-up.
  const order = topoOrder()
  for (let i = order.length - 1; i >= 0; i--) {
    const id = order[i]
    vol[id].gv = vol[id].pv
    for (const c of childrenOf[id] ?? []) vol[id].gv += vol[c].gv
  }
  return vol
}

function topoOrder() {
  const out = []
  const roots = distributors.filter((d) => !d.sponsorId).map((d) => d.id)
  const stack = [...roots]
  while (stack.length) {
    const id = stack.pop()
    out.push(id)
    for (const c of childrenOf[id] ?? []) stack.push(c)
  }
  return out
}

// --- 3. Qualification -------------------------------------------------------
// Active = met the personal volume requirement this period. This is the gate
// for everything: if you're not active you earn nothing and you are compressed
// out of your own upline's level count.

function qualify(vol) {
  const q = {}
  for (const d of distributors) {
    const v = vol[d.id]
    const active = d.status === 'active' && v.pv >= ACTIVE_PV_REQUIREMENT
    q[d.id] = { active, activeLegs: 0, paidAsRank: 'member', depth: 0 }
  }
  // An "active leg" is a personally-sponsored line that is itself active.
  // Rank on leg count rather than volume alone is what keeps a plan from
  // paying out on one lucky whale downline.
  for (const d of distributors) {
    let legs = 0
    for (const c of childrenOf[d.id] ?? []) if (q[c].active) legs++
    q[d.id].activeLegs = legs
  }
  for (const d of distributors) {
    const v = vol[d.id]
    const st = q[d.id]
    if (!st.active) {
      st.paidAsRank = 'member'
      st.depth = 0
      continue
    }
    // Paid-as = the highest rank whose requirements are ALL met this period.
    let best = RANKS[0]
    for (const r of RANKS) {
      if (v.pv >= r.pv && v.gv >= r.gv && st.activeLegs >= r.legs) best = r
    }
    st.paidAsRank = best.key
    st.depth = best.depth
  }
  return q
}

// --- 4. Unilevel with dynamic compression -----------------------------------

function runUnilevel(vol, qual) {
  const earnings = {}
  const traces = {} // per-order audit trail: who got paid, who was compressed
  for (const d of distributors) {
    earnings[d.id] = { unilevel: 0, fast_start: 0, matching: 0, pool: 0, retail: 0, clawback: 0 }
  }

  // Diagnostics the company actually cares about:
  //   rolledUp  - commission that skipped past an unqualified upline and was
  //               paid to someone higher instead. NOT saved money; it moved.
  //   depthLost - level existed and had volume, but the upline's rank didn't
  //               unlock it. Genuinely unpaid.
  //   breakage  - the chain ran out of uplines before the level table did.
  //               Genuinely unpaid. Large breakage = a shallow organisation.
  let rolledUpCv = 0
  let depthLostCv = 0
  let breakageCv = 0

  for (const o of orders) {
    if (o.status === 'refunded') continue

    const trace = { orderId: o.id, buyerId: o.distributorId, cv: o.cv, hops: [] }
    let payLevel = 1
    let cursor = byId[o.distributorId]?.sponsorId

    while (cursor && payLevel <= MAX_LEVEL) {
      const up = qual[cursor]
      if (!up.active) {
        // COMPRESSION. The unqualified upline is bypassed and — critically —
        // payLevel does NOT advance, so the next qualified person above them
        // receives this level's commission instead.
        trace.hops.push({
          id: cursor,
          outcome: 'compressed',
          level: payLevel,
          reason: `Below ${ACTIVE_PV_REQUIREMENT} PV this period`,
        })
        rolledUpCv += o.cv * (levelRate[payLevel] ?? 0)
        cursor = byId[cursor].sponsorId
        continue
      }
      if (payLevel > up.depth) {
        // Active, but their paid-as rank doesn't unlock this level. They are
        // skipped WITHOUT compression — the level is consumed. This portion is
        // simply not paid out, which is a real cost saving for the company.
        trace.hops.push({
          id: cursor,
          outcome: 'beyond_depth',
          level: payLevel,
          reason: `Paid-as ${up.paidAsRank} unlocks ${up.depth} levels`,
        })
        depthLostCv += o.cv * (levelRate[payLevel] ?? 0)
        payLevel++
        cursor = byId[cursor].sponsorId
        continue
      }
      const amount = o.cv * levelRate[payLevel]
      earnings[cursor].unilevel += amount
      trace.hops.push({
        id: cursor,
        outcome: 'paid',
        level: payLevel,
        rate: levelRate[payLevel],
        amount,
      })
      payLevel++
      cursor = byId[cursor].sponsorId
    }
    // Chain exhausted before the level table did.
    if (!cursor) {
      for (let l = payLevel; l <= MAX_LEVEL; l++) breakageCv += o.cv * (levelRate[l] ?? 0)
      if (payLevel <= MAX_LEVEL) {
        trace.hops.push({ outcome: 'breakage', level: payLevel, reason: 'No further upline' })
      }
    }
    traces[o.id] = trace
  }

  // Retail margin belongs to whoever made the customer sale, immediately.
  for (const d of distributors) earnings[d.id].retail = vol[d.id].retailMargin

  // Fast start: sponsor earns on a NEW enrollee's first order, and only inside
  // the enrolment window. Without the window check this silently pays on every
  // veteran's next order too, which massively overstates recruitment-linked
  // payout — and that is precisely the number the regulator cares about.
  for (const d of distributors) {
    const fo = firstOrderOf[d.id]
    if (!fo || fo.status === 'refunded' || !d.sponsorId) continue
    if (!isWithinEnrolmentWindow(d.joinedAt, fo.date)) continue
    if (!qual[d.sponsorId].active) continue
    earnings[d.sponsorId].fast_start += fo.cv * FAST_START_RATE
  }

  // Clawback: commission already advanced on orders that came back. Only
  // fast-start advances are clawed back here; unilevel simply never accrues on
  // a refunded order because it produced no volume in step 2.
  for (const o of orders) {
    if (o.status !== 'refunded') continue
    const buyer = byId[o.distributorId]
    const sponsorId = buyer?.sponsorId
    if (!sponsorId) continue
    if (firstOrderOf[o.distributorId]?.id !== o.id) continue
    if (!isWithinEnrolmentWindow(buyer.joinedAt, o.date)) continue
    earnings[sponsorId].clawback += o.cv * FAST_START_RATE
  }

  // Matching bonus: a share of your personal frontline's unilevel earnings.
  // Pays for mentoring rather than raw recruitment.
  for (const d of distributors) {
    const rank = RANKS[rankIndex[qual[d.id].paidAsRank]]
    if (!rank?.matching) continue
    let match = 0
    for (const c of childrenOf[d.id] ?? []) match += earnings[c].unilevel * rank.matching
    earnings[d.id].matching = match
  }

  // Leadership pool: a FIXED 2% of company CV, split by share count. Because
  // the budget is fixed, top-end exposure can never run away as the org grows.
  const companyCv = Object.values(vol).reduce((s, v) => s + v.cv, 0)
  const poolBudget = companyCv * POOL_RATE
  const sharers = distributors.filter((d) => RANKS[rankIndex[qual[d.id].paidAsRank]]?.pool)
  const totalShares = sharers.reduce(
    (s, d) => s + (qual[d.id].paidAsRank === 'diamond' ? 2 : 1),
    0,
  )
  for (const d of sharers) {
    const shares = qual[d.id].paidAsRank === 'diamond' ? 2 : 1
    earnings[d.id].pool = totalShares ? (poolBudget * shares) / totalShares : 0
  }

  return { earnings, traces, rolledUpCv, depthLostCv, breakageCv, poolBudget, companyCv }
}

// --- Assemble ---------------------------------------------------------------

function compute() {
  const vol = rollupVolume()
  const qual = qualify(vol)
  const run = runUnilevel(vol, qual)

  const totals = { unilevel: 0, fast_start: 0, matching: 0, pool: 0, retail: 0, clawback: 0 }
  for (const d of distributors) {
    for (const k of Object.keys(totals)) totals[k] += run.earnings[d.id][k]
  }

  // Payout ratio excludes retail margin (that's a price spread, not a company
  // payout) and nets off clawbacks.
  const totalPayout =
    totals.unilevel + totals.fast_start + totals.matching + totals.pool - totals.clawback

  // The Act 500 test, in numbers. Streams that pay on ENROLMENT activity are
  // recruitment-linked; streams that pay on ongoing product volume are not.
  const recruitmentLinked = totals.fast_start
  const salesLinked = totals.unilevel + totals.matching + totals.pool

  const activeCount = distributors.filter((d) => qual[d.id].active).length
  const earnerCount = distributors.filter((d) => {
    const e = run.earnings[d.id]
    return e.unilevel + e.fast_start + e.matching + e.pool > 0
  }).length

  return {
    volume: vol,
    qualification: qual,
    earnings: run.earnings,
    traces: run.traces,
    totals,
    totalPayout,
    companyCv: run.companyCv,
    companyGross: orders.filter((o) => o.status === 'paid').reduce((s, o) => s + o.gross, 0),
    payoutRatio: run.companyCv ? totalPayout / run.companyCv : 0,
    rolledUpCv: run.rolledUpCv,
    depthLostCv: run.depthLostCv,
    breakageCv: run.breakageCv,
    maxTheoreticalUnilevel: run.companyCv * LEVEL_RATES.reduce((s, l) => s + l.rate, 0),
    poolBudget: run.poolBudget,
    recruitmentLinkedShare: totalPayout ? recruitmentLinked / (recruitmentLinked + salesLinked) : 0,
    activeCount,
    activeRate: distributors.length ? activeCount / distributors.length : 0,
    earnerCount,
    earnerRate: distributors.length ? earnerCount / distributors.length : 0,
  }
}

// Computed once at module load — a run is a snapshot, not a live query.
export const RUN = compute()

// --- Helpers used by the UI -------------------------------------------------

export function totalEarnings(id) {
  const e = RUN.earnings[id]
  if (!e) return 0
  return e.unilevel + e.fast_start + e.matching + e.pool + e.retail - e.clawback
}

export function downlineIds(rootId, maxDepth = 99) {
  const out = []
  const walk = (id, depth) => {
    if (depth > maxDepth) return
    for (const c of childrenOf[id] ?? []) {
      out.push({ id: c, level: depth })
      walk(c, depth + 1)
    }
  }
  walk(rootId, 1)
  return out
}

export function levelBreakdown(rootId) {
  const rows = LEVEL_RATES.map((l) => ({
    level: l.level,
    rate: l.rate,
    members: 0,
    active: 0,
    cv: 0,
    earned: 0,
  }))
  for (const { id, level } of downlineIds(rootId, LEVEL_RATES.length)) {
    const row = rows[level - 1]
    if (!row) continue
    row.members += 1
    if (RUN.qualification[id].active) row.active += 1
    row.cv += RUN.volume[id].cv
  }
  // Attribute actual paid amounts back to the level they were paid at, using
  // the traces — so this reflects post-compression reality, not the raw tree.
  for (const t of Object.values(RUN.traces)) {
    for (const hop of t.hops) {
      if (hop.outcome === 'paid' && hop.id === rootId) {
        const row = rows[hop.level - 1]
        if (row) row.earned += hop.amount
      }
    }
  }
  return rows
}

// Orders in a distributor's downline that actually paid them something.
export function payingOrdersFor(id, limit = 40) {
  const out = []
  for (const t of Object.values(RUN.traces)) {
    const hop = t.hops.find((h) => h.id === id && h.outcome === 'paid')
    if (hop) out.push({ trace: t, hop })
  }
  return out.sort((a, b) => b.hop.amount - a.hop.amount).slice(0, limit)
}
