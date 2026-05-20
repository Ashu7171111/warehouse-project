'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'
import Navbar from '@/components/dashboard/Navbar'
import StatCard from '@/components/ui/StatCard'
import RouteForm from '@/components/forms/RouteForm'
import ResultPanel from '@/components/dashboard/ResultPanel'
import HistoryTable from '@/components/dashboard/HistoryTable'
import Analytics from '@/components/dashboard/Analytics'
import { optimizeRoute } from '@/lib/api'
import { RouteResult, RouteRequest, HistoryEntry, Warehouse } from '@/types'
import { Package, Route, Clock, Fuel, TrendingUp, Map as MapIcon, ArrowRight, Sparkles } from 'lucide-react'
import clsx from 'clsx'

// Dynamically import Leaflet map to avoid SSR issues
const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400">Loading map…</p>
      </div>
    </div>
  )
})

// ─── Tab titles ───────────────────────────────────────────────────────────────
const tabMeta: Record<string, { title: string; subtitle: string }> = {
  dashboard:  { title: 'Overview',          subtitle: 'Your delivery operations at a glance' },
  optimizer:  { title: 'Route Optimizer',   subtitle: 'TSP-powered shortest path solver' },
  history:    { title: 'Route History',     subtitle: 'Past route computations' },
  analytics:  { title: 'Analytics',         subtitle: 'Performance insights and trends' },
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [result, setResult] = useState<RouteResult | null>(null)
  const [currentWarehouse, setCurrentWarehouse] = useState<Warehouse>({ name: 'Warehouse', lat: 22.7196, lng: 75.8577 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  // Aggregate stats
  const totalDeliveries = history.reduce((s, e) => s + e.stops, 0)
  const totalDistance   = history.reduce((s, e) => s + e.distance, 0)
  const totalFuelCost   = history.reduce((s, e) => s + e.fuel_cost, 0)
  const avgTime         = history.length > 0
    ? history[history.length - 1]?.time || '—'
    : '—'

  const handleOptimize = useCallback(async (data: RouteRequest) => {
    setLoading(true)
    setError(null)
    setCurrentWarehouse({ ...data.warehouse })
    try {
      const res = await optimizeRoute(data)
      setResult(res)

      const entry: HistoryEntry = {
        id: Date.now().toString(),
        warehouse: data.warehouse.name,
        stops: res.stops_count,
        distance: res.distance,
        time: res.time,
        fuel_cost: res.fuel_cost,
        timestamp: res.timestamp,
      }
      setHistory(h => [entry, ...h])

      // Switch to optimizer view to show results
      setActiveTab('optimizer')
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to optimize route. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [])

  const tab = tabMeta[activeTab]

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar title={tab.title} subtitle={tab.subtitle} />

        <main className="flex-1 overflow-y-auto p-6">

          {/* ── DASHBOARD ─────────────────────────────── */}
          {activeTab === 'dashboard' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
              {/* Welcome banner */}
              <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
                <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
                  <div className="w-full h-full bg-white rounded-full blur-3xl" />
                </div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-blue-200" />
                    <span className="text-xs font-semibold text-blue-200 uppercase tracking-wide">Powered by TSP Optimization</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-1">Welcome to RouteFlow</h2>
                  <p className="text-blue-100 text-sm mb-4 max-w-md">
                    Optimize delivery routes in seconds using Google OR-Tools. Reduce fuel costs, save time, maximize efficiency.
                  </p>
                  <button
                    onClick={() => setActiveTab('optimizer')}
                    className="inline-flex items-center gap-2 bg-white text-blue-700 text-sm font-bold px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    Optimize a Route
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Total Deliveries"
                  value={totalDeliveries || 0}
                  icon={Package}
                  color="blue"
                  change={history.length > 0 ? `${history.length} routes` : 'Run first route'}
                  changeType="neutral"
                />
                <StatCard
                  label="Total Distance"
                  value={totalDistance > 0 ? `${totalDistance.toFixed(1)} km` : '0 km'}
                  icon={Route}
                  color="emerald"
                  change={result ? `Last: ${result.distance} km` : 'No data yet'}
                  changeType="neutral"
                />
                <StatCard
                  label="Est. Time (Last)"
                  value={avgTime}
                  icon={Clock}
                  color="amber"
                  change="Latest route"
                  changeType="neutral"
                />
                <StatCard
                  label="Total Fuel Cost"
                  value={totalFuelCost > 0 ? `₹${totalFuelCost.toFixed(0)}` : '₹0'}
                  icon={Fuel}
                  color="violet"
                  change={history.length > 0 ? `${history.length} computations` : 'No history'}
                  changeType="neutral"
                />
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: MapIcon, title: 'Optimize New Route', desc: 'Enter warehouse & stops to find optimal path', tab: 'optimizer', color: 'bg-blue-500' },
                  { icon: TrendingUp, title: 'View Analytics', desc: 'Distance and cost trends across all runs', tab: 'analytics', color: 'bg-emerald-500' },
                  { icon: Clock, title: 'Route History', desc: 'Browse all past optimization runs', tab: 'history', color: 'bg-amber-500' },
                ].map(({ icon: Icon, title, desc, tab: t, color }) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className="group text-left p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-white shadow-sm', color)}>
                      <Icon size={18} />
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-white text-sm mb-1">{title}</div>
                    <div className="text-xs text-slate-400">{desc}</div>
                    <div className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      Open <ArrowRight size={12} />
                    </div>
                  </button>
                ))}
              </div>

              {/* Recent history mini */}
              {history.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Recent Optimizations</h3>
                  <div className="space-y-2">
                    {history.slice(0, 3).map(e => (
                      <div key={e.id} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{e.warehouse}</div>
                          <div className="text-xs text-slate-400">{e.stops} stops • {new Date(e.timestamp).toLocaleTimeString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{e.distance} km</div>
                          <div className="text-xs text-slate-400">₹{e.fuel_cost}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── OPTIMIZER ─────────────────────────────── */}
          {activeTab === 'optimizer' && (
            <div className="max-w-7xl mx-auto">
              {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <span className="font-semibold">Error:</span>
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
                {/* Left: Form + Results */}
                <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
                  <RouteForm onSubmit={handleOptimize} loading={loading} />
                  {result && <ResultPanel result={result} warehouse={currentWarehouse} />}
                </div>

                {/* Right: Map */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" style={{ minHeight: '560px' }}>
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Live Map View</span>
                    </div>
                    {result && (
                      <div className="text-xs text-slate-400">{result.stops_count} stops plotted</div>
                    )}
                  </div>
                  <div style={{ height: 'calc(100% - 48px)' }}>
                    <MapView
                      warehouse={result ? currentWarehouse : undefined}
                      stops={result?.route_stops}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── HISTORY ───────────────────────────────── */}
          {activeTab === 'history' && (
            <div className="max-w-6xl mx-auto animate-fade-in">
              <HistoryTable entries={history} onClear={() => setHistory([])} />
            </div>
          )}

          {/* ── ANALYTICS ─────────────────────────────── */}
          {activeTab === 'analytics' && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              <Analytics history={history} />
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
