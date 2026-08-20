import React from 'react'
import { ChevronsLeft, Settings, User, ShieldCheck, Search, Bell } from 'lucide-react'
import { Tag } from './ui'
import { PERIOD } from '../data/plan'

export function Sidebar({ role, onRoleChange, nav, active, onNavigate, collapsed, onToggle, user }) {
  return (
    <aside className={`hidden shrink-0 flex-col border-r border-ink-600 bg-ink-900 md:flex ${collapsed ? 'w-[76px]' : 'w-64'} transition-[width] duration-200`}>
      <div className="flex items-center justify-between px-5 py-5">
        {!collapsed && (
          <div>
            <div className="font-display text-lg font-semibold tracking-tight text-ivory">Ledgerline</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-ivory-faint">
              {role === 'admin' ? 'Back office' : 'Distributor portal'}
            </div>
          </div>
        )}
        <button onClick={onToggle} className="rounded-md border border-ink-600 p-1.5 text-ivory-faint transition hover:border-gold-600/50 hover:text-gold-400" aria-label="Toggle sidebar">
          <ChevronsLeft size={14} className={`transition ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="px-3 pb-2">
        <div className={`flex rounded-md border border-ink-600 bg-ink-800/60 p-1 text-xs ${collapsed ? 'flex-col gap-1' : ''}`}>
          {[['member', 'Distributor', User], ['admin', 'Back office', ShieldCheck]].map(([key, label, Icon]) => (
            <button key={key} onClick={() => onRoleChange(key)} title={label}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 transition ${
                role === key ? 'bg-gold-500/15 text-gold-400' : 'text-ivory-faint hover:text-ivory-dim'}`}>
              <Icon size={12} />
              {!collapsed && label}
            </button>
          ))}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pt-1">
        {nav.map((item) => {
          const isActive = active === item.key
          const Icon = item.icon
          return (
            <button key={item.key} onClick={() => onNavigate(item.key)} title={item.label}
              className={`group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${
                isActive ? 'bg-gold-500/10 text-gold-400' : 'text-ivory-dim hover:bg-ink-700/60 hover:text-ivory'}`}>
              <Icon size={17} strokeWidth={1.75} className={isActive ? 'text-gold-400' : 'text-ivory-faint group-hover:text-ivory-dim'} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && isActive && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-ink-600 p-3">
        <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-ivory-dim transition hover:bg-ink-700/60 hover:text-ivory">
          <Settings size={17} strokeWidth={1.75} className="text-ivory-faint" />
          {!collapsed && <span>Settings</span>}
        </button>
        <div className={`mt-2 flex items-center gap-3 rounded-md px-3 py-2 ${collapsed ? 'justify-center' : ''}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold-600/40 bg-gold-500/10 font-display text-xs text-gold-400">
            {user.initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm text-ivory">{user.name}</div>
              <div className="tnum truncate font-mono text-[11px] text-ivory-faint">{user.id}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export function TopBar({ title, subtitle, role }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-ink-600 bg-ink-950/90 px-6 py-3.5 backdrop-blur">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="truncate font-display text-lg font-medium text-ivory">{title}</h1>
          {role === 'admin' && <Tag tone="warn"><ShieldCheck size={10} />Back office</Tag>}
        </div>
        <p className="truncate text-xs text-ivory-faint">{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden items-center gap-2 rounded-md border border-ink-600 bg-ink-800/60 px-3 py-2 text-sm text-ivory-faint lg:flex">
          <Search size={14} />
          <input placeholder="Search distributors, orders…" className="w-44 bg-transparent text-ivory placeholder:text-ivory-faint focus:outline-none" />
        </div>
        <div className="hidden rounded-md border border-ink-600 bg-ink-800/60 px-3 py-2 text-xs text-ivory-dim sm:block">
          {PERIOD.label}
        </div>
        <button className="relative rounded-md border border-ink-600 bg-ink-800/60 p-2 text-ivory-dim">
          <Bell size={16} />
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-rose-500" />
        </button>
      </div>
    </header>
  )
}

export function MobileNav({ nav, active, onNavigate }) {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-ink-600 bg-ink-900 px-3 py-2 md:hidden">
      {nav.map((item) => (
        <button key={item.key} onClick={() => onNavigate(item.key)}
          className={`shrink-0 rounded-md px-3 py-1.5 text-xs ${active === item.key ? 'bg-gold-500/10 text-gold-400' : 'text-ivory-dim'}`}>
          {item.label}
        </button>
      ))}
    </nav>
  )
}
