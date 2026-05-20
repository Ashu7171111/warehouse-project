'use client'

import { useState } from 'react'
import { Plus, Trash2, Zap, MapPin, Package, Gauge, DollarSign, AlertCircle } from 'lucide-react'
import { RouteRequest, Location } from '@/types'
import clsx from 'clsx'

interface RouteFormProps {
  onSubmit: (data: RouteRequest) => void
  loading: boolean
}

const DEMO_DATA: RouteRequest = {
  warehouse: { name: 'Main Warehouse', lat: 22.7196, lng: 75.8577 },
  locations: [
    { name: 'Stop A – Market', lat: 22.7352, lng: 75.8412 },
    { name: 'Stop B – Hospital', lat: 22.7058, lng: 75.8734 },
    { name: 'Stop C – Mall', lat: 22.7446, lng: 75.9012 },
    { name: 'Stop D – Station', lat: 22.7183, lng: 75.8843 },
  ],
  speed: 40,
  fuel_cost: 8,
}

export default function RouteForm({ onSubmit, loading }: RouteFormProps) {
  const [warehouse, setWarehouse] = useState({ name: '', lat: '', lng: '' })
  const [locations, setLocations] = useState<{ name: string; lat: string; lng: string }[]>([
    { name: '', lat: '', lng: '' },
    { name: '', lat: '', lng: '' },
  ])
  const [speed, setSpeed] = useState('40')
  const [fuelCost, setFuelCost] = useState('8')
  const [errors, setErrors] = useState<string[]>([])

  const loadDemo = () => {
    setWarehouse({ name: DEMO_DATA.warehouse.name, lat: String(DEMO_DATA.warehouse.lat), lng: String(DEMO_DATA.warehouse.lng) })
    setLocations(DEMO_DATA.locations.map(l => ({ name: l.name, lat: String(l.lat), lng: String(l.lng) })))
    setSpeed(String(DEMO_DATA.speed))
    setFuelCost(String(DEMO_DATA.fuel_cost))
    setErrors([])
  }

  const addLocation = () => setLocations(l => [...l, { name: '', lat: '', lng: '' }])
  const removeLocation = (i: number) => setLocations(l => l.filter((_, idx) => idx !== i))
  const updateLocation = (i: number, field: keyof Location, val: string) => {
    setLocations(l => l.map((loc, idx) => idx === i ? { ...loc, [field]: val } : loc))
  }

  const validate = (): boolean => {
    const errs: string[] = []
    if (!warehouse.name) errs.push('Warehouse name is required')
    if (!warehouse.lat || isNaN(Number(warehouse.lat))) errs.push('Valid warehouse latitude required')
    if (!warehouse.lng || isNaN(Number(warehouse.lng))) errs.push('Valid warehouse longitude required')

    const validLocs = locations.filter(l => l.name || l.lat || l.lng)
    if (validLocs.length < 1) errs.push('At least one delivery location required')
    validLocs.forEach((l, i) => {
      if (!l.name) errs.push(`Location ${i+1}: name required`)
      if (!l.lat || isNaN(Number(l.lat))) errs.push(`Location ${i+1}: valid latitude required`)
      if (!l.lng || isNaN(Number(l.lng))) errs.push(`Location ${i+1}: valid longitude required`)
    })

    if (!speed || isNaN(Number(speed)) || Number(speed) <= 0) errs.push('Valid vehicle speed required')
    if (!fuelCost || isNaN(Number(fuelCost)) || Number(fuelCost) < 0) errs.push('Valid fuel cost required')
    setErrors(errs)
    return errs.length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    const validLocs = locations.filter(l => l.name && l.lat && l.lng)
    onSubmit({
      warehouse: { name: warehouse.name, lat: Number(warehouse.lat), lng: Number(warehouse.lng) },
      locations: validLocs.map(l => ({ name: l.name, lat: Number(l.lat), lng: Number(l.lng) })),
      speed: Number(speed),
      fuel_cost: Number(fuelCost),
    })
  }

  const inputCls = 'w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
  const labelCls = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5'

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
            <MapPin size={14} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Route Configuration</h2>
        </div>
        <button
          onClick={loadDemo}
          className="text-xs font-medium px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
        >
          Load Demo
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-4 space-y-1">
            {errors.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle size={12} />
                {e}
              </div>
            ))}
          </div>
        )}

        {/* Warehouse */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Package size={14} className="text-blue-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Warehouse</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={labelCls}>Name</label>
              <input className={inputCls} placeholder="e.g. Main Distribution Center" value={warehouse.name} onChange={e => setWarehouse(w => ({...w, name: e.target.value}))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Latitude</label>
                <input className={inputCls} type="number" step="any" placeholder="22.7196" value={warehouse.lat} onChange={e => setWarehouse(w => ({...w, lat: e.target.value}))} />
              </div>
              <div>
                <label className={labelCls}>Longitude</label>
                <input className={inputCls} type="number" step="any" placeholder="75.8577" value={warehouse.lng} onChange={e => setWarehouse(w => ({...w, lng: e.target.value}))} />
              </div>
            </div>
          </div>
        </section>

        {/* Delivery Locations */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-emerald-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Delivery Stops ({locations.length})
              </span>
            </div>
            <button
              onClick={addLocation}
              disabled={locations.length >= 20}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors disabled:opacity-40"
            >
              <Plus size={12} />
              Add Stop
            </button>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {locations.map((loc, i) => (
              <div key={i} className="flex items-start gap-2 group">
                <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    <input
                      className="flex-1 text-xs bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-400 font-medium"
                      placeholder={`Location name (e.g. Stop ${String.fromCharCode(65+i)})`}
                      value={loc.name}
                      onChange={e => updateLocation(i, 'name', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input className={clsx(inputCls, 'text-xs py-1.5')} type="number" step="any" placeholder="Latitude" value={loc.lat} onChange={e => updateLocation(i, 'lat', e.target.value)} />
                    <input className={clsx(inputCls, 'text-xs py-1.5')} type="number" step="any" placeholder="Longitude" value={loc.lng} onChange={e => updateLocation(i, 'lng', e.target.value)} />
                  </div>
                </div>
                {locations.length > 1 && (
                  <button
                    onClick={() => removeLocation(i)}
                    className="mt-3 opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Parameters */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Gauge size={14} className="text-amber-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Vehicle Parameters</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Speed (km/h)</label>
              <div className="relative">
                <input className={inputCls} type="number" min="1" placeholder="40" value={speed} onChange={e => setSpeed(e.target.value)} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">km/h</span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Fuel Cost / KM</label>
              <div className="relative">
                <input className={inputCls} type="number" min="0" step="0.1" placeholder="8" value={fuelCost} onChange={e => setFuelCost(e.target.value)} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">₹/km</span>
              </div>
            </div>
          </div>
        </section>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={clsx(
            'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white transition-all duration-200',
            loading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-200 dark:shadow-blue-900 hover:shadow-xl active:scale-[0.98]'
          )}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Optimizing Route…
            </>
          ) : (
            <>
              <Zap size={16} />
              Optimize Route
            </>
          )}
        </button>
      </div>
    </div>
  )
}
