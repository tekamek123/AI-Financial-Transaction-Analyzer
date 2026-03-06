import axios from 'axios'

// Create axios instance with default configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const endpoints = {
  // Authentication
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  
  // Transactions
  transactions: {
    list: '/transactions',
    create: '/transactions',
    upload: '/transactions/upload',
    analyze: '/transactions/analyze',
    get: (id: string) => `/transactions/${id}`,
    update: (id: string) => `/transactions/${id}`,
    delete: (id: string) => `/transactions/${id}`,
  },
  
  // Analytics
  analytics: {
    overview: '/analytics/overview',
    riskDistribution: '/analytics/risk-distribution',
    transactionTrends: '/analytics/transaction-trends',
    categoryAnalysis: '/analytics/category-analysis',
    suspiciousPatterns: '/analytics/suspicious-patterns',
    merchantAnalysis: '/analytics/merchant-analysis',
    timeBasedPatterns: '/analytics/time-based-patterns',
  },
  
  // Alerts
  alerts: {
    list: '/alerts',
    create: '/alerts',
    get: (id: string) => `/alerts/${id}`,
    update: (id: string) => `/alerts/${id}`,
    delete: (id: string) => `/alerts/${id}`,
    resolve: (id: string) => `/alerts/${id}/resolve`,
  },
  
  // Risk Analysis
  risk: {
    scores: '/risk/scores',
    factors: '/risk/factors',
    predictions: '/risk/predictions',
    explanations: '/risk/explanations',
  },
  
  // Reports
  reports: {
    generate: '/reports/generate',
    list: '/reports',
    get: (id: string) => `/reports/${id}`,
    download: (id: string) => `/reports/${id}/download`,
  },
}

// API functions
export const apiClient = {
  // Authentication
  auth: {
    login: (credentials: { email: string; password: string }) =>
      api.post(endpoints.auth.login, credentials),
    
    register: (userData: any) =>
      api.post(endpoints.auth.register, userData),
    
    logout: () =>
      api.post(endpoints.auth.logout),
    
    getCurrentUser: () =>
      api.get(endpoints.auth.me),
  },
  
  // Transactions
  transactions: {
    getTransactions: (params?: any) =>
      api.get(endpoints.transactions.list, { params }),
    
    getTransaction: (id: string) =>
      api.get(endpoints.transactions.get(id)),
    
    createTransaction: (data: any) =>
      api.post(endpoints.transactions.create, data),
    
    updateTransaction: (id: string, data: any) =>
      api.put(endpoints.transactions.update(id), data),
    
    deleteTransaction: (id: string) =>
      api.delete(endpoints.transactions.delete(id)),
    
    uploadTransactions: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return api.post(endpoints.transactions.upload, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    },
    
    analyzeTransactions: (transactionIds: string[]) =>
      api.post(endpoints.transactions.analyze, { transaction_ids: transactionIds }),
  },
  
  // Analytics
  analytics: {
    getOverview: () =>
      api.get(endpoints.analytics.overview),
    
    getRiskDistribution: () =>
      api.get(endpoints.analytics.riskDistribution),
    
    getTransactionTrends: (params?: any) =>
      api.get(endpoints.analytics.transactionTrends, { params }),
    
    getCategoryAnalysis: () =>
      api.get(endpoints.analytics.categoryAnalysis),
    
    getSuspiciousPatterns: () =>
      api.get(endpoints.analytics.suspiciousPatterns),
    
    getMerchantAnalysis: () =>
      api.get(endpoints.analytics.merchantAnalysis),
    
    getTimeBasedPatterns: () =>
      api.get(endpoints.analytics.timeBasedPatterns),
  },
  
  // Alerts
  alerts: {
    getAlerts: (params?: any) =>
      api.get(endpoints.alerts.list, { params }),
    
    getAlert: (id: string) =>
      api.get(endpoints.alerts.get(id)),
    
    createAlert: (data: any) =>
      api.post(endpoints.alerts.create, data),
    
    updateAlert: (id: string, data: any) =>
      api.put(endpoints.alerts.update(id), data),
    
    deleteAlert: (id: string) =>
      api.delete(endpoints.alerts.delete(id)),
    
    resolveAlert: (id: string) =>
      api.post(endpoints.alerts.resolve(id)),
  },
  
  // Risk Analysis
  risk: {
    getRiskScores: (params?: any) =>
      api.get(endpoints.risk.scores, { params }),
    
    getRiskFactors: (transactionId: string) =>
      api.get(`${endpoints.risk.factors}/${transactionId}`),
    
    getPredictions: (data: any) =>
      api.post(endpoints.risk.predictions, data),
    
    getExplanations: (transactionId: string) =>
      api.get(`${endpoints.risk.explanations}/${transactionId}`),
  },
  
  // Reports
  reports: {
    generateReport: (data: any) =>
      api.post(endpoints.reports.generate, data),
    
    getReports: () =>
      api.get(endpoints.reports.list),
    
    getReport: (id: string) =>
      api.get(endpoints.reports.get(id)),
    
    downloadReport: (id: string) =>
      api.get(endpoints.reports.download(id), { responseType: 'blob' }),
  },
}

// Error handling utility
export const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.detail || error.response.data?.message || 'An error occurred'
    return {
      message,
      status: error.response.status,
      data: error.response.data,
    }
  } else if (error.request) {
    // Request was made but no response received
    return {
      message: 'Network error. Please check your connection.',
      status: 0,
      data: null,
    }
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0,
      data: null,
    }
  }
}

// Loading states
export const LoadingStates = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
}

export default api
