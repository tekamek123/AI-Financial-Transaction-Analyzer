'use client'

import { useState } from 'react'
import { 
  ChartBarIcon, 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  DocumentTextIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import Sidebar from './Sidebar'
import Header from './Header'
import OverviewCards from './OverviewCards'
import RecentTransactions from './RecentTransactions'
import AlertsPanel from './AlertsPanel'
import RiskDistributionChart from './RiskDistributionChart'
import TransactionTrendsChart from './TransactionTrendsChart'

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <Sidebar open={false} onClose={() => {}} />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                Financial Transaction Analyzer
              </h1>
              <p className="mt-2 text-gray-600">
                AI-powered fraud detection and transaction monitoring dashboard
              </p>
            </div>

            {/* Overview cards */}
            <OverviewCards />

            {/* Charts and recent transactions */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Risk Distribution Chart */}
              <RiskDistributionChart />
              
              {/* Transaction Trends Chart */}
              <TransactionTrendsChart />
            </div>

            {/* Recent transactions and alerts */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Recent Transactions */}
              <RecentTransactions />
              
              {/* Alerts Panel */}
              <AlertsPanel />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
