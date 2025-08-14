'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BellIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  LinkIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  BellIcon as BellIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  EyeIcon as EyeIconSolid,
  LinkIcon as LinkIconSolid,
  BookOpenIcon as BookOpenIconSolid,
} from '@heroicons/react/24/solid'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  iconSolid: React.ComponentType<{ className?: string }>
  badge?: number
  description?: string
}

interface SidebarNavigationProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
  className?: string
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    iconSolid: HomeIconSolid,
    description: 'Overview and key metrics'
  },
  {
    name: 'Regulatory Intelligence',
    href: '/dashboard/regulatory',
    icon: BookOpenIcon,
    iconSolid: BookOpenIconSolid,
    badge: 3,
    description: 'Latest RBI circulars and updates'
  },
  {
    name: 'Compliance Workflows',
    href: '/dashboard/compliance',
    icon: ShieldCheckIcon,
    iconSolid: ShieldCheckIconSolid,
    badge: 5,
    description: 'Active compliance processes'
  },
  {
    name: 'Document Management',
    href: '/dashboard/documents',
    icon: DocumentTextIcon,
    iconSolid: DocumentTextIconSolid,
    description: 'Compliance documents and files'
  },
  {
    name: 'Risk Assessment',
    href: '/dashboard/risk',
    icon: ExclamationTriangleIcon,
    iconSolid: ExclamationTriangleIconSolid,
    badge: 2,
    description: 'Risk analysis and monitoring'
  },
  {
    name: 'Analytics & Reports',
    href: '/dashboard/analytics',
    icon: ChartBarIcon,
    iconSolid: ChartBarIconSolid,
    description: 'Compliance analytics and reporting'
  },
  {
    name: 'Real-time Monitoring',
    href: '/dashboard/monitoring',
    icon: EyeIcon,
    iconSolid: EyeIconSolid,
    description: 'Live compliance monitoring'
  },
  {
    name: 'System Integrations',
    href: '/dashboard/integrations',
    icon: LinkIcon,
    iconSolid: LinkIconSolid,
    description: 'External system connections'
  },
  {
    name: 'Webhooks',
    href: '/dashboard/webhooks',
    icon: ClipboardDocumentListIcon,
    iconSolid: ClipboardDocumentListIconSolid,
    description: 'Webhook management'
  },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function SidebarNavigation({
  collapsed = false,
  onToggleCollapse,
  className = ''
}: SidebarNavigationProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(collapsed)

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    onToggleCollapse?.()
  }

  return (
    <div
      className={classNames(
        'fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-72',
        className
      )}
      style={{ top: '64px' }} // Account for header height
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <BuildingOfficeIcon className="h-6 w-6 text-primary-600" />
            <span className="text-lg font-semibold text-gray-900">Navigation</span>
          </div>
        )}
        <button
          onClick={handleToggleCollapse}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = isActive ? item.iconSolid : item.icon

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={classNames(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-700 hover:text-primary-700 hover:bg-gray-50'
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon
                    className={classNames(
                      'flex-shrink-0 h-6 w-6',
                      isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600'
                    )}
                  />
                  
                  {!isCollapsed && (
                    <>
                      <span className="ml-3 flex-1">{item.name}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-danger-600 rounded-full">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </>
                  )}
                  
                  {isCollapsed && item.badge && item.badge > 0 && (
                    <span className="absolute left-8 top-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-danger-600 rounded-full">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </Link>
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-16 top-0 ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
                    <div className="font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-gray-300 mt-1">{item.description}</div>
                    )}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Settings Link */}
      <div className="border-t border-gray-200 p-2">
        <Link
          href="/settings"
          className={classNames(
            'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
            pathname === '/settings'
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-700 hover:text-primary-700 hover:bg-gray-50'
          )}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Cog6ToothIcon
            className={classNames(
              'flex-shrink-0 h-6 w-6',
              pathname === '/settings' ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600'
            )}
          />
          {!isCollapsed && <span className="ml-3">Settings</span>}
        </Link>
      </div>

      {/* Sidebar Footer */}
      {!isCollapsed && (
        <div className="border-t border-gray-200 p-4">
          <div className="text-xs text-gray-500">
            <div className="font-medium">RBI Compliance Platform</div>
            <div>Version 1.0.0</div>
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                System Healthy
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
