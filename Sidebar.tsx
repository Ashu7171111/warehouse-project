'use client'

import { useState } from 'react'
import { useTheme } from '@/app/layout'
import {
  LayoutDashboard, Map, History, BarChart3, Settings,
  Package, ChevronLeft, ChevronRight, Truck, Moon, Sun
} from 'lucide-react'
import clsx from 'clsx'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'optimizer', label: 'Route Optimizer', icon: Map },
  { id: 'history', label: 'Route History', icon: History },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { dark, toggle } = useTheme()

  return (
    <aside
      className={clsx(
        'relative flex flex-col h-screen transition-all duration-300 ease-in-out shrink-0',
        'bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800',
        collapsed ? 'w-[70px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className={clsx(
        'flex items-center gap-3 px-4 py-5 border-b border-slate-100 dark:border-slate-800',
        collapsed && 'justify-center px-0'
      )}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 shadow-lg shadow-blue-200 dark:shadow-blue-900">
          <Truck size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="font-bold text-slate-900 dark:text-white text-[15px] leading-tight">RouteFlow</div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Logistics Suite</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2 mb-3">Main Menu</div>
        )}
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
              collapsed && 'justify-center px-0',
              activeTab === id
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            )}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className={clsx(
              'shrink-0',
              activeTab === id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
            )} />
            {!collapsed && <span>{label}</span>}
            {!collapsed && activeTab === id && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
            )}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className={clsx('px-3 py-4 border-t border-slate-100 dark:border-slate-800 space-y-1', collapsed && 'px-1')}>
        <button
          onClick={toggle}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all',
            collapsed && 'justify-center px-0'
          )}
          title={dark ? 'Light mode' : 'Dark mode'}
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
          {!collapsed && <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
