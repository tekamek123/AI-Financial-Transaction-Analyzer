'use client'

import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import LoadingSpinner from './LoadingSpinner'

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

interface TransactionDetailModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
  onAnalyze?: (transactionId: string) => void
}

export default function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
  onAnalyze
}: TransactionDetailModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  if (!transaction) return null

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: 'Critical', color: 'text-red-600', bg: 'bg-red-100' }
    if (score >= 60) return { level: 'High', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    if (score >= 40) return { level: 'Medium', color: 'text-blue-600', bg: 'bg-blue-100' }
    return { level: 'Low', color: 'text-green-600', bg: 'bg-green-100' }
  }

  const riskLevel = getRiskLevel(transaction.risk_score)

  const handleAnalyze = async () => {
    if (onAnalyze) {
      setIsAnalyzing(true)
      try {
        await onAnalyze(transaction.transaction_id)
      } finally {
        setIsAnalyzing(false)
      }
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black bg-opacity-25" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                Transaction Details
              </Dialog.Title>
              <button
                onClick={onClose}
                className="rounded-md p-2 hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Transaction Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                  <p className="text-sm text-gray-900 font-mono">{transaction.transaction_id}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <p className="text-lg font-semibold text-gray-900">
                    ${transaction.amount.toFixed(2)}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Timestamp</label>
                  <p className="text-sm text-gray-900">
                    {format(new Date(transaction.timestamp), 'PPP p')}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Account ID</label>
                  <p className="text-sm text-gray-900 font-mono">{transaction.account_id}</p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Merchant</label>
                  <p className="text-sm text-gray-900">{transaction.merchant || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-sm text-gray-900">{transaction.category || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Risk Score</label>
                  <div className="flex items-center space-x-2">
                    <span className={`text-lg font-bold ${riskLevel.color}`}>
                      {transaction.risk_score.toFixed(1)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskLevel.bg} ${riskLevel.color}`}>
                      {riskLevel.level}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="flex items-center space-x-2">
                    {transaction.is_suspicious ? (
                      <>
                        <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600 font-medium">Suspicious</span>
                      </>
                    ) : (
                      <>
                        <InformationCircleIcon className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">Normal</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Analysis */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Risk Analysis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Fraud Probability</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {transaction.fraud_probability.toFixed(1)}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${Math.min(transaction.fraud_probability, 100)}%` }}
                    />
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Anomaly Score</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {transaction.anomaly_score.toFixed(1)}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: `${Math.min(transaction.anomaly_score, 100)}%` }}
                    />
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Risk Level</div>
                  <div className={`text-lg font-semibold ${riskLevel.color}`}>
                    {riskLevel.level}
                  </div>
                  <div className={`w-full rounded-full h-2 mt-2 ${riskLevel.bg}`}>
                    <div
                      className={`h-2 rounded-full ${
                        riskLevel.level === 'Critical' ? 'bg-red-500' :
                        riskLevel.level === 'High' ? 'bg-yellow-500' :
                        riskLevel.level === 'Medium' ? 'bg-blue-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(transaction.risk_score, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Explanation */}
            {transaction.ai_explanation && (
              <div className="border-t border-gray-200 pt-6 mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">AI Analysis Explanation</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">{transaction.ai_explanation}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between">
                <div className="flex space-x-3">
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="btn btn-primary disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center">
                        <LoadingSpinner size="sm" className="mr-2" />
                        Analyzing...
                      </div>
                    ) : (
                      'Run AI Analysis'
                    )}
                  </button>
                  
                  <button className="btn btn-outline">
                    Create Alert
                  </button>
                </div>
                
                <button onClick={onClose} className="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  )
}
