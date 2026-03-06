'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dialog } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import {
  ChartBarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  UsersIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/', icon: ChartBarIcon, current: true },
  { name: 'Transactions', href: '/transactions', icon: BanknotesIcon, current: false },
  { name: 'Analytics', href: '/analytics', icon: ArrowTrendingUpIcon, current: false },
  { name: 'Alerts', href: '/alerts', icon: ExclamationTriangleIcon, current: false },
  { name: 'Risk Analysis', href: '/risk', icon: ShieldCheckIcon, current: false },
  { name: 'Reports', href: '/reports', icon: DocumentTextIcon, current: false },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, current: false },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile sidebar */}
      <Dialog as="div" className="lg:hidden" open={open} onClose={onClose}>
        <div className="fixed inset-0 z-50" />
        <Dialog.Panel className="fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto bg-white lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <h2 className="text-lg font-semibold text-gray-900">
              AI Analyzer
            </h2>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
              onClick={onClose}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <nav className="mt-5 px-2">
            <ul role="list" className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`${
                      pathname === item.href
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                    onClick={onClose}
                  >
                    <item.icon
                      className={`${
                        pathname === item.href
                          ? 'text-blue-600'
                          : 'text-gray-400 group-hover:text-gray-500'
                      } mr-3 h-5 w-5 flex-shrink-0`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Dialog.Panel>
      </Dialog>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-gray-50">
        <div className="flex h-16 flex-shrink-0 items-center px-6">
          <h2 className="text-lg font-semibold text-gray-900">
            AI Analyzer
          </h2>
        </div>
        <nav className="mt-5 flex-1 space-y-1 px-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`${
                pathname === item.href
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
            >
              <item.icon
                className={`${
                  pathname === item.href
                    ? 'text-blue-600'
                    : 'text-gray-400 group-hover:text-gray-500'
                } mr-3 h-5 w-5 flex-shrink-0`}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}
