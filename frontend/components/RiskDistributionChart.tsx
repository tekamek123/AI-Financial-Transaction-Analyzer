'use client'

import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

// Mock data - in real app, this would come from API
const mockData = [
  { name: 'Low Risk', value: 856, color: '#10b981' },
  { name: 'Medium Risk', value: 234, color: '#f59e0b' },
  { name: 'High Risk', value: 89, color: '#ef4444' },
  { name: 'Critical Risk', value: 23, color: '#991b1b' }
]

export default function RiskDistributionChart() {
  // In real app, use this to fetch data
  // const { data: riskData, isLoading } = useQuery({
  //   queryKey: ['analytics', 'risk-distribution'],
  //   queryFn: () => fetch('/api/v1/analytics/risk-distribution').then(res => res.json())
  // })

  const data = mockData

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {data.value} transactions ({((data.value / data.payload.total) * 100).toFixed(1)}%)
          </p>
        </div>
      )
    }
    return null
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-medium text-gray-900">Risk Distribution</h3>
        <p className="text-sm text-gray-500 mt-1">
          Total: {total.toLocaleString()} transactions
        </p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.map(item => ({ ...item, total }))}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${((entry.value / entry.total) * 100).toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry: any) => (
                <span className="text-sm">
                  {value}: {entry.payload.value.toLocaleString()}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center space-x-3">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{item.name}</p>
              <p className="text-xs text-gray-500">
                {item.value.toLocaleString()} ({((item.value / total) * 100).toFixed(1)}%)
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
