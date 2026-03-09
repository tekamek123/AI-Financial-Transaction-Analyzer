'use client'

import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts'

interface TimeBasedData {
  hour: number
  transactions: number
  suspiciousRate: number
}

interface TimeBasedPatternsChartProps {
  data: TimeBasedData[]
  className?: string
}

export default function TimeBasedPatternsChart({ data, className = '' }: TimeBasedPatternsChartProps) {
  // Transform data for better visualization
  const transformedData = data.map(item => ({
    ...item,
    hour: item.hour.toString().padStart(2, '0') + ':00',
    suspiciousCount: Math.round(item.transactions * (item.suspiciousRate / 100)),
    normalCount: item.transactions - Math.round(item.transactions * (item.suspiciousRate / 100))
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              Total: <span className="font-medium text-gray-900">{data.transactions}</span>
            </p>
            <p className="text-sm text-gray-600">
              Normal: <span className="font-medium text-green-600">{data.normalCount}</span>
            </p>
            <p className="text-sm text-gray-600">
              Suspicious: <span className="font-medium text-red-600">{data.suspiciousCount}</span>
            </p>
            <p className="text-sm text-gray-600">
              Rate: <span className="font-medium text-gray-900">{data.suspiciousRate.toFixed(1)}%</span>
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
        <h3 className="text-lg font-medium text-gray-900">Time-Based Patterns</h3>
        <p className="text-sm text-gray-500 mt-1">
          Transaction volume and suspicious activity by hour of day
        </p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={transformedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="hour" 
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 11 }}
              label={{ value: 'Transactions', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              label={{ value: 'Suspicious Rate (%)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Stacked bars for transactions */}
            <Bar yAxisId="left" dataKey="normalCount" stackId="transactions" fill="#10b981" name="Normal" />
            <Bar yAxisId="left" dataKey="suspiciousCount" stackId="transactions" fill="#ef4444" name="Suspicious" />
            
            {/* Line for suspicious rate */}
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="suspiciousRate" 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              name="Suspicious Rate (%)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Peak Hours Analysis */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Peak Hours Analysis</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Busiest Hour</p>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-gray-900">
                {transformedData.reduce((max, item) => item.transactions > max.transactions ? item : max).hour}
              </span>
              <span className="text-xs text-gray-500">
                ({Math.max(...data.map(item => item.transactions))} transactions)
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Highest Risk Hour</p>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-red-600">
                {transformedData.reduce((max, item) => item.suspiciousRate > max.suspiciousRate ? item : max).hour}
              </span>
              <span className="text-xs text-gray-500">
                ({Math.max(...data.map(item => item.suspiciousRate)).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Time Periods Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Time Periods Summary</h4>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="text-center">
            <p className="font-medium text-blue-600">Night (0-6)</p>
            <p className="text-gray-600">
              {data.filter(item => item.hour >= 0 && item.hour < 6).reduce((sum, item) => sum + item.transactions, 0)} txns
            </p>
            <p className="text-red-600">
              {(data.filter(item => item.hour >= 0 && item.hour < 6).reduce((sum, item) => sum + item.suspiciousRate, 0) / 6).toFixed(1)}% suspicious
            </p>
          </div>
          <div className="text-center">
            <p className="font-medium text-green-600">Day (6-18)</p>
            <p className="text-gray-600">
              {data.filter(item => item.hour >= 6 && item.hour < 18).reduce((sum, item) => sum + item.transactions, 0)} txns
            </p>
            <p className="text-red-600">
              {(data.filter(item => item.hour >= 6 && item.hour < 18).reduce((sum, item) => sum + item.suspiciousRate, 0) / 12).toFixed(1)}% suspicious
            </p>
          </div>
          <div className="text-center">
            <p className="font-medium text-purple-600">Evening (18-24)</p>
            <p className="text-gray-600">
              {data.filter(item => item.hour >= 18 && item.hour < 24).reduce((sum, item) => sum + item.transactions, 0)} txns
            </p>
            <p className="text-red-600">
              {(data.filter(item => item.hour >= 18 && item.hour < 24).reduce((sum, item) => sum + item.suspiciousRate, 0) / 6).toFixed(1)}% suspicious
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
