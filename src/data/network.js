// ---------------------------------------------------------------------------
// DISTRIBUTOR TREE + ORDER LEDGER (mock)
// ---------------------------------------------------------------------------
// Deterministic so every render, and every number derived from it, is stable.
// Orders are the source of truth. Commissions are NOT stored here — they are
// computed from these orders by lib/engine.js, exactly as a real commission
// run would. That is the whole point: money originates from a sale.
// ---------------------------------------------------------------------------

// Small seeded PRNG so the mock data never shifts between renders.
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const PRODUCTS = [
  { sku: 'RG-30',  name: 'Radiance Serum 30ml',      retail: 189, member: 149, pv: 60,  cv: 95 },
  { sku: 'VT-60',  name: 'Vital Complex 60s',        retail: 249, member: 199, pv: 100, cv: 130 },
  { sku: 'HB-01',  name: 'Herbal Brew 20 sachets',   retail: 129, member: 105, pv: 45,  cv: 68 },
  { sku: 'CL-500', name: 'Clarity Cleanser 500ml',   retail:  99, member:  79, pv: 35,  cv: 52 },
  { sku: 'ST-KIT', name: 'Starter Business Kit',     retail: 399, member: 349, pv: 150, cv: 210 },
  { sku: 'RN-90',  name: 'Renew Collagen 90s',       retail: 319, member: 259, pv: 130, cv: 170 },
]

export const productBySku = Object.fromEntries(PRODUCTS.map((p) => [p.sku, p]))

import { ACTIVE_PV_REQUIREMENT } from './plan'

const FIRST = ['Aina', 'Haziq', 'Farah', 'Ken', 'Priya', 'Dinesh', 'Wei Ling', 'Siti', 'Marcus', 'Nurul', 'Ravi', 'Mei Yee', 'Faizal', 'Grace', 'Azlan', 'Kavitha', 'Jun Hao', 'Zainab', 'Ismail', 'Yusof', 'Lina', 'Hafiz', 'Sharmila', 'Boon Keat', 'Aisyah', 'Daniel', 'Suhaila', 'Vikneswaran', 'Amirah', 'Chee Meng', 'Rohana', 'Kumar', 'Syafiq', 'Poh Ling', 'Zulkifli', 'Anitha', 'Fauzi', 'Mun Yee', 'Hasnah', 'Rajesh']
const LAST = ['Rahman', 'Tarmizi', 'Najwa', 'Wong', 'Selvam', 'Kumar', 'Tan', 'Aisyah', 'Lee', 'Huda', 'Chandran', 'Chong', 'Idris', 'Lian', 'Bakar', 'Menon', 'Lim', 'Yusof', 'Hashim', 'Ali', 'Goh', 'Zainal', 'Devi', 'Ng', 'Omar', 'Cheah', 'Ibrahim', 'Pillai', 'Salleh', 'Teoh']

// --- Build the tree ---------------------------------------------------------
// Unilevel: unlimited frontline width, capped payout depth. No forced
// placement, no spillover — everyone you enrol sits directly on your level 1.

function buildTree() {
  const rand = mulberry32(20260820)
  const nodes = []

  // The account the member portal is logged in as.
  const root = {
    id: 'MY-100001',
    name: 'Aina Rahman',
    sponsorId: null,
    joinedAt: '2024-02-11',
    recognisedRank: 'gold',
    kyc: 'verified',
    status: 'active',
    autoship: true,
    country: 'MY',
    state: 'Selangor',
  }
  nodes.push(root)

  // Sibling organizations, so company-wide admin figures aren't one leg.
  // Real direct-selling companies are a handful of large founding lines plus a
  // long tail of small ones — the size spread here is deliberate.
  const siblings = [
    { id: 'MY-100002', name: 'Chong Mei Yee', joinedAt: '2023-09-04', recognisedRank: 'diamond',  state: 'Penang' },
    { id: 'MY-100003', name: 'Suhaila Bakar', joinedAt: '2023-11-19', recognisedRank: 'platinum', state: 'Johor' },
    { id: 'MY-100004', name: 'Vikneswaran Menon', joinedAt: '2024-06-02', recognisedRank: 'gold', state: 'KL' },
    { id: 'MY-100005', name: 'Rohana Salleh', joinedAt: '2025-01-27', recognisedRank: 'silver',   state: 'Sabah' },
  ]
  const roots = siblings.map((s) => ({
    ...s,
    sponsorId: null,
    kyc: 'verified',
    status: 'active',
    autoship: true,
    country: 'MY',
  }))
  nodes.push(...roots)

  let seq = 100010
  const namePool = []
  for (const f of FIRST) for (const l of LAST) namePool.push(`${f} ${l}`)
  let nameIdx = 7

  function spawn(parent, depth, maxDepth) {
    if (depth > maxDepth) return
    // Frontline width: unlimited by plan, but realistically most people sponsor
    // 0-2 and a few sponsor many. Heavy tail, like a real field.
    const roll = rand()
    let width
    if (depth === 1) width = 8 + Math.floor(rand() * 7)
    else if (depth === 2) width = 1 + Math.floor(rand() * 4)
    else if (roll < 0.3) width = 0
    else if (roll < 0.62) width = 1
    else if (roll < 0.86) width = 2
    else width = 3 + Math.floor(rand() * 3)

    for (let i = 0; i < width; i++) {
      const id = `MY-${seq++}`
      const joinMonth = 1 + Math.floor(rand() * 18)
      const yr = joinMonth > 11 ? 2025 : 2026
      const mo = ((joinMonth - 1) % 12) + 1
      const node = {
        id,
        name: namePool[(nameIdx = (nameIdx + 37) % namePool.length)],
        sponsorId: parent.id,
        joinedAt: `${yr}-${String(mo).padStart(2, '0')}-${String(2 + Math.floor(rand() * 26)).padStart(2, '0')}`,
        recognisedRank: 'distributor',
        // KYC lags in the real world — a chunk of the field never completes it,
        // and that blocks their payout, not their earning.
        kyc: rand() < 0.12 ? 'pending' : rand() < 0.06 ? 'rejected' : 'verified',
        status: rand() < 0.05 ? 'suspended' : 'active',
        autoship: rand() < 0.46,
        country: 'MY',
        state: ['Selangor', 'Penang', 'Johor', 'Sabah', 'Sarawak', 'Perak', 'KL'][Math.floor(rand() * 7)],
      }
      nodes.push(node)
      spawn(node, depth + 1, maxDepth)
    }
  }

  spawn(root, 1, 7)
  for (const r of roots) spawn(r, 1, 7)
  return nodes
}

export const distributors = buildTree()
export const byId = Object.fromEntries(distributors.map((d) => [d.id, d]))

export const childrenOf = distributors.reduce((acc, d) => {
  if (d.sponsorId) (acc[d.sponsorId] ||= []).push(d.id)
  return acc
}, {})

// --- Generate the order ledger ---------------------------------------------
// This is the engine's only real input. Roughly half the field orders in any
// given period — which is what makes dynamic compression matter so much.

function buildOrders() {
  const rand = mulberry32(776611)
  const orders = []
  let seq = 500001

  for (const d of distributors) {
    if (d.status === 'suspended') continue

    // Autoship (loyalty/repurchase) is the residual engine of a unilevel plan.
    // It's why unilevel dominates consumable-product businesses.
    const ordersThisPeriod = d.autoship
      ? 1 + (rand() < 0.3 ? 1 : 0)
      : rand() < 0.42
        ? 1
        : 0

    // Autoship packs are deliberately built to clear the PV qualification
    // threshold in one order — that is the entire commercial purpose of a
    // loyalty programme in a unilevel plan. Non-autoship buyers pick freely
    // and often fall short, which is what drives compression.
    const QUALIFYING = PRODUCTS.filter((p) => p.pv >= ACTIVE_PV_REQUIREMENT)

    for (let i = 0; i < ordersThisPeriod; i++) {
      const isFirstAutoship = d.autoship && i === 0
      const pool = isFirstAutoship ? QUALIFYING : PRODUCTS
      const p = pool[Math.floor(rand() * pool.length)]
      const qty = rand() < 0.72 ? 1 : 2
      const isAutoship = isFirstAutoship
      const day = 1 + Math.floor(rand() * 28)
      // ~4% of orders come back. Refunds inside the window claw the commission
      // back off the upline — a real and permanent feature of these systems.
      const refunded = rand() < 0.04
      orders.push({
        id: `SO-${seq++}`,
        distributorId: d.id,
        sku: p.sku,
        qty,
        date: `2026-08-${String(day).padStart(2, '0')}`,
        channel: isAutoship ? 'autoship' : 'personal',
        gross: p.member * qty,
        pv: p.pv * qty,
        cv: p.cv * qty,
        status: refunded ? 'refunded' : 'paid',
        refundedOn: refunded ? `2026-08-${String(Math.min(28, day + 6)).padStart(2, '0')}` : null,
      })
    }

    // Retail customer orders. These matter enormously for compliance: they are
    // sales to people OUTSIDE the network, which is the whole legal basis of
    // the business under Act 500.
    if (rand() < 0.34) {
      const p = PRODUCTS[Math.floor(rand() * PRODUCTS.length)]
      const day = 1 + Math.floor(rand() * 28)
      orders.push({
        id: `SO-${seq++}`,
        distributorId: d.id,
        sku: p.sku,
        qty: 1,
        date: `2026-08-${String(day).padStart(2, '0')}`,
        channel: 'retail',
        gross: p.retail,
        pv: p.pv,
        cv: p.cv,
        retailMargin: p.retail - p.member,
        status: 'paid',
        refundedOn: null,
      })
    }
  }
  return orders.sort((a, b) => a.date.localeCompare(b.date))
}

export const orders = buildOrders()

// First order per distributor, used for fast-start eligibility.
export const firstOrderOf = orders.reduce((acc, o) => {
  if (!acc[o.distributorId] || o.date < acc[o.distributorId].date) acc[o.distributorId] = o
  return acc
}, {})

export const CURRENT_MEMBER_ID = 'MY-100001'
