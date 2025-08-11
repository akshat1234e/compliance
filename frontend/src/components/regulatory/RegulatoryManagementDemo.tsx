/**
 * RegulatoryManagementDemo Component
 * Comprehensive demonstration of all regulatory management components
 */

import React from 'react'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Button,
  Badge,
  ToastProvider
} from '@/components/ui'
import RegulatoryManagementLayout from './RegulatoryManagementLayout'

export interface RegulatoryManagementDemoProps {
  standalone?: boolean
}

const RegulatoryManagementDemo: React.FC<RegulatoryManagementDemoProps> = ({ standalone = true }) => {
  const [selectedRole, setSelectedRole] = React.useState<'admin' | 'compliance_officer' | 'risk_manager' | 'legal_counsel' | 'policy_manager'>('compliance_officer')
  const [loading, setLoading] = React.useState(false)

  const roles = [
    { id: 'admin', name: 'Administrator', description: 'Full access to all regulatory management components' },
    { id: 'compliance_officer', name: 'Compliance Officer', description: 'Access to circulars, impact analysis, and compliance tracking' },
    { id: 'risk_manager', name: 'Risk Manager', description: 'Access to circulars, impact analysis, and compliance tracking' },
    { id: 'legal_counsel', name: 'Legal Counsel', description: 'Access to regulatory circulars and policy management' },
    { id: 'policy_manager', name: 'Policy Manager', description: 'Access to policy management and compliance tracking' }
  ]

  const handleRoleChange = (role: typeof selectedRole) => {
    setLoading(true)
    setSelectedRole(role)
    // Simulate loading delay
    setTimeout(() => setLoading(false), 500)
  }

  const simulateDataRefresh = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }

  if (standalone) {
    return (
      <ToastProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Demo Controls */}
          <div className="bg-indigo-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold">Regulatory Management Demo</h1>
                  <p className="text-indigo-100 text-sm">
                    Interactive demonstration of comprehensive regulatory management system
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">View as:</span>
                    <select
                      value={selectedRole}
                      onChange={(e) => handleRoleChange(e.target.value as typeof selectedRole)}
                      className="text-sm bg-indigo-700 text-white border border-indigo-500 rounded px-3 py-1"
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={simulateDataRefresh}
                    className="bg-indigo-700 border-indigo-500 text-white hover:bg-indigo-600"
                  >
                    Simulate Data Refresh
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Role Information */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-sm">
                  Current Role: {roles.find(r => r.id === selectedRole)?.name}
                </Badge>
                <span className="text-sm text-gray-600">
                  {roles.find(r => r.id === selectedRole)?.description}
                </span>
              </div>
            </div>
          </div>

          {/* Regulatory Management System */}
          <RegulatoryManagementLayout
            userRole={selectedRole}
            loading={loading}
            onTabChange={(tabId) => console.log('Tab changed to:', tabId)}
          />

          {/* Demo Information */}
          <div className="bg-gray-100 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Regulatory Circulars</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Comprehensive circular viewer</li>
                      <li>• AI-powered impact analysis</li>
                      <li>• Multi-source integration (RBI, SEBI, NPCI)</li>
                      <li>• Advanced search and filtering</li>
                      <li>• Status tracking and workflows</li>
                      <li>• Document management</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Impact Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• AI-powered impact assessment</li>
                      <li>• Business impact analysis</li>
                      <li>• Technical change requirements</li>
                      <li>• Compliance gap analysis</li>
                      <li>• Implementation planning</li>
                      <li>• Risk assessment matrix</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Compliance Tracker</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Requirement tracking</li>
                      <li>• Progress monitoring</li>
                      <li>• Milestone management</li>
                      <li>• Evidence collection</li>
                      <li>• Kanban and list views</li>
                      <li>• Deadline management</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Policy Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Version control system</li>
                      <li>• Approval workflows</li>
                      <li>• Compliance mapping</li>
                      <li>• Training management</li>
                      <li>• Policy metrics tracking</li>
                      <li>• Document lifecycle</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Key Features & Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">AI-Powered Intelligence</h4>
                        <ul className="space-y-1 text-sm text-gray-600">
                          <li>• Automated impact analysis</li>
                          <li>• Intelligent risk assessment</li>
                          <li>• Smart recommendations</li>
                          <li>• Predictive compliance insights</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Comprehensive Coverage</h4>
                        <ul className="space-y-1 text-sm text-gray-600">
                          <li>• Multi-regulator support</li>
                          <li>• End-to-end workflow management</li>
                          <li>• Complete audit trails</li>
                          <li>• Integrated policy management</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Enterprise Ready</h4>
                        <ul className="space-y-1 text-sm text-gray-600">
                          <li>• Role-based access control</li>
                          <li>• Scalable architecture</li>
                          <li>• API-first design</li>
                          <li>• Security & compliance</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-lg">
                  <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-indigo-800">
                    This is a demonstration with mock data. In production, components would connect to real regulatory APIs and databases.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ToastProvider>
    )
  }

  return (
    <RegulatoryManagementLayout
      userRole={selectedRole}
      loading={loading}
    />
  )
}

export default RegulatoryManagementDemo
