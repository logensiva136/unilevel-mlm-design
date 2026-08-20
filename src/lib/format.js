import { CURRENCY } from '../data/plan'

export const money = (n, dp = 2) =>
  `${CURRENCY} ${(n ?? 0).toLocaleString('en-MY', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  })}`

export const compactMoney = (n) => {
  const v = n ?? 0
  if (Math.abs(v) >= 1_000_000) return `${CURRENCY} ${(v / 1_000_000).toFixed(2)}M`
  if (Math.abs(v) >= 1000) return `${CURRENCY} ${(v / 1000).toFixed(1)}k`
  return `${CURRENCY} ${v.toFixed(0)}`
}

export const num = (n) => (n ?? 0).toLocaleString('en-MY')
export const pct = (n, dp = 1) => `${((n ?? 0) * 100).toFixed(dp)}%`
export const rate = (n) => `${((n ?? 0) * 100).toFixed(0)}%`
