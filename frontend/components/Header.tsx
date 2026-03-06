'use client'

import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side */}
          <div className="flex items-center">
            <button
              type="button"
              className="lg:hidden -m-2.5 p-2.5 text-gray-700"
              onClick={onMenuClick}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                className="relative -m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500"></span>
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-md bg-white shadow-lg ring-1 ring-gray-200">
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 rounded-full bg-red-500 mt-2"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            High-risk transaction detected
                          </p>
                          <p className="text-xs text-gray-500">
                            2 minutes ago
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 rounded-full bg-yellow-500 mt-2"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            Unusual spending pattern detected
                          </p>
                          <p className="text-xs text-gray-500">
                            15 minutes ago
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 rounded-full bg-blue-500 mt-2"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            System update completed
                          </p>
                          <p className="text-xs text-gray-500">
                            1 hour ago
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden lg:block">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">A</span>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700">Admin User</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
