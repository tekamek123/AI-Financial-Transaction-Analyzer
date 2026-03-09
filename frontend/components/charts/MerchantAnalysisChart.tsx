'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

interface MerchantData {
  merchant: string
  transactions: number
  amount: number
  suspiciousRate: number
}

interface MerchantAnalysisChartProps {
  data: MerchantData[]
  className?: string
}

export default function MerchantAnalysisChart({ data, className = '' }: MerchantAnalysisChartProps) {
  // Sort data by transaction count
  const sortedData = [...data].sort((a, b) => b.transactions - a.transactions)

  // Color based on suspicious rate
  const getBarColor = (suspiciousRate: number) => {
    if (suspiciousRate >= 15) return '#dc2626'  // red
    if (suspiciousRate >= 10) return '#f59e0b'  // yellow
    if (suspiciousRate >= 5) return '#3b82f6'   // blue
    return '#10b981'  // green
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              Transactions: <span className="font-medium text-gray-900">{data.transactions}</span>
            </p>
            <p className="text-sm text-gray-600">
              Amount: <span className="font-medium text-gray-900">${data.amount.toLocaleString()}</span>
            </p>
            <p className="text-sm text-gray-600">
              Suspicious Rate: <span className="font-medium text-gray-900">{data.suspiciousRate.toFixed(1)}%</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">Merchant Analysis</h3>
        <p className="text-sm text-gray-500 mt-1">
          Top merchants by transaction volume and suspicious activity
        </p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="merchant" 
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: 'Transactions', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="transactions" 
              name="Transactions"
              radius={[4, 4, 0, 0]}
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.suspiciousRate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center space-x-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
          <span className="text-gray-600">Low (&lt;5%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
          <span className="text-gray-600">Medium (5-10%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded mr-1"></div>
          <span className="text-gray-600">High (10-15%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
          <span className="text-gray-600">Critical (&gt;15%)</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-500">Total Merchants</p>
          <p className="text-sm font-semibold text-gray-900">{data.length}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Total Volume</p>
          <p className="text-sm font-semibold text-gray-900">
            ${data.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Avg Suspicious Rate</p>
          <p className="text-sm font-semibold text-gray-900">
            {(data.reduce((sum, item) => sum + item.suspiciousRate, 0) / data.length).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  )
}
