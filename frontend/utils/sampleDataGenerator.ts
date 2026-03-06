// Sample data generator for testing and demos

export interface SampleTransaction {
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

export class SampleDataGenerator {
  private static merchants = [
    'Amazon', 'Walmart', 'Target', 'Best Buy', 'Home Depot',
    'Starbucks', 'McDonald\'s', 'Subway', 'Chipotle', 'Panera',
    'Shell', 'BP', 'Chevron', 'Exxon', 'Mobile',
    'Apple Store', 'Microsoft Store', 'Dell', 'HP', 'Lenovo',
    'Nike', 'Adidas', 'Under Armour', 'Puma', 'Reebok'
  ]

  private static categories = [
    'Retail', 'Food', 'Gas', 'Electronics', 'Clothing',
    'Entertainment', 'Travel', 'Healthcare', 'Education', 'Transfer',
    'Subscription', 'Utilities', 'Insurance', 'Investment', 'Other'
  ]

  private static accountIds = [
    'ACC001', 'ACC002', 'ACC003', 'ACC004', 'ACC005',
    'ACC006', 'ACC007', 'ACC008', 'ACC009', 'ACC010'
  ]

  private static suspiciousMerchants = [
    'Unknown', 'Online Store', 'E-commerce', 'Digital Store',
    'International Transfer', 'Crypto Exchange', 'Offshore Account'
  ]

  static generateTransactions(count: number, fraudRate: number = 0.05): SampleTransaction[] {
    const transactions: SampleTransaction[] = []
    
    for (let i = 0; i < count; i++) {
      const isFraud = Math.random() < fraudRate
      transactions.push(this.generateTransaction(i + 1, isFraud))
    }
    
    return transactions
  }

  private static generateTransaction(index: number, isFraud: boolean): SampleTransaction {
    const baseDate = new Date()
    const daysAgo = Math.floor(Math.random() * 90)
    const hoursAgo = Math.floor(Math.random() * 24)
    const minutesAgo = Math.floor(Math.random() * 60)
    
    const timestamp = new Date(
      baseDate.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - 
      (hoursAgo * 60 * 60 * 1000) - 
      (minutesAgo * 60 * 1000)
    )

    let amount = this.generateNormalAmount()
    let merchant = this.getRandomElement(this.merchants)
    let category = this.getRandomElement(this.categories)
    let hour = timestamp.getHours()

    if (isFraud) {
      // Make fraudulent transactions more suspicious
      if (Math.random() < 0.3) {
        amount = this.generateHighAmount()
      }
      if (Math.random() < 0.4) {
        merchant = this.getRandomElement(this.suspiciousMerchants)
        category = 'Transfer'
      }
      if (Math.random() < 0.3) {
        // Unusual time (late night or early morning)
        hour = this.getRandomElement([0, 1, 2, 3, 4, 5, 22, 23])
        timestamp.setHours(hour)
      }
    }

    const riskScore = this.calculateRiskScore(amount, hour, merchant, isFraud)
    const fraudProbability = this.calculateFraudProbability(riskScore, isFraud)
    const anomalyScore = this.calculateAnomalyScore(riskScore, isFraud)

    return {
      transaction_id: `txn_${String(index).padStart(6, '0')}`,
      amount: parseFloat(amount.toFixed(2)),
      timestamp: timestamp.toISOString(),
      merchant,
      category,
      account_id: this.getRandomElement(this.accountIds),
      risk_score: parseFloat(riskScore.toFixed(1)),
      is_suspicious: riskScore > 70,
      fraud_probability: parseFloat(fraudProbability.toFixed(1)),
      anomaly_score: parseFloat(anomalyScore.toFixed(1)),
      ai_explanation: this.generateExplanation(amount, merchant, hour, riskScore, isFraud)
    }
  }

  private static generateNormalAmount(): number {
    // Log-normal distribution for normal amounts
    const mean = 3.0 // ln($20) ≈ 3.0
    const stdDev = 1.0
    
    const u1 = Math.random()
    const u2 = Math.random()
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    
    const logAmount = mean + stdDev * z0
    const amount = Math.exp(logAmount)
    
    return Math.max(0.01, Math.min(1000, amount))
  }

  private static generateHighAmount(): number {
    // Higher amounts for suspicious transactions
    const min = 1000
    const max = 10000
    return Math.random() * (max - min) + min
  }

  private static calculateRiskScore(amount: number, hour: number, merchant: string, isFraud: boolean): number {
    let riskScore = 0

    // Amount-based risk
    if (amount > 5000) riskScore += 30
    else if (amount > 1000) riskScore += 20
    else if (amount > 500) riskScore += 10
    else if (amount > 100) riskScore += 5

    // Time-based risk
    if (hour >= 22 || hour <= 5) riskScore += 15
    else if (hour >= 6 && hour <= 8) riskScore += 5

    // Merchant-based risk
    if (this.suspiciousMerchants.includes(merchant)) riskScore += 25
    else if (merchant.includes('Unknown')) riskScore += 20

    // Base fraud adjustment
    if (isFraud) {
      riskScore += Math.random() * 20 + 10
    }

    return Math.min(100, Math.max(0, riskScore))
  }

  private static calculateFraudProbability(riskScore: number, isFraud: boolean): number {
    if (isFraud) {
      return Math.min(95, riskScore * 0.9 + Math.random() * 20)
    } else {
      return Math.max(0, riskScore * 0.3 + Math.random() * 10)
    }
  }

  private static calculateAnomalyScore(riskScore: number, isFraud: boolean): number {
    if (isFraud) {
      return Math.min(100, riskScore * 1.1 + Math.random() * 15)
    } else {
      return Math.max(0, riskScore * 0.4 + Math.random() * 5)
    }
  }

  private static generateExplanation(amount: number, merchant: string, hour: number, riskScore: number, isFraud: boolean): string {
    const explanations = []

    if (amount > 5000) {
      explanations.push('High amount transaction detected')
    }
    if (hour >= 22 || hour <= 5) {
      explanations.push('Transaction during unusual hours')
    }
    if (this.suspiciousMerchants.includes(merchant)) {
      explanations.push('Transaction with unknown or suspicious merchant')
    }
    if (isFraud && Math.random() < 0.3) {
      explanations.push('Abnormal spending pattern detected')
    }
    if (isFraud && Math.random() < 0.3) {
      explanations.push('Unusual transaction frequency')
    }

    if (explanations.length === 0) {
      return 'Normal transaction pattern'
    }

    return explanations.join('; ')
  }

  private static getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
  }

  // Generate CSV string
  static generateCSV(count: number, fraudRate: number = 0.05): string {
    const transactions = this.generateTransactions(count, fraudRate)
    
    const headers = [
      'transaction_id',
      'amount',
      'timestamp',
      'merchant',
      'category',
      'account_id'
    ]

    let csv = headers.join(',') + '\n'

    transactions.forEach(transaction => {
      const row = [
        transaction.transaction_id,
        transaction.amount.toString(),
        transaction.timestamp,
        transaction.merchant,
        transaction.category,
        transaction.account_id
      ]
      
      // Escape commas and quotes
      const escapedRow = row.map(value => {
        const strValue = value.toString()
        if (strValue.includes(',') || strValue.includes('"')) {
          return '"' + strValue.replace(/"/g, '""') + '"'
        }
        return strValue
      })
      
      csv += escapedRow.join(',') + '\n'
    })

    return csv
  }

  // Generate JSON string
  static generateJSON(count: number, fraudRate: number = 0.05): string {
    const transactions = this.generateTransactions(count, fraudRate)
    
    const simplifiedTransactions = transactions.map(t => ({
      transaction_id: t.transaction_id,
      amount: t.amount,
      timestamp: t.timestamp,
      merchant: t.merchant,
      category: t.category,
      account_id: t.account_id
    }))

    return JSON.stringify(simplifiedTransactions, null, 2)
  }

  // Download sample files
  static downloadSampleCSV(count: number = 100, fraudRate: number = 0.05): void {
    const csv = this.generateCSV(count, fraudRate)
    this.downloadFile(csv, `sample_transactions_${count}.csv`, 'text/csv')
  }

  static downloadSampleJSON(count: number = 100, fraudRate: number = 0.05): void {
    const json = this.generateJSON(count, fraudRate)
    this.downloadFile(json, `sample_transactions_${count}.json`, 'application/json')
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

  // Generate statistics
  static getStatistics(transactions: SampleTransaction[]) {
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)
    const suspiciousCount = transactions.filter(t => t.is_suspicious).length
    const avgRiskScore = transactions.reduce((sum, t) => sum + t.risk_score, 0) / transactions.length
    
    return {
      totalCount: transactions.length,
      totalAmount,
      suspiciousCount,
      suspiciousRate: (suspiciousCount / transactions.length) * 100,
      avgRiskScore,
      highRiskCount: transactions.filter(t => t.risk_score >= 70).length,
      mediumRiskCount: transactions.filter(t => t.risk_score >= 40 && t.risk_score < 70).length,
      lowRiskCount: transactions.filter(t => t.risk_score < 40).length
    }
  }
}
