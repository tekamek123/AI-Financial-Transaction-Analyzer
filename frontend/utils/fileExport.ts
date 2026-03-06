// File export utilities for transaction data

export interface ExportOptions {
  format: 'csv' | 'json'
  includeHeaders?: boolean
  fields?: string[]
  filename?: string
  filter?: {
    riskLevel?: 'all' | 'high' | 'medium' | 'low'
    dateRange?: { start: Date; end: Date }
    search?: string
  }
}

export interface Transaction {
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

export class FileExporter {
  static exportToCSV(transactions: Transaction[], options: ExportOptions = { format: 'csv' }): void {
    const filteredTransactions = this.filterTransactions(transactions, options.filter)
    const fields = options.fields || this.getDefaultFields()
    
    let csv = ''
    
    // Add headers
    if (options.includeHeaders !== false) {
      csv += fields.join(',') + '\n'
    }
    
    // Add data rows
    filteredTransactions.forEach(transaction => {
      const row = fields.map(field => {
        const value = this.getFieldValue(transaction, field)
        return this.escapeCSVValue(value)
      })
      csv += row.join(',') + '\n'
    })
    
    // Download file
    this.downloadFile(csv, options.filename || 'transactions.csv', 'text/csv')
  }

  static exportToJSON(transactions: Transaction[], options: ExportOptions = { format: 'json' }): void {
    const filteredTransactions = this.filterTransactions(transactions, options.filter)
    const fields = options.fields || this.getDefaultFields()
    
    // Map transactions to include only selected fields
    const mappedData = filteredTransactions.map(transaction => {
      const mapped: any = {}
      fields.forEach(field => {
        mapped[field] = this.getFieldValue(transaction, field)
      })
      return mapped
    })
    
    const json = JSON.stringify(mappedData, null, 2)
    
    // Download file
    this.downloadFile(json, options.filename || 'transactions.json', 'application/json')
  }

  private static filterTransactions(transactions: Transaction[], filter?: ExportOptions['filter']): Transaction[] {
    if (!filter) return transactions
    
    return transactions.filter(transaction => {
      // Risk level filter
      if (filter.riskLevel && filter.riskLevel !== 'all') {
        const riskScore = transaction.risk_score
        switch (filter.riskLevel) {
          case 'high':
            if (riskScore < 70) return false
            break
          case 'medium':
            if (riskScore < 40 || riskScore >= 70) return false
            break
          case 'low':
            if (riskScore >= 40) return false
            break
        }
      }
      
      // Date range filter
      if (filter.dateRange) {
        const transactionDate = new Date(transaction.timestamp)
        if (transactionDate < filter.dateRange.start || transactionDate > filter.dateRange.end) {
          return false
        }
      }
      
      // Search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase()
        const searchableText = [
          transaction.transaction_id,
          transaction.merchant,
          transaction.category,
          transaction.account_id
        ].join(' ').toLowerCase()
        
        if (!searchableText.includes(searchLower)) {
          return false
        }
      }
      
      return true
    })
  }

  private static getFieldValue(transaction: Transaction, field: string): string {
    switch (field) {
      case 'transaction_id':
        return transaction.transaction_id
      case 'amount':
        return transaction.amount.toString()
      case 'timestamp':
        return transaction.timestamp
      case 'merchant':
        return transaction.merchant || ''
      case 'category':
        return transaction.category || ''
      case 'account_id':
        return transaction.account_id
      case 'risk_score':
        return transaction.risk_score.toString()
      case 'is_suspicious':
        return transaction.is_suspicious.toString()
      case 'fraud_probability':
        return transaction.fraud_probability.toString()
      case 'anomaly_score':
        return transaction.anomaly_score.toString()
      case 'ai_explanation':
        return transaction.ai_explanation || ''
      default:
        return ''
    }
  }

  private static escapeCSVValue(value: string): string {
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return '"' + value.replace(/"/g, '""') + '"'
    }
    return value
  }

  private static getDefaultFields(): string[] {
    return [
      'transaction_id',
      'amount',
      'timestamp',
      'merchant',
      'category',
      'account_id',
      'risk_score',
      'is_suspicious',
      'fraud_probability',
      'anomaly_score',
      'ai_explanation'
    ]
  }

  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    window.URL.revokeObjectURL(url)
  }

  // Generate sample data for testing
  static generateSampleCSV(): string {
    const sampleData = [
      {
        transaction_id: 'txn_001',
        amount: 1250.00,
        timestamp: '2024-01-15T10:30:00Z',
        merchant: 'Amazon',
        category: 'Retail',
        account_id: 'ACC123'
      },
      {
        transaction_id: 'txn_002',
        amount: 45.99,
        timestamp: '2024-01-15T09:15:00Z',
        merchant: 'Starbucks',
        category: 'Food',
        account_id: 'ACC123'
      },
      {
        transaction_id: 'txn_003',
        amount: 5000.00,
        timestamp: '2024-01-14T23:45:00Z',
        merchant: 'Luxury Store',
        category: 'Retail',
        account_id: 'ACC789'
      }
    ]
    
    const fields = ['transaction_id', 'amount', 'timestamp', 'merchant', 'category', 'account_id']
    let csv = fields.join(',') + '\n'
    
    sampleData.forEach(row => {
      const values = fields.map(field => {
        const value = row[field as keyof typeof row]
        return this.escapeCSVValue(value.toString())
      })
      csv += values.join(',') + '\n'
    })
    
    return csv
  }

  static generateSampleJSON(): string {
    const sampleData = [
      {
        transaction_id: 'txn_001',
        amount: 1250.00,
        timestamp: '2024-01-15T10:30:00Z',
        merchant: 'Amazon',
        category: 'Retail',
        account_id: 'ACC123'
      },
      {
        transaction_id: 'txn_002',
        amount: 45.99,
        timestamp: '2024-01-15T09:15:00Z',
        merchant: 'Starbucks',
        category: 'Food',
        account_id: 'ACC123'
      },
      {
        transaction_id: 'txn_003',
        amount: 5000.00,
        timestamp: '2024-01-14T23:45:00Z',
        merchant: 'Luxury Store',
        category: 'Retail',
        account_id: 'ACC789'
      }
    ]
    
    return JSON.stringify(sampleData, null, 2)
  }

  // Download sample files
  static downloadSampleCSV(): void {
    const csv = this.generateSampleCSV()
    this.downloadFile(csv, 'sample_transactions.csv', 'text/csv')
  }

  static downloadSampleJSON(): void {
    const json = this.generateSampleJSON()
    this.downloadFile(json, 'sample_transactions.json', 'application/json')
  }
}

// Export statistics
export function getExportStatistics(transactions: Transaction[], filter?: ExportOptions['filter']) {
  const filteredTransactions = filter ? 
    FileExporter['filterTransactions'](transactions, filter) : 
    transactions
  
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0)
  const suspiciousCount = filteredTransactions.filter(t => t.is_suspicious).length
  const avgRiskScore = filteredTransactions.reduce((sum, t) => sum + t.risk_score, 0) / filteredTransactions.length
  
  return {
    totalCount: filteredTransactions.length,
    totalAmount,
    suspiciousCount,
    suspiciousRate: filteredTransactions.length > 0 ? (suspiciousCount / filteredTransactions.length) * 100 : 0,
    avgRiskScore,
    highRiskCount: filteredTransactions.filter(t => t.risk_score >= 70).length,
    mediumRiskCount: filteredTransactions.filter(t => t.risk_score >= 40 && t.risk_score < 70).length,
    lowRiskCount: filteredTransactions.filter(t => t.risk_score < 40).length
  }
}
