'use client'

import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

// Mock data - in real app, this would come from API
const mockAlerts = [
  {
    id: 1,
    transactionId: 'txn_001',
    type: 'high_amount',
    severity: 'high',
    message: 'Unusually large transaction detected: $1,250.00',
    isResolved: false,
    createdAt: '2024-01-15T10:35:00Z'
  },
  {
    id: 2,
    transactionId: 'txn_003',
    type: 'unusual_time',
    severity: 'medium',
    message: 'Transaction during unusual hours: 23:45',
    isResolved: false,
    createdAt: '2024-01-14T23:50:00Z'
  },
  {
    id: 3,
    transactionId: 'txn_002',
    type: 'unknown_merchant',
    severity: 'low',
    message: 'Transaction with unknown merchant',
    isResolved: true,
    createdAt: '2024-01-14T18:30:00Z'
  },
  {
    id: 4,
    transactionId: 'txn_004',
    type: 'frequency_anomaly',
    severity: 'medium',
    message: 'Unusual transaction frequency detected',
    isResolved: false,
    createdAt: '2024-01-14T15:20:00Z'
  }
]

export default function AlertsPanel() {
  // In real app, use this to fetch data
  // const { data: alerts, isLoading } = useQuery({
  //   queryKey: ['alerts'],
  //   queryFn: () => fetch('/api/v1/alerts').then(res => res.json())
  // })

  const alerts = mockAlerts

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'low':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
      case 'medium':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
      case 'low':
        return <InformationCircleIcon className="h-4 w-4 text-blue-500" />
      default:
        return <InformationCircleIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const unresolvedAlerts = alerts.filter(alert => !alert.isResolved)

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Security Alerts</h3>
          <span className="badge badge-warning">
            {unresolvedAlerts.length} Active
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <InformationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts</h3>
            <p className="mt-1 text-sm text-gray-500">
              All systems are operating normally.
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 ${
                alert.isResolved ? 'opacity-60' : ''
              } ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {alert.type.replace('_', ' ').toUpperCase()}
                    </p>
                    <div className="flex items-center space-x-2">
                      {alert.isResolved && (
                        <span className="badge badge-success">Resolved</span>
                      )}
                      <span className="text-xs text-gray-500">
                        {format(new Date(alert.createdAt), 'MMM d, HH:mm')}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm">
                    {alert.message}
                  </p>
                  <p className="mt-1 text-xs font-mono text-gray-600">
                    Transaction: {alert.transactionId}
                  </p>
                </div>
              </div>
              
              {!alert.isResolved && (
                <div className="mt-3 flex space-x-2">
                  <button className="btn btn-sm btn-outline">
                    Investigate
                  </button>
                  <button className="btn btn-sm btn-outline">
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {alerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="btn btn-outline w-full">
            View All Alerts
          </button>
        </div>
      )}
    </div>
  )
}
