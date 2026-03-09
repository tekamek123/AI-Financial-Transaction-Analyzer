'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { format } from 'date-fns'

interface RiskTrendsData {
  date: string
  lowRisk: number
  mediumRisk: number
  highRisk: number
  criticalRisk: number
}

interface RiskTrendsChartProps {
  data: RiskTrendsData[]
  className?: string
}

export default function RiskTrendsChart({ data, className = '' }: RiskTrendsChartProps) {
  // Transform data for stacked area chart
  const transformedData = data.map(item => ({
    ...item,
    total: item.lowRisk + item.mediumRisk + item.highRisk + item.criticalRisk,
    date: format(new Date(item.date), 'MMM dd')
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
          <p className="text-xs text-gray-500 mt-1">
            Total: {payload.reduce((sum: number, entry: any) => sum + entry.value, 0)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">Risk Trends Over Time</h3>
        <p className="text-sm text-gray-500 mt-1">
          Transaction risk level distribution
        </p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={transformedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: 'Transactions', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Stacked areas */}
            <Area
              type="monotone"
              dataKey="criticalRisk"
              stackId="risk"
              stroke="#dc2626"
              fill="#dc2626"
              fillOpacity={0.8}
              name="Critical"
            />
            <Area
              type="monotone"
              dataKey="highRisk"
              stackId="risk"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.8}
              name="High"
            />
            <Area
              type="monotone"
              dataKey="mediumRisk"
              stackId="risk"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.8}
              name="Medium"
            />
            <Area
              type="monotone"
              dataKey="lowRisk"
              stackId="risk"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.8}
              name="Low"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">Low</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            {data.reduce((sum, item) => sum + item.lowRisk, 0)}
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">Medium</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            {data.reduce((sum, item) => sum + item.mediumRisk, 0)}
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">High</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            {data.reduce((sum, item) => sum + item.highRisk, 0)}
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">Critical</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            {data.reduce((sum, item) => sum + item.criticalRisk, 0)}
          </p>
        </div>
      </div>
    </div>
  )
}
