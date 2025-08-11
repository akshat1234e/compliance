/**
 * RegulatoryManagementLayout Component
 * Main layout for regulatory management with navigation and component orchestration
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
import RegulatoryCircularViewer from './RegulatoryCircularViewer'
import ImpactAnalysisPanel from './ImpactAnalysisPanel'
import ComplianceTracker from './ComplianceTracker'
import PolicyManagement from './PolicyManagement'

// Types
export interface RegulatoryTab {
  id: string
  name: string
  icon: React.ReactNode
  component: React.ComponentType<any>
  badge?: number
  description: string
}

export interface RegulatoryManagementLayoutProps {
  defaultTab?: string
  onTabChange?: (tabId: string) => void
  loading?: boolean
  userRole?: 'admin' | 'compliance_officer' | 'risk_manager' | 'legal_counsel' | 'policy_manager'
}

const RegulatoryManagementLayout: React.FC<RegulatoryManagementLayoutProps> = ({
  defaultTab = 'circulars',
  onTabChange,
  loading = false,
  userRole = 'compliance_officer'
}) => {
  const [activeTab, setActiveTab] = React.useState(defaultTab)
  const [refreshKey, setRefreshKey] = React.useState(0)

  // Regulatory management tabs configuration
  const regulatoryTabs: RegulatoryTab[] = [
    {
      id: 'circulars',
      name: 'Regulatory Circulars',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      component: RegulatoryCircularViewer,
      badge: 5,
      description: 'Comprehensive viewer for regulatory circulars with AI-powered impact analysis'
    },
    {
      id: 'impact',
      name: 'Impact Analysis',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      component: ImpactAnalysisPanel,
      description: 'AI-powered regulatory impact analysis with detailed assessments and recommendations'
    },
    {
      id: 'compliance',
      name: 'Compliance Tracker',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      component: ComplianceTracker,
      badge: 12,
      description: 'Track compliance status and implementation progress for regulatory requirements'
    },
    {
      id: 'policies',
      name: 'Policy Management',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      component: PolicyManagement,
      badge: 3,
      description: 'Comprehensive policy management with version control and approval workflows'
    }
  ]

  // Filter tabs based on user role
  const getVisibleTabs = () => {
    switch (userRole) {
      case 'admin':
        return regulatoryTabs
      case 'compliance_officer':
        return regulatoryTabs.filter(tab => ['circulars', 'impact', 'compliance'].includes(tab.id))
      case 'risk_manager':
        return regulatoryTabs.filter(tab => ['circulars', 'impact', 'compliance'].includes(tab.id))
      case 'legal_counsel':
        return regulatoryTabs.filter(tab => ['circulars', 'policies'].includes(tab.id))
      case 'policy_manager':
        return regulatoryTabs.filter(tab => ['policies', 'compliance'].includes(tab.id))
      default:
        return regulatoryTabs
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
      case 'legal_counsel': return 'Legal Counsel'
      case 'policy_manager': return 'Policy Manager'
      default: return 'User'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-lg text-gray-600">Loading regulatory management...</p>
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
                  Regulatory Management System
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
              © 2024 RegTech Regulatory Management System. All rights reserved.
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

export default RegulatoryManagementLayout
