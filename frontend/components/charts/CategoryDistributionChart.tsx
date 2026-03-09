'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

interface CategoryData {
  category: string
  transactions: number
  amount: number
  suspiciousRate: number
}

interface CategoryDistributionChartProps {
  data: CategoryData[]
  className?: string
}

export default function CategoryDistributionChart({ data, className = '' }: CategoryDistributionChartProps) {
  // Colors for categories
  const COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
  ]

  // Transform data for pie chart
  const pieData = data.map(item => ({
    name: item.category,
    value: item.transactions,
    amount: item.amount,
    suspiciousRate: item.suspiciousRate
  }))

  // Transform data for bar chart
  const barData = data.map(item => ({
    category: item.category,
    transactions: item.transactions,
    suspiciousRate: item.suspiciousRate
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{data.name}</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              Transactions: <span className="font-medium text-gray-900">{data.value}</span>
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

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percent < 0.05) return null // Don't show label for small slices

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">Category Distribution</h3>
        <p className="text-sm text-gray-500 mt-1">
          Transaction volume and suspicious activity by category
        </p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry: any) => (
                <span className="text-sm">
                  {entry.payload.name}: {entry.payload.value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Suspicious Rate by Category */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Suspicious Rate by Category</h4>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="category" 
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                label={{ value: 'Suspicious Rate (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: any) => [`${value.toFixed(1)}%`, 'Suspicious Rate']}
              />
              <Bar 
                dataKey="suspiciousRate" 
                name="Suspicious Rate"
                radius={[4, 4, 0, 0]}
              >
                {barData.map((entry, index) => {
                  const color = entry.suspiciousRate >= 15 ? '#dc2626' :
                              entry.suspiciousRate >= 10 ? '#f59e0b' :
                              entry.suspiciousRate >= 5 ? '#3b82f6' : '#10b981'
                  return <Cell key={`cell-${index}`} fill={color} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-500">Categories</p>
          <p className="text-sm font-semibold text-gray-900">{data.length}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Total Volume</p>
          <p className="text-sm font-semibold text-gray-900">
            ${data.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Highest Risk</p>
          <p className="text-sm font-semibold text-gray-900">
            {data.reduce((max, item) => item.suspiciousRate > max.suspiciousRate ? item : max).category}
          </p>
        </div>
      </div>
    </div>
  )
}
