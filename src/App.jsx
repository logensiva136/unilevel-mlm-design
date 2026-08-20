import React, { useState } from 'react'
import {
  LayoutDashboard, Network, ReceiptText, ShoppingBag, Wallet as WalletIcon, Award,
  Calculator, Users, PackageX, Banknote, SlidersHorizontal, Scale,
} from 'lucide-react'
import { Sidebar, TopBar, MobileNav } from './components/Shell'

import Dashboard from './pages/member/Dashboard'
import Genealogy from './pages/member/Genealogy'
import Earnings from './pages/member/Earnings'
import Orders from './pages/member/Orders'
import Wallet from './pages/member/Wallet'
import Rank from './pages/member/Rank'

import AdminDashboard from './pages/admin/AdminDashboard'
import CommissionRun from './pages/admin/CommissionRun'
import Distributors from './pages/admin/Distributors'
import OrdersRefunds from './pages/admin/OrdersRefunds'
import Payouts from './pages/admin/Payouts'
import PlanConfig from './pages/admin/PlanConfig'
import Compliance from './pages/admin/Compliance'

import { byId, CURRENT_MEMBER_ID } from './data/network'

const MEMBER_NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, page: Dashboard, title: 'Dashboard', subtitle: 'Your qualification and earnings this period' },
  { key: 'genealogy', label: 'Organisation', icon: Network, page: Genealogy, title: 'Organisation', subtitle: 'Your downline and who qualifies' },
  { key: 'earnings', label: 'Earnings', icon: ReceiptText, page: Earnings, title: 'Earnings', subtitle: 'Every order that paid you, traceable to the sale' },
  { key: 'orders', label: 'Orders', icon: ShoppingBag, page: Orders, title: 'Orders', subtitle: 'Personal, autoship and retail customer sales' },
  { key: 'wallet', label: 'Wallet', icon: WalletIcon, page: Wallet, title: 'Wallet', subtitle: 'Accrued, released and withdrawn' },
  { key: 'rank', label: 'Rank', icon: Award, page: Rank, title: 'Rank', subtitle: 'Recognised title, paid-as rank and unlocked depth' },
]

const ADMIN_NAV = [
  { key: 'dashboard', label: 'Overview', icon: LayoutDashboard, page: AdminDashboard, title: 'Company overview', subtitle: 'Volume, field health and plan exposure' },
  { key: 'run', label: 'Commission run', icon: Calculator, page: CommissionRun, title: 'Commission run', subtitle: 'Calculate, check, approve and release' },
  { key: 'distributors', label: 'Distributors', icon: Users, page: Distributors, title: 'Distributors', subtitle: 'Register, verification and account status' },
  { key: 'orders', label: 'Orders & refunds', icon: PackageX, page: OrdersRefunds, title: 'Orders and refunds', subtitle: 'Order register, cooling-off and clawbacks' },
  { key: 'payouts', label: 'Payouts', icon: Banknote, page: Payouts, title: 'Payouts', subtitle: 'Withdrawal queue and release control' },
  { key: 'plan', label: 'Plan', icon: SlidersHorizontal, page: PlanConfig, title: 'Compensation plan', subtitle: 'Rates, thresholds and exposure modelling' },
  { key: 'compliance', label: 'Compliance', icon: Scale, page: Compliance, title: 'Compliance', subtitle: 'Act 500 licence tests and income disclosure' },
]

export default function App() {
  const [role, setRole] = useState('member')
  const [memberPage, setMemberPage] = useState('dashboard')
  const [adminPage, setAdminPage] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)

  const isMember = role === 'member'
  const nav = isMember ? MEMBER_NAV : ADMIN_NAV
  const active = isMember ? memberPage : adminPage
  const navigate = isMember ? setMemberPage : setAdminPage
  const current = nav.find((n) => n.key === active) ?? nav[0]
  const Page = current.page

  const me = byId[CURRENT_MEMBER_ID]
  const user = isMember
    ? { name: me.name, id: me.id, initials: 'AR' }
    : { name: 'Operations desk', id: 'ADM-0007', initials: 'OD' }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        role={role}
        onRoleChange={setRole}
        nav={nav}
        active={active}
        onNavigate={navigate}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        user={user}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopBar title={current.title} subtitle={current.subtitle} role={role} />
        <MobileNav nav={nav} active={active} onNavigate={navigate} />
        <main className="flex-1 px-4 py-5 sm:px-6"><Page /></main>
      </div>
    </div>
  )
}
