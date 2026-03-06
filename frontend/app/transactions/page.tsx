'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
import LoadingSpinner from '@/components/LoadingSpinner'
import { apiClient } from '@/utils/api'
import { useToastHelpers } from '@/components/Toast'

interface Transaction {
  id: string
  transaction_id: string
  amount: number
  timestamp: string
  merchant: string
  category: string
  account_id: string
  risk_score: number
  is_suspicious: boolean
  fraud_probability: number
  anomaly_score: number
  ai_explanation?: string
}

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRisk, setFilterRisk] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const { success: showSuccess } = useToastHelpers()

  // Mock data - in real app, use this to fetch data
  // const { data: transactions, isLoading, error } = useQuery({
  //   queryKey: ['transactions', { page: currentPage, search: searchTerm, risk: filterRisk }],
  //   queryFn: () => apiClient.transactions.getTransactions({
  //     page: currentPage,
  //     search: searchTerm,
  //     risk_filter: filterRisk
  //   })
  // })

  // Mock data for demonstration
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      transaction_id: 'txn_001',
      amount: 1250.00,
      timestamp: '2024-01-15T10:30:00Z',
      merchant: 'Amazon',
      category: 'Retail',
      account_id: 'ACC123',
      risk_score: 85.2,
      is_suspicious: true,
      fraud_probability: 75.8,
      anomaly_score: 92.3,
      ai_explanation: 'High amount transaction with unknown merchant detected during unusual hours'
    },
    {
      id: '2',
      transaction_id: 'txn_002',
      amount: 45.99,
      timestamp: '2024-01-15T09:15:00Z',
      merchant: 'Starbucks',
      category: 'Food',
      account_id: 'ACC123',
      risk_score: 12.3,
      is_suspicious: false,
      fraud_probability: 5.2,
      anomaly_score: 8.1
    },
    {
      id: '3',
      transaction_id: 'txn_003',
      amount: 5000.00,
      timestamp: '2024-01-14T23:45:00Z',
      merchant: 'Luxury Store',
      category: 'Retail',
      account_id: 'ACC789',
      risk_score: 78.9,
      is_suspicious: true,
      fraud_probability: 68.4,
      anomaly_score: 82.1,
      ai_explanation: 'Large transaction during late night hours'
    },
    {
      id: '4',
      transaction_id: 'txn_004',
      amount: 89.50,
      timestamp: '2024-01-14T18:22:00Z',
      merchant: 'Target',
      category: 'Retail',
      account_id: 'ACC456',
      risk_score: 25.1,
      is_suspicious: false,
      fraud_probability: 15.3,
      anomaly_score: 22.7
    }
  ]

  const transactions = mockTransactions
  const isLoading = false
  const error = null

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.account_id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRisk = filterRisk === 'all' ||
                       (filterRisk === 'suspicious' && transaction.is_suspicious) ||
                       (filterRisk === 'high' && transaction.risk_score >= 70) ||
                       (filterRisk === 'medium' && transaction.risk_score >= 40 && transaction.risk_score < 70) ||
                       (filterRisk === 'low' && transaction.risk_score < 40)
    
    return matchesSearch && matchesRisk
  })

  const getStatusBadge = (transaction: Transaction) => {
    if (transaction.is_suspicious) {
      return <span className="badge badge-danger">Suspicious</span>
    }
    
    if (transaction.risk_score >= 70) {
      return <span className="badge badge-warning">High Risk</span>
    }
    if (transaction.risk_score >= 40) {
      return <span className="badge badge-info">Medium Risk</span>
    }
    return <span className="badge badge-success">Low Risk</span>
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  const handleExport = () => {
    // In real app, implement CSV/JSON export
    showSuccess('Export Started', 'Transactions will be exported to CSV format')
  }

  const handleAnalyze = () => {
    // In real app, trigger AI analysis
    showSuccess('Analysis Started', 'AI analysis is running on selected transactions')
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Error loading transactions</h2>
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
                Transactions
              </h1>
              <p className="mt-2 text-gray-600">
                View and analyze all transaction data
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Link href="/transactions/upload" className="btn btn-primary">
                <PlusIcon className="h-4 w-4 mr-2" />
                Upload Transactions
              </Link>
              <button onClick={handleExport} className="btn btn-outline">
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export
              </button>
              <button onClick={handleAnalyze} className="btn btn-secondary">
                <EyeIcon className="h-4 w-4 mr-2" />
                Analyze
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
                />
              </div>
            </div>
            
            {/* Risk Filter */}
            <div className="sm:w-48">
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Risk Levels</option>
                <option value="suspicious">Suspicious Only</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.transaction_id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(transaction.timestamp), 'MMM d, yyyy HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{transaction.merchant}</div>
                        <div className="text-sm text-gray-500">{transaction.category}</div>
                        <div className="text-sm text-gray-500">{transaction.account_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${transaction.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${getRiskScoreColor(transaction.risk_score)}`}>
                          {transaction.risk_score.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">
                          FP: {transaction.fraud_probability.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(transaction)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          View
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          Analyze
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of 1
          </div>
          <div className="flex space-x-2">
            <button
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            >
              Previous
            </button>
            <button
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
              disabled={true} // Only one page in mock data
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
