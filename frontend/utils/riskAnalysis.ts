// Risk analysis utilities for transaction scoring and fraud detection

export interface Transaction {
  id: string
  transaction_id: string
  amount: number
  timestamp: string
  merchant: string
  category: string
  account_id: string
}

export interface RiskRule {
  id: string
  name: string
  enabled: boolean
  weight: number
  threshold: number
  category: 'amount' | 'time' | 'merchant' | 'frequency' | 'location' | 'pattern'
}

export interface RiskAnalysisResult {
  transaction_id: string
  risk_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  fraud_probability: number
  anomaly_score: number
  rule_scores: Record<string, number>
  explanations: string[]
  is_suspicious: boolean
}

export interface HistoricalData {
  avg_amount: number
  transaction_frequency: number
  known_merchants: Set<string>
  typical_hours: number[]
  last_transaction?: Date
}

export class RiskAnalysisEngine {
  private rules: RiskRule[]
  private historicalData: Map<string, HistoricalData>

  constructor(rules: RiskRule[]) {
    this.rules = rules.filter(rule => rule.enabled)
    this.historicalData = new Map()
  }

  // Update historical data for an account
  updateHistoricalData(accountId: string, transactions: Transaction[]): void {
    const accountTransactions = transactions.filter(t => t.account_id === accountId)
    
    if (accountTransactions.length === 0) return

    const amounts = accountTransactions.map(t => t.amount)
    const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length
    
    const hours = accountTransactions.map(t => new Date(t.timestamp).getHours())
    const typicalHours = this.getMode(hours)
    
    const merchants = new Set(accountTransactions.map(t => t.merchant))
    
    const sortedTransactions = accountTransactions.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    
    this.historicalData.set(accountId, {
      avg_amount: avgAmount,
      transaction_frequency: accountTransactions.length,
      known_merchants: merchants,
      typical_hours: typicalHours,
      last_transaction: new Date(sortedTransactions[0].timestamp)
    })
  }

  // Analyze a single transaction
  analyzeTransaction(transaction: Transaction, historicalData?: HistoricalData): RiskAnalysisResult {
    const data = historicalData || this.historicalData.get(transaction.account_id)
    
    if (!data) {
      return this.createLowRiskResult(transaction, 'No historical data available')
    }

    const ruleScores: Record<string, number> = {}
    const explanations: string[] = []

    // Apply each enabled rule
    for (const rule of this.rules) {
      const score = this.applyRule(rule, transaction, data)
      ruleScores[rule.id] = score
      
      if (score > rule.threshold) {
        explanations.push(this.getRuleExplanation(rule, transaction, data))
      }
    }

    // Calculate overall risk score
    const totalWeight = this.rules.reduce((sum, rule) => sum + rule.weight, 0)
    const weightedScore = this.rules.reduce((sum, rule) => {
      return sum + (ruleScores[rule.id] || 0) * (rule.weight / totalWeight)
    }, 0)

    const riskScore = Math.min(100, Math.max(0, weightedScore))
    const riskLevel = this.getRiskLevel(riskScore)
    const fraudProbability = this.calculateFraudProbability(riskScore)
    const anomalyScore = this.calculateAnomalyScore(riskScore, transaction, data)

    return {
      transaction_id: transaction.transaction_id,
      risk_score: riskScore,
      risk_level: riskLevel,
      fraud_probability: fraudProbability,
      anomaly_score: anomalyScore,
      rule_scores: ruleScores,
      explanations,
      is_suspicious: riskScore >= 70
    }
  }

  // Apply individual rule
  private applyRule(rule: RiskRule, transaction: Transaction, data: HistoricalData): number {
    switch (rule.category) {
      case 'amount':
        return this.analyzeAmountRule(transaction, data, rule.threshold)
      case 'time':
        return this.analyzeTimeRule(transaction, data, rule.threshold)
      case 'merchant':
        return this.analyzeMerchantRule(transaction, data, rule.threshold)
      case 'frequency':
        return this.analyzeFrequencyRule(transaction, data, rule.threshold)
      case 'location':
        return this.analyzeLocationRule(transaction, data, rule.threshold)
      case 'pattern':
        return this.analyzePatternRule(transaction, data, rule.threshold)
      default:
        return 0
    }
  }

  // Amount-based risk analysis
  private analyzeAmountRule(transaction: Transaction, data: HistoricalData, threshold: number): number {
    if (data.avg_amount === 0) return 0
    
    const deviationPercent = ((transaction.amount - data.avg_amount) / data.avg_amount) * 100
    return Math.min(100, Math.max(0, deviationPercent))
  }

  // Time-based risk analysis
  private analyzeTimeRule(transaction: Transaction, data: HistoricalData, threshold: number): number {
    const hour = new Date(transaction.timestamp).getHours()
    
    // High-risk hours (10 PM - 6 AM)
    if (hour >= 22 || hour <= 5) {
      return 80
    }
    
    // Unusual hours compared to typical
    if (data.typical_hours.length > 0) {
      const isTypical = data.typical_hours.includes(hour)
      return isTypical ? 20 : 60
    }
    
    return 30
  }

  // Merchant-based risk analysis
  private analyzeMerchantRule(transaction: Transaction, data: HistoricalData, threshold: number): number {
    if (data.known_merchants.has(transaction.merchant)) {
      return 10 // Low risk for known merchants
    }
    
    // Check for suspicious merchant patterns
    const suspiciousKeywords = ['unknown', 'test', 'suspicious', 'fake', 'temp']
    const merchantLower = transaction.merchant.toLowerCase()
    
    for (const keyword of suspiciousKeywords) {
      if (merchantLower.includes(keyword)) {
        return 90
      }
    }
    
    return 70 // High risk for unknown merchants
  }

  // Frequency-based risk analysis
  private analyzeFrequencyRule(transaction: Transaction, data: HistoricalData, threshold: number): number {
    if (!data.last_transaction) return 0
    
    const currentTime = new Date(transaction.timestamp).getTime()
    const lastTime = data.last_transaction.getTime()
    const hoursDiff = (currentTime - lastTime) / (1000 * 60 * 60)
    
    // Very frequent transactions (within 1 hour)
    if (hoursDiff < 1) {
      return 85
    }
    
    // Frequent transactions (within 6 hours)
    if (hoursDiff < 6) {
      return 60
    }
    
    // Normal frequency
    if (hoursDiff < 24) {
      return 30
    }
    
    return 10
  }

  // Location-based risk analysis (placeholder for future implementation)
  private analyzeLocationRule(transaction: Transaction, data: HistoricalData, threshold: number): number {
    // This would integrate with geolocation data
    return 0
  }

  // Pattern-based risk analysis
  private analyzePatternRule(transaction: Transaction, data: HistoricalData, threshold: number): number {
    let riskScore = 0
    
    // Round amount pattern (e.g., $99.99)
    if (transaction.amount % 1 === 0.99) {
      riskScore += 20
    }
    
    // Multiple of 100 pattern
    if (transaction.amount % 100 === 0 && transaction.amount > 100) {
      riskScore += 15
    }
    
    // Sequential transaction ID pattern
    const idPattern = /(\d+)$/.exec(transaction.transaction_id)
    if (idPattern) {
      const idNum = parseInt(idPattern[1])
      if (idNum % 100 === 0) {
        riskScore += 10
      }
    }
    
    return Math.min(100, riskScore)
  }

  // Get rule explanation
  private getRuleExplanation(rule: RiskRule, transaction: Transaction, data: HistoricalData): string {
    switch (rule.category) {
      case 'amount':
        const amountDeviation = ((transaction.amount - data.avg_amount) / data.avg_amount) * 100
        return `Amount ${amountDeviation.toFixed(1)}% above account average`
      
      case 'time':
        const hour = new Date(transaction.timestamp).getHours()
        return `Transaction at unusual hour (${hour}:00)`
      
      case 'merchant':
        return `Transaction with unknown/suspicious merchant: ${transaction.merchant}`
      
      case 'frequency':
        if (data.last_transaction) {
          const hoursDiff = (new Date(transaction.timestamp).getTime() - data.last_transaction.getTime()) / (1000 * 60 * 60)
          return `High frequency transaction (${hoursDiff.toFixed(1)} hours since last)`
        }
        return 'High frequency transaction'
      
      case 'location':
        return 'Transaction from unusual location'
      
      case 'pattern':
        return 'Suspicious transaction pattern detected'
      
      default:
        return 'Risk rule triggered'
    }
  }

  // Calculate risk level
  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 85) return 'critical'
    if (score >= 70) return 'high'
    if (score >= 40) return 'medium'
    return 'low'
  }

  // Calculate fraud probability
  private calculateFraudProbability(riskScore: number): number {
    // Non-linear scaling for more realistic probability
    if (riskScore >= 90) return 95 + Math.random() * 5
    if (riskScore >= 80) return 80 + Math.random() * 15
    if (riskScore >= 70) return 60 + Math.random() * 20
    if (riskScore >= 50) return 30 + Math.random() * 30
    if (riskScore >= 30) return 10 + Math.random() * 20
    return Math.random() * 10
  }

  // Calculate anomaly score
  private calculateAnomalyScore(riskScore: number, transaction: Transaction, data: HistoricalData): number {
    let anomalyScore = riskScore
    
    // Add anomaly factors
    if (transaction.amount > data.avg_amount * 5) {
      anomalyScore += 15
    }
    
    const hour = new Date(transaction.timestamp).getHours()
    if (hour >= 22 || hour <= 5) {
      anomalyScore += 10
    }
    
    if (!data.known_merchants.has(transaction.merchant)) {
      anomalyScore += 12
    }
    
    return Math.min(100, anomalyScore)
  }

  // Create low risk result
  private createLowRiskResult(transaction: Transaction, reason: string): RiskAnalysisResult {
    return {
      transaction_id: transaction.transaction_id,
      risk_score: 5,
      risk_level: 'low',
      fraud_probability: 2,
      anomaly_score: 5,
      rule_scores: {},
      explanations: [reason],
      is_suspicious: false
    }
  }

  // Get mode (most frequent value) from array
  private getMode<T>(arr: T[]): T[] {
    const frequency = new Map<T, number>()
    
    for (const item of arr) {
      frequency.set(item, (frequency.get(item) || 0) + 1)
    }
    
    let maxFrequency = 0
    let modes: T[] = []
    
    for (const [item, count] of frequency.entries()) {
      if (count > maxFrequency) {
        maxFrequency = count
        modes = [item]
      } else if (count === maxFrequency) {
        modes.push(item)
      }
    }
    
    return modes
  }

  // Batch analyze multiple transactions
  analyzeTransactions(transactions: Transaction[]): RiskAnalysisResult[] {
    // Update historical data first
    const accountIds = [...new Set(transactions.map(t => t.account_id))]
    
    for (const accountId of accountIds) {
      this.updateHistoricalData(accountId, transactions)
    }
    
    // Analyze each transaction
    return transactions.map(transaction => {
      const historicalData = this.historicalData.get(transaction.account_id)
      return this.analyzeTransaction(transaction, historicalData)
    })
  }

  // Get risk statistics for a batch of results
  getRiskStatistics(results: RiskAnalysisResult[]): {
    total: number
    low: number
    medium: number
    high: number
    critical: number
    suspicious: number
    avg_risk_score: number
    avg_fraud_probability: number
  } {
    const stats = {
      total: results.length,
      low: results.filter(r => r.risk_level === 'low').length,
      medium: results.filter(r => r.risk_level === 'medium').length,
      high: results.filter(r => r.risk_level === 'high').length,
      critical: results.filter(r => r.risk_level === 'critical').length,
      suspicious: results.filter(r => r.is_suspicious).length,
      avg_risk_score: results.reduce((sum, r) => sum + r.risk_score, 0) / results.length,
      avg_fraud_probability: results.reduce((sum, r) => sum + r.fraud_probability, 0) / results.length
    }
    
    return stats
  }
}
