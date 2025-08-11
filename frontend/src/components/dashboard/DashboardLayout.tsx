/**
 * DashboardLayout Component
 * Main dashboard layout with navigation and component orchestration
 */

import React from 'react'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Button,
  Badge,
  LoadingSpinner
} from '@/components/ui'
import { cn } from '@/lib/utils'
import ComplianceOverview from './ComplianceOverview'
import RegulatoryAlerts from './RegulatoryAlerts'
import RiskHeatmap from './RiskHeatmap'
import ComplianceMetrics from './ComplianceMetrics'
import AuditTrail from './AuditTrail'

// Types
export interface DashboardTab {
  id: string
  name: string
  icon: React.ReactNode
  component: React.ComponentType<any>
  badge?: number
  description: string
}

export interface DashboardLayoutProps {
  defaultTab?: string
  onTabChange?: (tabId: string) => void
  loading?: boolean
  userRole?: 'admin' | 'compliance_officer' | 'risk_manager' | 'auditor' | 'analyst'
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  defaultTab = 'overview',
  onTabChange,
  loading = false,
  userRole = 'compliance_officer'
}) => {
  const [activeTab, setActiveTab] = React.useState(defaultTab)
  const [refreshKey, setRefreshKey] = React.useState(0)

  // Dashboard tabs configuration
  const dashboardTabs: DashboardTab[] = [
    {
      id: 'overview',
      name: 'Overview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      component: ComplianceOverview,
      description: 'Real-time compliance health score and key metrics'
    },
    {
      id: 'alerts',
      name: 'Regulatory Alerts',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM12 17h.01M6 20a2 2 0 01-2-2V6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6.5" />
        </svg>
      ),
      component: RegulatoryAlerts,
      badge: 3,
      description: 'AI-powered regulatory change monitoring and impact assessment'
    },
    {
      id: 'risk',
      name: 'Risk Heatmap',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      component: RiskHeatmap,
      description: 'Interactive risk assessment and monitoring dashboard'
    },
    {
      id: 'metrics',
      name: 'Compliance Metrics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      component: ComplianceMetrics,
      description: 'KPI dashboard with benchmark comparisons and trend analysis'
    },
    {
      id: 'audit',
      name: 'Audit Trail',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      component: AuditTrail,
      description: 'Comprehensive audit log with search and filtering capabilities'
    }
  ]

  // Filter tabs based on user role
  const getVisibleTabs = () => {
    switch (userRole) {
      case 'admin':
        return dashboardTabs
      case 'compliance_officer':
        return dashboardTabs.filter(tab => ['overview', 'alerts', 'metrics', 'audit'].includes(tab.id))
      case 'risk_manager':
        return dashboardTabs.filter(tab => ['overview', 'risk', 'metrics'].includes(tab.id))
      case 'auditor':
        return dashboardTabs.filter(tab => ['overview', 'audit', 'metrics'].includes(tab.id))
      case 'analyst':
        return dashboardTabs.filter(tab => ['overview', 'metrics'].includes(tab.id))
      default:
        return dashboardTabs
    }
  }

  const visibleTabs = getVisibleTabs()
  const currentTab = visibleTabs.find(tab => tab.id === activeTab) || visibleTabs[0]

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    onTabChange?.(tabId)
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator'
      case 'compliance_officer': return 'Compliance Officer'
      case 'risk_manager': return 'Risk Manager'
      case 'auditor': return 'Auditor'
      case 'analyst': return 'Analyst'
      default: return 'User'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-lg text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">
                  RegTech Compliance Dashboard
                </h1>
              </div>
              <div className="ml-4">
                <Badge variant="outline" className="text-xs">
                  {getRoleDisplayName(userRole)}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh All
              </Button>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                System Online
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {tab.icon}
                {tab.name}
                {tab.badge && (
                  <Badge variant="destructive" className="text-xs">
                    {tab.badge}
                  </Badge>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Description */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="text-sm text-gray-600">{currentTab.description}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div key={`${activeTab}-${refreshKey}`}>
          {React.createElement(currentTab.component, {
            onRefresh: handleRefresh,
            key: refreshKey
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              © 2024 RegTech Compliance Platform. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>Last updated: {new Date().toLocaleString('en-IN')}</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span>All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default DashboardLayout
