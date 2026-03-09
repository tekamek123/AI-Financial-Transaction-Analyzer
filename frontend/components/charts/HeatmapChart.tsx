'use client'

import { useState } from 'react'
import { Tooltip, ResponsiveContainer } from 'recharts'

interface HeatmapData {
  day: string
  hour: number
  value: number
  suspicious: number
}

interface HeatmapChartProps {
  data: HeatmapData[]
  className?: string
}

export default function HeatmapChart({ data, className = '' }: HeatmapChartProps) {
  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: number; value: number; suspicious: number } | null>(null)

  // Days of week in order
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Create a map for quick lookup
  const dataMap = new Map()
  data.forEach(item => {
    dataMap.set(`${item.day}-${item.hour}`, item)
  })

  // Get color based on suspicious rate
  const getColor = (value: number, suspicious: number) => {
    const suspiciousRate = value > 0 ? (suspicious / value) * 100 : 0
    
    if (suspiciousRate >= 25) return '#dc2626'  // red - very high suspicious rate
    if (suspiciousRate >= 15) return '#f97316'  // orange - high suspicious rate
    if (suspiciousRate >= 10) return '#f59e0b'  // yellow - medium suspicious rate
    if (suspiciousRate >= 5) return '#3b82f6'   // blue - low suspicious rate
    if (value > 0) return '#10b981'  // green - very low suspicious rate
    return '#f3f4f6'  // gray - no data
  }

  const getIntensity = (value: number, suspicious: number) => {
    const suspiciousRate = value > 0 ? (suspicious / value) * 100 : 0
    
    if (suspiciousRate >= 25) return 100
    if (suspiciousRate >= 15) return 80
    if (suspiciousRate >= 10) return 60
    if (suspiciousRate >= 5) return 40
    if (value > 0) return 20
    return 0
  }

  const handleCellHover = (day: string, hour: number) => {
    const cellData = dataMap.get(`${day}-${hour}`)
    if (cellData) {
      setHoveredCell(cellData)
    } else {
      setHoveredCell({ day, hour, value: 0, suspicious: 0 })
    }
  }

  const handleCellLeave = () => {
    setHoveredCell(null)
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">Transaction Activity Heatmap</h3>
        <p className="text-sm text-gray-500 mt-1">
          Transaction volume and suspicious activity by day and hour
        </p>
      </div>

      {/* Heatmap Grid */}
      <div className="relative">
        {/* Hour labels */}
        <div className="flex">
          <div className="w-12"></div>
          <div className="flex-1 grid grid-cols-24 gap-0">
            {hours.map(hour => (
              <div key={hour} className="text-xs text-gray-500 text-center">
                {hour}
              </div>
            ))}
          </div>
        </div>

        {/* Days with cells */}
        <div className="flex">
          {/* Day labels */}
          <div className="w-12 flex flex-col justify-around py-1">
            {daysOfWeek.map(day => (
              <div key={day} className="text-xs text-gray-500 h-6 flex items-center">
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap cells */}
          <div className="flex-1">
            <div className="grid grid-cols-24 gap-0">
              {daysOfWeek.map(day => (
                <div key={day} className="col-span-24 grid grid-cols-24 gap-0">
                  {hours.map(hour => {
                    const cellData = dataMap.get(`${day}-${hour}`)
                    const color = cellData ? getColor(cellData.value, cellData.suspicious) : '#f3f4f6'
                    const intensity = cellData ? getIntensity(cellData.value, cellData.suspicious) : 0
                    
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className="w-full h-6 border border-gray-100 cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-blue-400 hover:z-10"
                        style={{ 
                          backgroundColor: color,
                          opacity: intensity > 0 ? 0.3 + (intensity / 100) * 0.7 : 1
                        }}
                        onMouseEnter={() => handleCellHover(day, hour)}
                        onMouseLeave={handleCellLeave}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div className="absolute z-10 bg-white p-2 border border-gray-200 rounded shadow-lg text-xs"
             style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <div className="font-medium text-gray-900">
            {hoveredCell.day} {hoveredCell.hour}:00
          </div>
          <div className="text-gray-600">
            Total: {hoveredCell.value}
          </div>
          <div className="text-red-600">
            Suspicious: {hoveredCell.suspicious}
          </div>
          <div className="text-gray-500">
            Rate: {hoveredCell.value > 0 ? ((hoveredCell.suspicious / hoveredCell.value) * 100).toFixed(1) : 0}%
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Suspicious Rate Legend</h4>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 mr-1"></div>
              <span className="text-gray-600">No Data</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 mr-1"></div>
              <span className="text-gray-600">&lt;5%</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 mr-1"></div>
              <span className="text-gray-600">5-10%</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 mr-1"></div>
              <span className="text-gray-600">10-15%</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-500 mr-1"></div>
              <span className="text-gray-600">15-25%</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 mr-1"></div>
              <span className="text-gray-600">&gt;25%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">Busiest Period</p>
            <p className="text-sm font-semibold text-gray-900">
              {data.reduce((max, item) => item.value > max.value ? item : max).day} {
                String(data.reduce((max, item) => item.value > max.value ? item : max).hour).padStart(2, '0')
              }:00
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Highest Risk</p>
            <p className="text-sm font-semibold text-red-600">
              {data.reduce((max, item) => {
                const currentRate = item.value > 0 ? (item.suspicious / item.value) * 100 : 0
                const maxRate = max.value > 0 ? (max.suspicious / max.value) * 100 : 0
                return currentRate > maxRate ? item : max
              }).day} {
                String(data.reduce((max, item) => {
                  const currentRate = item.value > 0 ? (item.suspicious / item.value) * 100 : 0
                  const maxRate = max.value > 0 ? (max.suspicious / max.value) * 100 : 0
                  return currentRate > maxRate ? item : max
                }).hour).padStart(2, '0')
              }:00
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Weekend Activity</p>
            <p className="text-sm font-semibold text-gray-900">
              {data.filter(item => ['Sat', 'Sun'].includes(item.day)).reduce((sum, item) => sum + item.value, 0)} txns
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Night Activity</p>
            <p className="text-sm font-semibold text-gray-900">
              {data.filter(item => item.hour >= 22 || item.hour <= 5).reduce((sum, item) => sum + item.value, 0)} txns
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
