'use client'

import { useQuery } from '@tanstack/react-query'
import { 
  BanknotesIcon, 
  ExclamationTriangleIcon, 
  ShieldCheckIcon, 
  ArrowTrendingUpIcon 
} from '@heroicons/react/24/outline'

// Mock data - in real app, this would come from API
const mockData = {
  totalTransactions: 1247,
  totalAmount: 284567.89,
  suspiciousTransactions: 23,
  fraudPrevented: 45678.32,
  riskScore: 18.5,
  changePercent: 12.3
}

export default function OverviewCards() {
  // In real app, use this to fetch data
  // const { data: overview, isLoading } = useQuery({
  //   queryKey: ['overview'],
  //   queryFn: () => fetch('/api/v1/analytics/overview').then(res => res.json())
  // })

  const stats = [
    {
      id: 1,
      name: 'Total Transactions',
      value: mockData.totalTransactions.toLocaleString(),
      change: '+12.3%',
      changeType: 'increase',
      icon: BanknotesIcon,
    },
    {
      id: 2,
      name: 'Total Amount',
      value: `$${mockData.totalAmount.toLocaleString()}`,
      change: '+8.1%',
      changeType: 'increase',
      icon: ArrowTrendingUpIcon,
    },
    {
      id: 3,
      name: 'Suspicious Transactions',
      value: mockData.suspiciousTransactions.toLocaleString(),
      change: '-2.4%',
      changeType: 'decrease',
      icon: ExclamationTriangleIcon,
    },
    {
      id: 4,
      name: 'Fraud Prevented',
      value: `$${mockData.fraudPrevented.toLocaleString()}`,
      change: '+15.7%',
      changeType: 'increase',
      icon: ShieldCheckIcon,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className="stat-card"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <stat.icon
                className="h-6 w-6 text-gray-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {stat.name}
                </dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">
                    {stat.value}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline text-sm">
              <p
                className={`${
                  stat.changeType === 'increase'
                    ? 'text-green-600'
                    : 'text-red-600'
                } font-medium`}
              >
                {stat.change}
              </p>
              <p className="text-gray-500 ml-2">from last month</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
