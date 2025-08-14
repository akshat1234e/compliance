'use client'

import HeaderNavigation from '@/components/navigation/HeaderNavigation'
import SidebarNavigation from '@/components/navigation/SidebarNavigation'
import { useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Mock user data (in real app, this would come from auth context)
  const user = {
    name: 'Admin User',
    email: 'admin@compliance.com',
    role: 'Administrator'
  }

  // Mock notifications data
  const notifications = {
    count: 3,
    items: [
      {
        id: '1',
        title: 'New RBI Circular',
        message: 'RBI/2024/15 - Updated KYC Guidelines',
        type: 'info' as const,
        timestamp: '2 hours ago',
        read: false
      },
      {
        id: '2',
        title: 'Compliance Deadline',
        message: 'Risk assessment report due in 3 days',
        type: 'warning' as const,
        timestamp: '4 hours ago',
        read: false
      },
      {
        id: '3',
        title: 'System Alert',
        message: 'High risk transaction detected',
        type: 'error' as const,
        timestamp: '6 hours ago',
        read: true
      }
    ]
  }

  const handleSearch = (query: string) => {
    // Implement search functionality
    console.log('Search query:', query)
  }

  const handleNotificationClick = (notificationId: string) => {
    // Handle notification click
    console.log('Notification clicked:', notificationId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <HeaderNavigation
        user={user}
        notifications={notifications}
        onSearch={handleSearch}
        onNotificationClick={handleNotificationClick}
      />

      {/* Sidebar Navigation */}
      <SidebarNavigation
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'ml-16' : 'ml-72'
        }`}
        style={{ paddingTop: '64px' }} // Account for fixed header
      >
        {/* Breadcrumb Navigation */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <div className="flex items-center">
                  <a href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-700">
                    Dashboard
                  </a>
                </div>
              </li>
              {/* Additional breadcrumb items would be added here based on current route */}
            </ol>
          </nav>
        </div>

        {/* Page Content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>© 2024 RBI Compliance Platform</span>
              <span>•</span>
              <span className="flex items-center">
                <span className="inline-block w-2 h-2 bg-success-500 rounded-full mr-2"></span>
                System Status: Operational
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
