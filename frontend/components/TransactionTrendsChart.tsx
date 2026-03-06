'use client'

import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Mock data - in real app, this would come from API
const mockData = [
  { date: '2024-01-09', transactions: 145, amount: 32456, suspicious: 12 },
  { date: '2024-01-10', transactions: 189, amount: 45678, suspicious: 18 },
  { date: '2024-01-11', transactions: 167, amount: 38901, suspicious: 15 },
  { date: '2024-01-12', transactions: 234, amount: 56789, suspicious: 28 },
  { date: '2024-01-13', transactions: 198, amount: 42345, suspicious: 22 },
  { date: '2024-01-14', transactions: 156, amount: 34567, suspicious: 14 },
  { date: '2024-01-15', transactions: 178, amount: 40123, suspicious: 19 }
]

export default function TransactionTrendsChart() {
  // In real app, use this to fetch data
  // const { data: trendsData, isLoading } = useQuery({
  //   queryKey: ['analytics', 'transaction-trends'],
  //   queryFn: () => fetch('/api/v1/analytics/transaction-trends').then(res => res.json())
  // })

  const data = mockData

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Amount' ? `$${entry.value.toLocaleString()}` : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-medium text-gray-900">Transaction Trends</h3>
        <p className="text-sm text-gray-500 mt-1">
          Last 7 days overview
        </p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              }}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 12 }}
              label={{ value: 'Transactions', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              label={{ value: 'Amount ($)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="transactions"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Transactions"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="amount"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Amount"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="suspicious"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Suspicious"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">Avg Daily</p>
          <p className="text-lg font-bold text-blue-600">
            {Math.round(data.reduce((sum, item) => sum + item.transactions, 0) / data.length)}
          </p>
          <p className="text-xs text-gray-500">transactions</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">Total Volume</p>
          <p className="text-lg font-bold text-green-600">
            ${(data.reduce((sum, item) => sum + item.amount, 0)).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">7 days</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">Alert Rate</p>
          <p className="text-lg font-bold text-red-600">
            {((data.reduce((sum, item) => sum + item.suspicious, 0) / data.reduce((sum, item) => sum + item.transactions, 0)) * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500">suspicious</p>
        </div>
      </div>
    </div>
  )
}
