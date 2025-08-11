/**
 * DashboardDemo Component
 * Comprehensive demonstration of all dashboard components
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
import DashboardLayout from './DashboardLayout'

export interface DashboardDemoProps {
  standalone?: boolean
}

const DashboardDemo: React.FC<DashboardDemoProps> = ({ standalone = true }) => {
  const [selectedRole, setSelectedRole] = React.useState<'admin' | 'compliance_officer' | 'risk_manager' | 'auditor' | 'analyst'>('compliance_officer')
  const [loading, setLoading] = React.useState(false)

  const roles = [
    { id: 'admin', name: 'Administrator', description: 'Full access to all dashboard components' },
    { id: 'compliance_officer', name: 'Compliance Officer', description: 'Access to compliance overview, alerts, metrics, and audit trail' },
    { id: 'risk_manager', name: 'Risk Manager', description: 'Access to risk heatmap, overview, and metrics' },
    { id: 'auditor', name: 'Auditor', description: 'Access to audit trail, overview, and metrics' },
    { id: 'analyst', name: 'Analyst', description: 'Access to overview and metrics only' }
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
          <div className="bg-blue-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold">RegTech Dashboard Demo</h1>
                  <p className="text-blue-100 text-sm">
                    Interactive demonstration of compliance dashboard components
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">View as:</span>
                    <select
                      value={selectedRole}
                      onChange={(e) => handleRoleChange(e.target.value as typeof selectedRole)}
                      className="text-sm bg-blue-700 text-white border border-blue-500 rounded px-3 py-1"
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
                    className="bg-blue-700 border-blue-500 text-white hover:bg-blue-600"
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

          {/* Dashboard */}
          <DashboardLayout
            userRole={selectedRole}
            loading={loading}
            onTabChange={(tabId) => console.log('Tab changed to:', tabId)}
          />

          {/* Demo Information */}
          <div className="bg-gray-100 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dashboard Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Real-time compliance monitoring</li>
                      <li>• AI-powered regulatory alerts</li>
                      <li>• Interactive risk heatmaps</li>
                      <li>• KPI benchmarking</li>
                      <li>• Comprehensive audit trails</li>
                      <li>• Role-based access control</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Component Architecture</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Modular React components</li>
                      <li>• TypeScript for type safety</li>
                      <li>• Responsive design system</li>
                      <li>• Accessibility compliant</li>
                      <li>• Performance optimized</li>
                      <li>• Extensible architecture</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">RegTech Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• RBI compliance monitoring</li>
                      <li>• SEBI regulatory tracking</li>
                      <li>• NPCI payment compliance</li>
                      <li>• Risk assessment frameworks</li>
                      <li>• Audit trail management</li>
                      <li>• Regulatory change alerts</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-blue-800">
                    This is a demonstration with mock data. In production, components would connect to real APIs.
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
    <DashboardLayout
      userRole={selectedRole}
      loading={loading}
    />
  )
}

export default DashboardDemo
