'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import {
  ArrowPathIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'
import LoadingSpinner from '@/components/LoadingSpinner'
import RiskTrendsChart from '@/components/charts/RiskTrendsChart'
import MerchantAnalysisChart from '@/components/charts/MerchantAnalysisChart'
import CategoryDistributionChart from '@/components/charts/CategoryDistributionChart'
import TimeBasedPatternsChart from '@/components/charts/TimeBasedPatternsChart'
import SuspiciousPatternsChart from '@/components/charts/SuspiciousPatternsChart'
import HeatmapChart from '@/components/charts/HeatmapChart'
import { apiClient } from '@/utils/api'
import { useToastHelpers } from '@/components/Toast'

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('7d') // 7d, 30d, 90d
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all')
  const { success: showSuccess } = useToastHelpers()

  // Mock data - in real app, use this to fetch data
  // const { data: analyticsData, isLoading, error } = useQuery({
  //   queryKey: ['analytics', { dateRange, riskLevel: selectedRiskLevel }],
  //   queryFn: () => apiClient.analytics.getAnalytics({
  //     date_range: dateRange,
  //     risk_level: selectedRiskLevel
  //   })
  // })

  const isLoading = false
  const error = null

  // Mock data for demonstration
  const mockAnalyticsData = {
    overview: {
      totalTransactions: 15420,
      totalAmount: 2845678.90,
      suspiciousTransactions: 342,
      fraudPrevented: 45678.32,
      avgRiskScore: 18.5,
      changePercent: 12.3
    },
    riskTrends: [
      { date: '2024-01-09', lowRisk: 145, mediumRisk: 23, highRisk: 12, criticalRisk: 3 },
      { date: '2024-01-10', lowRisk: 189, mediumRisk: 28, highRisk: 18, criticalRisk: 5 },
      { date: '2024-01-11', lowRisk: 167, mediumRisk: 25, highRisk: 15, criticalRisk: 4 },
      { date: '2024-01-12', lowRisk: 234, mediumRisk: 34, highRisk: 28, criticalRisk: 8 },
      { date: '2024-01-13', lowRisk: 198, mediumRisk: 30, highRisk: 22, criticalRisk: 6 },
      { date: '2024-01-14', lowRisk: 156, mediumRisk: 22, highRisk: 14, criticalRisk: 2 },
      { date: '2024-01-15', lowRisk: 178, mediumRisk: 26, highRisk: 19, criticalRisk: 4 }
    ],
    merchantAnalysis: [
      { merchant: 'Amazon', transactions: 342, amount: 45678.90, suspiciousRate: 8.5 },
      { merchant: 'Walmart', transactions: 289, amount: 34567.23, suspiciousRate: 5.2 },
      { merchant: 'Target', transactions: 234, amount: 28901.45, suspiciousRate: 6.8 },
      { merchant: 'Starbucks', transactions: 456, amount: 12345.67, suspiciousRate: 2.1 },
      { merchant: 'Shell', transactions: 189, amount: 56789.12, suspiciousRate: 4.3 },
      { merchant: 'Apple Store', transactions: 123, amount: 67890.34, suspiciousRate: 12.4 }
    ],
    categoryDistribution: [
      { category: 'Retail', transactions: 1234, amount: 234567.89, suspiciousRate: 7.2 },
      { category: 'Food', transactions: 890, amount: 34567.23, suspiciousRate: 3.4 },
      { category: 'Gas', transactions: 456, amount: 78901.45, suspiciousRate: 5.6 },
      { category: 'Electronics', transactions: 234, amount: 123456.78, suspiciousRate: 11.2 },
      { category: 'Transfer', transactions: 123, amount: 234567.89, suspiciousRate: 15.8 },
      { category: 'Entertainment', transactions: 345, amount: 23456.78, suspiciousRate: 4.1 }
    ],
    timeBasedPatterns: [
      { hour: 0, transactions: 23, suspiciousRate: 8.7 },
      { hour: 1, transactions: 12, suspiciousRate: 16.7 },
      { hour: 2, transactions: 8, suspiciousRate: 25.0 },
      { hour: 3, transactions: 5, suspiciousRate: 40.0 },
      { hour: 4, transactions: 3, suspiciousRate: 33.3 },
      { hour: 5, transactions: 7, suspiciousRate: 14.3 },
      { hour: 6, transactions: 15, suspiciousRate: 6.7 },
      { hour: 7, transactions: 34, suspiciousRate: 8.8 },
      { hour: 8, transactions: 56, suspiciousRate: 5.4 },
      { hour: 9, transactions: 78, suspiciousRate: 3.8 },
      { hour: 10, transactions: 89, suspiciousRate: 4.5 },
      { hour: 11, transactions: 92, suspiciousRate: 3.3 },
      { hour: 12, transactions: 87, suspiciousRate: 2.3 },
      { hour: 13, transactions: 94, suspiciousRate: 4.3 },
      { hour: 14, transactions: 88, suspiciousRate: 5.7 },
      { hour: 15, transactions: 76, suspiciousRate: 6.6 },
      { hour: 16, transactions: 65, suspiciousRate: 7.7 },
      { hour: 17, revenues: 54, suspiciousRate: 9.3 },
      { hour: 18, transactions: 43, suspiciousRate: 11.6 },
      { hour: 19, transactions: 38, suspiciousRate: 13.2 },
      { hour: 20, transactions: 32, suspiciousRate: 15.6 },
      { hour: 21, transactions: 28, suspiciousRate: 17.9 },
      { hour: 22, transactions: 19, suspiciousRate: 21.1 },
      { hour: 23, transactions: 11, suspiciousRate: 27.3 }
    ],
    suspiciousPatterns: [
      { pattern: 'High Amount + Night Time', count: 45, riskScore: 85.2 },
      { pattern: 'Unknown Merchant + High Frequency', count: 23, riskScore: 78.9 },
      { pattern: 'Unusual Category + Large Amount', count: 18, riskScore: 72.3 },
      { pattern: 'Weekend + High Value', count: 34, riskScore: 68.7 },
      { pattern: 'International + Quick Succession', count: 12, riskScore: 91.4 }
    ],
    heatmapData: [
      { day: 'Mon', hour: 0, value: 12, suspicious: 2 },
      { day: 'Mon', hour: 6, value: 34, suspicious: 3 },
      { day: 'Mon', hour: 12, value: 89, suspicious: 4 },
      { day: 'Mon', hour: 18, value: 45, suspicious: 7 },
      { day: 'Tue', hour: 0, value: 8, suspicious: 1 },
      { day: 'Tue', hour: 6, value: 28, suspicious: 2 },
      { day: 'Tue', hour: 12, value: 76, suspicious: 3 },
      { day: 'Tue', hour: 18, value: 52, suspicious: 8 },
      { day: 'Wed', hour: 0, value: 15, suspicious: 3 },
      { day: 'Wed', hour: 6, value: 41, suspicious: 4 },
      { day: 'Wed', hour: 12, value: 92, suspicious: 5 },
      { day: 'Wed', hour: 18, value: 38, suspicious: 6 },
      { day: 'Thu', hour: 0, value: 10, suspicious: 2 },
      { day: 'Thu', hour: 6, value: 36, suspicious: 3 },
      { day: 'Thu', hour: 12, value: 84, suspicious: 4 },
      { day: 'Thu', hour: 18, value: 48, suspicious: 9 },
      { day: 'Fri', hour: 0, value: 18, suspicious: 4 },
      { day: 'Fri', hour: 6, value: 45, suspicious: 5 },
      { day: 'Fri', hour: 12, value: 98, suspicious: 6 },
      { day: 'Fri', hour: 18, value: 67, suspicious: 12 },
      { day: 'Sat', hour: 0, value: 25, suspicious: 8 },
      { day: 'Sat', hour: 6, value: 22, suspicious: 3 },
      { day: 'Sat', hour: 12, value: 56, suspicious: 4 },
      { day: 'Sat', hour: 18, value: 78, suspicious: 15 },
      { day: 'Sun', hour: 0, value: 22, suspicious: 7 },
      { day: 'Sun', hour: 6, value: 19, suspicious: 2 },
      { day: 'Sun', hour: 12, value: 43, suspicious: 3 },
      { day: 'Sun', hour: 18, value: 61, suspicious: 11 }
    ]
  }

  const analyticsData = mockAnalyticsData

  const handleRefresh = () => {
    showSuccess('Data Refreshed', 'Analytics data has been updated')
  }

  const handleExport = () => {
    showSuccess('Export Started', 'Analytics report will be generated and downloaded')
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Error loading analytics</h2>
          <p className="text-gray-500">Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Analytics Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                Comprehensive analysis of transaction patterns and fraud detection
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button onClick={handleRefresh} className="btn btn-outline">
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Refresh
              </button>
              <button onClick={handleExport} className="btn btn-outline">
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Date Range Filter */}
            <div className="sm:w-48">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
            
            {/* Risk Level Filter */}
            <div className="sm:w-48">
              <select
                value={selectedRiskLevel}
                onChange={(e) => setSelectedRiskLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Risk Levels</option>
                <option value="high">High Risk Only</option>
                <option value="medium">Medium Risk Only</option>
                <option value="low">Low Risk Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="stat-card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 text-blue-500">📊</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Transactions
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {analyticsData.overview.totalTransactions.toLocaleString()}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline text-sm">
                  <p className="text-green-600 font-medium">
                    +{analyticsData.overview.changePercent}%
                  </p>
                  <p className="text-gray-500 ml-2">from last period</p>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 text-green-500">💰</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Amount
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        ${analyticsData.overview.totalAmount.toLocaleString()}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 text-red-500">⚠️</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Suspicious Transactions
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {analyticsData.overview.suspiciousTransactions.toLocaleString()}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 text-yellow-500">🛡️</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Fraud Prevented
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        ${analyticsData.overview.fraudPrevented.toLocaleString()}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Risk Trends Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RiskTrendsChart data={analyticsData.riskTrends} />
              <MerchantAnalysisChart data={analyticsData.merchantAnalysis} />
            </div>

            {/* Category Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CategoryDistributionChart data={analyticsData.categoryDistribution} />
              <TimeBasedPatternsChart data={analyticsData.timeBasedPatterns} />
            </div>

            {/* Suspicious Patterns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SuspiciousPatternsChart data={analyticsData.suspiciousPatterns} />
              <HeatmapChart data={analyticsData.heatmapData} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
