'use client'

import IntelligentSearch from '@/components/search/IntelligentSearch'
import {
    ArrowRightOnRectangleIcon,
    BellIcon,
    BuildingOfficeIcon,
    Cog6ToothIcon,
    ExclamationTriangleIcon,
    QuestionMarkCircleIcon,
    UserIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

interface HeaderNavigationProps {
  user?: {
    name: string
    email: string
    avatar?: string
    role: string
  }
  notifications?: {
    count: number
    items: Array<{
      id: string
      title: string
      message: string
      type: 'info' | 'warning' | 'error' | 'success'
      timestamp: string
      read: boolean
    }>
  }
  onSearch?: (query: string) => void
  onNotificationClick?: (notificationId: string) => void
}

export default function HeaderNavigation({
  user = {
    name: 'Admin User',
    email: 'admin@compliance.com',
    role: 'Administrator'
  },
  notifications = { count: 3, items: [] },
  onSearch,
  onNotificationClick
}: HeaderNavigationProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const router = useRouter()

  const notificationRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  // Mock search suggestions (AI-powered in real implementation)
  const mockSuggestions = [
    'RBI Circular 2024',
    'Compliance Workflow',
    'Risk Assessment',
    'Regulatory Updates',
    'Document Management'
  ]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (query: string) => {
    if (onSearch) {
      onSearch(query)
    } else {
      // Default search behavior
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value)
    if (value.length > 2) {
      const filtered = mockSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      )
      setSearchSuggestions(filtered.slice(0, 5))
    } else {
      setSearchSuggestions([])
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-warning-600" />
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-danger-600" />
      case 'success':
        return <BellIcon className="h-5 w-5 text-success-600" />
      default:
        return <BellIcon className="h-5 w-5 text-info-600" />
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-nav px-4 sm:px-6 lg:px-8">
        {/* Logo/Brand */}
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <BuildingOfficeIcon className="h-8 w-8 text-primary-600" />
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-gray-900">RBI Compliance</span>
              <span className="block text-xs text-gray-500">Management Platform</span>
            </div>
          </Link>
        </div>

        {/* Central Search Bar */}
        <div className="flex-1 max-w-lg mx-4 sm:mx-8">
          <IntelligentSearch
            placeholder="Search regulations, workflows, documents..."
            onSearch={(query, results) => {
              console.log('Search performed:', query, results)
            }}
            onResultClick={(result) => {
              console.log('Result clicked:', result)
            }}
            showRecentSearches={true}
            showAISuggestions={true}
          />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* Emergency Compliance Button */}
          <button
            onClick={() => router.push('/emergency-compliance')}
            className="hidden sm:inline-flex items-center px-3 py-2 border border-danger-300 text-sm font-medium rounded-md text-danger-700 bg-danger-50 hover:bg-danger-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger-500"
          >
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            Emergency
          </button>

          {/* Help Button */}
          <button
            onClick={() => router.push('/help')}
            className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-md"
          >
            <QuestionMarkCircleIcon className="h-6 w-6" />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-md"
            >
              <BellIcon className="h-6 w-6" />
              {notifications.count > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-danger-400 ring-2 ring-white" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {notifications.items.length > 0 ? (
                    <div className="space-y-3">
                      {notifications.items.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => onNotificationClick?.(notification.id)}
                          className="flex items-start space-x-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                        >
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-sm text-gray-500">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{notification.timestamp}</p>
                          </div>
                          {!notification.read && (
                            <div className="h-2 w-2 bg-primary-600 rounded-full" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No new notifications</p>
                  )}

                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <Link
                      href="/notifications"
                      className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                      onClick={() => setShowNotifications(false)}
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full" />
                ) : (
                  <UserIcon className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                <div className="py-1">
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <UserIcon className="h-4 w-4 mr-3" />
                    Your Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Cog6ToothIcon className="h-4 w-4 mr-3" />
                    Settings
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      router.push('/logout')
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
