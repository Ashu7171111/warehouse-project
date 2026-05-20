'use client'

import { useEffect, useRef } from 'react'
import { RouteStop, Warehouse } from '@/types'

interface MapViewProps {
  warehouse?: Warehouse
  stops?: RouteStop[]
  center?: [number, number]
  zoom?: number
}

export default function MapView({ warehouse, stops, center, zoom = 13 }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<any>(null)
  const layerGroupRef = useRef<any>(null)
  const LRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!containerRef.current) return

    import('leaflet').then(L => {
      if (!containerRef.current) return
      const container = containerRef.current as any
      if (container._leaflet_id) {
        container._leaflet_id = null
      }
      if (instanceRef.current) {
        instanceRef.current.remove()
        instanceRef.current = null
      }
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
      const map = L.map(containerRef.current, {
        center: center || [22.7196, 75.8577],
        zoom,
        zoomControl: true,
      })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)
      instanceRef.current = map
      layerGroupRef.current = L.layerGroup().addTo(map)
      LRef.current = L
    })

    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove()
        instanceRef.current = null
        layerGroupRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!instanceRef.current || !layerGroupRef.current || !LRef.current) return
    const L = LRef.current
    layerGroupRef.current.clearLayers()
    const allLatLngs: [number, number][] = []

    if (warehouse) {
      const warehouseIcon = L.divIcon({
        html: `<div style="width:36px;height:36px;background:linear-gradient(135deg,#2563eb,#1d4ed8);border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 12px rgba(37,99,235,0.4);font-size:16px;">📦</div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
      })
      L.marker([warehouse.lat, warehouse.lng], { icon: warehouseIcon, zIndexOffset: 1000 })
        .addTo(layerGroupRef.current)
        .bindPopup(`<div style="font-weight:700;color:#1e40af;font-size:13px;">${warehouse.name}</div><div style="font-size:11px;color:#64748b">🏭 Start / End Point</div>`)
      allLatLngs.push([warehouse.lat, warehouse.lng])
    }

    if (stops && stops.length > 0) {
      const colors = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#8b5cf6','#ec4899','#14b8a6']
      stops.forEach((stop, i) => {
        if (stop.name === (warehouse?.name || 'Warehouse') && (i === 0 || i === stops.length - 1)) return
        const color = colors[i % colors.length]
        const stopIcon = L.divIcon({
          html: `<div style="width:30px;height:30px;background:${color};border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:800;border:2.5px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.25);">${stop.order}</div>`,
          className: '',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          popupAnchor: [0, -15],
        })
        L.marker([stop.lat, stop.lng], { icon: stopIcon })
          .addTo(layerGroupRef.current)
          .bindPopup(`<div style="font-weight:700;font-size:13px;">${stop.name}</div><div style="background:${color};color:white;font-size:11px;font-weight:600;padding:3px 8px;border-radius:6px;display:inline-block;margin-top:6px">Stop #${stop.order}</div>`)
        allLatLngs.push([stop.lat, stop.lng])
      })
      if (stops.length > 1) {
        const routeCoords = stops.map(s => [s.lat, s.lng] as [number, number])
        L.polyline(routeCoords, { color: '#e2e8f0', weight: 5, opacity: 0.8 }).addTo(layerGroupRef.current)
        L.polyline(routeCoords, { color: '#3b82f6', weight: 3, opacity: 0.9, dashArray: '8, 4' }).addTo(layerGroupRef.current)
      }
    }

    if (allLatLngs.length > 1) {
      instanceRef.current.fitBounds(allLatLngs, { padding: [40, 40] })
    } else if (allLatLngs.length === 1) {
      instanceRef.current.setView(allLatLngs[0], 14)
    }
  }, [warehouse, stops])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', minHeight: '400px' }}
        className="rounded-xl overflow-hidden"
      />
    </>
  )
}