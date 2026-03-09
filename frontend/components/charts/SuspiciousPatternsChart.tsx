'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

interface SuspiciousPatternData {
  pattern: string
  count: number
  riskScore: number
}

interface SuspiciousPatternsChartProps {
  data: SuspiciousPatternData[]
  className?: string
}

export default function SuspiciousPatternsChart({ data, className = '' }: SuspiciousPatternsChartProps) {
  // Sort data by risk score
  const sortedData = [...data].sort((a, b) => b.riskScore - a.riskScore)

  // Transform data for radar chart
  const radarData = data.map(item => ({
    pattern: item.pattern.split(' ')[0], // Take first word for radar chart
    fullPattern: item.pattern,
    count: item.count,
    riskScore: item.riskScore,
    normalizedCount: (item.count / Math.max(...data.map(d => d.count))) * 100,
    normalizedRisk: item.riskScore
  }))

  // Color based on risk score
  const getBarColor = (riskScore: number) => {
    if (riskScore >= 85) return '#dc2626'  // red
    if (riskScore >= 75) return '#f59e0b'  // yellow
    if (riskScore >= 65) return '#3b82f6'   // blue
    return '#10b981'  // green
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{data.fullPattern || label}</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              Occurrences: <span className="font-medium text-gray-900">{data.count}</span>
            </p>
            <p className="text-sm text-gray-600">
              Risk Score: <span className="font-medium text-gray-900">{data.riskScore.toFixed(1)}</span>
            </p>
            <p className="text-sm text-gray-600">
              Severity: <span className={`font-medium ${getRiskSeverityColor(data.riskScore)}`}>
                {getRiskSeverity(data.riskScore)}
              </span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  const getRiskSeverity = (score: number) => {
    if (score >= 85) return 'Critical'
    if (score >= 75) return 'High'
    if (score >= 65) return 'Medium'
    return 'Low'
  }

  const getRiskSeverityColor = (score: number) => {
    if (score >= 85) return 'text-red-600'
    if (score >= 75) return 'text-yellow-600'
    if (score >= 65) return 'text-blue-600'
    return 'text-green-600'
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">Suspicious Patterns</h3>
        <p className="text-sm text-gray-500 mt-1">
          Common fraud patterns and their risk scores
        </p>
      </div>
      
      {/* Bar Chart */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="pattern" 
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 11 }}
              label={{ value: 'Risk Score', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="riskScore" 
              name="Risk Score"
              radius={[4, 4, 0, 0]}
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.riskScore)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pattern Details */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">Pattern Details</h4>
        {sortedData.map((pattern, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getBarColor(pattern.riskScore) }}
                />
                <span className="text-sm font-medium text-gray-900">{pattern.pattern}</span>
              </div>
              <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                <span>{pattern.count} occurrences</span>
                <span>Score: {pattern.riskScore.toFixed(1)}</span>
                <span className={getRiskSeverityColor(pattern.riskScore)}>
                  {getRiskSeverity(pattern.riskScore)}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">{pattern.count}</div>
                <div className="text-xs text-gray-500">count</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">Total Patterns</p>
            <p className="text-sm font-semibold text-gray-900">{data.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Highest Risk</p>
            <p className="text-sm font-semibold text-red-600">
              {sortedData[0]?.riskScore.toFixed(1) || 'N/A'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Total Occurrences</p>
            <p className="text-sm font-semibold text-gray-900">
              {data.reduce((sum, item) => sum + item.count, 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
