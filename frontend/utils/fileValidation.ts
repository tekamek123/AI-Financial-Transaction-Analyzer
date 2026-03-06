// File validation utilities for transaction uploads

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  rowCount?: number
  preview?: any[]
}

export interface TransactionField {
  name: string
  type: 'string' | 'number' | 'datetime'
  required: boolean
  format?: string
}

// Required fields for transaction data
const REQUIRED_FIELDS: TransactionField[] = [
  { name: 'transaction_id', type: 'string', required: true },
  { name: 'amount', type: 'number', required: true },
  { name: 'timestamp', type: 'datetime', required: true },
  { name: 'merchant', type: 'string', required: false },
  { name: 'category', type: 'string', required: false },
  { name: 'account_id', type: 'string', required: true }
]

// Optional fields
const OPTIONAL_FIELDS: TransactionField[] = [
  { name: 'description', type: 'string', required: false },
  { name: 'location', type: 'string', required: false },
  { name: 'reference', type: 'string', required: false }
]

export class FileValidator {
  static validateCSV(file: File): Promise<ValidationResult> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const result = this.parseAndValidateCSV(text)
          resolve(result)
        } catch (error) {
          resolve({
            isValid: false,
            errors: ['Failed to parse CSV file'],
            warnings: []
          })
        }
      }
      
      reader.onerror = () => {
        resolve({
          isValid: false,
          errors: ['Failed to read file'],
          warnings: []
        })
      }
      
      reader.readAsText(file)
    })
  }

  static validateJSON(file: File): Promise<ValidationResult> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const result = this.parseAndValidateJSON(text)
          resolve(result)
        } catch (error) {
          resolve({
            isValid: false,
            errors: ['Failed to parse JSON file'],
            warnings: []
          })
        }
      }
      
      reader.onerror = () => {
        resolve({
          isValid: false,
          errors: ['Failed to read file'],
          warnings: []
        })
      }
      
      reader.readAsText(file)
    })
  }

  private static parseAndValidateCSV(text: string): ValidationResult {
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length === 0) {
      return {
        isValid: false,
        errors: ['CSV file is empty'],
        warnings: []
      }
    }

    // Parse header
    const headerLine = lines[0]
    const headers = this.parseCSVLine(headerLine)
    
    // Check required fields
    const missingFields = REQUIRED_FIELDS
      .filter(field => field.required)
      .filter(field => !headers.includes(field.name))
    
    if (missingFields.length > 0) {
      return {
        isValid: false,
        errors: [`Missing required fields: ${missingFields.map(f => f.name).join(', ')}`],
        warnings: []
      }
    }

    // Parse data rows
    const dataRows = lines.slice(1)
    const parsedData: any[] = []
    const errors: string[] = []
    const warnings: string[] = []

    dataRows.forEach((line, index) => {
      if (line.trim() === '') return
      
      try {
        const values = this.parseCSVLine(line)
        const row: any = {}
        
        headers.forEach((header, headerIndex) => {
          const value = values[headerIndex] || ''
          const field = REQUIRED_FIELDS.find(f => f.name === header) || 
                       OPTIONAL_FIELDS.find(f => f.name === header)
          
          if (field) {
            row[header] = this.parseValue(value, field)
          } else {
            row[header] = value
          }
        })
        
        // Validate row
        const rowErrors = this.validateRow(row, index + 2) // +2 because header is row 1
        errors.push(...rowErrors)
        
        parsedData.push(row)
      } catch (error) {
        errors.push(`Row ${index + 2}: ${error}`)
      }
    })

    // Check for data issues
    if (parsedData.length > 0) {
      const amountWarnings = this.validateAmounts(parsedData)
      const dateWarnings = this.validateDates(parsedData)
      warnings.push(...amountWarnings, ...dateWarnings)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      rowCount: parsedData.length,
      preview: parsedData.slice(0, 5)
    }
  }

  private static parseAndValidateJSON(text: string): ValidationResult {
    let data: any[]
    
    try {
      const parsed = JSON.parse(text)
      
      if (!Array.isArray(parsed)) {
        return {
          isValid: false,
          errors: ['JSON file must contain an array of transactions'],
          warnings: []
        }
      }
      
      data = parsed
    } catch (error) {
      return {
        isValid: false,
        errors: ['Invalid JSON format'],
        warnings: []
      }
    }

    if (data.length === 0) {
      return {
        isValid: false,
        errors: ['JSON file is empty'],
        warnings: []
      }
    }

    const errors: string[] = []
    const warnings: string[] = []

    // Validate each transaction
    data.forEach((item, index) => {
      const rowErrors = this.validateRow(item, index + 1)
      errors.push(...rowErrors)
    })

    // Check for data issues
    const amountWarnings = this.validateAmounts(data)
    const dateWarnings = this.validateDates(data)
    warnings.push(...amountWarnings, ...dateWarnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      rowCount: data.length,
      preview: data.slice(0, 5)
    }
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++ // Skip next quote
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
  }

  private static parseValue(value: string, field: TransactionField): any {
    const trimmed = value.trim()
    
    if (trimmed === '') {
      return field.required ? null : ''
    }
    
    switch (field.type) {
      case 'number':
        const num = parseFloat(trimmed.replace(/[^0-9.-]/g, ''))
        return isNaN(num) ? null : num
      case 'datetime':
        const date = new Date(trimmed)
        return isNaN(date.getTime()) ? null : date.toISOString()
      default:
        return trimmed
    }
  }

  private static validateRow(row: any, rowNumber: number): string[] {
    const errors: string[] = []
    
    REQUIRED_FIELDS.forEach(field => {
      if (field.required && (row[field.name] === null || row[field.name] === undefined || row[field.name] === '')) {
        errors.push(`Row ${rowNumber}: Missing required field '${field.name}'`)
      }
      
      if (row[field.name] !== null && row[field.name] !== undefined) {
        if (field.type === 'number' && (isNaN(row[field.name]) || row[field.name] < 0)) {
          errors.push(`Row ${rowNumber}: Invalid value for '${field.name}' - must be a positive number`)
        }
        
        if (field.type === 'datetime' && !row[field.name]) {
          errors.push(`Row ${rowNumber}: Invalid date format for '${field.name}'`)
        }
      }
    })
    
    return errors
  }

  private static validateAmounts(data: any[]): string[] {
    const warnings: string[] = []
    const amounts = data.map(row => row.amount).filter(amount => amount !== null && !isNaN(amount))
    
    if (amounts.length === 0) return warnings
    
    const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length
    const maxAmount = Math.max(...amounts)
    const minAmount = Math.min(...amounts)
    
    // Check for unusually large amounts
    if (maxAmount > avgAmount * 10) {
      warnings.push(`Found unusually large transaction amounts (max: $${maxAmount.toFixed(2)})`)
    }
    
    // Check for negative amounts
    const negativeAmounts = amounts.filter(amount => amount < 0)
    if (negativeAmounts.length > 0) {
      warnings.push(`Found ${negativeAmounts.length} transactions with negative amounts`)
    }
    
    return warnings
  }

  private static validateDates(data: any[]): string[] {
    const warnings: string[] = []
    const dates = data.map(row => new Date(row.timestamp)).filter(date => !isNaN(date.getTime()))
    
    if (dates.length === 0) return warnings
    
    const now = new Date()
    const futureDates = dates.filter(date => date > now)
    
    if (futureDates.length > 0) {
      warnings.push(`Found ${futureDates.length} transactions with future dates`)
    }
    
    // Check for very old dates
    const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000))
    const oldDates = dates.filter(date => date < oneYearAgo)
    
    if (oldDates.length > 0) {
      warnings.push(`Found ${oldDates.length} transactions older than 1 year`)
    }
    
    return warnings
  }
}

// File format detection
export function detectFileFormat(filename: string): 'csv' | 'json' | 'unknown' {
  const extension = filename.split('.').pop()?.toLowerCase()
  
  switch (extension) {
    case 'csv':
      return 'csv'
    case 'json':
      return 'json'
    default:
      return 'unknown'
  }
}

// File size utilities
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}
