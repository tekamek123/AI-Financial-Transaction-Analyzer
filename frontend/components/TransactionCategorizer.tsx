'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { 
  TagIcon, 
  FunnelIcon, 
  CheckCircleIcon,
  XMarkIcon,
  SparklesIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from './LoadingSpinner'
import { apiClient } from '@/utils/api'
import { useToastHelpers } from './Toast'

interface Category {
  id: string
  name: string
  description: string
  color: string
  icon: string
  parent_category?: string
  confidence_threshold: number
  keywords: string[]
  rules: {
    amount_range?: { min: number; max: number }
    merchants?: string[]
    time_patterns?: string[]
    frequency_limits?: { max_per_hour: number; max_per_day: number }
  }
}

interface CategorizedTransaction {
  transaction_id: string
  original_category: string
  suggested_category: string
  confidence_score: number
  reasoning: string
  alternative_categories: Array<{
    category: string
    confidence: number
    reasoning: string
  }>
}

interface TransactionCategorizerProps {
  transactionIds?: string[]
  onCategoryUpdate?: (transactionId: string, category: string) => void
  className?: string
}

export default function TransactionCategorizer({ 
  transactionIds = [], 
  onCategoryUpdate,
  className = ''
}: TransactionCategorizerProps) {
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>(transactionIds)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showUncategorized, setShowUncategorized] = useState(false)
  const { success: showSuccess, error: showError } = useToastHelpers()

  // Mock categories - in real app, use this to fetch data
  // const { data: categories, isLoading, error } = useQuery({
  //   queryKey: ['categories'],
  //   queryFn: () => apiClient.categories.getCategories()
  // })

  // Categorize mutation
  const categorizeMutation = useMutation({
    mutationFn: (transactionIds: string[]) => apiClient.transactions.categorizeTransactions(transactionIds),
    onSuccess: () => {
      showSuccess('Categorization Complete', 'Transactions have been categorized')
    },
    onError: (error) => {
      const apiError = error as any
      showError('Categorization Failed', apiError.message || 'Failed to categorize transactions')
    }
  })

  // Mock data for demonstration
  const mockCategories: Category[] = [
    {
      id: 'retail',
      name: 'Retail',
      description: 'General retail purchases including online and in-store shopping',
      color: '#3b82f6',
      icon: '🛍️',
      confidence_threshold: 70,
      keywords: ['amazon', 'walmart', 'target', 'best buy', 'shop', 'store', 'purchase'],
      rules: {
        amount_range: { min: 10, max: 10000 },
        merchants: ['amazon', 'walmart', 'target', 'best buy', 'costco', 'home depot'],
        frequency_limits: { max_per_hour: 20, max_per_day: 200 }
      }
    },
    {
      id: 'food',
      name: 'Food & Dining',
      description: 'Restaurants, cafes, and food delivery services',
      color: '#10b981',
      icon: '🍔',
      confidence_threshold: 75,
      keywords: ['restaurant', 'cafe', 'coffee', 'food', 'dining', 'uber eats', 'doordash'],
      rules: {
        amount_range: { min: 5, max: 500 },
        merchants: ['mcdonalds', 'starbucks', 'subway', 'chipotle', 'panera'],
        frequency_limits: { max_per_hour: 10, max_per_day: 100 }
      }
    },
    {
      id: 'transport',
      name: 'Transportation',
      description: 'Travel, rideshare, and transportation services',
      color: '#f59e0b',
      icon: '🚗',
      confidence_threshold: 70,
      keywords: ['uber', 'lyft', 'taxi', 'gas', 'parking', 'transit', 'airport'],
      rules: {
        amount_range: { min: 5, max: 1000 },
        merchants: ['uber', 'lyft', 'shell', 'bp', 'exxon', 'parking'],
        frequency_limits: { max_per_hour: 15, max_per_day: 150 }
      }
    },
    {
      id: 'entertainment',
      name: 'Entertainment',
      description: 'Movies, games, streaming, and entertainment venues',
      color: '#8b5cf6',
      icon: '🎮',
      confidence_threshold: 65,
      keywords: ['netflix', 'spotify', 'movie', 'concert', 'game', 'streaming'],
      rules: {
        amount_range: { min: 5, max: 200 },
        merchants: ['netflix', 'spotify', 'amc', 'cinemark', 'steam'],
        frequency_limits: { max_per_hour: 5, max_per_day: 50 }
      }
    },
    {
      id: 'utilities',
      name: 'Utilities',
      description: 'Electric, water, gas, internet, and phone services',
      color: '#6b7280',
      icon: '💡',
      confidence_threshold: 80,
      keywords: ['electric', 'water', 'gas', 'internet', 'phone', 'utility'],
      rules: {
        amount_range: { min: 20, max: 1000 },
        merchants: ['con edison', 'verizon', 'at&t', 'comcast', 'spectrum'],
        frequency_limits: { max_per_hour: 3, max_per_day: 30 }
      }
    },
    {
      id: 'healthcare',
      name: 'Healthcare',
      description: 'Medical services, pharmacies, and health insurance',
      color: '#ec4899',
      icon: '🏥',
      confidence_threshold: 75,
      keywords: ['hospital', 'doctor', 'pharmacy', 'medical', 'health', 'insurance'],
      rules: {
        amount_range: { min: 10, max: 5000 },
        merchants: ['cvs', 'walgreens', 'hospital', 'clinic', 'medical'],
        frequency_limits: { max_per_hour: 5, max_per_day: 50 }
      }
    },
    {
      id: 'transfer',
      name: 'Transfers',
      description: 'Bank transfers, wire transfers, and money movement',
      color: '#ef4444',
      icon: '💸',
      confidence_threshold: 85,
      keywords: ['transfer', 'wire', 'payment', 'deposit', 'withdrawal', 'bank'],
      rules: {
        amount_range: { min: 1, max: 50000 },
        merchants: ['bank', 'transfer', 'payment'],
        frequency_limits: { max_per_hour: 25, max_per_day: 250 }
      }
    }
  ]

  const mockCategorizedTransactions: CategorizedTransaction[] = [
    {
      transaction_id: 'txn_001',
      original_category: 'Online Purchase',
      suggested_category: 'retail',
      confidence_score: 92,
      reasoning: 'Merchant "Amazon" is a known retail merchant with matching keywords and typical amount range',
      alternative_categories: [
        { category: 'retail', confidence: 92, reasoning: 'Primary match based on merchant and keywords' },
        { category: 'entertainment', confidence: 15, reasoning: 'Could be digital entertainment purchase' }
      ]
    },
    {
      transaction_id: 'txn_002',
      original_category: 'Coffee Shop',
      suggested_category: 'food',
      confidence_score: 88,
      reasoning: 'Merchant "Starbucks" is a known food & dining establishment with typical purchase patterns',
      alternative_categories: []
    },
    {
      transaction_id: 'txn_003',
      original_category: 'Unknown',
      suggested_category: 'retail',
      confidence_score: 76,
      reasoning: 'Amount and merchant pattern suggest retail purchase, though merchant is not recognized',
      alternative_categories: [
        { category: 'retail', confidence: 76, reasoning: 'Best match based on amount and timing' },
        { category: 'entertainment', confidence: 24, reasoning: 'Could be entertainment purchase' }
      ]
    }
  ]

  const categories = mockCategories
  const categorizedTransactions = mockCategorizedTransactions
  const isLoading = false
  const error = null

  const filteredTransactions = categorizedTransactions.filter(transaction => {
    if (filterCategory === 'all') return true
    if (filterCategory === 'uncategorized') {
      return transaction.confidence_score < 70
    }
    return transaction.suggested_category === filterCategory
  })

  const handleCategorize = () => {
    if (selectedTransactions.length === 0) {
      showError('No Selection', 'Please select transactions to categorize')
      return
    }
    categorizeMutation.mutate(selectedTransactions)
  }

  const handleCategoryUpdate = (transactionId: string, newCategory: string) => {
    if (onCategoryUpdate) {
      onCategoryUpdate(transactionId, newCategory)
    }
    showSuccess('Category Updated', `Transaction has been categorized as ${newCategory}`)
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100'
    if (score >= 70) return 'text-blue-600 bg-blue-100'
    if (score >= 50) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getCategoryStats = () => {
    const stats = new Map<string, { count: number; avg_confidence: number }>()
    
    categorizedTransactions.forEach(transaction => {
      const existing = stats.get(transaction.suggested_category) || { count: 0, avg_confidence: 0 }
      stats.set(transaction.suggested_category, {
        count: existing.count + 1,
        avg_confidence: (existing.avg_confidence * existing.count + transaction.confidence_score) / (existing.count + 1)
      })
    })
    
    return stats
  }

  const categoryStats = getCategoryStats()

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Categories</h3>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Transaction Categorizer</h3>
            <p className="text-sm text-gray-500 mt-1">
              AI-powered transaction categorization and classification
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCategorize}
              disabled={selectedTransactions.length === 0 || categorizeMutation.isPending}
              className="btn btn-primary disabled:opacity-50"
            >
              {categorizeMutation.isPending ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Categorizing...
                </div>
              ) : (
                <div className="flex items-center">
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Auto-Categorize
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Category Overview */}
      <div className="p-4 border-b border-gray-200">
        <h4 className="text-md font-medium text-gray-900 mb-4">Category Definitions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div key={category.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-lg">{category.icon}</span>
                <div>
                  <h5 className="text-sm font-medium text-gray-900">{category.name}</h5>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(category.confidence_threshold)}`}>
                    {category.confidence_threshold}% threshold
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-2">{category.description}</p>
              
              {/* Category Rules */}
              <div className="text-xs text-gray-500 space-y-1">
                {category.rules.amount_range && (
                  <div>Amount: ${category.rules.amount_range.min} - ${category.rules.amount_range.max}</div>
                )}
                {category.rules.merchants && (
                  <div>Merchants: {category.rules.merchants.slice(0, 3).join(', ')}...</div>
                )}
                {category.rules.frequency_limits && (
                  <div>Max: {category.rules.frequency_limits.max_per_hour}/hr, {category.rules.frequency_limits.max_per_day}/day</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-4 w-4 text-gray-500" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="uncategorized">Low Confidence (&lt;70%)</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="show-uncategorized"
              checked={showUncategorized}
              onChange={(e) => setShowUncategorized(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="show-uncategorized" className="text-sm text-gray-700">
              Show uncategorized only
            </label>
          </div>
        </div>
      </div>

      {/* Categorized Transactions */}
      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-8">
            <LoadingSpinner />
            <p className="text-gray-600 mt-2">Categorizing transactions...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.transaction_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {transaction.transaction_id}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(transaction.confidence_score)}`}>
                        {transaction.confidence_score}% confidence
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-500">Original:</span>
                        <span className="font-medium text-gray-900">{transaction.original_category}</span>
                        <span className="text-gray-500">→</span>
                        <span className="font-medium text-green-600">{transaction.suggested_category}</span>
                      </div>
                      
                      <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                        <strong>AI Reasoning:</strong> {transaction.reasoning}
                      </p>
                      
                      {/* Alternative Categories */}
                      {transaction.alternative_categories.length > 1 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">Alternative suggestions:</p>
                          <div className="space-y-1">
                            {transaction.alternative_categories.slice(1).map((alt, index) => (
                              <div key={index} className="flex items-center justify-between text-xs">
                                <span className="text-gray-700">{alt.category}</span>
                                <span className={`px-2 py-1 rounded-full ${getConfidenceColor(alt.confidence)}`}>
                                  {alt.confidence}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleCategoryUpdate(transaction.transaction_id, transaction.suggested_category)}
                      className="btn btn-sm btn-primary"
                    >
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Statistics */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Category Distribution</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {Array.from(categoryStats.entries()).map(([categoryId, stats]) => {
            const category = categories.find(c => c.id === categoryId)
            return (
              <div key={categoryId} className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <span className="text-lg">{category?.icon}</span>
                  <span className="font-medium text-gray-900">{category?.name}</span>
                </div>
                <div className="text-gray-600">
                  <div>{stats.count} transactions</div>
                  <div>Avg: {stats.avg_confidence.toFixed(1)}% confidence</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
