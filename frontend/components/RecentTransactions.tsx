'use client'

import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'

// Mock data - in real app, this would come from API
const mockTransactions = [
  {
    id: 'txn_001',
    amount: 1250.00,
    merchant: 'Amazon',
    category: 'Retail',
    timestamp: '2024-01-15T10:30:00Z',
    riskScore: 85.2,
    isSuspicious: true,
    status: 'high'
  },
  {
    id: 'txn_002',
    amount: 45.99,
    merchant: 'Starbucks',
    category: 'Food',
    timestamp: '2024-01-15T09:15:00Z',
    riskScore: 12.3,
    isSuspicious: false,
    status: 'low'
  },
  {
    id: 'txn_003',
    amount: 5000.00,
    merchant: 'Luxury Store',
    category: 'Retail',
    timestamp: '2024-01-14T23:45:00Z',
    riskScore: 78.9,
    isSuspicious: true,
    status: 'high'
  },
  {
    id: 'txn_004',
    amount: 89.50,
    merchant: 'Target',
    category: 'Retail',
    timestamp: '2024-01-14T18:22:00Z',
    riskScore: 25.1,
    isSuspicious: false,
    status: 'medium'
  },
  {
    id: 'txn_005',
    amount: 250.00,
    merchant: 'Gas Station',
    category: 'Gas',
    timestamp: '2024-01-14T15:10:00Z',
    riskScore: 18.7,
    isSuspicious: false,
    status: 'low'
  }
]

export default function RecentTransactions() {
  // In real app, use this to fetch data
  // const { data: transactions, isLoading } = useQuery({
  //   queryKey: ['transactions', 'recent'],
  //   queryFn: () => fetch('/api/v1/transactions?limit=10').then(res => res.json())
  // })

  const transactions = mockTransactions

  const getStatusBadge = (status: string, isSuspicious: boolean) => {
    if (isSuspicious) {
      return <span className="badge badge-danger">Suspicious</span>
    }
    
    switch (status) {
      case 'high':
        return <span className="badge badge-warning">High Risk</span>
      case 'medium':
        return <span className="badge badge-info">Medium Risk</span>
      case 'low':
        return <span className="badge badge-success">Low Risk</span>
      default:
        return <span className="badge badge-gray">Unknown</span>
    }
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
        <div className="mt-3 sm:mt-0 sm:ml-4 sm:flex-shrink-0">
          <button
            type="button"
            className="btn btn-outline"
          >
            View All
          </button>
        </div>
      </div>
      
      <div className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Merchant
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Score
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.id}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(transaction.timestamp), 'MMM d, yyyy HH:mm')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{transaction.merchant}</div>
                    <div className="text-sm text-gray-500">{transaction.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${transaction.amount.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getRiskScoreColor(transaction.riskScore)}`}>
                      {transaction.riskScore.toFixed(1)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(transaction.status, transaction.isSuspicious)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
