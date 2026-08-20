# Ledgerline — unilevel direct selling platform (UI)

Front-end only. No backend, no database. But the numbers are **not** hardcoded:
`src/lib/engine.js` is a working unilevel commission engine with dynamic
compression, and every figure in the UI is computed from the order ledger in
`src/data/network.js`.

```bash
npm install
npm run dev
```

Toggle **Distributor / Back office** at the top of the sidebar.

---

## The business, before the UI

The thing most MLM mockups get wrong is treating commission as a number that
appears from nowhere. It isn't. Money originates from a **sale**, and if it
doesn't, the scheme is illegal — under Malaysia's Direct Sales and Anti-Pyramid
Scheme Act 1993 (Act 500), a pyramid is defined as an arrangement where bonuses
flow primarily from recruitment rather than the sale of goods. So the order
ledger is the root of this data model, and commission is derived from it.

### Three different volume numbers

| | What it is | Used for |
|---|---|---|
| **PV** | Personal Volume — qualification points | Deciding if you're *active* |
| **CV** | Commissionable Volume | The base percentages are paid on |
| **GV** | Group Volume — your downline's PV | Rank advancement |

CV is deliberately lower than the retail price. A company cannot pay commission
on the full ticket and still fund product cost, logistics and margin.

### Dynamic compression — the defining unilevel mechanic

If an upline doesn't meet the PV requirement in a period, they don't qualify.
The commission that would have gone to them **rolls up** to the next qualifying
distributor above them, and — critically — the skipped person *doesn't consume a
level*. So volume six people below you can pay you at level 3.

The engine implements four distinct per-hop outcomes:

- **Paid** — qualified, and their rank unlocks this level
- **Compressed** — not active; bypassed, level not consumed, rolls up
- **Beyond depth** — active, but rank doesn't unlock this level; level *is*
  consumed and goes unpaid
- **Breakage** — chain ran out of uplines before the level table did

Compression **moves** money, it doesn't save it. Breakage is the real saving,
and a large breakage figure means a shallow organisation, not a healthy one.
The admin reconciliation panel separates these, because conflating them makes a
plan look cheaper than it is.

### Rank does two jobs

Rank isn't a badge — it **unlocks payout depth**. A new Distributor earns 3
levels; a Platinum earns 7. Volume seven levels down is worth nothing to you if
your rank only pays four.

And there are **two ranks per person**:

- **Recognised** — highest ever achieved, held for life
- **Paid-as** — re-qualified from scratch every single period

Confusing the two is the most common source of commission disputes in the
field, so the member portal shows them side by side and explains the gap.

### Income streams

A unilevel plan is never just the level override. This one layers:

- **Retail profit** — member/retail price spread, paid immediately
- **Fast start** — 20% of a new enrollee's first order CV, inside a 30-day
  window, to the sponsor. Clawed back on refund.
- **Unilevel override** — levels 1–7, 5/4/4/3/3/2/2%, with compression
- **Matching bonus** — a share of your frontline's unilevel earnings. Rewards
  mentoring rather than raw recruiting.
- **Leadership pool** — a *fixed* 2% of company CV split by shares among
  Platinum/Diamond. Fixed-budget by design so top-end cost can't run away.

### Compliance is a feature, not a disclaimer

The back office computes the Act 500 tests from the live run: what share of
payout is recruitment-linked, how much volume came from genuine retail
customers outside the network, buy-back policy, and the 10-working-day
cooling-off period during which no goods may be supplied and no deposit taken.

It also publishes an honest **income disclosure statement**. In this dataset
about 28% of distributors earned anything at all and the median is near zero.
That is the structural reality of direct selling, and presenting a plan by
overemphasising disproportionately high bonuses is itself a regulatory problem.

---

## What's in it

**Distributor portal** — Dashboard (qualification gate, earnings by stream,
level-by-level with locked depth), Organisation (lazy genealogy tree with
qualification state), Earnings (every order that paid you + the compression
trace), Orders (personal/autoship/retail, PV vs CV), Wallet (accrued vs
released, KYC gate), Rank (recognised vs paid-as, depth ladder).

**Back office** — Overview (field health, volume origin, plan exposure),
Commission run (staged approval gate with pre-release checks), Distributors
(register, KYC, suspend), Orders & refunds (register + clawbacks + trace),
Payouts (withdrawal queue, KYC-blocked), Plan (editable rates with live
what-if against the real run), Compliance (Act 500 tests + income disclosure).

### The signature element: the compression trace

`src/components/CompressionTrace.jsx` answers the question every distributor
eventually asks — *why did this pay at the level it did?* — by showing the
actual walk up the tree for a single order, hop by hop, marking who was paid,
who was compressed and why, and where the chain broke. Real example from the
seeded data:

```
compressed   L1  Ken Salleh          (below 100 PV)
paid         L1  Farah Zainal        RM 17.00   ← two hops up, still level 1
paid         L2  Haziq Bakar         RM 13.60
paid         L3  Aina Rahman         RM 13.60
breakage     L4  —                   (no further upline)
```

It's used in both portals: the distributor sees it for their own commission,
ops sees it as an audit trail on any order.

---

## Design

Dark "ledger" palette — forest ink ground, brass gold for money, sage for
qualified/active, rose for failures, plus two dedicated hues for the
compression vocabulary (amber = rolled up, muted violet = unpaid depth) so the
three states read instantly. Fraunces for display, Inter for UI, IBM Plex Mono
for all figures, with tabular numerals everywhere money or volume aligns —
non-negotiable in anything that reconciles.

## Wiring up a backend

Replace `src/data/*.js` with API calls and move `src/lib/engine.js` server-side —
a commission run must never be computed on the client. The engine is written to
port directly: pure functions over `distributors` + `orders`, no React
dependencies. Keep the run **stamped with a plan version**, keep the
approve-then-release gate as two distinct permissioned actions, and never let a
plan edit retroactively alter a released run.

The role toggle is a UI convenience for demoing. Real deployment gates the back
office behind actual authorisation, server-side.

---

## Deploying to GitHub Pages

A workflow is included at `.github/workflows/deploy.yml`. It builds on every
push to `main` and publishes `dist/`.

1. Push the project to a GitHub repo.
2. In the repo, go to **Settings → Pages** and set **Source** to
   **GitHub Actions** (not "Deploy from a branch" — that serves your source
   files instead of the build, and you'll get a blank page).
3. Push to `main`. The Actions tab shows the run; the URL appears in the
   `deploy` job when it finishes.

### Why `base: './'`

`vite.config.js` sets `base: './'` so asset URLs are relative. This is the fix
for the single most common Pages failure: a site that deploys "successfully"
but renders a blank page, with `/assets/index-xxx.js` 404-ing in the console.
That happens because the default absolute base assumes the site is at the
domain root, while a project site actually lives at
`username.github.io/repo-name/`.

Relative base is safe here because the app has no client-side router — all
navigation is React state, so there is only ever one real URL. **If you later
add React Router, `base: './'` will break it.** At that point switch to
`base: '/your-repo-name/'`, pass the same value as the router `basename`, and
add a `404.html` that copies `index.html` so deep links don't 404.

### Notes

- `npm ci` in the workflow requires `package-lock.json` to be committed. It is.
- The build is fully static and the commission engine runs in the browser, so
  there is nothing to configure at runtime — no env vars, no API keys.
- Google Fonts are loaded from CDN, so the deployed page needs network access
  for typography to render as designed.
