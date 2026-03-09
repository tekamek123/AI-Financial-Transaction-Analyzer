'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  BellIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
import LoadingSpinner from '@/components/LoadingSpinner'
import { apiClient } from '@/utils/api'
import { useToastHelpers } from '@/components/Toast'

interface Alert {
  id: string
  alert_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  transaction_id?: string
  account_id?: string
  merchant?: string
  amount?: number
  risk_score?: number
  is_resolved: boolean
  created_at: string
  resolved_at?: string
  resolved_by?: string
  notes?: string
}

export default function AlertsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const { success: showSuccess } = useToastHelpers()

  // Mock data - in real app, use this to fetch data
  // const { data: alerts, isLoading, error } = useQuery({
  //   queryKey: ['alerts', { page: currentPage, search: searchTerm, severity: filterSeverity, status: filterStatus }],
  //   queryFn: () => apiClient.alerts.getAlerts({
  //     page: currentPage,
  //     search: searchTerm,
  //     severity: filterSeverity,
  //     status: filterStatus
  //   })
  // })

  // Resolve alert mutation
  const resolveMutation = useMutation({
    mutationFn: (alertId: string) => apiClient.alerts.resolveAlert(alertId),
    onSuccess: () => {
      showSuccess('Alert Resolved', 'Alert has been marked as resolved')
    },
    onError: (error) => {
      const apiError = error as any
      showSuccess('Error', apiError.message || 'Failed to resolve alert')
    }
  })

  // Mock data for demonstration
  const mockAlerts: Alert[] = [
    {
      id: '1',
      alert_type: 'High Amount Transaction',
      severity: 'high',
      message: 'Transaction amount $15,000 exceeds account average by 500%',
      transaction_id: 'txn_12345',
      account_id: 'ACC001',
      merchant: 'Luxury Store',
      amount: 15000,
      risk_score: 92.5,
      is_resolved: false,
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      alert_type: 'Unusual Time Pattern',
      severity: 'medium',
      message: 'Multiple transactions detected during unusual hours (2-4 AM)',
      transaction_id: 'txn_12346',
      account_id: 'ACC002',
      merchant: 'Online Store',
      amount: 2500,
      risk_score: 78.3,
      is_resolved: false,
      created_at: '2024-01-15T03:15:00Z'
    },
    {
      id: '3',
      alert_type: 'Suspicious Merchant',
      severity: 'critical',
      message: 'Transaction with unknown merchant flagged as high risk',
      transaction_id: 'txn_12347',
      account_id: 'ACC003',
      merchant: 'Unknown Seller',
      amount: 8500,
      risk_score: 95.2,
      is_resolved: false,
      created_at: '2024-01-14T23:45:00Z'
    },
    {
      id: '4',
      alert_type: 'Rapid Succession',
      severity: 'high',
      message: '5 transactions within 2 minutes from same account',
      transaction_id: 'txn_12348',
      account_id: 'ACC004',
      merchant: 'Various',
      amount: 1200,
      risk_score: 88.7,
      is_resolved: true,
      resolved_at: '2024-01-14T15:30:00Z',
      resolved_by: 'analyst_1',
      notes: 'Customer confirmed legitimate purchases',
      created_at: '2024-01-14T14:25:00Z'
    }
  ]

  const alerts = mockAlerts
  const isLoading = false
  const error = null

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.alert_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.account_id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity
    const matchesStatus = filterStatus === 'all' || 
                        (filterStatus === 'resolved' && alert.is_resolved) ||
                        (filterStatus === 'unresolved' && !alert.is_resolved)
    
    return matchesSearch && matchesSeverity && matchesStatus
  })

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'high':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      case 'medium':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'low':
        return <BellIcon className="h-5 w-5 text-blue-500" />
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full'
    switch (severity) {
      case 'critical':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Critical</span>
      case 'high':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>High</span>
      case 'medium':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Medium</span>
      case 'low':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Low</span>
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</span>
    }
  }

  const handleResolveAlert = (alertId: string) => {
    resolveMutation.mutate(alertId)
  }

  const handleExport = () => {
    showSuccess('Export Started', 'Alerts will be exported to CSV format')
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Error loading alerts</h2>
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
                Security Alerts
              </h1>
              <p className="mt-2 text-gray-600">
                Monitor and manage fraud detection alerts
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button onClick={handleExport} className="btn btn-outline">
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export
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
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
                />
              </div>
            </div>
            
            {/* Severity Filter */}
            <div className="sm:w-32">
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            {/* Status Filter */}
            <div className="sm:w-32">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="unresolved">Unresolved</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredAlerts.length} of {alerts.length} alerts
        </div>

        {/* Alerts List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAlerts.map((alert) => (
                <div key={alert.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Alert Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getSeverityIcon(alert.severity)}
                      </div>
                      
                      {/* Alert Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {alert.alert_type}
                          </h3>
                          {getSeverityBadge(alert.severity)}
                          {alert.is_resolved && (
                            <span className="flex items-center text-green-600 text-sm">
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Resolved
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">
                          {alert.message}
                        </p>
                        
                        {/* Alert Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
                          {alert.transaction_id && (
                            <div>
                              <span className="font-medium">Transaction ID:</span>
                              <div className="font-mono">{alert.transaction_id}</div>
                            </div>
                          )}
                          {alert.account_id && (
                            <div>
                              <span className="font-medium">Account:</span>
                              <div>{alert.account_id}</div>
                            </div>
                          )}
                          {alert.merchant && (
                            <div>
                              <span className="font-medium">Merchant:</span>
                              <div>{alert.merchant}</div>
                            </div>
                          )}
                          {alert.amount && (
                            <div>
                              <span className="font-medium">Amount:</span>
                              <div>${alert.amount.toLocaleString()}</div>
                            </div>
                          )}
                          {alert.risk_score && (
                            <div>
                              <span className="font-medium">Risk Score:</span>
                              <div>{alert.risk_score.toFixed(1)}</div>
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Created:</span>
                            <div>{format(new Date(alert.created_at), 'MMM d, yyyy HH:mm')}</div>
                          </div>
                          {alert.resolved_at && (
                            <div>
                              <span className="font-medium">Resolved:</span>
                              <div>{format(new Date(alert.resolved_at), 'MMM d, yyyy HH:mm')}</div>
                            </div>
                          )}
                        </div>
                        
                        {/* Resolution Notes */}
                        {alert.notes && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-sm text-green-800">
                              <strong>Resolution:</strong> {alert.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button className="text-blue-600 hover:text-blue-900 text-sm">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {!alert.is_resolved && (
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          disabled={resolveMutation.isPending}
                          className="btn btn-sm btn-primary"
                        >
                          {resolveMutation.isPending ? 'Resolving...' : 'Resolve'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
