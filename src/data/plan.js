// ---------------------------------------------------------------------------
// COMPENSATION PLAN CONFIGURATION
// ---------------------------------------------------------------------------
// In a real deployment this is the most tightly version-controlled object in
// the system: every commission run is stamped with the plan version that
// produced it, so historical statements can always be recomputed and audited.
// ---------------------------------------------------------------------------

export const PLAN_VERSION = '2026.03'
export const CURRENCY = 'RM'

// Volume vocabulary. These are three different numbers and conflating them is
// the classic modelling mistake:
//   PV (Personal Volume)   - qualification points. Decide whether you're ACTIVE.
//   CV (Commissionable Vol)- the base commissions are actually calculated on.
//   GV (Group Volume)      - PV of your whole downline. Drives rank.
// CV is usually lower than retail price, because the company can't pay
// commission on the full ticket and still fund COGS, logistics and margin.

export const ACTIVE_PV_REQUIREMENT = 100 // PV per period to be "active"

// Unilevel level payout table. Paid on CV, not on retail price.
// Total exposure = 23% of CV. Real plans keep total unilevel exposure roughly
// in the low 20s so the whole comp plan (all streams) lands under ~40% of CV.
export const LEVEL_RATES = [
  { level: 1, rate: 0.05 },
  { level: 2, rate: 0.04 },
  { level: 3, rate: 0.04 },
  { level: 4, rate: 0.03 },
  { level: 5, rate: 0.03 },
  { level: 6, rate: 0.02 },
  { level: 7, rate: 0.02 },
]

export const TOTAL_UNILEVEL_EXPOSURE = LEVEL_RATES.reduce((s, l) => s + l.rate, 0)

// Rank ladder. `depth` is the key unilevel mechanic: your rank unlocks how many
// levels deep you are paid. A new distributor earns 3 levels; a leader earns 7.
// Every requirement must be re-met each period — you keep the *recognised*
// title for life, but you are PAID AS whatever you qualify for this period.
export const RANKS = [
  { key: 'member',      name: 'Member',      pv: 0,   gv: 0,     legs: 0, depth: 0, matching: 0,    pool: false },
  { key: 'distributor', name: 'Distributor', pv: 100, gv: 0,     legs: 0, depth: 3, matching: 0,    pool: false },
  { key: 'bronze',      name: 'Bronze',      pv: 100, gv: 800,   legs: 2, depth: 4, matching: 0,    pool: false },
  { key: 'silver',      name: 'Silver',      pv: 100, gv: 3000,  legs: 3, depth: 5, matching: 0.05, pool: false },
  { key: 'gold',        name: 'Gold',        pv: 100, gv: 9000,  legs: 4, depth: 6, matching: 0.10, pool: false },
  { key: 'platinum',    name: 'Platinum',    pv: 100, gv: 20000, legs: 6, depth: 7, matching: 0.10, pool: true },
  { key: 'diamond',     name: 'Diamond',     pv: 100, gv: 45000, legs: 8, depth: 7, matching: 0.15, pool: true },
]

export const rankByKey = Object.fromEntries(RANKS.map((r) => [r.key, r]))
export const rankIndex = Object.fromEntries(RANKS.map((r, i) => [r.key, i]))

// Income streams. A unilevel plan is never *only* the level override — every
// modern plan layers a front-end bonus (to help new people earn early), a
// depth/loyalty bonus, and a top-rank pool.
export const INCOME_STREAMS = {
  retail: {
    label: 'Retail profit',
    note: 'Difference between member price and retail price on customer orders. Paid immediately, not in the run.',
  },
  fast_start: {
    label: 'Fast start',
    note: "20% of CV on a new personal enrollee's first order, within their first 30 days. Paid to the sponsor. Subject to clawback if refunded.",
  },
  unilevel: {
    label: 'Unilevel override',
    note: 'Level 1–7 percentage of downline CV, depth unlocked by paid-as rank, with dynamic compression.',
  },
  matching: {
    label: 'Matching bonus',
    note: "A percentage of your personally-sponsored distributors' unilevel earnings. Rewards mentoring, not just recruiting. Silver+.",
  },
  pool: {
    label: 'Leadership pool',
    note: '2% of total company CV, shared by share-count across Platinum and Diamond. Caps top-end exposure at a fixed budget.',
  },
}

export const FAST_START_RATE = 0.2
export const FAST_START_WINDOW_DAYS = 30
export const POOL_RATE = 0.02

// --- Compliance constants (Malaysia, Act 500) -------------------------------
// Direct Sales and Anti-Pyramid Scheme Act 1993, administered by KPDN.
// These aren't decoration: the ratio test below is what separates a licensed
// direct seller from a criminal pyramid under s.27B.
export const COMPLIANCE = {
  licenceLabel: 'AJL (Lesen Jualan Langsung)',
  licenceNo: 'AJL 932178',
  licenceExpiry: '2027-04-30',
  regulator: 'KPDN',
  coolingOffWorkingDays: 10,
  buybackMonths: 6,
  buybackRate: 0.9,
  // Bonus must come primarily from SALE OF GOODS, not from recruitment.
  // We track the share of payout attributable to recruitment-linked streams.
  maxRecruitmentLinkedShare: 0.5,
  // Internal guardrail, not a statutory number: total payout as a share of CV.
  payoutRatioCeiling: 0.45,
}

export const PERIOD = {
  label: 'August 2026',
  key: '2026-08',
  opens: '2026-08-01',
  closes: '2026-08-31',
  runsOn: '2026-09-05',
  paysOn: '2026-09-10',
}
